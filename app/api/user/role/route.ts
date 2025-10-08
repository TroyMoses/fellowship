import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";
import { createDriveFolder } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !["admin", "fellow"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    const institutionsCollection = db.collection("institutions");
    const accountsCollection = db.collection("accounts");

    let institutionId: ObjectId | undefined;

    if (role === "admin") {
      // Check if user already has an institution
      const existingUser = await usersCollection.findOne({
        email: session.user.email,
      });

      if (existingUser?.institutionId) {
        institutionId = existingUser.institutionId as ObjectId;
        console.log("[v0] User already has institution", {
          institutionId: institutionId.toString(),
        });
      } else {
        const userAccount = await accountsCollection.findOne({
          userId: existingUser?._id,
          provider: "google",
        });

        // Create a new institution for this admin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const institution: any = {
          name: `${session.user.name}'s Institution`,
          googleAccountEmail: session.user.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (userAccount?.refresh_token) {
          institution.googleRefreshToken = userAccount.refresh_token;
          console.log("[v0] Copied Google refresh token to institution");
        } else {
          console.warn("[v0] No Google refresh token found for user");
        }

        const result = await institutionsCollection.insertOne(institution);
        institutionId = result.insertedId;
        console.log("[v0] Created new institution", {
          institutionId: institutionId.toString(),
        });

        if (userAccount?.refresh_token) {
          try {
            const rootFolder = await createDriveFolder({
              institutionId: institutionId,
              folderName: `${session.user.name}'s Fellowship Program`,
            });

            await institutionsCollection.updateOne(
              { _id: institutionId },
              {
                $set: {
                  googleDriveFolderId: rootFolder.id,
                  updatedAt: new Date(),
                },
              }
            );

            console.log("[v0] Created institution root Drive folder", {
              folderId: rootFolder.id,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            console.error(
              "[v0] Failed to create institution Drive folder:",
              error.message
            );
            // Don't fail the whole request if Drive folder creation fails
          }
        }
      }
    }

    // Update user role and institutionId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      role,
      updatedAt: new Date(),
    };

    if (institutionId) {
      updateData.institutionId = institutionId;
    }

    await usersCollection.updateOne(
      { email: session.user.email },
      { $set: updateData }
    );

    console.log("[v0] Updated user role", {
      email: session.user.email,
      role,
      institutionId: institutionId?.toString(),
    });

    return NextResponse.json({
      success: true,
      role,
      institutionId: institutionId?.toString(),
    });
  } catch (error) {
    console.error("[v0] Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

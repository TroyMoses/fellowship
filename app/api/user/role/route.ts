import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";
import { createDriveFolder } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Role API called");

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error("[v0] Unauthorized: No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[v0] User authenticated:", session.user.email);

    const { role } = await req.json();

    if (!role || !["admin", "fellow"].includes(role)) {
      console.error("[v0] Invalid role:", role);
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    console.log("[v0] Setting role to:", role);

    let db;
    try {
      db = await getDatabase();
      console.log("[v0] Database connected successfully");
    } catch (dbError) {
      console.error("[v0] Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 500 }
      );
    }

    const usersCollection = db.collection("users");
    const institutionsCollection = db.collection("institutions");
    const accountsCollection = db.collection("accounts");

    let institutionId: ObjectId | undefined;

    if (role === "admin") {
      // Check if user already has an institution
      const existingUser = await usersCollection.findOne({
        email: session.user.email,
      });

      console.log("[v0] Existing user found:", {
        hasUser: !!existingUser,
        hasInstitution: !!existingUser?.institutionId,
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

        console.log("[v0] User account lookup:", {
          hasAccount: !!userAccount,
          hasRefreshToken: !!userAccount?.refresh_token,
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
          console.warn(
            "[v0] No Google refresh token found for user - Drive features will be limited"
          );
        }

        try {
          const result = await institutionsCollection.insertOne(institution);
          institutionId = result.insertedId;
          console.log("[v0] Created new institution", {
            institutionId: institutionId.toString(),
          });
        } catch (institutionError) {
          console.error("[v0] Failed to create institution:", institutionError);
          return NextResponse.json(
            { error: "Failed to create institution. Please try again." },
            { status: 500 }
          );
        }

        if (userAccount?.refresh_token) {
          try {
            console.log("[v0] Attempting to create Drive folder");
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
            // The admin can still use the platform, just without Drive integration
          }
        } else {
          console.log("[v0] Skipping Drive folder creation - no refresh token");
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

    try {
      const updateResult = await usersCollection.updateOne(
        { email: session.user.email },
        { $set: updateData }
      );

      console.log("[v0] User update result:", {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount,
      });

      if (updateResult.matchedCount === 0) {
        console.error("[v0] User not found in database");
        return NextResponse.json(
          { error: "User not found. Please sign out and sign in again." },
          { status: 404 }
        );
      }
    } catch (updateError) {
      console.error("[v0] Failed to update user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user role. Please try again." },
        { status: 500 }
      );
    }

    console.log("[v0] Updated user role successfully", {
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
    console.error(
      "[v0] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to update role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";

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
        // Create a new institution for this admin
        const institution = {
          name: `${session.user.name}'s Institution`,
          googleAccountEmail: session.user.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await institutionsCollection.insertOne(institution);
        institutionId = result.insertedId;
        console.log("[v0] Created new institution", {
          institutionId: institutionId.toString(),
        });
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

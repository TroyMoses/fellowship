import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    // Get current user to find their cohorts
    const currentUser = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get fellows in the same cohorts or institution
    const fellows = await db
      .collection("users")
      .find({
        role: "fellow",
        $or: [
          { cohortIds: { $in: currentUser.cohortIds || [] } },
          { institutionId: currentUser.institutionId },
        ],
      })
      .toArray();

    return NextResponse.json({ fellows });
  } catch (error) {
    console.error("Error fetching fellows:", error);
    return NextResponse.json(
      { error: "Failed to fetch fellows" },
      { status: 500 }
    );
  }
}

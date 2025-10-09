import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, action, notes, cohortId } = await request.json();

    if (!applicationId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = await getDatabase();

    // Get the application
    const application = await db.collection("applications").findOne({
      _id: new ObjectId(applicationId),
      institutionId: new ObjectId(session.user.institutionId),
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application has already been reviewed" },
        { status: 400 }
      );
    }

    // Update application status
    await db.collection("applications").updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          status: action === "approve" ? "approved" : "rejected",
          reviewedAt: new Date(),
          reviewedBy: new ObjectId(session.user.id),
          reviewNotes: notes || undefined,
        },
      }
    );

    // If approved, update the user's institution and cohort
    if (action === "approve") {
      const updateData: any = {
        institutionId: new ObjectId(session.user.institutionId),
      };

      // Add to cohort if one is provided
      if (cohortId) {
        await db.collection("users").updateOne(
          { _id: application.fellowId },
          {
            $set: updateData,
            $addToSet: { cohortIds: new ObjectId(cohortId) },
          }
        );

        // Add fellow to cohort's fellowIds
        await db.collection("cohorts").updateOne(
          { _id: new ObjectId(cohortId) },
          {
            $addToSet: { fellowIds: application.fellowId },
          }
        );
      } else {
        await db
          .collection("users")
          .updateOne({ _id: application.fellowId }, { $set: updateData });
      }
    }

    // Get fellow and institution details for email notification
    const fellow = await db
      .collection("users")
      .findOne({ _id: application.fellowId });
    const institution = await db
      .collection("institutions")
      .findOne({ _id: new ObjectId(session.user.institutionId) });

    if (fellow?.email && institution) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const dashboardUrl = `${baseUrl}/fellow`;

      const emailTemplate =
        action === "approve"
          ? emailTemplates.applicationApproved(
              fellow.name,
              institution.name,
              dashboardUrl
            )
          : emailTemplates.applicationRejected(fellow.name, institution.name);

      await sendEmail({
        to: fellow.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    }

    console.log("[v0] Application reviewed:", {
      applicationId,
      action,
      fellowEmail: fellow?.email,
      institutionName: institution?.name,
      cohortId: cohortId || "none",
    });

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error("[v0] Error reviewing application:", error);
    return NextResponse.json(
      { error: "Failed to review application" },
      { status: 500 }
    );
  }
}

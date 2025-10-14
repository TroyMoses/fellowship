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

    const { applicationId, action, notes } = await request.json();

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

    // If approved, update the user's institution and automatically assign to active cohort
    if (action === "approve") {
      const activeCohort = await db.collection("cohorts").findOne({
        institutionId: new ObjectId(session.user.institutionId),
        status: "active",
      });

      const updateData: any = {
        institutionId: new ObjectId(session.user.institutionId),
      };

      if (activeCohort) {
        // Add fellow to active cohort
        await db.collection("users").updateOne(
          { _id: application.fellowId },
          {
            $set: updateData,
            $addToSet: { cohortIds: activeCohort._id },
          }
        );

        // Add fellow to cohort's fellowIds
        await db.collection("cohorts").updateOne(
          { _id: activeCohort._id },
          {
            $addToSet: { fellowIds: application.fellowId },
          }
        );

        console.log("[v0] Fellow automatically assigned to active cohort:", {
          fellowId: application.fellowId,
          cohortId: activeCohort._id,
          cohortName: activeCohort.name,
        });
      } else {
        // No active cohort - just assign to institution
        await db
          .collection("users")
          .updateOne({ _id: application.fellowId }, { $set: updateData });

        console.log(
          "[v0] Fellow approved but no active cohort available for assignment"
        );
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

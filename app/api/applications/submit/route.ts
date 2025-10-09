import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { institutionId, applicationData } = await request.json();

    if (!institutionId || !applicationData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if user already applied
    const existingApplication = await db.collection("applications").findOne({
      fellowId: new ObjectId(session.user.id),
      institutionId: new ObjectId(institutionId),
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this fellowship" },
        { status: 400 }
      );
    }

    // Get institution details for email notification
    const institution = await db
      .collection("institutions")
      .findOne({ _id: new ObjectId(institutionId) });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Create application
    const application = {
      fellowId: new ObjectId(session.user.id),
      institutionId: new ObjectId(institutionId),
      status: "pending" as const,
      applicationData,
      submittedAt: new Date(),
    };

    const result = await db.collection("applications").insertOne(application);

    // Get admin users for this institution
    const admins = await db
      .collection("users")
      .find({
        institutionId: new ObjectId(institutionId),
        role: "admin",
      })
      .toArray();

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const applicationUrl = `${baseUrl}/admin/applications/${result.insertedId}`;

    const emailTemplate = emailTemplates.applicationSubmitted(
      applicationData.fullName,
      institution.name,
      applicationUrl
    );

    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    console.log("[v0] New application submitted:", {
      applicationId: result.insertedId,
      institutionName: institution.name,
      applicantEmail: applicationData.email,
      adminCount: admins.length,
    });

    return NextResponse.json({
      success: true,
      applicationId: result.insertedId,
    });
  } catch (error) {
    console.error("[v0] Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

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

    const { institutionId, emails, message } = await request.json();

    if (
      !institutionId ||
      !emails ||
      !Array.isArray(emails) ||
      emails.length === 0
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = await getDatabase();

    // Get institution details
    const institution = await db
      .collection("institutions")
      .findOne({ _id: new ObjectId(institutionId) });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Get user details for the inviter
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user has access to this institution
    if (
      user.role === "fellow" &&
      user.institutionId?.toString() !== institutionId
    ) {
      return NextResponse.json(
        { error: "You can only invite to your own institution" },
        { status: 403 }
      );
    }

    if (
      user.role === "admin" &&
      user.institutionId?.toString() !== institutionId
    ) {
      return NextResponse.json(
        { error: "You can only invite to your own institution" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/fellow/fellowships`;

    // Send invitations
    const results = await Promise.allSettled(
      emails.map(async (email) => {
        const emailTemplate = emailTemplates.fellowshipInvitation(
          user.name,
          institution.name,
          inviteUrl
        );

        // Add custom message if provided
        let htmlWithMessage = emailTemplate.html;
        if (message) {
          htmlWithMessage = htmlWithMessage.replace(
            '<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">',
            `<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #333; font-style: italic;">"${message}"</p>
              <p style="margin: 0; font-size: 14px; color: #666; padding-top: 15px; border-top: 1px solid #e5e7eb;">`
          );
        }

        return sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: htmlWithMessage,
        });
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log("[v0] Invitations sent:", {
      institutionName: institution.name,
      inviterName: user.name,
      inviterRole: user.role,
      successful,
      failed,
      total: emails.length,
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
    });
  } catch (error) {
    console.error("[v0] Error sending invitations:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

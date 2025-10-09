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

    const { emails, message } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user details
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get institution details
    const institution = await db
      .collection("institutions")
      .findOne({ _id: user.institutionId });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const signupUrl = `${baseUrl}/fellow/fellowships`;

    const emailTemplate = emailTemplates.invitation(
      user.name || "A fellow member",
      institution.name,
      message || "",
      signupUrl
    );

    // Send invitations
    const results = [];
    for (const email of emails) {
      try {
        await sendEmail({
          to: email.trim(),
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        results.push({ email, success: true });
      } catch (error) {
        console.error(`[v0] Failed to send invitation to ${email}:`, error);
        results.push({ email, success: false, error: String(error) });
      }
    }

    console.log("[v0] Invitations sent:", {
      inviter: user.name,
      institution: institution.name,
      totalEmails: emails.length,
      successful: results.filter((r) => r.success).length,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[v0] Error sending invitations:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

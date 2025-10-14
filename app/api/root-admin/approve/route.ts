import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendEmail, emailTemplates } from "@/lib/email";
import { createDriveFolder } from "@/lib/google-drive";

export async function POST(request: Request) {
  try {
    console.log("[v0] Approval API called");

    const session = await getServerSession(authOptions);
    console.log("[v0] Session:", {
      user: session?.user,
      role: session?.user?.role,
    });

    if (!session?.user || session.user.role !== "root_admin") {
      console.log("[v0] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[v0] Request body:", body);

    const { institutionId, action, institutionName, adminEmail, adminName } =
      body;

    if (!institutionId || !action || !["approve", "reject"].includes(action)) {
      console.log("[v0] Invalid request parameters");
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    console.log("[v0] Connecting to database...");
    const db = await getDatabase();
    const institutionsCollection = db.collection("institutions");
    const usersCollection = db.collection("users");
    const accountsCollection = db.collection("accounts");

    console.log("[v0] Finding institution:", institutionId);
    const institution = await institutionsCollection.findOne({
      _id: new ObjectId(institutionId),
    });

    if (!institution) {
      console.log("[v0] Institution not found");
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    console.log("[v0] Institution found:", {
      name: institution.name,
      status: institution.status,
    });

    if (institution.status !== "pending") {
      console.log("[v0] Institution already processed");
      return NextResponse.json(
        { error: "Institution has already been processed" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    console.log("[v0] Updating institution status to:", newStatus);

    // Update institution status
    await institutionsCollection.updateOne(
      { _id: new ObjectId(institutionId) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    console.log("[v0] Institution status updated successfully");

    // Get admin user
    const admin = await usersCollection.findOne({
      institutionId: new ObjectId(institutionId),
    });

    console.log(
      "[v0] Admin user found:",
      admin ? { email: admin.email, name: admin.name } : "none"
    );

    if (action === "approve" && admin) {
      console.log("[v0] Processing approval...");

      // Update admin user role
      await usersCollection.updateOne(
        { _id: admin._id },
        {
          $set: {
            role: "admin",
            updatedAt: new Date(),
          },
        }
      );

      console.log("[v0] Admin role updated");

      // Create Drive folder if refresh token exists
      if (institution.googleRefreshToken) {
        try {
          console.log("[v0] Attempting to create Drive folder...");
          const userAccount = await accountsCollection.findOne({
            userId: admin._id,
            provider: "google",
          });

          if (userAccount?.refresh_token) {
            const rootFolder = await createDriveFolder({
              institutionId: institutionId,
              folderName: `${institution.name} - Fellowship Program`,
            });

            await institutionsCollection.updateOne(
              { _id: new ObjectId(institutionId) },
              {
                $set: {
                  googleDriveFolderId: rootFolder.id,
                  updatedAt: new Date(),
                },
              }
            );

            console.log(
              "[v0] Created institution root Drive folder:",
              rootFolder.id
            );
          }
        } catch (error) {
          console.error("[v0] Failed to create Drive folder:", error);
          // Don't fail the approval if Drive folder creation fails
        }
      }

      // Send approval email
      try {
        console.log("[v0] Sending approval email to:", adminEmail);
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const dashboardUrl = `${baseUrl}/admin`;
        const approvalEmail = emailTemplates.adminApproved(
          adminName,
          institutionName,
          dashboardUrl
        );

        await sendEmail({
          to: adminEmail,
          subject: approvalEmail.subject,
          html: approvalEmail.html,
        });

        console.log("[v0] Approval email sent successfully");
      } catch (emailError) {
        console.error("[v0] Failed to send approval email:", emailError);
        // Don't fail the approval if email fails
      }

      console.log("[v0] Institution approved and admin notified");
    } else if (action === "reject" && admin) {
      console.log("[v0] Processing rejection...");

      // Send rejection email
      try {
        console.log("[v0] Sending rejection email to:", adminEmail);
        const rejectionEmail = emailTemplates.adminRejected(
          adminName,
          institutionName
        );

        await sendEmail({
          to: adminEmail,
          subject: rejectionEmail.subject,
          html: rejectionEmail.html,
        });

        console.log("[v0] Rejection email sent successfully");
      } catch (emailError) {
        console.error("[v0] Failed to send rejection email:", emailError);
        // Don't fail the rejection if email fails
      }

      console.log("[v0] Institution rejected and admin notified");
    }

    console.log("[v0] Approval process completed successfully");
    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error("[v0] Error processing approval:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

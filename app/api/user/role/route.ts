import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Role API called");

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error("[v0] Unauthorized: No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[v0] User authenticated:", session.user.email);

    const { role, institutionName, institutionLogo } = await req.json();

    if (!role || !["admin", "fellow"].includes(role)) {
      console.error("[v0] Invalid role:", role);
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (role === "admin") {
      if (!institutionName || !institutionName.trim()) {
        return NextResponse.json(
          { error: "Institution name is required for admin role" },
          { status: 400 }
        );
      }
      if (!institutionLogo || !institutionLogo.trim()) {
        return NextResponse.json(
          { error: "Institution logo is required for admin role" },
          { status: 400 }
        );
      }
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
    let isPending = false;

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
        const existingInstitution = await institutionsCollection.findOne({
          _id: existingUser.institutionId as ObjectId,
        });

        if (existingInstitution?.status === "pending") {
          return NextResponse.json(
            {
              success: true,
              pending: true,
              institutionId: existingUser.institutionId.toString(),
              message: "Your admin request is still pending approval",
            },
            { status: 200 }
          );
        }

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const institution: any = {
          name: institutionName.trim(),
          logo: institutionLogo.trim(),
          googleAccountEmail: session.user.email,
          status: "pending",
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
          isPending = true;
          console.log("[v0] Created new institution with pending status", {
            institutionId: institutionId.toString(),
            name: institutionName,
          });
        } catch (institutionError) {
          console.error("[v0] Failed to create institution:", institutionError);
          return NextResponse.json(
            { error: "Failed to create institution. Please try again." },
            { status: 500 }
          );
        }

        try {
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

          // Send pending email to admin
          const pendingEmail = emailTemplates.adminPendingApproval(
            session.user.name || session.user.email,
            institutionName
          );
          await sendEmail({
            to: session.user.email,
            subject: pendingEmail.subject,
            html: pendingEmail.html,
          });
          console.log("[v0] Sent pending email to admin");

          // Send notification to root admin
          const rootAdmin = await usersCollection.findOne({
            role: "root_admin",
          });
          if (rootAdmin?.email) {
            const reviewUrl = `${baseUrl}/root-admin/institutions/${institutionId}`;
            const rootAdminEmail = emailTemplates.rootAdminNewRequest(
              session.user.name || session.user.email,
              session.user.email,
              institutionName,
              reviewUrl
            );
            await sendEmail({
              to: rootAdmin.email,
              subject: rootAdminEmail.subject,
              html: rootAdminEmail.html,
            });
            console.log(
              "[v0] Sent notification to root admin:",
              rootAdmin.email
            );
          } else {
            console.warn("[v0] No root admin found to notify");
          }
        } catch (emailError) {
          console.error("[v0] Failed to send email notifications:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (isPending) {
      // Don't set role, only set institutionId
      updateData.institutionId = institutionId;
      console.log("[v0] Setting institutionId without role (pending approval)");
    } else {
      // Set role for fellows or approved admins
      updateData.role = role;
      if (institutionId) {
        updateData.institutionId = institutionId;
      }
      console.log("[v0] Setting role and institutionId");
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

    console.log("[v0] Updated user successfully", {
      email: session.user.email,
      role: isPending ? "pending" : role,
      institutionId: institutionId?.toString(),
    });

    return NextResponse.json({
      success: true,
      role: isPending ? null : role,
      pending: isPending,
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

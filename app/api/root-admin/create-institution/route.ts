import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Create institution API called");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "root_admin") {
      console.log("[v0] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, logo, adminEmail, adminName } = body;

    console.log("[v0] Creating institution:", { name, adminEmail });

    // Validate required fields
    if (!name || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if institution with same name already exists
    const existingInstitution = await db
      .collection("institutions")
      .findOne({ name });
    if (existingInstitution) {
      return NextResponse.json(
        { error: "Institution with this name already exists" },
        { status: 400 }
      );
    }

    // Check if admin email is already assigned to another institution
    const existingAdmin = await db.collection("users").findOne({
      email: adminEmail,
      role: "admin",
    });

    if (existingAdmin && existingAdmin.institutionId) {
      return NextResponse.json(
        {
          error:
            "This email is already assigned as admin to another institution",
        },
        { status: 400 }
      );
    }

    // Create the institution with approved status
    const institutionData = {
      name,
      logo: logo || "",
      googleAccountEmail: adminEmail,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const institutionResult = await db
      .collection("institutions")
      .insertOne(institutionData);
    const institutionId = institutionResult.insertedId;

    console.log("[v0] Institution created:", {
      institutionId: institutionId.toString(),
    });

    // Check if user already exists
    if (existingAdmin) {
      // Update existing user to be admin of this institution
      await db.collection("users").updateOne(
        { email: adminEmail },
        {
          $set: {
            role: "admin",
            institutionId: institutionId,
            updatedAt: new Date(),
          },
        }
      );
      console.log("[v0] Updated existing user as admin");
    } else {
      // Create a placeholder user record that will be completed when they sign in
      await db.collection("users").insertOne({
        email: adminEmail,
        name: adminName,
        role: "admin",
        institutionId: institutionId,
        cohortIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("[v0] Created placeholder user record");
    }

    // Send email notification to the new admin
    try {
      const dashboardUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/admin`;

      await sendEmail({
        to: adminEmail,
        subject: `You've been assigned as admin of ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ${name}!</h2>
            <p>Hello ${adminName},</p>
            <p>You have been assigned as the administrator of <strong>${name}</strong>.</p>
            <p>You can now sign in to access your admin dashboard and start managing your institution.</p>
            <div style="margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Sign In to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Please sign in using your Google account: <strong>${adminEmail}</strong>
            </p>
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact the root administrator.
            </p>
          </div>
        `,
      });

      console.log("[v0] Email sent to new admin:", adminEmail);
    } catch (emailError) {
      console.error("[v0] Error sending email to admin:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      institutionId: institutionId.toString(),
      message: "Institution created successfully",
    });
  } catch (error) {
    console.error("[v0] Error creating institution:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create institution",
      },
      { status: 500 }
    );
  }
}

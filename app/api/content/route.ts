import type { NextRequest } from "next/server";
import {
  getAuthSession,
  isAdmin,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadFileToDrive } from "@/lib/google-drive";
import {
  createContentSchema,
  validateFileSize,
  validateFileType,
} from "@/lib/validation";
import { uploadRateLimit } from "@/lib/rate-limit";
import { handleError, AppError } from "@/lib/error-handler";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      throw new AppError("Unauthorized", 401);
    }

    const rateLimitResult = await uploadRateLimit(req, session.user.id);
    if (!rateLimitResult.success) {
      throw new AppError("Upload limit exceeded. Please try again later.", 429);
    }

    const body = await req.json();

    const validationResult = createContentSchema.safeParse(body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.errors[0].message, 400);
    }

    const data = validationResult.data;

    if (!validateFileSize(data.fileData, 50)) {
      throw new AppError("File size exceeds 50MB limit", 400);
    }

    const allowedTypes = [
      "image/",
      "video/",
      "application/pdf",
      "application/",
      "text/",
    ];
    if (!validateFileType(data.mimeType, allowedTypes)) {
      throw new AppError("File type not allowed", 400);
    }

    const db = await getDatabase();
    if (!session.user.institutionId) {
      throw new AppError("User institutionId is missing", 400);
    }
    const institutionId = new ObjectId(session.user.institutionId);

    const cohort = await db.collection("cohorts").findOne({
      _id: new ObjectId(data.cohortId),
      institutionId,
    });

    if (!cohort) {
      throw new AppError("Cohort not found", 404);
    }

    if (!cohort.googleDriveFolderId) {
      throw new AppError("Cohort does not have a Google Drive folder", 400);
    }

    // Convert base64 to buffer
    const base64Data = data.fileData.split(",")[1];
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Upload to Google Drive
    let driveFile;
    try {
      driveFile = await uploadFileToDrive({
        institutionId: institutionId.toString(),
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileBuffer,
        folderId: cohort.googleDriveFolderId,
      });
    } catch (error: any) {
      console.error("[v0] Drive upload failed:", error);
      throw new AppError(
        "Failed to upload to Google Drive. Please ensure Google account is connected.",
        500
      );
    }

    // Save content metadata to database
    const content = {
      cohortId: new ObjectId(data.cohortId),
      title: data.title,
      description: data.description || "",
      googleDriveFileId: driveFile.id,
      googleDriveLink: driveFile.webViewLink,
      uploadedBy: new ObjectId(session.user.id),
      uploadedAt: new Date(),
      type: data.type,
      mimeType: data.mimeType,
    };

    const result = await db.collection("content").insertOne(content);

    if (cohort.fellowIds && cohort.fellowIds.length > 0) {
      const fellows = await db
        .collection("users")
        .find({
          _id: { $in: cohort.fellowIds },
        })
        .toArray();

      // Send email to each fellow
      for (const fellow of fellows) {
        try {
          const emailContent = emailTemplates.contentUploaded(
            fellow.name,
            data.title,
            cohort.name,
            driveFile.webViewLink,
            data.description || ""
          );
          await sendEmail({
            to: fellow.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (error) {
          console.error(
            `[v0] Failed to send content notification to ${fellow.email}:`,
            error
          );
        }
      }
    }

    return apiSuccess(
      {
        contentId: result.insertedId,
        driveLink: driveFile.webViewLink,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const db = await getDatabase();

    // Get content for user's cohorts
    let query: any = {};

    if (session.user.role === "admin") {
      // Admin sees all content for their institution
      if (!session.user.institutionId) {
        throw new AppError("User institutionId is missing", 400);
      }
      const cohorts = await db
        .collection("cohorts")
        .find({
          institutionId: new ObjectId(session.user.institutionId),
        })
        .toArray();

      query = { cohortId: { $in: cohorts.map((c) => c._id) } };
    } else {
      // Fellows see content for their cohorts
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(session.user.id) });
      query = { cohortId: { $in: user?.cohortIds || [] } };
    }

    const content = await db
      .collection("content")
      .find(query)
      .sort({ uploadedAt: -1 })
      .toArray();

    return apiSuccess({ content });
  } catch (error: any) {
    console.error("[v0] Get content error:", error);
    return apiError(error.message || "Failed to fetch content", 500);
  }
}

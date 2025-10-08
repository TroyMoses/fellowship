import type { NextRequest } from "next/server";
import {
  getAuthSession,
  isAdmin,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createDriveFolder } from "@/lib/google-drive";
import { createCohortSchema } from "@/lib/validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { handleError, AppError } from "@/lib/error-handler";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      throw new AppError("Unauthorized", 401);
    }

    const rateLimitResult = await apiRateLimit(req, session.user.id);
    if (!rateLimitResult.success) {
      throw new AppError("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();

    const validationResult = createCohortSchema.safeParse(body);
    if (!validationResult.success) {
      // @ts-expect-error - error
      throw new AppError(validationResult.error.errors[0].message, 400);
    }

    const data = validationResult.data;

    const db = await getDatabase();
    const institutionId = new ObjectId(session.user.institutionId);

    // Determine cohort status based on dates
    const now = new Date();
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400);
    }

    let status: "upcoming" | "active" | "completed" = "upcoming";
    if (now >= startDate && now <= endDate) {
      status = "active";
    } else if (now > endDate) {
      status = "completed";
    }

    // Create cohort
    const cohort = {
      institutionId,
      name: data.name,
      description: data.description || "",
      startDate,
      endDate,
      fellowIds: [],
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("cohorts").insertOne(cohort);

    try {
      const institution = await db
        .collection("institutions")
        .findOne({ _id: institutionId });

      if (!institution?.googleRefreshToken) {
        console.warn("[v0] Institution does not have Google account connected");
      } else {
        // Create institution root folder if it doesn't exist
        let rootFolderId = institution.googleDriveFolderId;

        if (!rootFolderId) {
          console.log("[v0] Creating institution root folder...");
          const rootFolder = await createDriveFolder({
            institutionId: institutionId.toString(),
            folderName: `${institution.name} - Fellowship Program`,
          });

          rootFolderId = rootFolder.id;

          await db.collection("institutions").updateOne(
            { _id: institutionId },
            {
              $set: {
                googleDriveFolderId: rootFolderId,
                updatedAt: new Date(),
              },
            }
          );

          console.log("[v0] Created institution root folder", {
            folderId: rootFolderId,
          });
        }

        // Create cohort folder
        const folder = await createDriveFolder({
          institutionId: institutionId.toString(),
          folderName: data.name,
          parentFolderId: rootFolderId,
        });

        await db.collection("cohorts").updateOne(
          { _id: result.insertedId },
          {
            $set: {
              googleDriveFolderId: folder.id,
              updatedAt: new Date(),
            },
          }
        );

        console.log("[v0] Created cohort Drive folder", {
          cohortId: result.insertedId,
          folderId: folder.id,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("[v0] Failed to create Drive folder:", error.message);
      // Don't fail the whole request if Drive folder creation fails
    }

    return apiSuccess({ cohortId: result.insertedId }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const db = await getDatabase();
    const cohorts = await db
      .collection("cohorts")
      .find({
        institutionId: new ObjectId(session.user.institutionId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    return apiSuccess({ cohorts });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[v0] Get cohorts error:", error);
    return apiError(error.message || "Failed to fetch cohorts", 500);
  }
}

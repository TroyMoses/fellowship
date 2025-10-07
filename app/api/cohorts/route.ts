import type { NextRequest } from "next/server"
import { getAuthSession, isAdmin, apiError, apiSuccess } from "@/lib/api-helpers"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { createDriveFolder } from "@/lib/google-drive"
import { createCohortSchema } from "@/lib/validation"
import { apiRateLimit } from "@/lib/rate-limit"
import { handleError, AppError } from "@/lib/error-handler"

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !isAdmin(session)) {
      throw new AppError("Unauthorized", 401)
    }

    const rateLimitResult = await apiRateLimit(req, session.user.id)
    if (!rateLimitResult.success) {
      throw new AppError("Too many requests. Please try again later.", 429)
    }

    const body = await req.json()

    const validationResult = createCohortSchema.safeParse(body)
    if (!validationResult.success) {
      throw new AppError(validationResult.error.errors[0].message, 400)
    }

    const data = validationResult.data

    const db = await getDatabase()
    const institutionId = new ObjectId(session.user.institutionId)

    // Determine cohort status based on dates
    const now = new Date()
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400)
    }

    let status: "upcoming" | "active" | "completed" = "upcoming"
    if (now >= startDate && now <= endDate) {
      status = "active"
    } else if (now > endDate) {
      status = "completed"
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
    }

    const result = await db.collection("cohorts").insertOne(cohort)

    // Create Google Drive folder for this cohort
    try {
      const institution = await db.collection("institutions").findOne({ _id: institutionId })

      if (institution?.googleDriveFolderId) {
        const folder = await createDriveFolder({
          institutionId: institutionId.toString(),
          folderName: data.name,
          parentFolderId: institution.googleDriveFolderId,
        })

        await db.collection("cohorts").updateOne(
          { _id: result.insertedId },
          {
            $set: {
              googleDriveFolderId: folder.id,
              updatedAt: new Date(),
            },
          },
        )
      }
    } catch (error) {
      console.error("[v0] Failed to create Drive folder:", error)
    }

    return apiSuccess({ cohortId: result.insertedId }, 201)
  } catch (error) {
    return handleError(error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return apiError("Unauthorized", 401)
    }

    const db = await getDatabase()
    const cohorts = await db
      .collection("cohorts")
      .find({
        institutionId: new ObjectId(session.user.institutionId),
      })
      .sort({ createdAt: -1 })
      .toArray()

    return apiSuccess({ cohorts })
  } catch (error: any) {
    console.error("[v0] Get cohorts error:", error)
    return apiError(error.message || "Failed to fetch cohorts", 500)
  }
}

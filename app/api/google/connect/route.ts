import type { NextRequest } from "next/server"
import { getAuthSession, isAdmin, apiError, apiSuccess } from "@/lib/api-helpers"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { createDriveFolder } from "@/lib/google-drive"

/**
 * Connect Google account and set up Drive folder for institution
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401)
    }

    const body = await req.json()
    const { institutionId, refreshToken } = body

    if (!institutionId || !refreshToken) {
      return apiError("Missing required fields")
    }

    const db = await getDatabase()

    // Update institution with Google refresh token
    await db.collection("institutions").updateOne(
      { _id: new ObjectId(institutionId) },
      {
        $set: {
          googleRefreshToken: refreshToken,
          updatedAt: new Date(),
        },
      },
    )

    // Create main Drive folder for the institution
    const folder = await createDriveFolder({
      institutionId,
      folderName: "Fellowship Platform - Content",
    })

    // Store folder ID
    await db.collection("institutions").updateOne(
      { _id: new ObjectId(institutionId) },
      {
        $set: {
          googleDriveFolderId: folder.id,
          updatedAt: new Date(),
        },
      },
    )

    return apiSuccess({
      message: "Google account connected successfully",
      folderId: folder.id,
    })
  } catch (error: any) {
    console.error("[v0] Google connect error:", error)
    return apiError(error.message || "Failed to connect Google account", 500)
  }
}

import { google } from "googleapis"
import { getDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

/**
 * Get OAuth2 client for a specific institution
 */
export async function getGoogleClient(institutionId: string | ObjectId) {
  const db = await getDatabase()
  const institution = await db.collection("institutions").findOne({
    _id: typeof institutionId === "string" ? new ObjectId(institutionId) : institutionId,
  })

  if (!institution || !institution.googleRefreshToken) {
    throw new Error("Institution not found or Google account not connected")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google",
  )

  oauth2Client.setCredentials({
    refresh_token: institution.googleRefreshToken,
  })

  return oauth2Client
}

/**
 * Store Google refresh token for an institution
 */
export async function storeGoogleToken(institutionId: string | ObjectId, refreshToken: string) {
  const db = await getDatabase()
  await db.collection("institutions").updateOne(
    { _id: typeof institutionId === "string" ? new ObjectId(institutionId) : institutionId },
    {
      $set: {
        googleRefreshToken: refreshToken,
        updatedAt: new Date(),
      },
    },
  )
}

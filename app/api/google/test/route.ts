import type { NextRequest } from "next/server"
import { getAuthSession, isAdmin, apiError, apiSuccess } from "@/lib/api-helpers"
import { getGoogleClient } from "@/lib/google-auth"
import { google } from "googleapis"

/**
 * Test Google API connection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401)
    }

    const body = await req.json()
    const { institutionId } = body

    if (!institutionId) {
      return apiError("Missing institutionId")
    }

    // Test Calendar API
    const oauth2Client = await getGoogleClient(institutionId)
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    const calendarList = await calendar.calendarList.list()

    // Test Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client })
    const about = await drive.about.get({ fields: "user" })

    return apiSuccess({
      message: "Google APIs connected successfully",
      calendar: {
        connected: true,
        calendars: calendarList.data.items?.length || 0,
      },
      drive: {
        connected: true,
        user: about.data.user?.emailAddress,
      },
    })
  } catch (error: any) {
    console.error("[v0] Google test error:", error)
    return apiError(error.message || "Failed to test Google connection", 500)
  }
}

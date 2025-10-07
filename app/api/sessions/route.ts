import type { NextRequest } from "next/server"
import { getAuthSession, isAdmin, apiError, apiSuccess, validateRequired } from "@/lib/api-helpers"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { createCalendarEvent } from "@/lib/google-calendar"

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401)
    }

    const body = await req.json()
    const error = validateRequired(body, ["cohortId", "title", "startTime", "endTime"])
    if (error) return apiError(error)

    const db = await getDatabase()
    const institutionId = new ObjectId(session.user.institutionId)

    // Get cohort and fellows
    const cohort = await db.collection("cohorts").findOne({
      _id: new ObjectId(body.cohortId),
      institutionId,
    })

    if (!cohort) {
      return apiError("Cohort not found", 404)
    }

    // Get fellow emails
    const fellows = await db
      .collection("users")
      .find({
        _id: { $in: cohort.fellowIds },
      })
      .toArray()

    const fellowEmails = fellows.map((f) => f.email)

    // Create Google Calendar event with Meet link
    let calendarEvent
    try {
      calendarEvent = await createCalendarEvent({
        institutionId: institutionId.toString(),
        title: body.title,
        description: body.description || "",
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        attendeeEmails: fellowEmails,
      })
    } catch (error: any) {
      console.error("[v0] Calendar event creation failed:", error)
      return apiError("Failed to create Google Calendar event. Please ensure Google account is connected.", 500)
    }

    // Create session in database
    const sessionData = {
      institutionId,
      cohortId: new ObjectId(body.cohortId),
      title: body.title,
      description: body.description || "",
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      googleCalendarEventId: calendarEvent.id,
      googleMeetLink: calendarEvent.meetLink,
      attendees: cohort.fellowIds.map((fellowId: ObjectId) => ({
        fellowId,
        status: "invited",
      })),
      contentLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("sessions").insertOne(sessionData)

    return apiSuccess(
      {
        sessionId: result.insertedId,
        meetLink: calendarEvent.meetLink,
      },
      201,
    )
  } catch (error: any) {
    console.error("[v0] Create session error:", error)
    return apiError(error.message || "Failed to create session", 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return apiError("Unauthorized", 401)
    }

    const db = await getDatabase()
    const sessions = await db
      .collection("sessions")
      .find({
        institutionId: new ObjectId(session.user.institutionId),
      })
      .sort({ startTime: -1 })
      .toArray()

    return apiSuccess({ sessions })
  } catch (error: any) {
    console.error("[v0] Get sessions error:", error)
    return apiError(error.message || "Failed to fetch sessions", 500)
  }
}

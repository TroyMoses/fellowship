import { google } from "googleapis"
import { getGoogleClient } from "./google-auth"
import type { ObjectId } from "mongodb"

export interface CreateEventParams {
  institutionId: string | ObjectId
  title: string
  description?: string
  startTime: Date
  endTime: Date
  attendeeEmails: string[]
}

export interface CalendarEvent {
  id: string
  meetLink?: string
  htmlLink: string
}

/**
 * Create a Google Calendar event with Google Meet link
 */
export async function createCalendarEvent(params: CreateEventParams): Promise<CalendarEvent> {
  const { institutionId, title, description, startTime, endTime, attendeeEmails } = params

  const oauth2Client = await getGoogleClient(institutionId)
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  const event = {
    summary: title,
    description: description || "",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "UTC",
    },
    attendees: attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 }, // 1 day before
        { method: "popup", minutes: 30 }, // 30 minutes before
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: event,
  })

  return {
    id: response.data.id!,
    meetLink: response.data.hangoutLink,
    htmlLink: response.data.htmlLink!,
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(
  institutionId: string | ObjectId,
  eventId: string,
  updates: Partial<CreateEventParams>,
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId)
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  const event: any = {}

  if (updates.title) event.summary = updates.title
  if (updates.description) event.description = updates.description
  if (updates.startTime) {
    event.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: "UTC",
    }
  }
  if (updates.endTime) {
    event.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: "UTC",
    }
  }
  if (updates.attendeeEmails) {
    event.attendees = updates.attendeeEmails.map((email) => ({ email }))
  }

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: event,
  })
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(institutionId: string | ObjectId, eventId: string): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId)
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  })
}

/**
 * Get calendar event details
 */
export async function getCalendarEvent(institutionId: string | ObjectId, eventId: string) {
  const oauth2Client = await getGoogleClient(institutionId)
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  const response = await calendar.events.get({
    calendarId: "primary",
    eventId,
  })

  return response.data
}

import { google } from "googleapis";
import { getGoogleClient } from "./google-auth";
import type { ObjectId } from "mongodb";

export interface CreateEventParams {
  institutionId: string | ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
}

export interface CalendarEvent {
  id: string;
  meetLink?: string;
  htmlLink: string;
}

/**
 * Create a Google Calendar event with Google Meet link
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CalendarEvent> {
  const {
    institutionId,
    title,
    description,
    startTime,
    endTime,
    attendeeEmails,
  } = params;

  try {
    const oauth2Client = await getGoogleClient(institutionId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: event,
    });

    return {
      id: response.data.id!,
      // @ts-expect-error - meet link
      meetLink: response.data.hangoutLink,
      htmlLink: response.data.htmlLink!,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error(
        "Google Calendar API is not enabled. Please enable it in Google Cloud Console: " +
          "https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview " +
          "Then wait 2-3 minutes and try again. See GOOGLE_API_SETUP.md for detailed instructions."
      );
    }
    if (error.code === 401) {
      throw new Error(
        "Google authentication failed. Please sign out and sign back in to refresh your Google permissions."
      );
    }
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(
  institutionId: string | ObjectId,
  eventId: string,
  updates: Partial<CreateEventParams>
): Promise<void> {
  try {
    const oauth2Client = await getGoogleClient(institutionId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event: any = {};

    if (updates.title) event.summary = updates.title;
    if (updates.description) event.description = updates.description;
    if (updates.startTime) {
      event.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: "UTC",
      };
    }
    if (updates.endTime) {
      event.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: "UTC",
      };
    }
    if (updates.attendeeEmails) {
      event.attendees = updates.attendeeEmails.map((email) => ({ email }));
    }

    await calendar.events.patch({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
      requestBody: event,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error(
        "Google Calendar API is not enabled. See GOOGLE_API_SETUP.md for setup instructions."
      );
    }
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(
  institutionId: string | ObjectId,
  eventId: string
): Promise<void> {
  try {
    const oauth2Client = await getGoogleClient(institutionId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error(
        "Google Calendar API is not enabled. See GOOGLE_API_SETUP.md for setup instructions."
      );
    }
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Get calendar event details
 */
export async function getCalendarEvent(
  institutionId: string | ObjectId,
  eventId: string
) {
  try {
    const oauth2Client = await getGoogleClient(institutionId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error(
        "Google Calendar API is not enabled. See GOOGLE_API_SETUP.md for setup instructions."
      );
    }
    throw new Error(`Failed to get calendar event: ${error.message}`);
  }
}

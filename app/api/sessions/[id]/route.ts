import type { NextRequest } from "next/server";
import {
  getAuthSession,
  isAdmin,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const db = await getDatabase();
    const institutionId = session.user.institutionId
      ? new ObjectId(session.user.institutionId)
      : undefined;

    // Get existing session
    const existingSession = await db.collection("sessions").findOne({
      _id: new ObjectId(id),
      institutionId,
    });

    if (!existingSession) {
      return apiError("Session not found", 404);
    }

    // Check if session has already passed
    if (new Date(existingSession.startTime) < new Date()) {
      return apiError("Cannot update a session that has already occurred", 400);
    }

    // Track changes for email notification
    const changes: string[] = [];
    const oldDateTime = new Date(existingSession.startTime).toLocaleString();

    if (body.title && body.title !== existingSession.title) {
      changes.push(`Title changed to "${body.title}"`);
    }
    if (body.description && body.description !== existingSession.description) {
      changes.push("Description updated");
    }
    if (
      body.startTime &&
      new Date(body.startTime).getTime() !==
        new Date(existingSession.startTime).getTime()
    ) {
      changes.push(
        `Start time changed to ${new Date(body.startTime).toLocaleString()}`
      );
    }
    if (
      body.endTime &&
      new Date(body.endTime).getTime() !==
        new Date(existingSession.endTime).getTime()
    ) {
      changes.push(
        `End time changed to ${new Date(body.endTime).toLocaleString()}`
      );
    }

    // Update Google Calendar event if time or title changed
    if (existingSession.googleCalendarEventId && changes.length > 0) {
      try {
        if (!institutionId) {
          return apiError("Institution ID is missing", 400);
        }
        await updateCalendarEvent({
          institutionId: institutionId.toString(),
          eventId: existingSession.googleCalendarEventId,
          title: body.title || existingSession.title,
          description: body.description || existingSession.description,
          startTime: body.startTime
            ? new Date(body.startTime)
            : existingSession.startTime,
          endTime: body.endTime
            ? new Date(body.endTime)
            : existingSession.endTime,
        });
      } catch (error: any) {
        console.error("[v0] Calendar event update failed:", error);
        return apiError("Failed to update Google Calendar event", 500);
      }
    }

    // Update session in database
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);

    await db
      .collection("sessions")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Get cohort and fellows to send notifications
    const cohort = await db.collection("cohorts").findOne({
      _id: existingSession.cohortId,
    });

    if (cohort && changes.length > 0) {
      const fellows = await db
        .collection("users")
        .find({
          _id: { $in: cohort.fellowIds },
        })
        .toArray();

      // Send email notifications to all fellows
      const newDateTime = body.startTime
        ? new Date(body.startTime).toLocaleString()
        : oldDateTime;

      for (const fellow of fellows) {
        try {
          const emailContent = emailTemplates.sessionUpdated(
            fellow.name,
            body.title || existingSession.title,
            oldDateTime,
            newDateTime,
            existingSession.googleMeetLink || "",
            changes
          );
          await sendEmail({
            to: fellow.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (error) {
          console.error(
            `[v0] Failed to send update email to ${fellow.email}:`,
            error
          );
        }
      }
    }

    return apiSuccess({ message: "Session updated successfully", changes });
  } catch (error: any) {
    console.error("[v0] Update session error:", error);
    return apiError(error.message || "Failed to update session", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason) {
      return apiError("Cancellation reason is required", 400);
    }

    const db = await getDatabase();
    const institutionId = session?.user?.institutionId
      ? new ObjectId(session.user.institutionId)
      : null;

    // Get existing session
    const existingSession = await db.collection("sessions").findOne({
      _id: new ObjectId(id),
      institutionId,
    });

    if (!existingSession) {
      return apiError("Session not found", 404);
    }

    // Check if session has already passed
    if (new Date(existingSession.startTime) < new Date()) {
      return apiError("Cannot cancel a session that has already occurred", 400);
    }

    // Delete Google Calendar event
    if (existingSession.googleCalendarEventId) {
      try {
        if (!institutionId) {
          return apiError("Institution ID is missing", 400);
        }
        await deleteCalendarEvent({
          institutionId: institutionId.toString(),
          eventId: existingSession.googleCalendarEventId,
        });
      } catch (error: any) {
        console.error("[v0] Calendar event deletion failed:", error);
      }
    }

    // Mark session as cancelled instead of deleting
    await db.collection("sessions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: new ObjectId(session.user.id),
        },
      }
    );

    // Get cohort and fellows to send notifications
    const cohort = await db.collection("cohorts").findOne({
      _id: existingSession.cohortId,
    });

    if (cohort) {
      const fellows = await db
        .collection("users")
        .find({
          _id: { $in: cohort.fellowIds },
        })
        .toArray();

      // Send cancellation email notifications to all fellows
      const sessionDateTime = new Date(
        existingSession.startTime
      ).toLocaleString();

      for (const fellow of fellows) {
        try {
          const emailContent = emailTemplates.sessionCancelled(
            fellow.name,
            existingSession.title,
            sessionDateTime,
            reason
          );
          await sendEmail({
            to: fellow.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (error) {
          console.error(
            `[v0] Failed to send cancellation email to ${fellow.email}:`,
            error
          );
        }
      }
    }

    return apiSuccess({ message: "Session cancelled successfully" });
  } catch (error: any) {
    console.error("[v0] Cancel session error:", error);
    return apiError(error.message || "Failed to cancel session", 500);
  }
}

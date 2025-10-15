import type { ObjectId } from "mongodb";

export interface Institution {
  _id?: ObjectId;
  name: string;
  logo?: string; // Added logo field for institution branding
  googleAccountEmail: string;
  googleRefreshToken?: string;
  googleCalendarId?: string;
  googleDriveFolderId?: string;
  status: "pending" | "approved" | "rejected"; // Added approval status
  createdAt: Date;
  updatedAt: Date;
}

export interface Cohort {
  _id?: ObjectId;
  institutionId: ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  googleDriveFolderId?: string;
  fellowIds: ObjectId[];
  status: "upcoming" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  image?: string;
  role: "admin" | "fellow" | "root_admin"; // Added root_admin role
  institutionId?: ObjectId;
  cohortIds: ObjectId[];
  googleAccountEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  _id?: ObjectId;
  institutionId: ObjectId;
  cohortId: ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  googleCalendarEventId?: string;
  googleMeetLink?: string;
  attendees: {
    fellowId: ObjectId;
    status: "invited" | "attended" | "missed";
  }[];
  contentLinks: string[];
  status?: "scheduled" | "cancelled" | "completed";
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Content {
  _id?: ObjectId;
  cohortId: ObjectId;
  title: string;
  description?: string;
  googleDriveFileId: string;
  googleDriveLink: string;
  uploadedBy: ObjectId;
  uploadedAt: Date;
  type: "document" | "video" | "presentation" | "other";
  mimeType?: string;
}

export interface Application {
  _id?: ObjectId;
  fellowId: ObjectId;
  institutionId: ObjectId;
  status: "pending" | "approved" | "rejected";
  applicationData: {
    fullName: string;
    email: string;
    phone?: string;
    education: string;
    experience: string;
    motivation: string;
    linkedIn?: string;
    resume?: string;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: ObjectId;
  reviewNotes?: string;
}

export interface Message {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  content: string;
  readBy: ObjectId[];
  createdAt: Date;
}

export interface Conversation {
  _id?: ObjectId;
  type: "group" | "direct";
  cohortId?: ObjectId; // For group chats
  participantIds: ObjectId[];
  lastMessageAt: Date;
  createdAt: Date;
}

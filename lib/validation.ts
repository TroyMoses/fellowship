import { z } from "zod"

// Cohort validation schemas
export const createCohortSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
})

// Session validation schemas
export const createSessionSchema = z.object({
  cohortId: z.string().min(1, "Cohort ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start time"),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end time"),
})

// Content validation schemas
export const createContentSchema = z.object({
  cohortId: z.string().min(1, "Cohort ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  type: z.enum(["document", "video", "presentation", "other"]),
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileData: z.string().min(1, "File data is required"),
})

// Validate file size (in base64)
export function validateFileSize(base64Data: string, maxSizeMB = 50): boolean {
  const sizeInBytes = (base64Data.length * 3) / 4
  const sizeInMB = sizeInBytes / (1024 * 1024)
  return sizeInMB <= maxSizeMB
}

// Validate file type
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => mimeType.startsWith(type))
}

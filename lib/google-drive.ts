import { google } from "googleapis"
import { getGoogleClient } from "./google-auth"
import type { ObjectId } from "mongodb"
import { Readable } from "stream"

export interface CreateFolderParams {
  institutionId: string | ObjectId
  folderName: string
  parentFolderId?: string
}

export interface UploadFileParams {
  institutionId: string | ObjectId
  fileName: string
  mimeType: string
  fileBuffer: Buffer
  folderId: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  webContentLink?: string
  thumbnailLink?: string
}

/**
 * Create a Google Drive folder
 */
export async function createDriveFolder(params: CreateFolderParams): Promise<DriveFile> {
  const { institutionId, folderName, parentFolderId } = params

  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  const fileMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  }

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId]
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name, mimeType, webViewLink",
  })

  // Make folder accessible to anyone with the link
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  })

  return {
    id: response.data.id!,
    name: response.data.name!,
    mimeType: response.data.mimeType!,
    webViewLink: response.data.webViewLink!,
  }
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(params: UploadFileParams): Promise<DriveFile> {
  const { institutionId, fileName, mimeType, fileBuffer, folderId } = params

  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  }

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, mimeType, webViewLink, webContentLink, thumbnailLink",
  })

  // Make file accessible to anyone with the link
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  })

  return {
    id: response.data.id!,
    name: response.data.name!,
    mimeType: response.data.mimeType!,
    webViewLink: response.data.webViewLink!,
    webContentLink: response.data.webContentLink,
    thumbnailLink: response.data.thumbnailLink,
  }
}

/**
 * List files in a Google Drive folder
 */
export async function listDriveFiles(institutionId: string | ObjectId, folderId: string): Promise<DriveFile[]> {
  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)",
    orderBy: "createdTime desc",
  })

  return (response.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    webViewLink: file.webViewLink!,
    webContentLink: file.webContentLink,
    thumbnailLink: file.thumbnailLink,
  }))
}

/**
 * Delete a file from Google Drive
 */
export async function deleteDriveFile(institutionId: string | ObjectId, fileId: string): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  await drive.files.delete({
    fileId,
  })
}

/**
 * Grant access to a Drive folder for specific users
 */
export async function grantFolderAccess(
  institutionId: string | ObjectId,
  folderId: string,
  userEmails: string[],
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  for (const email of userEmails) {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "user",
        emailAddress: email,
      },
      sendNotificationEmail: false,
    })
  }
}

/**
 * Revoke access to a Drive folder for specific users
 */
export async function revokeFolderAccess(
  institutionId: string | ObjectId,
  folderId: string,
  userEmails: string[],
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId)
  const drive = google.drive({ version: "v3", auth: oauth2Client })

  // Get all permissions for the folder
  const permissions = await drive.permissions.list({
    fileId: folderId,
    fields: "permissions(id, emailAddress)",
  })

  // Find and delete permissions for specified emails
  for (const email of userEmails) {
    const permission = permissions.data.permissions?.find((p) => p.emailAddress === email)
    if (permission?.id) {
      await drive.permissions.delete({
        fileId: folderId,
        permissionId: permission.id,
      })
    }
  }
}

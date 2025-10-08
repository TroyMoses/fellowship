import { google } from "googleapis";
import { getGoogleClient } from "./google-auth";
import type { ObjectId } from "mongodb";
import { Readable } from "stream";

export interface CreateFolderParams {
  institutionId: string | ObjectId;
  folderName: string;
  parentFolderId?: string;
}

export interface UploadFileParams {
  institutionId: string | ObjectId;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  folderId: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

/**
 * Create a Google Drive folder
 */
export async function createDriveFolder(
  params: CreateFolderParams
): Promise<DriveFile> {
  const { institutionId, folderName, parentFolderId } = params;

  console.log("[v0] Creating Drive folder:", {
    institutionId: institutionId.toString(),
    folderName,
    parentFolderId,
  });

  try {
    const oauth2Client = await getGoogleClient(institutionId);
    console.log("[v0] Got Google client, creating drive instance");

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileMetadata: any = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    console.log(
      "[v0] Calling Drive API to create folder with metadata:",
      fileMetadata
    );

    let response;
    try {
      response = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name, mimeType, webViewLink",
      });
      console.log("[v0] Drive API response received:", {
        hasResponse: !!response,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
      });
    } catch (apiError: any) {
      console.error("[v0] Drive API call failed:", {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors,
        stack: apiError.stack,
      });
      throw apiError;
    }

    if (!response || !response.data) {
      console.error(
        "[v0] Invalid response from Drive API - response or data is undefined"
      );
      throw new Error("Invalid response from Google Drive API");
    }

    if (!response.data.id) {
      console.error("[v0] Drive API response missing file ID:", response.data);
      throw new Error("Google Drive API did not return a file ID");
    }

    console.log("[v0] Folder created successfully, setting permissions");

    // Make folder accessible to anyone with the link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log("[v0] Permissions set successfully");

    return {
      id: response.data.id,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      webViewLink: response.data.webViewLink!,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[v0] Error in createDriveFolder:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    if (error.code === 403) {
      throw new Error(
        "Google Drive API is not enabled. Please enable it in Google Cloud Console: " +
          "https://console.developers.google.com/apis/api/drive.googleapis.com/overview " +
          "Then wait 2-3 minutes and try again. See GOOGLE_API_SETUP.md for detailed instructions."
      );
    }
    if (error.code === 401) {
      throw new Error(
        "Google authentication failed. Please sign out and sign back in to refresh your Google permissions."
      );
    }
    throw new Error(`Failed to create Drive folder: ${error.message}`);
  }
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(
  params: UploadFileParams
): Promise<DriveFile> {
  const { institutionId, fileName, mimeType, fileBuffer, folderId } = params;

  try {
    const oauth2Client = await getGoogleClient(institutionId);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, mimeType, webViewLink, webContentLink, thumbnailLink",
    });

    // Make file accessible to anyone with the link
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      webViewLink: response.data.webViewLink!,
      // @ts-expect-error - content link
      webContentLink: response.data.webContentLink,
      // @ts-expect-error - thumbnail link
      thumbnailLink: response.data.thumbnailLink,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 403) {
      throw new Error(
        "Google Drive API is not enabled. See GOOGLE_API_SETUP.md for setup instructions."
      );
    }
    throw new Error(`Failed to upload file to Drive: ${error.message}`);
  }
}

/**
 * List files in a Google Drive folder
 */
export async function listDriveFiles(
  institutionId: string | ObjectId,
  folderId: string
): Promise<DriveFile[]> {
  const oauth2Client = await getGoogleClient(institutionId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields:
      "files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)",
    orderBy: "createdTime desc",
  });

  // @ts-expect-error - return
  return (response.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    webViewLink: file.webViewLink!,
    webContentLink: file.webContentLink,
    thumbnailLink: file.thumbnailLink,
  }));
}

/**
 * Delete a file from Google Drive
 */
export async function deleteDriveFile(
  institutionId: string | ObjectId,
  fileId: string
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  await drive.files.delete({
    fileId,
  });
}

/**
 * Grant access to a Drive folder for specific users
 */
export async function grantFolderAccess(
  institutionId: string | ObjectId,
  folderId: string,
  userEmails: string[]
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  for (const email of userEmails) {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "user",
        emailAddress: email,
      },
      sendNotificationEmail: false,
    });
  }
}

/**
 * Revoke access to a Drive folder for specific users
 */
export async function revokeFolderAccess(
  institutionId: string | ObjectId,
  folderId: string,
  userEmails: string[]
): Promise<void> {
  const oauth2Client = await getGoogleClient(institutionId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Get all permissions for the folder
  const permissions = await drive.permissions.list({
    fileId: folderId,
    fields: "permissions(id, emailAddress)",
  });

  // Find and delete permissions for specified emails
  for (const email of userEmails) {
    const permission = permissions.data.permissions?.find(
      (p) => p.emailAddress === email
    );
    if (permission?.id) {
      await drive.permissions.delete({
        fileId: folderId,
        permissionId: permission.id,
      });
    }
  }
}

import type { NextRequest } from "next/server";
import { getAuthSession, isAdmin, apiSuccess } from "@/lib/api-helpers";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createDriveFolder } from "@/lib/google-drive";
import { handleError, AppError } from "@/lib/error-handler";

/**
 * Fix missing Google Drive folder for a cohort
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      throw new AppError("Unauthorized", 401);
    }

    const db = await getDatabase();
    const institutionId = new ObjectId(session.user.institutionId);

    const cohort = await db.collection("cohorts").findOne({
      _id: new ObjectId(id),
      institutionId,
    });

    if (!cohort) {
      throw new AppError("Cohort not found", 404);
    }

    if (cohort.googleDriveFolderId) {
      return apiSuccess({
        message: "Cohort already has a Drive folder",
        folderId: cohort.googleDriveFolderId,
      });
    }

    const institution = await db
      .collection("institutions")
      .findOne({ _id: institutionId });

    if (!institution?.googleRefreshToken) {
      throw new AppError(
        "Google account not connected. Please connect your Google account in Settings.",
        400
      );
    }

    // Create institution root folder if it doesn't exist
    let rootFolderId = institution.googleDriveFolderId;

    if (!rootFolderId) {
      const rootFolder = await createDriveFolder({
        institutionId: institutionId.toString(),
        folderName: `${institution.name} - Fellowship Program`,
      });

      rootFolderId = rootFolder.id;

      await db.collection("institutions").updateOne(
        { _id: institutionId },
        {
          $set: {
            googleDriveFolderId: rootFolderId,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Create cohort folder
    const folder = await createDriveFolder({
      institutionId: institutionId.toString(),
      folderName: cohort.name,
      parentFolderId: rootFolderId,
    });

    await db.collection("cohorts").updateOne(
      { _id: cohort._id },
      {
        $set: {
          googleDriveFolderId: folder.id,
          updatedAt: new Date(),
        },
      }
    );

    return apiSuccess({
      message: "Drive folder created successfully",
      folderId: folder.id,
      webViewLink: folder.webViewLink,
    });
  } catch (error) {
    return handleError(error);
  }
}

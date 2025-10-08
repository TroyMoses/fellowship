import { google } from "googleapis";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

/**
 * Get OAuth2 client for a specific institution
 */
export async function getGoogleClient(institutionId: string | ObjectId) {
  console.log(
    "[v0] Getting Google client for institution:",
    institutionId.toString()
  );

  const db = await getDatabase();
  const institution = await db.collection("institutions").findOne({
    _id:
      typeof institutionId === "string"
        ? new ObjectId(institutionId)
        : institutionId,
  });

  if (!institution) {
    console.error("[v0] Institution not found:", institutionId.toString());
    throw new Error("Institution not found");
  }

  if (!institution.googleRefreshToken) {
    console.error(
      "[v0] No Google refresh token for institution:",
      institutionId.toString()
    );
    throw new Error("Google account not connected - no refresh token");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error(
      "[v0] Missing Google OAuth credentials in environment variables"
    );
    throw new Error("Google OAuth credentials not configured");
  }

  if (!process.env.NEXTAUTH_URL) {
    console.error("[v0] Missing NEXTAUTH_URL environment variable");
    throw new Error("NEXTAUTH_URL not configured");
  }

  console.log(
    "[v0] Creating OAuth2 client with redirect:",
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );

  oauth2Client.setCredentials({
    refresh_token: institution.googleRefreshToken,
  });

  try {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      console.error("[v0] Failed to get access token from refresh token");
      throw new Error("Failed to refresh Google access token");
    }
    console.log("[v0] Successfully obtained access token");
  } catch (error) {
    console.error("[v0] Error refreshing access token:", error);
    throw new Error(
      "Failed to authenticate with Google - refresh token may be invalid"
    );
  }

  return oauth2Client;
}

/**
 * Store Google refresh token for an institution
 */
export async function storeGoogleToken(
  institutionId: string | ObjectId,
  refreshToken: string
) {
  const db = await getDatabase();
  await db.collection("institutions").updateOne(
    {
      _id:
        typeof institutionId === "string"
          ? new ObjectId(institutionId)
          : institutionId,
    },
    {
      $set: {
        googleRefreshToken: refreshToken,
        updatedAt: new Date(),
      },
    }
  );
}

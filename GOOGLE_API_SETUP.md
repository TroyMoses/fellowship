# Google APIs Setup Guide

This guide will help you enable and configure the required Google APIs for the Fellowship Platform.

## Required APIs

The platform requires the following Google APIs to be enabled:

1. **Google Calendar API** - For creating sessions with Google Meet links
2. **Google Drive API** - For storing and managing cohort content

## Step-by-Step Setup

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project from the dropdown at the top (or create a new project)

### 2. Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
   - Or visit: https://console.cloud.google.com/apis/library
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" in the results
4. Click the **"Enable"** button
5. Wait 2-3 minutes for the API to be fully enabled

**Direct Link:** https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=YOUR_PROJECT_ID

### 3. Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API" in the results
4. Click the **"Enable"** button
5. Wait 2-3 minutes for the API to be fully enabled

**Direct Link:** https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=YOUR_PROJECT_ID

### 4. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name: "Fellowship Platform"
   - User support email: Your email
   - Developer contact email: Your email
4. Click **Save and Continue**

### 5. Add OAuth Scopes

1. On the "Scopes" page, click **Add or Remove Scopes**
2. Add the following scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/drive.file`
3. Click **Update** and then **Save and Continue**

### 6. Configure OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure:
   - Name: "Fellowship Platform Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourapp.vercel.app`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourapp.vercel.app/api/auth/callback/google` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Add them to your `.env.local` file:
   \`\`\`env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   \`\`\`

### 7. Verify API Status

After enabling the APIs, verify they're active:

1. Go to **APIs & Services** > **Dashboard**
2. You should see both "Google Calendar API" and "Google Drive API" listed
3. Check that they show as "Enabled"

### 8. Test the Integration

1. Restart your development server
2. Sign out and sign back in to refresh your OAuth tokens
3. Try creating a session - it should now work!

## Troubleshooting

### "API has not been used in project before or it is disabled"

**Solution:**

- Make sure you've enabled both Google Calendar API and Google Drive API
- Wait 2-3 minutes after enabling for changes to propagate
- Restart your development server
- Sign out and sign back in to get fresh OAuth tokens

### "Access Not Configured"

**Solution:**

- Check that the OAuth consent screen is properly configured
- Verify that all required scopes are added
- Make sure the redirect URIs match exactly (including http/https)

### "Invalid Client"

**Solution:**

- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that there are no extra spaces or quotes in your `.env.local` file
- Make sure you're using the credentials from the correct Google Cloud project

### "Insufficient Permissions"

**Solution:**

- Sign out and sign back in to grant the new permissions
- Check that the OAuth scopes include calendar and drive.file
- Verify the user has granted all requested permissions

## Important Notes

- **Development vs Production:** Make sure to add both development and production URLs to your OAuth configuration
- **API Quotas:** Google APIs have usage quotas. For production use, you may need to request quota increases
- **Security:** Never commit your `.env.local` file or expose your client secret
- **Token Refresh:** The platform automatically handles token refresh, but users may need to re-authenticate if tokens expire

## Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [API Library](https://console.cloud.google.com/apis/library)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [Credentials](https://console.cloud.google.com/apis/credentials)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)

## Need Help?

If you're still experiencing issues after following this guide:

1. Check the browser console for detailed error messages
2. Check the server logs for API error responses
3. Verify all environment variables are set correctly
4. Make sure you've waited a few minutes after enabling APIs
   \`\`\`

```typescript file="" isHidden

```

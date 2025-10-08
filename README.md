# Fellowship Management Platform

A modern, production-ready SaaS platform for managing fellowship programs with integrated Google Workspace features.

## Features

- **Authentication**: Secure Google OAuth integration with NextAuth.js
- **Session Management**: Schedule sessions with automatic Google Meet links and calendar invites
- **Content Management**: Upload and share content via Google Drive with cohort-specific folders
- **Role-Based Access**: Separate dashboards for admins and fellows
- **Real-time Sync**: Automatic synchronization with Google Calendar and Drive
- **Scalable Architecture**: Built with Next.js 15, MongoDB, and TypeScript

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js v4 with Google OAuth (JWT sessions)
- **UI**: shadcn/ui, Tailwind CSS v4
- **APIs**: Google Calendar API, Google Drive API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (MongoDB Atlas recommended)
- Google Cloud Console project with OAuth 2.0 credentials

### Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env

# MongoDB - Use the connection string from MongoDB Atlas

# Make sure to replace <username>, <password>, and <cluster-url>

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/fellowship_platform?retryWrites=true&w=majority&tls=true

# NextAuth

NEXTAUTH_URL=http://localhost:3000

# Generate a secret with: openssl rand -base64 32

NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth & APIs

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
\`\`\`

#### Generating NEXTAUTH_SECRET

Run this command in your terminal:

\`\`\`bash

# On macOS/Linux

openssl rand -base64 32

# On Windows (PowerShell)

node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

Copy the output and use it as your `NEXTAUTH_SECRET`.

#### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Get your connection string from the "Connect" button
5. **Important**: Ensure your connection string includes `?retryWrites=true&w=majority&tls=true`

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - For production, add: `https://your-domain.com/api/auth/callback/google`
5. The required scopes are automatically requested by the app:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/drive.file`

### Installation

\`\`\`bash

# Install dependencies

npm install

# Run development server

npm run dev

# Build for production

npm run build

# Start production server

npm start
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## First Time Setup

1. Sign in with your Google account
2. Select your role (Admin or Fellow)
3. If you're an admin, you'll be prompted to set up your institution
4. Connect your Google Calendar and Drive
5. Start creating cohorts and scheduling sessions!

## Troubleshooting

### MongoDB Connection Issues

If you see SSL/TLS errors:

1. Ensure your MongoDB URI includes `tls=true` parameter
2. Check that your IP is whitelisted in MongoDB Atlas
3. Verify your database user credentials are correct
4. Try using the connection string format: `mongodb+srv://...?retryWrites=true&w=majority&tls=true`

### Authentication Issues

If you're redirected back to the sign-in page:

1. Verify `NEXTAUTH_SECRET` is set in `.env.local`
2. Check that `NEXTAUTH_URL` matches your current URL
3. Ensure Google OAuth credentials are correct
4. Check the browser console and terminal for error messages

### Google API Issues

If Google Calendar/Drive features aren't working:

1. Verify APIs are enabled in Google Cloud Console
2. Check that OAuth consent screen is configured
3. Ensure redirect URIs match exactly (including http/https)
4. Verify the user has granted all required permissions

## Project Structure

\`\`\`
fellowship-platform/
├── app/ # Next.js app directory
│ ├── admin/ # Admin dashboard pages
│ ├── fellow/ # Fellow dashboard pages
│ ├── api/ # API routes
│ ├── auth/ # Authentication pages
│ └── onboarding/ # Role selection page
├── components/ # React components
│ ├── admin/ # Admin-specific components
│ ├── fellow/ # Fellow-specific components
│ ├── providers/ # Context providers
│ └── ui/ # shadcn/ui components
├── lib/ # Utility functions
│ ├── mongodb.ts # MongoDB connection with SSL config
│ ├── auth.ts # NextAuth configuration (JWT)
│ ├── google-auth.ts # Google OAuth helpers
│ ├── google-calendar.ts # Calendar API functions
│ ├── google-drive.ts # Drive API functions
│ ├── validation.ts # Input validation with Zod
│ ├── rate-limit.ts # Rate limiting
│ └── error-handler.ts # Error handling
├── types/ # TypeScript type definitions
└── middleware.ts # Next.js middleware for auth
\`\`\`

## Database Schema

### Collections

- **users**: User accounts with roles (admin/fellow)
- **accounts**: OAuth account information
- **institutions**: Institution/organization data
- **cohorts**: Fellowship cohort information
- **sessions**: Scheduled sessions with Meet links
- **content**: Uploaded content metadata

## Security Features

- **Authentication**: Secure OAuth 2.0 flow with Google
- **Session Management**: JWT-based sessions (no database calls during auth)
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Zod schema validation for all inputs
- **File Upload Security**: File type and size validation
- **Token Management**: Secure refresh token storage with encryption
- **HTTPS**: Enforced in production
- **MongoDB Security**: TLS/SSL encryption for database connections

## API Routes

### Authentication

- `GET/POST /api/auth/*` - NextAuth.js endpoints

### User Management

- `POST /api/user/role` - Set user role (admin/fellow)

### Cohorts

- `POST /api/cohorts` - Create a new cohort
- `GET /api/cohorts` - List all cohorts

### Sessions

- `POST /api/sessions` - Schedule a new session
- `GET /api/sessions` - List all sessions

### Content

- `POST /api/content` - Upload content to Drive
- `GET /api/content` - List all content

### Google Integration

- `POST /api/google/connect` - Connect Google account
- `GET /api/google/test` - Test Google API connection

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `MONGODB_URI`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Update Google OAuth redirect URIs in Google Cloud Console
5. Deploy

### Environment Variables for Production

\`\`\`env
MONGODB_URI=mongodb+srv://...?retryWrites=true&w=majority&tls=true
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
\`\`\`

## Performance Optimizations

- Server-side rendering for initial page loads
- JWT sessions (no database calls during authentication)
- MongoDB connection pooling with optimized settings
- Image optimization with Next.js Image
- Efficient data fetching with MongoDB aggregation
- Client-side caching with SWR

## Monitoring and Logging

- Console logging for debugging (development)
- Error tracking with detailed error messages
- API request/response logging
- NextAuth debug mode in development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for your fellowship programs.

## Support

For issues and questions, please open an issue on GitHub or contact support.

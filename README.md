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
- **Authentication**: NextAuth.js v4 with Google OAuth
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
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fellowship_platform

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth & APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
\`\`\`

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Add the following scopes:
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

## Project Structure

\`\`\`
fellowship-platform/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin dashboard pages
│   ├── fellow/              # Fellow dashboard pages
│   ├── api/                 # API routes
│   └── auth/                # Authentication pages
├── components/              # React components
│   ├── admin/              # Admin-specific components
│   ├── fellow/             # Fellow-specific components
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utility functions
│   ├── mongodb.ts          # MongoDB connection
│   ├── auth.ts             # NextAuth configuration
│   ├── google-auth.ts      # Google OAuth helpers
│   ├── google-calendar.ts  # Calendar API functions
│   ├── google-drive.ts     # Drive API functions
│   ├── validation.ts       # Input validation
│   ├── rate-limit.ts       # Rate limiting
│   └── error-handler.ts    # Error handling
├── types/                   # TypeScript type definitions
└── middleware.ts           # Next.js middleware
\`\`\`

## Database Schema

### Collections

- **institutions**: Institution/organization data
- **cohorts**: Fellowship cohort information
- **users**: User accounts (admins and fellows)
- **sessions**: Scheduled sessions with Meet links
- **content**: Uploaded content metadata

## Security Features

- **Authentication**: Secure OAuth 2.0 flow with Google
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Zod schema validation for all inputs
- **File Upload Security**: File type and size validation
- **Token Management**: Secure refresh token storage
- **HTTPS**: Enforced in production

## API Routes

### Cohorts
- `POST /api/cohorts` - Create a new cohort
- `GET /api/cohorts` - List all cohorts

### Sessions
- `POST /api/sessions` - Schedule a new session
- `GET /api/sessions` - List all sessions

### Content
- `POST /api/content` - Upload content to Drive
- `GET /api/content` - List all content

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Update `NEXTAUTH_URL` to your production domain and ensure all Google OAuth redirect URIs are updated in Google Cloud Console.

## Performance Optimizations

- Server-side rendering for initial page loads
- Optimistic UI updates with SWR
- Image optimization with Next.js Image
- MongoDB connection pooling
- Efficient data fetching with aggregation pipelines

## Monitoring and Logging

- Console logging for debugging (use proper logging service in production)
- Error tracking with detailed error messages
- API request/response logging

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

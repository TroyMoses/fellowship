# MongoDB SSL/TLS Connection Issues on Windows

If you're experiencing SSL/TLS connection errors with MongoDB Atlas on Windows, here are several solutions:

## Quick Fix (Development Only)

The code has been updated to automatically allow invalid certificates in development mode. This should resolve most SSL issues.

## Permanent Solutions

### Option 1: Update MongoDB Connection String

Add SSL parameters to your connection string:

\`\`\`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fellowship_platform?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true
\`\`\`

**Note:** Only use `tlsAllowInvalidCertificates=true` in development!

### Option 2: Update Node.js

Some Node.js versions have OpenSSL issues. Try updating to the latest LTS version:

\`\`\`bash

# Check your Node.js version

node --version

# Update to latest LTS (v20 or v22)

\`\`\`

### Option 3: Use MongoDB Compass Connection String

1. Open MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect using MongoDB Compass"
4. Copy the connection string
5. Replace the one in your `.env.local`

### Option 4: Disable SSL Validation (Development Only)

If the above doesn't work, you can temporarily disable SSL validation:

\`\`\`env

# Add to .env.local

NODE_TLS_REJECT_UNAUTHORIZED=0
\`\`\`

**⚠️ WARNING:** Never use this in production!

### Option 5: Use Local MongoDB

For development, consider using a local MongoDB instance:

\`\`\`bash

# Install MongoDB locally

# Then use this connection string:

MONGODB_URI=mongodb://localhost:27017/fellowship_platform
\`\`\`

## Verify Connection

After applying a fix, restart your development server:

\`\`\`bash
npm run dev
\`\`\`

Watch the console for MongoDB connection logs. You should see successful connection messages instead of SSL errors.

## Production Deployment

For production on Vercel:

- The SSL issues are Windows-specific and won't occur on Vercel's Linux servers
- Remove `tlsAllowInvalidCertificates=true` from your production connection string
- Use the standard MongoDB Atlas connection string

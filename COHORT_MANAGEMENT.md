# Cohort Management System

This document explains the automatic cohort management system implemented in the Fellowship Platform.

## Overview

The platform now enforces a **single active cohort per institution** policy with automatic status transitions based on dates.

## Key Features

### 1. Single Active Cohort Rule

- Only one cohort can be "active" at any given time per institution
- When creating a new cohort while one is active, the new cohort is automatically set to "upcoming" status
- Fellows approved by admins are automatically assigned to the active cohort

### 2. Date Range Validation

When creating a new cohort:

- **No Overlapping Dates**: New cohorts cannot have date ranges that overlap with existing cohorts
- **Sequential Cohorts**: If an active cohort exists, new cohorts must start after the active cohort's end date
- **Clear Error Messages**: Users receive specific feedback about date conflicts

### 3. Automatic Status Transitions

#### Cohort Statuses

- **upcoming**: Cohort is scheduled but hasn't started yet
- **active**: Cohort is currently running (only one per institution)
- **completed**: Cohort has ended

#### Automatic Activation/Deactivation

The system automatically updates cohort statuses through:

**Daily Cron Job** (runs at midnight UTC):

- Checks all institutions
- Deactivates cohorts that have passed their end date (active → completed)
- Activates upcoming cohorts that have reached their start date (upcoming → active)

**Manual Trigger** (for admins):

- Admins can manually trigger status updates via: `GET /api/cohorts/activate`
- Useful for testing or immediate updates without waiting for the cron job

### 4. Automatic Fellow Assignment

When an admin approves a fellow's application:

- The system automatically finds the active cohort for that institution
- The fellow is immediately added to the active cohort's `fellowIds` array
- The cohort ID is added to the fellow's `cohortIds` array
- If no active cohort exists, the fellow is added to the institution but not assigned to a cohort yet

### 5. Viewing Expired Cohorts

Admins can view all cohorts (active, upcoming, and completed) including:

- All fellows who were part of expired cohorts
- All sessions that were held during the cohort
- All content that was shared with the cohort
- Complete historical data is preserved

## API Endpoints

### Create Cohort

\`\`\`
POST /api/cohorts
\`\`\`
**Validation**:

- Checks for overlapping date ranges
- Ensures new cohorts start after active cohort ends
- Automatically sets status based on dates and existing active cohorts

### Activate Cohorts (Cron)

\`\`\`
POST /api/cohorts/activate
Authorization: Bearer {CRON_SECRET}
\`\`\`
**Purpose**: Automated daily job to update cohort statuses

### Check Cohort Status (Manual)

\`\`\`
GET /api/cohorts/activate
\`\`\`
**Purpose**: Admin-triggered status update for their institution

### Review Application

\`\`\`
POST /api/applications/review
\`\`\`
**Automatic Behavior**: Approved fellows are automatically assigned to the active cohort

## Environment Variables

### Required for Cron Job

\`\`\`env
CRON_SECRET=your-secure-random-string
\`\`\`

Set this in your Vercel project settings to secure the cron endpoint.

## Vercel Cron Configuration

The cron job is configured in `vercel.json`:

\`\`\`json
{
"crons": [
{
"path": "/api/cohorts/activate",
"schedule": "0 0 * * *"
}
]
}
\`\`\`

This runs daily at midnight UTC (00:00).

## User Workflows

### Creating a New Cohort

1. Admin navigates to "Cohorts" → "Create Cohort"
2. Fills in cohort details (name, description, dates)
3. System validates:
   - End date is after start date
   - No date overlap with existing cohorts
   - If active cohort exists, new cohort starts after it ends
4. Cohort is created with appropriate status:
   - "active" if dates are current and no other active cohort exists
   - "upcoming" if dates are in the future OR another cohort is active
   - "completed" if dates are in the past

### Approving Fellows

1. Admin reviews application at `/admin/applications/[id]`
2. Clicks "Approve"
3. System automatically:
   - Finds the active cohort
   - Assigns fellow to that cohort
   - Sends approval email to fellow
4. Fellow immediately has access to active cohort's sessions and content

### Viewing Historical Data

1. Admin navigates to "Cohorts"
2. All cohorts are listed with status badges (active/upcoming/completed)
3. Clicking any cohort shows:
   - All fellows (past or present)
   - All sessions (past or scheduled)
   - All content items
   - Complete cohort information

## Database Schema

### Cohort Document

\`\`\`typescript
{
\_id: ObjectId,
institutionId: ObjectId,
name: string,
description?: string,
startDate: Date,
endDate: Date,
googleDriveFolderId?: string,
fellowIds: ObjectId[],
status: "upcoming" | "active" | "completed",
createdAt: Date,
updatedAt: Date
}
\`\`\`

## Error Messages

### Date Validation Errors

- "End date must be after start date"
- "New cohort must start after the current active cohort ends (MM/DD/YYYY)"
- "Date range overlaps with existing cohort 'Cohort Name' (MM/DD/YYYY - MM/DD/YYYY)"

## Best Practices

1. **Plan Cohorts in Advance**: Create upcoming cohorts before the current one ends
2. **Monitor Status**: Check the cohorts page regularly to see status transitions
3. **Sequential Planning**: Ensure cohort dates don't overlap to avoid validation errors
4. **Historical Access**: Completed cohorts remain accessible for reference and reporting

## Troubleshooting

### Cohort Not Activating Automatically

- Check that the cron job is running (Vercel dashboard → Cron Jobs)
- Verify `CRON_SECRET` is set in environment variables
- Manually trigger: `GET /api/cohorts/activate` as an admin

### Cannot Create New Cohort

- Check for date overlaps with existing cohorts
- Ensure new cohort starts after active cohort ends
- Review error message for specific date conflict details

### Fellow Not Assigned to Cohort

- Verify an active cohort exists when approving the application
- Check cohort status in the cohorts list
- Fellows approved without an active cohort will be assigned when one becomes active

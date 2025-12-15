# Canvas LMS + Microsoft Integration

## Overview

The system now automatically syncs Canvas LMS assignments for users who log in with their Microsoft account. This works because Canvas can use Microsoft OAuth tokens for authentication when your institution has Microsoft integrated with Canvas.

## How It Works

### For Microsoft Users

1. **Automatic Detection**: When you log in with Microsoft, the system detects your Microsoft account
2. **Auto-Sync on Login**: Assignments from ALL your Canvas courses are automatically synced
3. **No Manual Setup**: No need to enter Canvas URLs or tokens
4. **24-Hour Refresh**: Assignments auto-sync every 24 hours when you log in

### For Non-Microsoft Users

Users who don't log in with Microsoft can still manually configure Canvas:

1. Enter Canvas API URL
2. Generate and enter a Canvas access token
3. Click "Sync Assignments" button

## Setup Requirements

### Environment Variables

Add to your `.env` file:

```env
# Canvas LMS Configuration
CANVAS_API_URL=https://canvas.yourinstitution.edu
```

**Important**: Do NOT include `/api/v1` at the end of the URL.

### How Microsoft Integration Works

1. User logs in with Microsoft OAuth
2. System stores Microsoft access token in the database
3. Canvas API accepts this Microsoft token (when Canvas is configured to use Microsoft SSO)
4. System fetches all courses the user is enrolled in
5. For each course, fetches all assignments
6. Creates tasks for each new assignment

## Features

### Automatic Syncing

- ✅ Syncs on first login
- ✅ Re-syncs every 24 hours
- ✅ Fetches from ALL enrolled courses
- ✅ Skips already-imported assignments
- ✅ No user interaction needed

### Assignment Data

Each Canvas assignment becomes:

**Assignment Record:**

- Name: "Course Name: Assignment Name"
- Canvas Assignment ID
- Canvas Course ID
- Due date (or 7 days from now if no due date)

**Task Record:**

- Name: Assignment name
- Description: "Canvas assignment from Course Name"
- Body: Markdown formatted with:
  - Assignment title
  - Course name
  - Description (if available)
  - Direct link to Canvas

### Canvas Button UI

The Canvas button in the task editor shows different content based on login method:

**Microsoft Users See:**

- ✅ "Microsoft Account Detected" message
- Information about automatic syncing
- No credential input fields needed

**Other Users See:**

- Canvas API URL input
- Access token input
- Manual sync button
- Tip to log in with Microsoft for auto-sync

## Technical Implementation

### Files Modified

1. **src/app/actions/canvas-sync.ts**

   - Detects Microsoft account
   - Uses Microsoft access token for Canvas API
   - Syncs assignments directly (no API call needed)
   - Handles both first-time and recurring syncs

2. **src/app/api/canvas/sync/route.ts**

   - POST: Accepts `useMicrosoft` flag
   - POST: Uses Microsoft token when flag is set
   - GET: Returns `isMicrosoftUser` status

3. **src/components/canvas-button.tsx**

   - Shows Microsoft-specific UI
   - Displays auto-sync information
   - Hides credential inputs for Microsoft users

4. **src/components/auth-provider.tsx**
   - Triggers Canvas check on login
   - Runs in background without blocking UI

### Database Schema

**user table:**

- `canvasApiUrl`: Canvas instance URL
- `canvasApiToken`: Manual token (null for Microsoft users)
- `canvasLastSync`: Last successful sync timestamp

**account table:**

- `providerId`: "microsoft" for Microsoft users
- `accessToken`: OAuth token used for Canvas API

**assignment table:**

- `canvasAssignmentId`: Canvas assignment ID
- `canvasCourseId`: Canvas course ID

**task table:**

- Links to assignment via `assignmentId`

## API Endpoint

### POST /api/canvas/sync

**For Microsoft Users:**

```json
{
  "useMicrosoft": true
}
```

**For Manual Users:**

```json
{
  "apiUrl": "https://canvas.university.edu",
  "apiToken": "your_canvas_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "synced": 15,
  "skipped": 3,
  "total": 18,
  "message": "Synced 15 assignments, skipped 3 existing"
}
```

### GET /api/canvas/sync

**Response:**

```json
{
  "configured": true,
  "apiUrl": "https://canvas.university.edu",
  "lastSync": "2025-12-12T10:30:00.000Z",
  "isMicrosoftUser": true
}
```

## Troubleshooting

### Assignments Not Syncing

1. **Check Microsoft Login**: Verify you're logged in with Microsoft account
2. **Check Access Token**: Go to database and verify `account.accessToken` exists
3. **Check Canvas URL**: Verify `CANVAS_API_URL` is set in `.env`
4. **Check Logs**: Look for errors in server console during login
5. **Manual Test**: Try manual sync with Canvas credentials

### Canvas API Errors

- **401 Unauthorized**: Microsoft token may not work with your Canvas instance
- **404 Not Found**: Check `CANVAS_API_URL` is correct
- **Rate Limit**: Canvas API has rate limits; wait and retry

### Microsoft Token Expires

- Tokens typically last 1 hour
- Better Auth should refresh them automatically
- If sync fails, log out and back in to refresh token

## Security Notes

- Microsoft access tokens are stored encrypted in the database
- Tokens are only used server-side, never exposed to client
- Manual Canvas tokens are also stored securely
- All API requests require authentication
- Canvas credentials are user-specific, not shared

## Future Enhancements

Potential improvements:

- [ ] Webhook support for real-time assignment updates
- [ ] Sync assignment submissions/grades
- [ ] Two-way sync (update Canvas from app)
- [ ] Support for other SSO providers (Google, etc.)
- [ ] Assignment completion tracking
- [ ] Canvas calendar integration

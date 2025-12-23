# Debugging Guide

This document provides information on debugging common issues in the RPS OnChain application.

## Name Resolution Priority Order

The application resolves names in the following priority order:

1. **ENS** (highest priority - official blockchain identity)
2. **Farcaster** (social identity)
3. **Basename** (Base chain names)
4. **Wallet Address** (fallback - shortened format)

## Environment Variables Required

Make sure these environment variables are configured in your Vercel deployment:

### Required for Farcaster Name Resolution

- `NEYNAR_API_KEY` - Get your free API key at https://neynar.com/

### Required for Cron Jobs

- `CRON_SECRET` - A secure random string to protect cron endpoints

### Required for Redis Caching

- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token

## Debugging Endpoints

### Test Farcaster Name Resolution

```
GET /api/test-farcaster?address=0x1234...
```

This endpoint will:

- Test name resolution for a specific address
- Show if NEYNAR_API_KEY is configured
- Display detailed logs of the resolution process

### Test Cron Jobs

```
GET /api/test-cron?endpoint=cleanup-rooms&secret=YOUR_CRON_SECRET
GET /api/test-cron?endpoint=notifications&secret=YOUR_CRON_SECRET
```

This endpoint will:

- Test cron job endpoints manually
- Verify CRON_SECRET configuration
- Show detailed response from cron jobs

### Test Notification Preferences

```
GET /api/check-notification-prefs?fid=YOUR_FID
```

This endpoint will:

- Check if user has notification preferences set up
- Show whether notifications should be sent
- Provide recommendations for fixing notification issues

### Debug Notifications

```
GET /api/test-notifications-debug?fid=YOUR_FID
```

This endpoint will:

- Show all users with notification preferences
- Display detailed timing and eligibility information
- Show what notifications would be generated

## Common Issues

### 1. Wrong Name Source Priority

**Symptoms:**

- User has ENS but Farcaster name is showing
- Expected name source not being used

**Solution:**

- ENS names have highest priority (most official)
- Farcaster names are second priority
- Check logs to see which names were found during resolution

### 2. Farcaster Users Showing as "wallet" Source

**Symptoms:**

- Users with Farcaster accounts show as "wallet" source instead of "farcaster"
- Badge shows "BASE" instead of "FC"

**Debugging:**

1. Check if `NEYNAR_API_KEY` is configured in Vercel
2. Use `/api/test-farcaster?address=USER_ADDRESS` to test resolution
3. Check logs for Neynar API errors

**Solution:**

- Configure `NEYNAR_API_KEY` in Vercel environment variables
- Ensure the API key has proper permissions

### 3. Base Chain ENS Resolver Errors

**Symptoms:**

- Error: `Chain "Base" does not support contract "ensUniversalResolver"`

**Solution:**

- The code has been updated to handle Base chain properly
- Basename resolution now uses the correct approach without universalResolverAddress

### 4. Cron Jobs Not Running

**Symptoms:**

- Cron jobs don't appear in Vercel dashboard
- Daily reminders not being sent
- Room cleanup not happening

**Debugging:**

1. Check if `vercel.json` is properly configured
2. Verify `CRON_SECRET` is set in Vercel
3. Use `/api/test-cron` endpoints to test manually

**Solution:**

- Ensure `vercel.json` is in the correct location (`packages/nextjs/vercel.json`)
- Configure `CRON_SECRET` in Vercel environment variables
- Deploy the application to register cron jobs

### 5. Match Timeout Errors

**Symptoms:**

- `TypeError: fetch failed` with `ETIMEDOUT` errors
- Matches not loading on share pages

**Solution:**

- The code has been updated with 10-second timeouts
- Match history is now separated from room cleanup
- Matches persist for 30 days even after rooms expire

### 6. Notifications Not Being Received

**Symptoms:**

- Cron job runs successfully but no Farcaster notifications received
- User has enabled notifications but doesn't get daily reminders

**Debugging:**

1. Check if user has notification preferences: `/api/check-notification-prefs?fid=YOUR_FID`
2. Verify notification token is present in database
3. Check if user is within the time window (±1 hour of reminder time)
4. Verify user hasn't already claimed today

**Common Causes:**

- **No notification token**: User needs to grant notification permissions in Farcaster client
- **Wrong time window**: Notifications only sent within 1 hour of reminder time
- **Already claimed**: No notification sent if user already claimed today
- **Disabled reminders**: User has `enable_daily_reminders = 0`

**Solution:**

- User must enable notifications in the Farcaster miniapp
- Notification token is automatically stored when user grants permissions
- Check timing - cron runs at 9 AM UTC, sends to users with reminder time ±1 hour

## Vercel Cron Configuration

The application uses two cron jobs:

1. **Room Cleanup** - Runs daily at midnight UTC

   - Path: `/api/cron/cleanup-rooms`
   - Schedule: `0 0 * * *`

2. **Daily Reminders** - Runs daily at 9 AM UTC
   - Path: `/api/notifications/send-daily-reminders`
   - Schedule: `0 9 * * *`

Both cron jobs require the `CRON_SECRET` environment variable for authentication.

## Logs to Monitor

When debugging, look for these log prefixes:

- `[Name Resolution]` - General name resolution process
- `[Farcaster Resolution]` - Farcaster-specific resolution
- `[Basename Resolution]` - Base chain name resolution
- `[resolvePlayerName]` - Main resolution function
- `[Test Farcaster]` - Debug endpoint logs
- `[Test Cron]` - Cron debug endpoint logs

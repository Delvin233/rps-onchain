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

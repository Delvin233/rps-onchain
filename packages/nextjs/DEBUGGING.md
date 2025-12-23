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

### Test Notification Sending

```
GET /api/test-notification-send?fid=YOUR_FID
```

This endpoint will:

- Send a test notification to a specific user
- Verify notification token is working
- Show detailed response from Farcaster API

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

**Symptoms:**[useDisplayName] Final values for 0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6:
Object
displayName
:
"delvin233"
ensType
:
"farcaster"
hasEns
:
true
resolvedName
:
{address: '0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6', displayName: 'delvin233', source: 'farcaster', farcasterUsername: 'delvin233', farcasterDisplayName: 'delvin233', …}
source
:
"farcaster"
[[Prototype]]
:
Object

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

## Notification System Debug Guide

The notification system sends daily reminders for GoodDollar UBI claims via Farcaster push notifications. **Farcaster handles notification preferences natively** - users enable/disable notifications through the miniapp menu (three dots → "Turn on/off notifications").

### System Architecture

1. **Native Farcaster Preferences** - Users control notifications via Farcaster's built-in toggle
2. **Automatic Token Storage** - When users enable notifications, the app automatically stores their notification token
3. **Daily Cron Job** - Sends notifications to all users who have tokens (meaning they enabled notifications)
4. **Simple UI** - Just shows notification status and instructions, no custom toggles needed

### How It Works

1. **User Enables Notifications:**

   - User taps three dots (⋯) in Farcaster miniapp
   - Selects "Turn on notifications"
   - Farcaster provides notification token to the app
   - App automatically stores token in database

2. **Daily Notifications:**

   - Cron runs at 9 AM UTC daily
   - Finds all users with notification tokens
   - Sends reminders to users who haven't claimed UBI today
   - Uses Farcaster's notification API

3. **User Disables Notifications:**
   - User taps "Turn off notifications" in Farcaster menu
   - Farcaster stops providing notification token
   - App stops sending notifications (no token = no notifications)

### Debug Endpoints

#### Check User Notification Status

```bash
GET /api/check-notification-prefs?fid=12345
```

#### Test Notification Sending

```bash
GET /api/test-notification-send?fid=12345
```

#### Debug All Users

```bash
GET /api/test-notifications-debug
```

### Common Issues & Solutions

#### 1. User Not Receiving Notifications

**Check List:**

1. **Farcaster Notifications Enabled**: User must enable via Farcaster menu (⋯ → Turn on notifications)
2. **Token Stored**: Check if notification token exists in database
3. **Time Window**: Notifications sent between 8-10 AM UTC
4. **Already Claimed**: No notification if user already claimed UBI today

**Debug Steps:**

```bash
# Check if user has notification token
curl "https://www.rpsonchain.xyz/api/check-notification-prefs?fid=USER_FID"

# Test sending notification manually
curl "https://www.rpsonchain.xyz/api/test-notification-send?fid=USER_FID"
```

#### 2. No Notification Token

**Symptoms:**

- `hasNotificationToken: false` in debug response
- User says they enabled notifications but no token stored

**Solutions:**

1. User needs to enable notifications via Farcaster menu (not in-app toggle)
2. Check if app properly detects `context.client.notificationDetails.token`
3. Verify token storage API is working

#### 3. Notifications Not Sending

**Check:**

- Cron job is running (check Vercel function logs)
- Users have notification tokens in database
- Current time is between 8-10 AM UTC
- Farcaster API is responding correctly

### Simplified Database Schema

```sql
CREATE TABLE notification_preferences (
  fid INTEGER PRIMARY KEY,
  address TEXT,
  notification_token TEXT,  -- Only field that matters now
  last_claim_date TEXT,     -- To prevent duplicate notifications
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Testing Flow

#### 1. Enable Notifications (User)

1. Open app in Farcaster
2. Tap three dots (⋯) in top right
3. Select "Turn on notifications"
4. Verify notification status shows "Enabled" in profile

#### 2. Test Notification System

```bash
# Check if token was stored
curl "https://www.rpsonchain.xyz/api/check-notification-prefs?fid=YOUR_FID"

# Send test notification
curl "https://www.rpsonchain.xyz/api/test-notification-send?fid=YOUR_FID"

# Run cron job manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     "https://www.rpsonchain.xyz/api/notifications/send-daily-reminders"
```

### Key Simplifications

- ❌ **No custom notification toggles** - Farcaster handles this
- ❌ **No reminder time selection** - Fixed at 9 AM UTC ±1 hour
- ❌ **No complex preference management** - Token presence = wants notifications
- ✅ **Automatic token detection** - Works seamlessly with Farcaster
- ✅ **Simple UI** - Just shows status and instructions
- ✅ **Native UX** - Uses Farcaster's built-in notification system

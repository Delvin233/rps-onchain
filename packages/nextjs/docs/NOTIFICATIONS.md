# Daily GoodDollar Notification System

This document describes the simplified notification system for daily GoodDollar reminders in the RPS-onChain Farcaster miniapp.

## Overview

The system automatically sends daily reminders to users who have added the miniapp to claim their GoodDollar rewards. It works entirely in the background without requiring any user interface - Farcaster handles notification preferences natively.

## How It Works

1. **User adds miniapp** → Webhook automatically enables daily reminders
2. **User removes miniapp** → Webhook automatically disables reminders
3. **Daily cron job** → Sends reminders to all enabled users at 9:00 AM UTC
4. **User controls** → Users can enable/disable notifications directly in their Farcaster client

## Components

### 1. Database Schema

```sql
CREATE TABLE notification_preferences (
  fid INTEGER PRIMARY KEY,
  address TEXT,
  enable_daily_reminders BOOLEAN DEFAULT 1,
  reminder_time TEXT DEFAULT '09:00',
  timezone TEXT DEFAULT 'UTC',
  last_claim_date TEXT,
  notification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. API Endpoints

- **`/api/notifications/preferences`** - GET/POST for managing user preferences (internal use)
- **`/api/notifications/send-daily-reminders`** - POST endpoint for cron job
- **`/api/farcaster/webhook`** - Webhook handler for miniapp add/remove events

### 3. Cron Job

Runs daily at 9:00 AM UTC via Vercel Cron:

```json
{
  "path": "/api/notifications/send-daily-reminders",
  "schedule": "0 9 * * *"
}
```

## Features

### Automatic Setup

- When users add the miniapp, notifications are automatically enabled
- When users remove the miniapp, notifications are automatically disabled
- No user interface needed - works entirely in the background

### Smart Reminders

- Sends daily GoodDollar claim reminders
- Randomized greeting messages for variety
- Prevents duplicate notifications if already claimed
- 1-hour window for sending reminders

### Farcaster Integration

- Uses Farcaster's native notification system
- Users control notifications through their Farcaster client settings
- Respects user preferences set in Farcaster

## Environment Variables

```bash
# Required for cron job security
CRON_SECRET=your_secure_random_string_here
```

## Manual Testing

You can manually trigger the daily reminders by calling:

```bash
curl -X POST https://your-domain.com/api/notifications/send-daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Future Enhancements

- Timezone-aware scheduling
- Multiple reminder times per day
- Game match notifications
- Tournament announcements
- Weekly leaderboard updates

## Architecture Benefits

- **Zero UI complexity** - No settings pages needed
- **Native integration** - Uses Farcaster's built-in notification controls
- **Automatic management** - Self-managing based on miniapp add/remove events
- **Secure** - Protected cron endpoints with secret authentication
- **Scalable** - Handles unlimited users with efficient database queries

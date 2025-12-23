# Neynar Notifications Integration

This document explains how RPS-onChain integrates with Neynar for Farcaster miniapp notifications.

## Overview

We've migrated from a custom notification system to Neynar's managed notification service for better reliability, analytics, and cross-client support.

## Key Components

### 1. Manifest Configuration

- **Webhook URL**: `https://api.neynar.com/f/app/fcd16a47-60e7-472b-b9bd-617e31f0f7e9/event`
- **Location**: `packages/nextjs/app/.well-known/farcaster.json/route.ts`

### 2. Notification Service

- **File**: `packages/nextjs/lib/notificationService.ts`
- **Main Functions**:
  - `sendFarcasterNotification(fids[], notification)` - Send to multiple users
  - `sendFarcasterNotificationToUser(fid, notification)` - Send to single user

### 3. UI Components

- **AddMiniAppPrompt**: `packages/nextjs/components/AddMiniAppPrompt.tsx`

  - Prompts users to add the miniapp and enable notifications
  - Shows different states (not added, already added, loading)
  - Handles success/error cases

- **TestNotificationButton**: `packages/nextjs/components/TestNotificationButton.tsx`
  - Allows users to test if notifications are working
  - Only visible in Farcaster contexts

### 4. API Endpoints

- `/api/test-neynar?fid=YOUR_FID` - Test Neynar integration
- `/api/debug-notification?fid=YOUR_FID` - Debug notification issues
- `/api/notifications/send-daily-reminders` - Cron job for daily reminders
- `/api/test-notification-send?fid=YOUR_FID` - Legacy test endpoint (updated for Neynar)

## How It Works

### User Flow

1. **User visits profile page** in Farcaster client (Warpcast, Base App, etc.)
2. **AddMiniAppPrompt appears** if not already added
3. **User clicks "Add Mini App"** → `sdk.actions.addMiniApp()` is called
4. **Farcaster client** generates notification token and sends to Neynar webhook
5. **Neynar manages** the token automatically
6. **App can send notifications** via Neynar API without managing tokens

### Notification Sending

```typescript
// Send to single user
await sendFarcasterNotificationToUser(fid, {
  title: "🎉 Daily Reward Available!",
  body: "Your GoodDollar is ready to claim!",
  targetUrl: "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
});

// Send to multiple users (batch)
await sendFarcasterNotification([fid1, fid2, fid3], notification);
```

## Benefits of Neynar

### ✅ **Advantages**

- **No token management** - Neynar handles all notification tokens
- **Cross-client support** - Works in Warpcast, Base App, and other Farcaster clients
- **Analytics dashboard** - View delivery rates, open rates, engagement metrics
- **Better error handling** - Improved rate limiting and retry logic
- **Batch sending** - Send to multiple users efficiently
- **Automatic cleanup** - Handles token revocation and user removal

### 📊 **Analytics**

Visit [dev.neynar.com](https://dev.neynar.com) to see:

- Notification delivery rates
- User engagement metrics
- Error tracking and debugging
- Performance insights

## Environment Variables

```bash
NEYNAR_API_KEY=270438F3-1ECD-4DA2-99B2-5FCA98640BF8
```

## Testing

### Manual Testing

1. **Add miniapp**: Visit `/profile` in Farcaster client and click "Add Mini App"
2. **Test notification**: Click "Test Notification" button on profile page
3. **API testing**: `GET /api/test-neynar?fid=YOUR_FID`

### Daily Reminders

- **Cron job**: Runs at 9 AM UTC daily
- **Endpoint**: `/api/notifications/send-daily-reminders`
- **Target**: Users with `enable_daily_reminders = 1` in database

## Migration Notes

### What Changed

- **Webhook URL**: Now points to Neynar instead of custom endpoint
- **API calls**: Use Neynar API instead of direct Farcaster API
- **Token management**: Removed - Neynar handles automatically
- **Error handling**: Improved with Neynar's infrastructure

### Backward Compatibility

- All existing API endpoints still work
- Database schema unchanged
- User preferences preserved
- Notification content format unchanged

## Troubleshooting

### Common Issues

1. **Notifications not received**:

   - Check if user added miniapp (`context.client.added`)
   - Verify user enabled notifications in Farcaster client
   - Test with `/api/test-neynar?fid=FID`

2. **API errors**:

   - Verify `NEYNAR_API_KEY` is set
   - Check Neynar API status
   - Review error logs in Neynar dev portal

3. **Manifest issues**:
   - Ensure webhook URL is correct in manifest
   - Verify domain matches production URL
   - Check manifest is accessible at `/.well-known/farcaster.json`

### Debug Tools

- **Test endpoint**: `/api/test-neynar?fid=YOUR_FID`
- **Debug endpoint**: `/api/debug-notification?fid=YOUR_FID`
- **Neynar dev portal**: [dev.neynar.com](https://dev.neynar.com)

## Future Enhancements

### Potential Improvements

- **User segmentation** - Target notifications based on user behavior
- **A/B testing** - Test different notification content
- **Scheduled notifications** - Send at optimal times per user
- **Rich notifications** - Include images, actions, etc.
- **Analytics integration** - Connect with app analytics

### Neynar Features to Explore

- **Notification filtering** - Target specific user cohorts
- **Rate limiting** - Automatic throttling and retry logic
- **Delivery optimization** - Best time delivery
- **Template management** - Reusable notification templates

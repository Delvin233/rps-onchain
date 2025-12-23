/**
 * Notification service for Farcaster miniapp push notifications using Neynar
 */
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export interface NotificationData {
  title: string;
  body: string;
  targetUrl?: string;
  actionUrl?: string;
}

export interface UserNotificationPrefs {
  fid: number;
  address?: string;
  enableDailyReminders: boolean;
  reminderTime: string; // HH:MM format, e.g., "09:00"
  timezone: string; // e.g., "America/New_York"
  lastClaimDate?: string; // YYYY-MM-DD format
  notificationToken?: string; // From Farcaster client (managed by Neynar)
}

// Initialize Neynar client
let neynarClient: NeynarAPIClient;

function getNeynarClient(): NeynarAPIClient {
  if (!neynarClient) {
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error("NEYNAR_API_KEY not found in environment variables");
    }
    // Initialize with configuration object
    neynarClient = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY,
    });
  }
  return neynarClient;
}

/**
 * Send notification to Farcaster users using Neynar SDK
 * Based on Base App documentation approach
 */
export async function sendFarcasterNotification(
  fids: number[], // Support multiple FIDs for batch sending
  notification: NotificationData,
): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar SDK] Attempting to send to FIDs:`, fids);
      console.log(`[Neynar SDK] Notification:`, notification);
    }

    if (!process.env.NEYNAR_API_KEY) {
      console.error(`[Neynar SDK] NEYNAR_API_KEY not found in environment variables`);
      return false;
    }

    // Use Neynar SDK approach (as recommended by Base App docs)
    const client = getNeynarClient();
    const response = await client.publishFrameNotifications({
      targetFids: fids, // Array of FIDs to send to (empty array = all users with notifications enabled)
      filters: {}, // No filters for now, but could add exclude_fids, following_fid, etc.
      notification: {
        title: notification.title,
        body: notification.body,
        target_url: notification.targetUrl || "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar SDK] Successfully sent:`, response);
    }

    return true;
  } catch (error) {
    console.error(`[Neynar SDK] Failed to send:`, error);
    return false;
  }
}

/**
 * Send notification to single user (wrapper for backward compatibility)
 */
export async function sendFarcasterNotificationToUser(fid: number, notification: NotificationData): Promise<boolean> {
  return sendFarcasterNotification([fid], notification);
}

/**
 * Generate daily GoodDollar claim reminder
 */
export function generateGoodDollarReminder(userName?: string): NotificationData {
  const greetings = [
    "Good morning",
    "Rise and shine",
    "Start your day right",
    "Daily opportunity awaits",
    "Time to claim",
  ];

  const messages = [
    "Your daily $GoodDollar is ready to claim!",
    "Don't miss your daily $GoodDollar reward!",
    "Claim your free $GoodDollar today!",
    "Your daily crypto reward is waiting!",
    "Free $GoodDollar available - claim now!",
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  const title = userName ? `${greeting}, ${userName}!` : greeting;

  return {
    title,
    body: message,
    targetUrl: "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
    actionUrl: "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
  };
}

/**
 * Check if user should receive daily reminder
 * With Neynar, we only check if user has enabled reminders and timing
 */
export function shouldSendDailyReminder(prefs: UserNotificationPrefs): boolean {
  // If user hasn't enabled daily reminders, don't send
  if (!prefs.enableDailyReminders) return false;

  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Don't send if already claimed today
  if (prefs.lastClaimDate === today) return false;

  // Check if it's the right time (within 1 hour window of 9 AM UTC)
  // Since cron runs at 9 AM UTC, we send to everyone who hasn't claimed today
  const currentHour = now.getHours();

  // Send notifications between 8 AM and 10 AM UTC (±1 hour from 9 AM)
  return currentHour >= 8 && currentHour <= 10;
}

/**
 * Get default notification preferences
 */
export function getDefaultNotificationPrefs(fid: number): UserNotificationPrefs {
  return {
    fid,
    enableDailyReminders: true,
    reminderTime: "09:00", // 9 AM
    timezone: "UTC",
  };
}

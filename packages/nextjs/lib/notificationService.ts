/**
 * Notification service for Farcaster miniapp push notifications using Neynar
 */

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

/**
 * Send notification to Farcaster users using Neynar's API
 * Based on Neynar notification documentation
 */
export async function sendFarcasterNotification(
  fids: number[], // Support multiple FIDs for batch sending
  notification: NotificationData,
): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar Notification] Attempting to send to FIDs:`, fids);
      console.log(`[Neynar Notification] Notification:`, notification);
    }

    if (!process.env.NEYNAR_API_KEY) {
      console.error(`[Neynar Notification] NEYNAR_API_KEY not found in environment variables`);
      return false;
    }

    const requestBody = {
      target_fids: fids, // Array of FIDs to send to
      notification: {
        title: notification.title,
        body: notification.body,
        target_url: notification.targetUrl || "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar Notification] Request body:`, requestBody);
    }

    // Use Neynar's notification API
    const response = await fetch("https://api.neynar.com/v2/farcaster/frame/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEYNAR_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar Notification] Response status: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Neynar Notification] Failed to send: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    if (process.env.NODE_ENV === "development") {
      console.log(`[Neynar Notification] Successfully sent:`, result);
    }
    return true;
  } catch (error) {
    console.error(`[Neynar Notification] Failed to send:`, error);
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

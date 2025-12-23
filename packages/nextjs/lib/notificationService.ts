/**
 * Notification service for Farcaster miniapp push notifications
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
  notificationToken?: string; // From Farcaster client
}

/**
 * Send notification to Farcaster user
 * Based on Farcaster miniapp SDK documentation
 */
export async function sendFarcasterNotification(
  fid: number,
  notification: NotificationData,
  notificationToken?: string,
): Promise<boolean> {
  try {
    console.log(`[Notification] Attempting to send to FID ${fid}:`, notification);
    console.log(`[Notification] Using token: ${notificationToken?.substring(0, 8)}...`);

    if (!notificationToken) {
      console.log(`[Notification] No notification token for FID ${fid} - cannot send notification`);
      return false;
    }

    const requestBody = {
      notificationId: `daily-reminder-${fid}-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      targetUrl: notification.targetUrl || "https://www.rpsonchain.xyz/profile?scroll=gooddollar",
      tokens: [notificationToken], // Required: array of notification tokens
    };

    console.log(`[Notification] Request body:`, requestBody);

    // Use Farcaster's notification API as documented in the SDK
    const response = await fetch("https://api.farcaster.xyz/v1/frame-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: Token is passed in the body 'tokens' array, not Authorization header
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Notification] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Notification] Failed to send to FID ${fid}: ${response.status} - ${errorText}`);
      console.error(`[Notification] Response headers:`, Object.fromEntries(response.headers.entries()));
      return false;
    }

    const result = await response.json();
    console.log(`[Notification] Successfully sent to FID ${fid}:`, result);
    return true;
  } catch (error) {
    console.error(`[Notification] Failed to send to FID ${fid}:`, error);
    return false;
  }
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
 * Simplified version - if user has notification token, they want notifications
 */
export function shouldSendDailyReminder(prefs: UserNotificationPrefs): boolean {
  // If no notification token, user hasn't enabled notifications in Farcaster
  if (!prefs.notificationToken) return false;

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

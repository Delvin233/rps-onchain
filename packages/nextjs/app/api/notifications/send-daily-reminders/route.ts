import { NextRequest, NextResponse } from "next/server";
import {
  UserNotificationPrefs,
  generateGoodDollarReminder,
  sendFarcasterNotification,
  shouldSendDailyReminder,
} from "~~/lib/notificationService";
import { turso } from "~~/lib/turso";

export async function POST(req: NextRequest) {
  try {
    // Verify this is called by a cron job or authorized source
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with daily reminders enabled
    const result = await turso.execute({
      sql: `
        SELECT fid, address, enable_daily_reminders, reminder_time, timezone, 
               last_claim_date, notification_token
        FROM notification_preferences 
        WHERE enable_daily_reminders = 1
      `,
      args: [],
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const row of result.rows) {
      const prefs: UserNotificationPrefs = {
        fid: row.fid as number,
        address: (row.address as string) || undefined,
        enableDailyReminders: Boolean(row.enable_daily_reminders),
        reminderTime: row.reminder_time as string,
        timezone: row.timezone as string,
        lastClaimDate: (row.last_claim_date as string) || undefined,
        notificationToken: (row.notification_token as string) || undefined,
      };

      if (shouldSendDailyReminder(prefs)) {
        try {
          // Get user's display name (could be from Farcaster API or your database)
          const userName = await getUserDisplayName(prefs.fid);

          const notification = generateGoodDollarReminder(userName);

          const success = await sendFarcasterNotification(prefs.fid, notification, prefs.notificationToken);

          if (success) {
            sentCount++;
            console.log(`[Daily Reminder] Sent to FID ${prefs.fid}`);
          } else {
            errorCount++;
            console.error(`[Daily Reminder] Failed to send to FID ${prefs.fid}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`[Daily Reminder] Error processing FID ${prefs.fid}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error sending daily reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}

// Helper function to get user display name
async function getUserDisplayName(fid: number): Promise<string | undefined> {
  try {
    // You could integrate with Farcaster API or your user database
    // For now, return undefined to use generic greeting
    return undefined;
  } catch (error) {
    console.error(`Error fetching display name for FID ${fid}:`, error);
    return undefined;
  }
}

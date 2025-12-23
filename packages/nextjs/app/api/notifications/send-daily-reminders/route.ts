import { NextRequest, NextResponse } from "next/server";
import {
  UserNotificationPrefs,
  generateGoodDollarReminder,
  sendFarcasterNotification,
  shouldSendDailyReminder,
} from "~~/lib/notificationService";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    // Verify this is called by a cron job or authorized source
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Daily Reminders] Starting cron job at", new Date().toISOString());

    // Get all users who have notification tokens (meaning they enabled notifications in Farcaster)
    const result = await turso.execute({
      sql: `
        SELECT fid, address, enable_daily_reminders, reminder_time, timezone, 
               last_claim_date, notification_token
        FROM notification_preferences 
        WHERE notification_token IS NOT NULL AND notification_token != ''
      `,
      args: [],
    });

    console.log(`[Daily Reminders] Found ${result.rows.length} users with notification tokens`);

    let sentCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const row of result.rows) {
      const prefs: UserNotificationPrefs = {
        fid: row.fid as number,
        address: (row.address as string) || undefined,
        enableDailyReminders: true, // If they have a token, they want notifications
        reminderTime: (row.reminder_time as string) || "09:00",
        timezone: (row.timezone as string) || "UTC",
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
            console.log(`[Daily Reminder] ✓ Sent to FID ${prefs.fid}`);
          } else {
            errorCount++;
            console.error(`[Daily Reminder] ✗ Failed to send to FID ${prefs.fid}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`[Daily Reminder] ✗ Error processing FID ${prefs.fid}:`, error);
        }
      } else {
        skippedCount++;
        console.log(`[Daily Reminder] ⏭ Skipped FID ${prefs.fid} (not in time window or already claimed)`);
      }
    }

    const summary = {
      success: true,
      sent: sentCount,
      errors: errorCount,
      skipped: skippedCount,
      total: result.rows.length,
      timestamp: new Date().toISOString(),
    };

    console.log("[Daily Reminders] Completed:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Daily Reminders] Cron job error:", error);
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

import { NextRequest, NextResponse } from "next/server";
import { generateGoodDollarReminder, shouldSendDailyReminder } from "~~/lib/notificationService";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    // Check notification preferences in database
    const result = await turso.execute({
      sql: `
        SELECT fid, address, enable_daily_reminders, reminder_time, timezone, 
               last_claim_date, notification_token
        FROM notification_preferences 
        ${fid ? "WHERE fid = ?" : ""}
      `,
      args: fid ? [parseInt(fid)] : [],
    });

    console.log(`[Test Notifications] Found ${result.rows.length} users with notification preferences`);

    const debugInfo = [];

    for (const row of result.rows) {
      const prefs = {
        fid: row.fid as number,
        address: (row.address as string) || undefined,
        enableDailyReminders: Boolean(row.enable_daily_reminders),
        reminderTime: row.reminder_time as string,
        timezone: row.timezone as string,
        lastClaimDate: (row.last_claim_date as string) || undefined,
        notificationToken: (row.notification_token as string) || undefined,
      };

      const shouldSend = shouldSendDailyReminder(prefs);
      const notification = generateGoodDollarReminder();

      // Check current time info
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [targetHour, targetMinute] = prefs.reminderTime.split(":").map(Number);
      const targetTime = targetHour * 60 + targetMinute;
      const currentTime = currentHour * 60 + currentMinute;
      const timeDiff = Math.abs(currentTime - targetTime);

      debugInfo.push({
        fid: prefs.fid,
        address: prefs.address,
        enableDailyReminders: prefs.enableDailyReminders,
        reminderTime: prefs.reminderTime,
        timezone: prefs.timezone,
        lastClaimDate: prefs.lastClaimDate,
        hasNotificationToken: !!prefs.notificationToken,
        notificationTokenLength: prefs.notificationToken?.length || 0,
        shouldSend,
        currentTime: `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`,
        targetTime: prefs.reminderTime,
        timeDiffMinutes: timeDiff,
        withinTimeWindow: timeDiff <= 60,
        todayDate: now.toISOString().split("T")[0],
        alreadyClaimedToday: prefs.lastClaimDate === now.toISOString().split("T")[0],
        generatedNotification: notification,
      });
    }

    return NextResponse.json({
      success: true,
      totalUsers: result.rows.length,
      currentTime: new Date().toISOString(),
      debugInfo,
      notes: {
        notificationImplementation: "Currently only logs notifications - not actually sending to Farcaster",
        farcasterApiEndpoint: "Not implemented - needs real Farcaster notification API",
        timeWindow: "Notifications sent within 1 hour of reminder time",
      },
    });
  } catch (error) {
    console.error("[Test Notifications Debug] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

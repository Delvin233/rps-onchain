import { NextRequest, NextResponse } from "next/server";
import { UserNotificationPrefs, shouldSendDailyReminder } from "~~/lib/notificationService";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "Missing fid parameter" }, { status: 400 });
    }

    // Validate FID is a valid number
    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber) || !isFinite(fidNumber) || fidNumber <= 0) {
      return NextResponse.json(
        {
          error: "Invalid fid parameter",
          message: "FID must be a positive integer",
          example: "Use: /api/check-notification-prefs?fid=12345",
        },
        { status: 400 },
      );
    }

    console.log(`[Check Notification Prefs] Checking preferences for FID ${fidNumber}`);

    // Get user's notification preferences from database
    const result = await turso.execute({
      sql: `
        SELECT fid, address, enable_daily_reminders, reminder_time, timezone, 
               last_claim_date, notification_token
        FROM notification_preferences 
        WHERE fid = ?
      `,
      args: [fidNumber],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        fid: fidNumber,
        found: false,
        hasNotificationToken: false,
        shouldReceiveNotifications: false,
        message: "User not found in notification preferences. User needs to enable notifications in Farcaster menu.",
        instructions: [
          "1. Open the app in Farcaster",
          "2. Tap the three dots (⋯) in the top right corner",
          "3. Select 'Turn on notifications'",
          "4. The app will automatically store the notification token",
        ],
      });
    }

    const row = result.rows[0];
    const prefs: UserNotificationPrefs = {
      fid: row.fid as number,
      address: (row.address as string) || undefined,
      enableDailyReminders: Boolean(row.enable_daily_reminders),
      reminderTime: (row.reminder_time as string) || "09:00",
      timezone: (row.timezone as string) || "UTC",
      lastClaimDate: (row.last_claim_date as string) || undefined,
      notificationToken: (row.notification_token as string) || undefined,
    };

    const hasNotificationToken = Boolean(prefs.notificationToken);
    const shouldReceive = shouldSendDailyReminder(prefs);

    // Get current time info for debugging
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().split("T")[0];

    return NextResponse.json({
      fid: fidNumber,
      found: true,
      preferences: prefs,
      hasNotificationToken,
      shouldReceiveNotifications: shouldReceive,
      debugInfo: {
        currentTime: now.toISOString(),
        currentHour,
        today,
        alreadyClaimedToday: prefs.lastClaimDate === today,
        inTimeWindow: currentHour >= 8 && currentHour <= 10,
        reminderTime: prefs.reminderTime,
        timezone: prefs.timezone,
      },
      message: hasNotificationToken
        ? shouldReceive
          ? "✅ User will receive notifications"
          : "⏭ User has token but won't receive notification (wrong time or already claimed)"
        : "❌ User needs to enable notifications in Farcaster menu",
      instructions: hasNotificationToken
        ? []
        : [
            "1. Open the app in Farcaster",
            "2. Tap the three dots (⋯) in the top right corner",
            "3. Select 'Turn on notifications'",
            "4. The app will automatically store the notification token",
          ],
    });
  } catch (error) {
    console.error("[Check Notification Prefs] Error:", error);
    return NextResponse.json({ error: "Failed to check notification preferences" }, { status: 500 });
  }
}

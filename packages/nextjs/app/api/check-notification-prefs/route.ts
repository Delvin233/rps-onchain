import { NextRequest, NextResponse } from "next/server";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID parameter required" }, { status: 400 });
    }

    // Check if user has notification preferences
    const result = await turso.execute({
      sql: `
        SELECT fid, address, enable_daily_reminders, reminder_time, timezone, 
               last_claim_date, notification_token, created_at, updated_at
        FROM notification_preferences 
        WHERE fid = ?
      `,
      args: [parseInt(fid)],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        found: false,
        message: "No notification preferences found for this FID",
        suggestion: "User needs to enable notifications in the app first",
      });
    }

    const row = result.rows[0];
    const prefs = {
      fid: row.fid as number,
      address: (row.address as string) || null,
      enableDailyReminders: Boolean(row.enable_daily_reminders),
      reminderTime: row.reminder_time as string,
      timezone: row.timezone as string,
      lastClaimDate: (row.last_claim_date as string) || null,
      hasNotificationToken: !!(row.notification_token as string),
      notificationTokenLength: (row.notification_token as string)?.length || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };

    // Check current time and whether notification should be sent
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [targetHour, targetMinute] = prefs.reminderTime.split(":").map(Number);
    const targetTime = targetHour * 60 + targetMinute;
    const currentTime = currentHour * 60 + currentMinute;
    const timeDiff = Math.abs(currentTime - targetTime);
    const todayDate = now.toISOString().split("T")[0];

    const analysis = {
      enabledReminders: prefs.enableDailyReminders,
      hasToken: prefs.hasNotificationToken,
      alreadyClaimedToday: prefs.lastClaimDate === todayDate,
      withinTimeWindow: timeDiff <= 60,
      currentTime: `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")} UTC`,
      targetTime: prefs.reminderTime,
      timeDiffMinutes: timeDiff,
      shouldReceiveNotification:
        prefs.enableDailyReminders && prefs.hasNotificationToken && prefs.lastClaimDate !== todayDate && timeDiff <= 60,
    };

    return NextResponse.json({
      found: true,
      preferences: prefs,
      analysis,
      recommendations: {
        enableReminders: !prefs.enableDailyReminders ? "Enable daily reminders in app settings" : "✓ Enabled",
        notificationToken: !prefs.hasNotificationToken
          ? "Grant notification permissions in Farcaster client"
          : "✓ Token present",
        claimStatus:
          prefs.lastClaimDate === todayDate
            ? "Already claimed today - no notification needed"
            : "✓ Can receive notification",
        timeWindow: timeDiff > 60 ? `Wait until ${prefs.reminderTime} UTC (±1 hour window)` : "✓ Within time window",
      },
    });
  } catch (error) {
    console.error("[Check Notification Prefs] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

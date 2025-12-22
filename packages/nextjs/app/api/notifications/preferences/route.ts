import { NextRequest, NextResponse } from "next/server";
import { turso } from "~~/lib/turso";

// Initialize notification preferences table
async function initNotificationPrefsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
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
  `);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "Missing fid parameter" }, { status: 400 });
    }

    await initNotificationPrefsTable();

    const result = await turso.execute({
      sql: "SELECT * FROM notification_preferences WHERE fid = ?",
      args: [parseInt(fid)],
    });

    if (result.rows.length === 0) {
      // Return default preferences for users who added the miniapp
      return NextResponse.json({
        fid: parseInt(fid),
        enableDailyReminders: true,
        reminderTime: "09:00",
        timezone: "UTC",
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      fid: parseInt(fid),
      address: (row.address as string) || undefined,
      enableDailyReminders: Boolean(row.enable_daily_reminders),
      reminderTime: row.reminder_time as string,
      timezone: row.timezone as string,
      lastClaimDate: (row.last_claim_date as string) || undefined,
      notificationToken: (row.notification_token as string) || undefined,
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, address, enableDailyReminders, reminderTime, timezone, notificationToken, lastClaimDate } = body;

    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    await initNotificationPrefsTable();

    await turso.execute({
      sql: `
        INSERT INTO notification_preferences 
        (fid, address, enable_daily_reminders, reminder_time, timezone, notification_token, last_claim_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(fid) DO UPDATE SET
          address = excluded.address,
          enable_daily_reminders = excluded.enable_daily_reminders,
          reminder_time = excluded.reminder_time,
          timezone = excluded.timezone,
          notification_token = excluded.notification_token,
          last_claim_date = excluded.last_claim_date,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        fid,
        address || null,
        enableDailyReminders ? 1 : 0,
        reminderTime || "09:00",
        timezone || "UTC",
        notificationToken || null,
        lastClaimDate || null,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

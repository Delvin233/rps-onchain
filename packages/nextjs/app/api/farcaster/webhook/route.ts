import { NextRequest, NextResponse } from "next/server";
import { turso } from "~~/lib/turso";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Farcaster webhook received:", body);

    // Initialize table if needed
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

    // Handle different webhook events
    switch (body.type) {
      case "miniapp_added":
        console.log(`User ${body.data.fid} added the miniapp`);

        // Auto-enable daily reminders for new users
        try {
          await turso.execute({
            sql: `
              INSERT INTO notification_preferences 
              (fid, enable_daily_reminders, reminder_time, timezone, created_at, updated_at)
              VALUES (?, 1, '09:00', 'UTC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT(fid) DO UPDATE SET
                enable_daily_reminders = 1,
                updated_at = CURRENT_TIMESTAMP
            `,
            args: [body.data.fid],
          });

          console.log(`Auto-enabled notifications for FID ${body.data.fid}`);
        } catch (error) {
          console.error(`Failed to setup notifications for FID ${body.data.fid}:`, error);
        }
        break;

      case "miniapp_removed":
        console.log(`User ${body.data.fid} removed the miniapp`);

        // Disable notifications when user removes the miniapp
        try {
          await turso.execute({
            sql: `
              UPDATE notification_preferences 
              SET enable_daily_reminders = 0, updated_at = CURRENT_TIMESTAMP
              WHERE fid = ?
            `,
            args: [body.data.fid],
          });

          console.log(`Disabled notifications for FID ${body.data.fid}`);
        } catch (error) {
          console.error(`Failed to disable notifications for FID ${body.data.fid}:`, error);
        }
        break;

      default:
        console.log("Unknown webhook type:", body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

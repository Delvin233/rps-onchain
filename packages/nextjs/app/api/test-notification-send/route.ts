import { NextRequest, NextResponse } from "next/server";
import { generateGoodDollarReminder, sendFarcasterNotificationToUser } from "~~/lib/notificationService";
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
          example: "Use: /api/test-notification-send?fid=12345",
        },
        { status: 400 },
      );
    }

    console.log(`[Test Notification] Testing notification for FID ${fidNumber} using Neynar`);

    // Check if user has enabled daily reminders (Neynar manages tokens automatically)
    const result = await turso.execute({
      sql: "SELECT enable_daily_reminders FROM notification_preferences WHERE fid = ?",
      args: [fidNumber],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: "User not found in notification preferences",
        fid: fidNumber,
        hasEnabledNotifications: false,
        message: "User needs to add the miniapp and enable notifications in Farcaster first",
      });
    }

    const enabledReminders = result.rows[0].enable_daily_reminders as number;

    if (!enabledReminders) {
      return NextResponse.json({
        error: "User has not enabled daily reminders",
        fid: fidNumber,
        hasEnabledNotifications: false,
        message: "User needs to enable notifications for this miniapp in Farcaster",
      });
    }

    // Generate test notification
    const notification = generateGoodDollarReminder("Test User");

    // Send notification using Neynar
    const success = await sendFarcasterNotificationToUser(fidNumber, notification);

    return NextResponse.json({
      success,
      fid: fidNumber,
      hasEnabledNotifications: true,
      notification,
      message: success ? "Test notification sent successfully via Neynar!" : "Failed to send test notification",
      neynarManaged: true,
    });
  } catch (error) {
    console.error("[Test Notification] Error:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}

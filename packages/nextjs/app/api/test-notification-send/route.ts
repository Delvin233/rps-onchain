import { NextRequest, NextResponse } from "next/server";
import { generateGoodDollarReminder, sendFarcasterNotification } from "~~/lib/notificationService";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "Missing fid parameter" }, { status: 400 });
    }

    console.log(`[Test Notification] Testing notification for FID ${fid}`);

    // Get user's notification token from database
    const result = await turso.execute({
      sql: "SELECT notification_token FROM notification_preferences WHERE fid = ?",
      args: [parseInt(fid)],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: "User not found in notification preferences",
        fid: parseInt(fid),
        hasToken: false,
        message: "User needs to enable notifications in Farcaster menu first",
      });
    }

    const notificationToken = result.rows[0].notification_token as string;

    if (!notificationToken) {
      return NextResponse.json({
        error: "No notification token found",
        fid: parseInt(fid),
        hasToken: false,
        message: "User needs to enable notifications in Farcaster menu",
      });
    }

    // Generate test notification
    const notification = generateGoodDollarReminder("Test User");

    // Send notification
    const success = await sendFarcasterNotification(parseInt(fid), notification, notificationToken);

    return NextResponse.json({
      success,
      fid: parseInt(fid),
      hasToken: true,
      notification,
      message: success ? "Test notification sent successfully!" : "Failed to send test notification",
    });
  } catch (error) {
    console.error("[Test Notification] Error:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}

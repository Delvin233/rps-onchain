import { NextRequest, NextResponse } from "next/server";
import { sendFarcasterNotification } from "~~/lib/notificationService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    // Get user's notification preferences using the API
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";
    const prefsResponse = await fetch(`${baseUrl}/api/notifications/preferences?fid=${fid}`);

    if (!prefsResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch notification preferences",
          fid: parseInt(fid),
          suggestion: "User needs to enable notifications in Farcaster app first",
        },
        { status: 404 },
      );
    }

    const prefs = await prefsResponse.json();

    if (!prefs.notificationToken) {
      return NextResponse.json(
        {
          error: "No notification token found",
          fid: parseInt(fid),
          prefs,
          suggestion: "User needs to enable notifications in Farcaster app (⋯ → Turn on notifications)",
        },
        { status: 400 },
      );
    }

    // Generate test notification
    const notification = {
      title: "🔔 Test Notification",
      body: "This is a test notification from RPS-onChain. If you see this, notifications are working!",
      targetUrl: "https://www.rpsonchain.xyz/profile",
      actionUrl: "https://www.rpsonchain.xyz/profile",
    };

    console.log(`[Debug] Sending test notification to FID ${fid}:`, notification);
    console.log(`[Debug] User preferences:`, prefs);

    // Send the notification
    const success = await sendFarcasterNotification(parseInt(fid), notification, prefs.notificationToken);

    return NextResponse.json({
      success,
      fid: parseInt(fid),
      notification,
      userPrefs: {
        hasToken: !!prefs.notificationToken,
        tokenPreview: prefs.notificationToken?.substring(0, 8) + "...",
        enabledReminders: prefs.enableDailyReminders,
      },
      message: success
        ? "Test notification sent successfully! Check your phone's notification tray."
        : "Failed to send test notification. Check logs for details.",
      troubleshooting: {
        checkFarcasterAppNotifications: "Settings → Apps → Farcaster → Notifications",
        checkDoNotDisturb: "Ensure phone is not in Do Not Disturb mode",
        checkBatteryOptimization: "Settings → Battery → Battery Optimization → Farcaster → Don't optimize",
        checkFarcasterInAppSettings: "Open Farcaster → Settings → Notifications",
        waitTime: "Notifications may take 1-2 minutes to appear",
        possibleIssues: [
          "Phone is in Do Not Disturb mode",
          "Farcaster app notifications are disabled in phone settings",
          "Battery optimization is killing Farcaster in background",
          "Farcaster in-app notification settings are disabled",
          "Network connectivity issues",
          "Farcaster servers are experiencing delays",
        ],
      },
    });
  } catch (error) {
    console.error("[Debug] Error sending test notification:", error);
    return NextResponse.json(
      {
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error",
        fid: parseInt(fid),
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendFarcasterNotificationToUser } from "~~/lib/notificationService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json(
      {
        error: "Missing fid parameter",
        usage: "GET /api/test-neynar?fid=YOUR_FID",
      },
      { status: 400 },
    );
  }

  try {
    const fidNumber = parseInt(fid);

    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
    }

    const notification = {
      title: "🎉 Neynar Integration Test",
      body: "Your RPS-onChain app is now using Neynar for notifications!",
      targetUrl: "https://www.rpsonchain.xyz/profile",
    };

    const success = await sendFarcasterNotificationToUser(fidNumber, notification);

    return NextResponse.json({
      success,
      message: success ? "Neynar notification sent successfully!" : "Failed to send notification via Neynar",
      notification,
      neynarIntegration: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Neynar Test] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint") || "cleanup-rooms";
    const secret = searchParams.get("secret");

    if (!secret) {
      return NextResponse.json({ error: "Secret parameter required for testing" }, { status: 400 });
    }

    // Test the cron endpoint
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const cronUrl = `${baseUrl}/api/${endpoint === "notifications" ? "notifications/send-daily-reminders" : "cron/cleanup-rooms"}`;

    console.log(`[Test Cron] Testing endpoint: ${cronUrl}`);

    const response = await fetch(cronUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      success: true,
      endpoint: cronUrl,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      debug: {
        hasCronSecret: !!process.env.CRON_SECRET,
        cronSecretLength: process.env.CRON_SECRET?.length || 0,
        providedSecret: secret,
        secretsMatch: process.env.CRON_SECRET === secret,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Cron] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test the notification endpoint
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";
    const testUrl = `${baseUrl}/api/notifications/send-daily-reminders`;

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      testUrl,
      status: response.status,
      data,
      cronSecret: process.env.CRON_SECRET ? "Set" : "Missing",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      cronSecret: process.env.CRON_SECRET ? "Set" : "Missing",
    });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  const edgeConfigId = process.env.EDGE_CONFIG_ID || process.env.EDGE_CONFIG?.match(/ecfg_[a-zA-Z0-9]+/)?.[0];

  return NextResponse.json({
    EDGE_CONFIG: !!process.env.EDGE_CONFIG,
    EDGE_CONFIG_ID: !!process.env.EDGE_CONFIG_ID,
    EDGE_CONFIG_ID_EXTRACTED: !!edgeConfigId,
    EDGE_CONFIG_SAMPLE: process.env.EDGE_CONFIG?.substring(0, 50),
    VERCEL_API_TOKEN: !!process.env.VERCEL_API_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    EDGE_CONFIG: !!process.env.EDGE_CONFIG,
    EDGE_CONFIG_ID: !!process.env.EDGE_CONFIG_ID,
    VERCEL_API_TOKEN: !!process.env.VERCEL_API_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  });
}

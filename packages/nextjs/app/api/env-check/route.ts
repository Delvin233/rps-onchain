import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    PINATA_JWT: !!process.env.PINATA_JWT,
    WALLET_CONNECT_PROJECT_ID: !!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NODE_ENV: process.env.NODE_ENV,
  });
}

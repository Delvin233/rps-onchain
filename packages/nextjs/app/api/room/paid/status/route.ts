import { NextResponse } from "next/server";

// Status API is not needed - frontend polls contract state directly
// This endpoint exists for backwards compatibility but returns empty
export async function GET() {
  return NextResponse.json({ finished: false });
}

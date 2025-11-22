import { NextResponse } from "next/server";
import { initAllTables } from "~~/lib/turso";

export async function GET() {
  try {
    await initAllTables();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

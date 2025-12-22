import { NextResponse } from "next/server";
import { initUserVerificationsTable } from "~~/lib/turso";

export async function POST() {
  try {
    await initUserVerificationsTable();
    return NextResponse.json({
      success: true,
      message: "user_verifications table initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing user_verifications table:", error);
    return NextResponse.json({ error: "Failed to initialize table" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { normalizeAddresses } from "../../../scripts/normalize-addresses";

/**
 * One-time API endpoint to normalize all addresses in the database
 * Only works in development mode for safety
 */
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Migration only available in development" }, { status: 403 });
  }

  try {
    await normalizeAddresses();
    return NextResponse.json({
      success: true,
      message: "All addresses normalized to lowercase",
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

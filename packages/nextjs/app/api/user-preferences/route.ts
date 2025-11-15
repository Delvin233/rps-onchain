import { NextRequest, NextResponse } from "next/server";
import { initUserPreferencesTable, turso } from "~~/lib/turso";

// Initialize table on first request
let tableInitialized = false;

async function ensureTable() {
  if (!tableInitialized) {
    await initUserPreferencesTable();
    tableInitialized = true;
  }
}

// GET: Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const result = await turso.execute({
      sql: "SELECT * FROM user_preferences WHERE user_address = ?",
      args: [address.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ preferences: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      preferences: {
        fontTheme: row.font_theme,
        spacingScale: row.spacing_scale,
        fontSizeOverride: row.font_size_override,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// POST: Save user preferences
export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const body = await request.json();
    const { address, fontTheme, spacingScale, fontSizeOverride } = body;

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    await turso.execute({
      sql: `
        INSERT INTO user_preferences (user_address, font_theme, spacing_scale, font_size_override, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_address) DO UPDATE SET
          font_theme = excluded.font_theme,
          spacing_scale = excluded.spacing_scale,
          font_size_override = excluded.font_size_override,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [address.toLowerCase(), fontTheme, spacingScale, fontSizeOverride],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}

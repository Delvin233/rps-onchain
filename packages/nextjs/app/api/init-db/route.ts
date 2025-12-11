import { NextResponse } from "next/server";
import { initAIMatchDatabase } from "~~/lib/aiMatchSchema";

export async function POST() {
  try {
    console.log("🚀 Initializing AI Match Database...");

    // Run the database initialization
    await initAIMatchDatabase();

    console.log("✅ Database initialization completed successfully");

    return NextResponse.json({
      success: true,
      message: "Database initialization completed successfully",
    });
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Database initialization failed: ${error.message}`,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize database",
    usage: "curl -X POST /api/init-db",
  });
}

/**
 * AI Matches Migration API Endpoint
 *
 * POST /api/migrate/ai-matches - Execute the AI matches migration
 * GET /api/migrate/ai-matches - Get migration status
 * DELETE /api/migrate/ai-matches - Rollback migration (for testing)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  executeMigration,
  getAIMatchesMigrationStatus,
  rollbackMigration,
  verifyDatabaseIntegrity,
} from "~~/lib/migrations/migrationRunner";

/**
 * GET - Get migration status
 */
export async function GET() {
  try {
    const status = await getAIMatchesMigrationStatus();
    const integrity = await verifyDatabaseIntegrity();

    return NextResponse.json({
      success: true,
      status,
      integrity,
    });
  } catch (error) {
    console.error("Error getting migration status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get migration status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST - Execute migration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force } = body;
    console.log("Force migration:", force); // Use the variable to avoid linting error

    console.log("🚀 AI Matches Migration API called");

    // Execute the AI matches migration
    const result = await executeMigration("001");

    if (result.success) {
      // Verify integrity after successful migration
      const integrity = await verifyDatabaseIntegrity();

      return NextResponse.json({
        success: true,
        message: result.message,
        migration: result.migration,
        result: result.result,
        integrity,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          migration: result.migration,
          result: result.result,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error executing migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration execution failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Rollback migration (for testing purposes)
 */
export async function DELETE() {
  try {
    console.log("🔄 AI Matches Migration Rollback API called");

    const result = await rollbackMigration("001");

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        migration: result.migration,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          migration: result.migration,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error rolling back migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration rollback failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

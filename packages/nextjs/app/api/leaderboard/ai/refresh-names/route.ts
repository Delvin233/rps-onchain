import { NextResponse } from "next/server";
import { batchResolveDisplayNames } from "~~/lib/nameResolver";
import { getAllPlayers, updatePlayerDisplayName } from "~~/lib/turso";

/**
 * Refresh all display names in the AI leaderboard
 *
 * This endpoint:
 * 1. Fetches all players from the database
 * 2. Resolves their display names (Farcaster/ENS/Basename)
 * 3. Updates the database with new names
 *
 * Useful for:
 * - Picking up new Farcaster usernames
 * - Updating ENS/Basename changes
 * - Fixing cached truncated addresses
 *
 * POST /api/leaderboard/ai/refresh-names
 */
export async function POST() {
  try {
    console.log("[Leaderboard] Starting name refresh...");

    // Get all players
    const players = await getAllPlayers();
    console.log(`[Leaderboard] Found ${players.length} players to refresh`);

    if (players.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No players to refresh",
        updated: 0,
      });
    }

    // Batch resolve all names (skip cache to force fresh resolution)
    const addresses = players.map(p => p.address);
    console.log(`[Leaderboard] Resolving names for addresses:`, addresses);

    const resolvedNames = await batchResolveDisplayNames(addresses, true);
    console.log(`[Leaderboard] Resolved names:`, Array.from(resolvedNames.entries()));

    // Update database with new names
    let updated = 0;
    for (const player of players) {
      const newName = resolvedNames.get(player.address);

      console.log(`[Leaderboard] Player ${player.address}: current="${player.display_name}", resolved="${newName}"`);

      // Only update if we got a better name (not truncated address)
      if (newName && !newName.includes("...") && newName !== player.display_name) {
        await updatePlayerDisplayName(player.address, newName);
        console.log(`[Leaderboard] Updated ${player.address}: "${player.display_name}" → "${newName}"`);
        updated++;
      } else {
        console.log(`[Leaderboard] Skipped ${player.address}: no improvement (has "..." or same name)`);
      }
    }

    console.log(`[Leaderboard] Name refresh complete: ${updated}/${players.length} updated`);

    return NextResponse.json({
      success: true,
      message: `Refreshed ${updated} player names`,
      total: players.length,
      updated,
    });
  } catch (error) {
    console.error("[Leaderboard] Name refresh failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh names",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

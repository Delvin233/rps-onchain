# AI Wins Tally Fix

## Problem

AI wins were not being recorded correctly in the leaderboard. User had 81 AI wins in stats but only 42 wins in leaderboard (39 wins missing).

## Root Cause

The anti-cheat verification logic in `/api/leaderboard/ai/update` had several issues:

1. **Wrong data path**: Was reading `statsData?.ai?.wins` instead of `statsData?.stats?.ai?.wins`
2. **Too strict**: Blocked players with `statsAIWins === 0`, preventing first-time players from recording wins
3. **Race conditions**: Stats update and leaderboard verification happened simultaneously, causing stale reads
4. **Overly aggressive**: Blocked legitimate wins due to timing issues

## How AI Wins Are Recorded

### Flow

1. Player plays AI match → `/api/play-ai` is called
2. AI makes random move and determines winner
3. **Stats are updated** → `/api/stats-fast` POST updates `stats` table in Turso
4. **Match saved to history** → `/api/history-fast` POST saves to Redis (for match history)
5. **Leaderboard update triggered** → `/api/leaderboard/ai/update` POST with matchId
6. **Verification** → Fetches stats from `/api/stats-fast` GET
7. **Atomic increment** → `incrementPlayerWins()` uses SQL `wins = wins + 1`
8. **Rank recalculation** → New rank determined based on total wins

### Data Storage

- **Stats**: Stored in Turso `stats` table (source of truth for win counts)
- **Leaderboard**: Stored in Turso `ai_leaderboards` table (optimized for ranking)
- **Match History**: Stored in Redis (for quick access to recent matches)

## Solution

### Changes Made

1. **Fixed stats path**: `statsData?.stats?.ai?.wins` (correct API response structure)
2. **Removed blocking check**: Removed `if (statsAIWins === 0)` that blocked first-time players
3. **Lenient verification**: Only block if `leaderboardWins > statsWins + 5` (allows race conditions)
4. **Better logging**: Added clear logs to debug verification process

### New Verification Logic

```typescript
// Only block if leaderboard wins significantly exceed stats wins
// Allow +5 buffer for race conditions and timing issues
if (currentLeaderboardWins > statsAIWins + 5) {
  // BLOCK: Suspicious activity
  return 403
}

// Otherwise allow the update
```

### Why This Works

- **Allows first-time players**: No longer blocks when `statsAIWins === 0`
- **Handles race conditions**: +5 buffer accounts for simultaneous updates
- **Still prevents cheating**: Blocks if leaderboard wins are significantly higher than stats
- **Non-blocking**: Allows updates even if stats verification fails (don't punish legitimate users)

## Testing

### Before Fix

- User had 81 AI wins in stats
- Leaderboard showed only 42 wins
- 39 wins were blocked by verification

### After Fix

- All legitimate wins should be recorded
- First-time players can record their first win
- Race conditions are handled gracefully
- Suspicious activity is still detected and blocked

## Monitoring

Check logs for:

- `[Leaderboard] Verification for {address}` - Shows stats vs leaderboard comparison
- `[Leaderboard] BLOCKED:` - Indicates blocked updates (should be rare)
- `[Leaderboard] Large win difference` - Flags large discrepancies for investigation

## Related Files

- `/api/leaderboard/ai/update/route.ts` - Leaderboard update endpoint (FIXED)
- `/api/play-ai/route.ts` - AI match logic
- `/api/stats-fast/route.ts` - Stats storage (Turso)
- `/lib/turso.ts` - Database utilities (`incrementPlayerWins`)
- `/lib/tursoStorage.ts` - Stats update logic
- `/hooks/useAIMatchCompletion.ts` - Frontend hook that triggers updates

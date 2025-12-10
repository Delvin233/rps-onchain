# Name Resolution Fix

## Date: December 8, 2024

### Problem

Farcaster usernames were not being displayed on the leaderboard even though the Neynar API was working correctly. The issue was that display names were cached in the database and never refreshed.

### Root Cause

The update endpoint (`/api/leaderboard/ai/update`) only resolved display names for new players:

```typescript
// Old logic - only resolve if no name exists
if (!displayName) {
  displayName = await resolveDisplayName(lowerAddress);
}
```

This meant:

- Once a player had any display name (even a truncated address), it would never update
- New Farcaster usernames wouldn't be picked up
- ENS/Basename changes wouldn't be reflected

### Solution

#### 1. Always Resolve Names on Update

Modified the update endpoint to always attempt name resolution:

```typescript
// New logic - always try to resolve, but only update if we get a better name
try {
  const resolvedName = await resolveDisplayName(lowerAddress);

  // Only update if we got a better name (not just truncated address)
  if (resolvedName && !resolvedName.includes("...")) {
    displayName = resolvedName;
  }
} catch {
  // Keep existing display name if resolution fails/times out
}
```

Benefits:

- Picks up new Farcaster usernames automatically
- Updates ENS/Basename changes
- Doesn't overwrite good names with truncated addresses
- Gracefully handles resolution failures

#### 2. Manual Refresh Endpoint

Created `/api/leaderboard/ai/refresh-names` to batch update all names:

```typescript
POST / api / leaderboard / ai / refresh - names;
```

This endpoint:

- Fetches all players from the database
- Batch resolves their display names (efficient)
- Updates only names that improved (not truncated addresses)
- Returns count of updated names

Usage:

```bash
curl -X POST https://your-domain.com/api/leaderboard/ai/refresh-names
```

Response:

```json
{
  "success": true,
  "message": "Refreshed 5 player names",
  "total": 11,
  "updated": 5
}
```

#### 3. New Database Helper Functions

Added to `lib/turso.ts`:

**getAllPlayers()**

- Returns all leaderboard entries
- Used by refresh endpoint for batch processing

**updatePlayerDisplayName()**

- Updates a single player's display name
- Efficient single-field update

### Testing

#### Test Neynar API

```bash
curl "https://your-domain.com/api/test-neynar?address=0x997c71bb2b7d5814c99494d534db264e1702f245"
```

Expected response should include:

```json
{
  "parsed": {
    "username": "delvin233"
  }
}
```

#### Test Name Resolution

1. **Automatic (on next AI win)**:

   - Play an AI match and win
   - Name should update automatically

2. **Manual (refresh all)**:

   ```bash
   curl -X POST https://your-domain.com/api/leaderboard/ai/refresh-names
   ```

3. **Verify on leaderboard**:
   - Visit `/leaderboards/ai`
   - Check that Farcaster usernames appear

### Files Modified

- `packages/nextjs/app/api/leaderboard/ai/update/route.ts` - Always resolve names
- `packages/nextjs/app/api/leaderboard/ai/refresh-names/route.ts` - New batch refresh endpoint
- `packages/nextjs/lib/turso.ts` - Added getAllPlayers() and updatePlayerDisplayName()

### Performance Considerations

- Name resolution has 2-second timeout to prevent blocking
- Batch resolution processes 10 addresses at a time
- Name resolution cache (5 minutes TTL) reduces API calls
- Only updates names that improved (not truncated addresses)

### Next Steps

1. Deploy changes to production
2. Run refresh endpoint to update existing names:
   ```bash
   curl -X POST https://rps-onchain.vercel.app/api/leaderboard/ai/refresh-names
   ```
3. Monitor logs for name resolution success rate
4. Consider adding automatic periodic refresh (e.g., daily cron job)

### Notes

- Neynar API key is already configured in Vercel environment variables
- Name resolution cache is in-memory (resets on deployment)
- Basename resolution errors are expected and harmless
- Truncated addresses (with "...") are never used to overwrite existing names

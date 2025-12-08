# Rate Limit Fix for AI Leaderboard

## Date: December 8, 2024

### Problem
AI wins were not being recorded consistently. Player had 49 AI wins in stats but only 47 wins in the leaderboard.

**Root Cause:** The leaderboard update endpoint had a 10-second rate limit between updates. Since AI matches are quick (can be completed in 5-10 seconds), players could win 2-3 matches within the rate limit window, causing those wins to be silently dropped.

### Evidence
- Player stats: 49 AI wins
- Leaderboard: 47 AI wins
- Missing: 2 wins (likely won within 10 seconds of each other)

### Solution

#### 1. Reduced Rate Limit
Changed from 10 seconds to 2 seconds:

```typescript
// Before
const RATE_LIMIT_MS = 10000; // 10 seconds between updates

// After
const RATE_LIMIT_MS = 2000; // 2 seconds between updates (AI matches are quick)
```

**Rationale:**
- AI matches typically take 5-15 seconds to complete
- 2 seconds is enough to prevent spam/abuse
- Allows consecutive wins to be recorded properly
- Still protects against accidental double-submissions

#### 2. Improved Error Logging
Added specific handling for rate limit errors:

```typescript
if (response.status === 429) {
  console.log("[Leaderboard] Rate limited, will update on next win");
}
```

This helps identify when rate limiting occurs without showing errors to users.

### Testing

After deployment, test by:

1. **Play multiple AI matches quickly:**
   - Win 3 AI matches in a row (within 30 seconds)
   - Check that all 3 wins are recorded in leaderboard

2. **Verify rate limit still works:**
   - Try to submit 2 wins within 2 seconds (shouldn't be possible in normal gameplay)
   - Second submission should be rate limited

3. **Check logs:**
   - Look for rate limit messages in Vercel logs
   - Verify wins are being recorded

### Expected Behavior

**Before Fix:**
- Win at 0s → Recorded ✅
- Win at 8s → Dropped ❌ (within 10s rate limit)
- Win at 18s → Recorded ✅

**After Fix:**
- Win at 0s → Recorded ✅
- Win at 8s → Recorded ✅ (outside 2s rate limit)
- Win at 18s → Recorded ✅

### Files Modified
- `packages/nextjs/app/api/leaderboard/ai/update/route.ts` - Reduced rate limit to 2 seconds
- `packages/nextjs/hooks/useAIMatchCompletion.ts` - Added rate limit error handling

### Notes
- The 2 missing wins cannot be retroactively added (no record of them)
- Future wins will be recorded correctly
- Rate limit is per-address, so multiple players can update simultaneously
- Rate limit map is in-memory, resets on deployment

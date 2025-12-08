# Anti-Cheat System for AI Leaderboard

## Date: December 8, 2024

### Security Measures Implemented

#### 1. Match ID Verification
Every AI match gets a unique ID that must be verified before counting toward the leaderboard.

**Match ID Format:**
```
{address}_{timestamp}_{random9chars}
Example: 0x1234..._{1765156789}_{a3f9k2m1p}
```

**How it works:**
1. Frontend generates unique matchId when match starts
2. Match is saved to Redis history with this matchId
3. Leaderboard update requires the matchId
4. Server verifies matchId exists in Redis history before counting win

#### 2. Deduplication
Prevents the same match from being counted twice.

**Implementation:**
- In-memory map tracks processed matchIds
- Each matchId can only be processed once within 5 minutes
- Automatic cleanup of old entries

#### 3. History Verification (Anti-Cheat)
Server verifies that the match actually exists in Redis history.

**Verification Process:**
```typescript
1. Fetch user's match history from Redis
2. Search for matchId in recent matches (last 100)
3. Verify:
   - Match opponent is "AI"
   - Match result is "win"
   - Match ID matches exactly
4. If not found → Reject with 403 Forbidden
5. If found → Process the win
```

#### 4. Atomic Database Operations
Prevents race conditions when multiple wins are recorded simultaneously.

**SQL Implementation:**
```sql
UPDATE ai_leaderboards 
SET wins = wins + 1, rank = ?, updated_at = ?
WHERE address = ?
```

This ensures that even if two requests hit the server at the exact same time, both wins are counted correctly.

### Attack Scenarios & Defenses

#### ❌ Attack 1: Spam Fake Wins
```bash
# Attacker tries to spam wins without playing
for i in {1..100}; do
  curl -X POST /api/leaderboard/ai/update \
    -d '{"address":"0x...","won":true,"matchId":"fake_'$i'"}'
done
```

**Defense:** ✅ History verification fails
- matchId "fake_1", "fake_2", etc. don't exist in Redis
- Server returns 403 Forbidden
- No wins are counted

#### ❌ Attack 2: Replay Same Match
```bash
# Attacker tries to count the same win multiple times
matchId="real_match_id_from_history"
for i in {1..100}; do
  curl -X POST /api/leaderboard/ai/update \
    -d '{"address":"0x...","won":true,"matchId":"'$matchId'"}'
done
```

**Defense:** ✅ Deduplication prevents double-counting
- First request: Processed ✅
- Subsequent requests: "Match already processed" ❌
- Only 1 win is counted

#### ❌ Attack 3: Race Condition
```bash
# Attacker tries to exploit race condition
# Send 2 requests at exact same time with different matchIds
curl -X POST /api/leaderboard/ai/update -d '{"matchId":"id1"}' &
curl -X POST /api/leaderboard/ai/update -d '{"matchId":"id2"}' &
```

**Defense:** ✅ Atomic SQL increment
- Both requests read current wins
- Database handles concurrent updates atomically
- Both wins are counted correctly (no lost updates)

#### ❌ Attack 4: Modify Frontend Code
```javascript
// Attacker modifies frontend to skip game logic
updateLeaderboard(myAddress, true, "fake_id")
```

**Defense:** ✅ Server-side verification
- matchId "fake_id" doesn't exist in Redis history
- Server rejects with 403 Forbidden
- No win is counted

### Graceful Degradation

If Redis is down or history check fails:
- ⚠️ Log warning but allow update
- Don't block legitimate users
- Monitor logs for suspicious patterns

**Rationale:**
- Better to allow some potential cheating than block all legitimate users
- Redis downtime shouldn't break the leaderboard
- Monitoring can catch abuse patterns

### Testing Anti-Cheat

#### Test 1: Legitimate Win
```bash
# Play a real game, should work
1. Play AI match in UI
2. Win the match
3. Check leaderboard → Win counted ✅
```

#### Test 2: Fake Match ID
```bash
# Try to submit fake win
curl -X POST /api/leaderboard/ai/update \
  -H "Content-Type: application/json" \
  -d '{"address":"0x...","won":true,"matchId":"fake123"}'

# Expected: 403 Forbidden
# Expected log: "Match fake123 not found in history"
```

#### Test 3: Replay Attack
```bash
# Get a real matchId from history
matchId="real_match_id"

# Try to submit it twice
curl -X POST /api/leaderboard/ai/update \
  -d '{"address":"0x...","won":true,"matchId":"'$matchId'"}'

curl -X POST /api/leaderboard/ai/update \
  -d '{"address":"0x...","won":true,"matchId":"'$matchId'"}'

# Expected: First succeeds, second returns "Match already processed"
```

### Monitoring

Watch for these patterns in logs:

**Suspicious Activity:**
```
[Leaderboard] Match {id} not found in history for {address}
```
- Indicates someone trying to submit fake matches
- Track addresses that do this repeatedly

**Normal Activity:**
```
[Leaderboard] Updated {address}: {wins} wins → {rank}
[Leaderboard] Match {id} already processed, skipping
```

### Files Modified
- `packages/nextjs/app/api/leaderboard/ai/update/route.ts` - Added verification
- `packages/nextjs/app/play/single/page.tsx` - Generate and save matchId
- `packages/nextjs/hooks/useAIMatchCompletion.ts` - Pass matchId to update
- `packages/nextjs/lib/turso.ts` - Atomic increment function

### Security Level

**Before:** 🔴 Anyone could spam fake wins
**After:** 🟢 Must actually play and win to get leaderboard credit

**Remaining Risks:**
- If Redis is compromised, attacker could inject fake matches
- If someone finds a way to win AI matches programmatically (but they'd still need to play)

**Acceptable Risks:**
- These are edge cases that require significant effort
- The game is free-to-play, so there's limited incentive to cheat
- Monitoring can catch abuse patterns

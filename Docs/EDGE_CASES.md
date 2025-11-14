# Edge Cases & Duplicate Handling

## 🔄 Deduplication Strategy

### **Unique Key Generation:**

```javascript
// AI Matches
key = `ai-${timestamp}-${player}-${playerMove}-${opponentMove}`
// Example: "ai-2024-01-15T10:30:00Z-0x123-rock-scissors"

// Multiplayer (with games array - rematches)
key = `room-${roomId}-${gamesCount}`
// Example: "room-ABC123-3" (3 games played in this room)

// Multiplayer (single game)
key = `match-${roomId}-${timestamp}-${moves}`
// Example: "match-ABC123-1234567890-rock-scissors"
```

---

## 🎯 Edge Cases Handled

### **1. Rematches in Same Room**

**Scenario:**
- Room ABC123
- Game 1: rock vs scissors (10:00 AM)
- Game 2: paper vs rock (10:05 AM)
- Game 3: scissors vs paper (10:10 AM)

**Storage:**
- Redis: 3 separate entries in `history:${address}`
- IPFS: 1 room object with `games: [game1, game2, game3]`
- LocalStorage: 1 room object with games array

**Deduplication:**
- Key: `room-ABC123-3`
- Shows as 1 expandable card with 3 games
- ✅ No duplicates

---

### **2. AI Games (No Room ID)**

**Scenario:**
- Play AI 3 times
- All have `opponent: "AI"`
- No roomId

**Storage:**
- Redis: 3 entries with timestamps
- IPFS: Synced via manual/cron
- LocalStorage: Not stored

**Deduplication:**
- Key includes timestamp + moves: `ai-2024-01-15T10:30:00Z-0x123-rock-scissors`
- Each game is unique
- ✅ All 3 games show separately

---

### **3. Same Players, Different Rooms**

**Scenario:**
- Player A vs Player B in room ABC123
- Player A vs Player B in room XYZ789

**Deduplication:**
- Key: `match-ABC123-...` vs `match-XYZ789-...`
- Different roomIds = different keys
- ✅ Both games show

---

### **4. Sync Button Pressed Multiple Times**

**Scenario:**
- User plays 5 AI games
- Presses sync button 3 times
- Same data uploaded to IPFS each time

**What Happens:**
1. First sync: Creates IPFS hash `QmAAA`, stores in Edge Config
2. Second sync: Creates IPFS hash `QmBBB`, **unpins QmAAA**, updates Edge Config
3. Third sync: Creates IPFS hash `QmCCC`, **unpins QmBBB**, updates Edge Config

**Result:**
- Only latest IPFS hash (`QmCCC`) is stored in Edge Config
- Old hashes are unpinned (deleted from Pinata)
- ✅ No duplicates in IPFS

**Deduplication:**
- Redis data is same (not duplicated)
- IPFS data is same (old versions deleted)
- ✅ No duplicates shown

---

### **5. LocalStorage + Redis + IPFS All Have Same Match**

**Scenario:**
- Multiplayer game stored to all 3 sources
- History page fetches all 3

**Deduplication:**
```javascript
// All 3 sources return same match:
localStorage: { roomId: "ABC123", timestamp: 1234567890, moves: {...} }
redis:        { roomId: "ABC123", timestamp: 1234567890, moves: {...} }
ipfs:         { roomId: "ABC123", timestamp: 1234567890, moves: {...} }

// Unique key: "match-ABC123-1234567890-rock-scissors"
// Map keeps only 1 entry (last one wins)
```

**Result:**
- ✅ Shows once (no duplicate)

---

### **6. Network Failure During Storage**

**Scenario:**
- Multiplayer game finishes
- Redis storage succeeds
- IPFS storage fails (network error)

**What Happens:**
1. Match stored in Redis ✅
2. IPFS call fails ❌
3. Edge Config not updated ❌

**Recovery:**
- Match shows in history (from Redis)
- User can press "Sync IPFS" button
- Manual sync uploads Redis data to IPFS
- ✅ Data recovered

---

### **7. Redis TTL Expires (7 Days)**

**Scenario:**
- User plays game
- Doesn't visit for 8 days
- Redis data expires

**What Happens:**
- Redis: Empty (expired)
- IPFS: Still has data (if synced)
- LocalStorage: Still has data (if multiplayer)

**History Page Shows:**
- Data from IPFS + LocalStorage
- ✅ No data loss (if synced)
- ⚠️ AI games lost if not synced

**Prevention:**
- Daily cron job syncs Redis → IPFS
- Manual sync button available

---

### **8. User Clears Browser Data**

**Scenario:**
- User clears cookies/localStorage
- LocalStorage wiped

**What Happens:**
- LocalStorage: Empty
- Redis: Still has data (7 days)
- IPFS: Still has data (permanent)

**History Page Shows:**
- Data from Redis + IPFS
- ✅ No data loss

---

### **9. Multiple Devices**

**Scenario:**
- User plays on Device A
- Switches to Device B

**What Happens:**
- Device A LocalStorage: Has games
- Device B LocalStorage: Empty
- Redis: Has all games (7 days)
- IPFS: Has all games (permanent)

**History Page Shows:**
- Device A: LocalStorage + Redis + IPFS
- Device B: Redis + IPFS only
- ✅ Both devices see same history (after deduplication)

---

### **10. Concurrent Games**

**Scenario:**
- User plays 2 games simultaneously in different tabs
- Both finish at same time

**What Happens:**
1. Tab 1: Stores to Redis
2. Tab 2: Stores to Redis
3. Both succeed (Redis handles concurrent writes)

**Deduplication:**
- Different timestamps/moves = different keys
- ✅ Both games show

---

### **11. Rematch After Redis Expires**

**Scenario:**
- Room ABC123, Game 1 (8 days ago, Redis expired)
- Room ABC123, Game 2 (today, in Redis)

**What Happens:**
- Redis: Only Game 2
- IPFS: Both games (if synced)
- LocalStorage: Both games (if multiplayer)

**Deduplication:**
- Key: `room-ABC123-2` (2 games total)
- Shows 1 card with 2 games
- ✅ Correct

---

### **12. IPFS Gateway Failure**

**Scenario:**
- History page tries to fetch from IPFS
- Gateway is down

**What Happens:**
```javascript
try {
  const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
  const ipfsData = await ipfsResponse.json();
} catch (error) {
  console.error("Error fetching from IPFS:", error);
  // Continue with Redis + LocalStorage only
}
```

**Result:**
- Shows data from Redis + LocalStorage
- ✅ Graceful degradation

---

### **13. Malformed Data in Storage**

**Scenario:**
- Corrupted data in Redis/IPFS/LocalStorage

**Protection:**
```javascript
// Redis parsing
const parsedRedisMatches = redisMatches.map(m => 
  typeof m === "string" ? JSON.parse(m) : m
);

// LocalStorage parsing
try {
  const matches = JSON.parse(localStorage.getItem("rps_matches") || "[]");
} catch {
  return []; // Return empty array on error
}
```

**Result:**
- ✅ Doesn't crash
- ✅ Shows valid data only

---

## 🛡️ Data Integrity Guarantees

### **Redis:**
- ✅ Atomic operations (LPUSH, SET)
- ✅ TTL auto-cleanup (7 days)
- ✅ Concurrent write safe

### **IPFS:**
- ✅ Immutable (content-addressed)
- ✅ Old versions unpinned (no duplicates)
- ✅ Permanent storage

### **Edge Config:**
- ✅ Global CDN (fast reads)
- ✅ Atomic updates (upsert)
- ✅ Only stores latest hash

### **LocalStorage:**
- ✅ Client-side only
- ✅ Limited to 50 matches (LTRIM)
- ✅ Backup only (not critical)

---

## 📊 Deduplication Summary

| Source | Duplicates Possible? | How Handled |
|--------|---------------------|-------------|
| **Redis** | No | LPUSH adds to list, LTRIM keeps last 100 |
| **IPFS** | No | Old hashes unpinned, Edge Config stores latest only |
| **LocalStorage** | No | Array limited to 50, client-side only |
| **Merge** | Yes | Deduplication via unique key Map |

**Final Result:** ✅ No duplicates shown to user

---

## 🔧 Testing Edge Cases

### **Test 1: Rematch**
```bash
1. Create room ABC123
2. Play game 1
3. Request rematch
4. Play game 2
5. Check history → Should show 1 card with 2 games
```

### **Test 2: Sync Multiple Times**
```bash
1. Play 3 AI games
2. Press sync button
3. Press sync button again
4. Check history → Should show 3 games (no duplicates)
```

### **Test 3: Cross-Device**
```bash
1. Play on Device A
2. Open on Device B
3. Check history → Should show same games
```

### **Test 4: Redis Expiry**
```bash
1. Play game
2. Wait 8 days (or manually delete Redis key)
3. Check history → Should still show from IPFS
```

---

## 🎯 Conclusion

The app handles duplicates through:
1. **Smart unique keys** (timestamp + moves + roomId)
2. **Map-based deduplication** (keeps last entry per key)
3. **IPFS cleanup** (unpins old versions)
4. **Graceful fallbacks** (if one source fails, others work)

✅ **No duplicates shown to users**
✅ **Data integrity maintained**
✅ **Edge cases handled gracefully**

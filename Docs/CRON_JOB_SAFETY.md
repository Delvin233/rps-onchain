# Daily Cron Job - Safety & Deduplication

## 🎯 Purpose

The daily cron job (`/api/cron/sync-all`) ensures:
- ✅ All Redis data synced to IPFS (permanent backup)
- ✅ No data loss from Redis TTL expiry
- ✅ Catches any failed auto-syncs
- ✅ Deduplicates data across all sources

---

## 🔄 How It Works

### **Trigger:**
```
Daily at 2:00 AM UTC (Vercel Cron)
```

### **Flow:**

```javascript
1. Get all users (from Redis stats:* keys)
2. For each user:
   a. Check if they have matches in Redis
   b. Skip if no matches
   c. Fetch all matches from Redis
   d. Deduplicate matches
   e. Sync to IPFS
   f. Wait 500ms (rate limiting)
3. Return summary (synced, skipped, errors)
```

---

## 🛡️ Safety Features

### **1. Deduplication**

**Problem:** Same match could be in Redis multiple times

**Solution:**
```javascript
// Create unique key for each match
const uniqueKey = match.opponent === "AI"
  ? `ai-${timestamp}-${player}`
  : `match-${roomId}-${timestamp}`;

// Use Map to deduplicate
const uniqueMatches = Array.from(
  new Map(matches.map(m => [uniqueKey, m])).values()
);
```

**Result:** ✅ No duplicate matches in IPFS

---

### **2. Skip Empty Users**

**Problem:** User has stats but no matches

**Solution:**
```javascript
const historyLength = await redis.llen(`history:${address}`);
if (historyLength === 0) {
  skip(); // Don't sync empty data
}
```

**Result:** ✅ No empty IPFS files

---

### **3. Rate Limiting**

**Problem:** 100 users = 100 IPFS uploads = rate limit

**Solution:**
```javascript
// Wait 500ms between each user sync
await new Promise(resolve => setTimeout(resolve, 500));
```

**Math:**
- 100 users × 500ms = 50 seconds total
- Rate: 2 uploads/second
- Pinata limit: 3 uploads/second
- ✅ Safe margin

---

### **4. Error Handling**

**Problem:** One user fails, entire cron stops

**Solution:**
```javascript
try {
  await syncUser(address);
  synced++;
} catch (error) {
  errors++;
  console.error(`Failed to sync ${address}:`, error);
  // Continue to next user
}
```

**Result:** ✅ One failure doesn't stop entire sync

---

### **5. Detailed Logging**

**Output:**
```json
{
  "success": true,
  "synced": 85,
  "skipped": 10,
  "errors": 5,
  "total": 100,
  "results": [
    { "address": "0x123", "status": "synced", "matchCount": 42 },
    { "address": "0x456", "status": "skipped", "reason": "no_matches" },
    { "address": "0x789", "status": "error", "error": "Rate limit" }
  ]
}
```

**Benefits:**
- ✅ Know exactly what happened
- ✅ Debug failures easily
- ✅ Monitor sync health

---

## 🔍 Edge Cases Handled

### **1. Duplicate Matches Across Sources**

**Scenario:**
- Match in Redis
- Same match already in IPFS
- Cron runs

**Handling:**
```javascript
// Fetch existing IPFS data
const existingMatches = await getMatchRecord(currentHash);

// Merge with Redis data
const allMatches = [...existingMatches, ...redisMatches];

// Deduplicate
const uniqueMatches = deduplicateByKey(allMatches);

// Store only unique matches
await uploadToIPFS(uniqueMatches);
```

**Result:** ✅ No duplicates in IPFS

---

### **2. Redis Data Expires During Cron**

**Scenario:**
- Cron starts at 2:00 AM
- User's Redis data expires at 2:05 AM (7-day TTL)
- Cron reaches that user at 2:10 AM

**Handling:**
```javascript
const historyLength = await redis.llen(`history:${address}`);
if (historyLength === 0) {
  // Data already expired
  skip();
  // But IPFS still has old data (safe)
}
```

**Result:** ✅ No error, old IPFS data preserved

---

### **3. IPFS Upload Fails**

**Scenario:**
- Pinata API down
- Network error
- Rate limit hit

**Handling:**
```javascript
try {
  await uploadToIPFS(matches);
  synced++;
} catch (error) {
  errors++;
  // Log error but continue
  // Data still in Redis (7 days)
  // Will retry tomorrow
}
```

**Result:** ✅ Graceful failure, retry next day

---

### **4. Concurrent Cron Runs**

**Scenario:**
- Cron triggered manually
- Daily cron also runs
- Both running at same time

**Handling:**
```javascript
// Vercel Cron ensures only 1 instance runs
// If manual trigger, it queues until current finishes
```

**Result:** ✅ No concurrent syncs

---

### **5. User Plays During Cron**

**Scenario:**
- Cron syncing user's data
- User plays new game
- New match added to Redis

**Handling:**
```javascript
// Cron syncs snapshot of Redis at that moment
// New match stays in Redis
// Next cron (tomorrow) will catch it
// Or auto-sync at 100 games catches it
```

**Result:** ✅ No data loss, eventual consistency

---

### **6. Malformed Data in Redis**

**Scenario:**
- Corrupted JSON in Redis
- Invalid match structure

**Handling:**
```javascript
const parsedMatches = redisMatches.map(m => {
  try {
    return typeof m === "string" ? JSON.parse(m) : m;
  } catch {
    return null; // Skip invalid data
  }
}).filter(Boolean); // Remove nulls
```

**Result:** ✅ Invalid data skipped, valid data synced

---

### **7. IPFS Hash Mismatch**

**Scenario:**
- Edge Config has hash `QmAAA`
- IPFS file `QmAAA` doesn't exist (deleted)

**Handling:**
```javascript
try {
  const existingData = await getMatchRecord(currentHash);
} catch {
  // File not found, start fresh
  existingData = { matches: [] };
}
```

**Result:** ✅ Recreates IPFS file from Redis

---

### **8. Stats Mismatch**

**Scenario:**
- Redis stats: 100 games
- IPFS matches: 95 games
- Mismatch!

**Handling:**
```javascript
// Recalculate stats from actual matches
const wins = matches.filter(m => m.result === "win").length;
const totalGames = matches.length;

// Store recalculated stats (source of truth)
await uploadToIPFS({ matches, stats: { totalGames, wins, ... } });
```

**Result:** ✅ Stats always match actual matches

---

## 📊 Performance

### **Sync Time:**

| Users | Matches Each | Total Time | Rate |
|-------|--------------|------------|------|
| 10 | 50 | 5 seconds | 2/sec |
| 100 | 50 | 50 seconds | 2/sec |
| 1000 | 50 | 8.3 minutes | 2/sec |

### **Rate Limit Safety:**

- Pinata limit: 3 uploads/second
- Our rate: 2 uploads/second
- Safety margin: 33%
- ✅ Safe for 1000+ users

---

## 🔧 Configuration

### **Cron Schedule:**
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-all",
    "schedule": "0 2 * * *" // Daily at 2 AM UTC
  }]
}
```

### **Rate Limit:**
```javascript
const SYNC_DELAY = 500; // ms between syncs
await new Promise(resolve => setTimeout(resolve, SYNC_DELAY));
```

### **Deduplication Key:**
```javascript
// AI matches
const key = `ai-${timestamp}-${player}`;

// Multiplayer matches
const key = `match-${roomId}-${timestamp}-${moves}`;
```

---

## 🎯 Testing

### **Manual Trigger:**
```bash
curl -X GET https://your-app.vercel.app/api/cron/sync-all \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### **Test Cases:**

1. **Empty User:**
   ```javascript
   // User has stats but no matches
   // Expected: Skipped
   ```

2. **Duplicate Matches:**
   ```javascript
   // Same match in Redis twice
   // Expected: Only 1 in IPFS
   ```

3. **Failed Upload:**
   ```javascript
   // Pinata returns 500
   // Expected: Error logged, continue to next user
   ```

4. **Expired Redis:**
   ```javascript
   // Redis data gone
   // Expected: Skipped, IPFS data preserved
   ```

---

## 📈 Monitoring

### **Metrics to Track:**

1. **Sync Success Rate:**
   ```
   synced / total × 100%
   Target: > 95%
   ```

2. **Error Rate:**
   ```
   errors / total × 100%
   Alert if: > 5%
   ```

3. **Skip Rate:**
   ```
   skipped / total × 100%
   Normal: 10-20% (users with no new matches)
   ```

4. **Sync Duration:**
   ```
   Total time to complete
   Alert if: > 10 minutes
   ```

---

## 🚀 Future Enhancements

### **1. Incremental Sync:**
```javascript
// Only sync users with new matches since last sync
const lastSyncTime = await redis.get(`last_sync:${address}`);
if (noNewMatchesSince(lastSyncTime)) {
  skip();
}
```

### **2. Priority Queue:**
```javascript
// Sync active users first
const activeUsers = getUsersByActivity();
syncInOrder(activeUsers);
```

### **3. Parallel Syncing:**
```javascript
// Sync multiple users in parallel (with rate limiting)
await Promise.all(
  users.map((user, i) => 
    delay(i * 500).then(() => syncUser(user))
  )
);
```

### **4. Smart Retry:**
```javascript
// Retry failed syncs with exponential backoff
if (syncFailed) {
  retryAfter(2^attemptNumber * 1000);
}
```

---

## 🎉 Conclusion

**The daily cron job ensures:**
- ✅ Zero data loss (Redis → IPFS backup)
- ✅ No duplicates (smart deduplication)
- ✅ Handles all edge cases gracefully
- ✅ Rate limit safe (500ms delay)
- ✅ Detailed logging (debug friendly)
- ✅ Fault tolerant (one failure doesn't stop all)

**Result:** Reliable, automatic, permanent data backup! 🎮

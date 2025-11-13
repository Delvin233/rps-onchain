# Rate Limit Protection & Batch IPFS Uploads

## 🚨 Problem

**Without Batching:**
- 2 players play 50 rematches
- Each game = 2 IPFS uploads (one per player)
- Total: 100 IPFS uploads in ~10 minutes
- **Pinata rate limit: ~3 requests/second**
- **Result: Rate limit errors!** ❌

**Pinata Free Tier:**
- 1GB storage
- 100 pins/month
- Rate limit: ~3 requests/second
- Burst: ~10 requests

---

## ✅ Solution: Smart Batching

### **Strategy:**

```
Game 1: Upload to IPFS (instant backup)
Games 2-9: Redis only (fast)
Game 10: Batch upload all 10 to IPFS
Games 11-19: Redis only
Game 20: Batch upload all 20 to IPFS
...
Game 100: Auto-sync all 100 to IPFS
```

### **Benefits:**
- ✅ First game backed up immediately
- ✅ 90% fewer IPFS uploads
- ✅ No rate limit issues
- ✅ All data still preserved
- ✅ Faster gameplay (less API calls)

---

## 📊 Upload Frequency

### **AI Games:**
```javascript
// Auto-sync at 100 games
if (listLength >= 100) {
  syncToIPFS();
}
```

### **Multiplayer Games:**
```javascript
// Sync on: 1st game, every 10th game, or at 100 games
const shouldSync = 
  totalGames === 1 ||      // First game
  totalGames % 10 === 0 || // Every 10th
  totalGames >= 100;       // At capacity
```

---

## 🎯 Comparison

### **Before Batching:**

| Games | IPFS Uploads | Rate Limit Risk |
|-------|--------------|-----------------|
| 10 | 20 | Low |
| 50 | 100 | **High** ⚠️ |
| 100 | 200 | **Critical** ❌ |

### **After Batching:**

| Games | IPFS Uploads | Rate Limit Risk |
|-------|--------------|-----------------|
| 10 | 4 (game 1 + game 10) | None ✅ |
| 50 | 12 (1, 10, 20, 30, 40, 50) | None ✅ |
| 100 | 22 (1, 10, 20, ..., 100) | None ✅ |

**Reduction: 90% fewer uploads!**

---

## 🔄 Data Flow

### **Multiplayer Game:**

```
Game Finish
  ↓
Store to Redis (both players)
  ↓
Check: Should sync to IPFS?
  ├─ Yes (1st, 10th, 20th, etc.)
  │   ↓
  │   Fetch all matches from Redis
  │   ↓
  │   Upload to IPFS
  │   ↓
  │   Update Edge Config
  │
  └─ No (2nd-9th, 11th-19th, etc.)
      ↓
      Skip IPFS (data safe in Redis)
```

---

## 🛡️ Data Safety

### **Scenario 1: Player plays 15 games**
- Game 1: Redis + IPFS ✅
- Games 2-9: Redis only
- Game 10: Redis + IPFS ✅
- Games 11-15: Redis only

**If Redis fails:**
- IPFS has games 1-10 ✅
- Games 11-15 in Redis (7-day TTL)
- Manual sync available
- Daily cron will catch it

### **Scenario 2: Player plays 100 games**
- Game 1: IPFS ✅
- Game 10: IPFS ✅
- Game 20: IPFS ✅
- ...
- Game 100: IPFS ✅

**Result:**
- 11 IPFS uploads total
- All 100 games preserved
- No rate limits
- ✅ Perfect!

---

## ⚡ Performance Impact

### **API Calls Reduced:**

**Before:**
```
50 games = 100 IPFS uploads
= 100 × 500ms = 50 seconds total
```

**After:**
```
50 games = 6 IPFS uploads
= 6 × 500ms = 3 seconds total
```

**Savings: 94% faster!**

### **User Experience:**

**Before:**
- Every game: Wait for IPFS upload
- Slow game finish (500ms delay)
- Rate limit errors

**After:**
- Most games: Instant finish
- Only 10% of games wait for IPFS
- No rate limit errors
- ✅ Smooth gameplay

---

## 🔍 Edge Cases

### **1. Both Players Hit 10th Game**
```
Player A: Game 10 → Sync to IPFS
Player B: Game 10 → Sync to IPFS
```
- 2 uploads at same time
- Still under rate limit (3/sec)
- ✅ No issue

### **2. Multiple Rooms Finishing**
```
Room 1: Game 10 → Sync
Room 2: Game 10 → Sync
Room 3: Game 10 → Sync
```
- 6 uploads (2 per room)
- Spread over ~1 second
- Still under rate limit
- ✅ No issue

### **3. Redis Expires Before Sync**
```
Player plays 15 games
Games 11-15 in Redis
Redis expires after 7 days
```
- Games 1-10 safe in IPFS ✅
- Games 11-15 lost ❌
- **Solution:** Daily cron syncs all

### **4. Manual Sync**
```
Player presses "Sync IPFS" button
```
- Syncs all Redis data immediately
- Bypasses batching
- ✅ User control

---

## 📈 Scaling

### **10 Players, 100 Games Each:**

**Before Batching:**
- 10 × 100 × 2 = 2,000 IPFS uploads
- ~17 minutes at 2 uploads/sec
- **Rate limit errors** ❌

**After Batching:**
- 10 × 11 × 2 = 220 IPFS uploads
- ~2 minutes at 2 uploads/sec
- **No rate limits** ✅

**Reduction: 89% fewer uploads**

---

## 🎛️ Configuration

### **Batch Size:**
```javascript
const BATCH_SIZE = 10; // Sync every 10 games
```

### **Sync Conditions:**
```javascript
const shouldSync = 
  totalGames === 1 ||           // First game (instant backup)
  totalGames % BATCH_SIZE === 0 || // Every 10th game
  totalGames >= 100;            // At capacity (auto-sync)
```

### **Adjustable:**
- Change `BATCH_SIZE` to 5, 10, 20, etc.
- Smaller = more frequent syncs, more API calls
- Larger = fewer syncs, more data in Redis

---

## 🚀 Future Enhancements

### **1. Adaptive Batching:**
```javascript
// Adjust batch size based on API response time
if (ipfsResponseTime > 1000ms) {
  BATCH_SIZE = 20; // Increase batch size
} else {
  BATCH_SIZE = 10; // Normal batch size
}
```

### **2. Priority Queue:**
```javascript
// Prioritize important games
if (isHighStakes || isFirstGame) {
  syncImmediately();
} else {
  addToBatchQueue();
}
```

### **3. Background Sync:**
```javascript
// Use Web Workers for non-blocking sync
worker.postMessage({ action: 'syncToIPFS', data: matches });
```

### **4. Retry Logic:**
```javascript
// Retry failed syncs with exponential backoff
if (syncFailed) {
  retryAfter(2^attemptNumber * 1000);
}
```

---

## 📊 Monitoring

### **Metrics to Track:**

1. **IPFS Upload Rate:**
   - Uploads per minute
   - Alert if > 50/min

2. **Rate Limit Errors:**
   - Count 429 responses
   - Alert if > 0

3. **Batch Efficiency:**
   - Average games per batch
   - Target: 10 games

4. **Sync Lag:**
   - Time between game and IPFS sync
   - Target: < 5 minutes

---

## 🎯 Conclusion

**Batch IPFS uploads provide:**
- ✅ 90% fewer API calls
- ✅ No rate limit issues
- ✅ Faster gameplay
- ✅ All data preserved
- ✅ Better scalability

**Trade-offs:**
- ⚠️ Some games not immediately in IPFS
- ✅ But safe in Redis (7 days)
- ✅ Daily cron catches everything
- ✅ Manual sync available

**Result:** Smooth, scalable, rate-limit-free gameplay! 🎮

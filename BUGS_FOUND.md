# Potential Bugs & Edge Cases Found

## 🔴 Critical Issues

### 1. **Race Condition in Multiplayer Join**
**File**: `app/play/multiplayer/page.tsx`
**Issue**: Blockchain transaction happens BEFORE Redis update. If blockchain succeeds but Redis fails, user is stuck.
**Line**: 113-115
```typescript
await joinGameContract({ functionName: "joinGame", args: [roomCode] });
// If this fails, blockchain already recorded the join
const response = await fetch("/api/room/join", ...);
```
**Fix**: Wrap in try-catch and handle blockchain revert if Redis fails.

---

### 2. **AI Game State Not Cleared on Error**
**File**: `app/play/single/page.tsx`
**Issue**: If `/api/play-ai` fails, `sessionStorage.setItem("aiGameActive", "true")` remains set, blocking navigation forever.
**Line**: 72-84
```typescript
sessionStorage.setItem("aiGameActive", "true");
const response = await fetch("/api/play-ai", ...); // If this fails, state stuck
```
**Fix**: Add try-catch and clear sessionStorage on error.

---

### 3. **Multiplayer Room Polling Never Stops**
**File**: `app/game/multiplayer/[roomId]/page.tsx`
**Issue**: `pollGameStatus` interval continues even after component unmounts if user force-closes tab.
**Line**: 115-130
**Fix**: Already has cleanup, but errorCount > 10 should also stop polling.

---

## ⚠️ Medium Issues

### 4. **Missing Error Handling in UBI Claim**
**File**: `app/profile/page.tsx`
**Issue**: If `checkEntitlement()` or `getNextClaimTime()` fails after claim, state becomes inconsistent.
**Line**: 68-76
```typescript
const [newEntitlement, newNextClaimTime] = await Promise.all([...]);
// No error handling if these fail
```
**Fix**: Add try-catch around Promise.all.

---

### 5. **Room Code Case Sensitivity**
**File**: `app/play/multiplayer/page.tsx`
**Issue**: Room code is converted to uppercase on input, but backend might be case-sensitive.
**Line**: 207
```typescript
onChange={e => setRoomCode(e.target.value.toUpperCase())}
```
**Fix**: Ensure backend also normalizes to uppercase.

---

### 6. **Network Switch During Active Game**
**File**: `app/play/multiplayer/page.tsx`
**Issue**: User can switch networks while in a game, causing contract calls to fail.
**Line**: 226-232
**Fix**: Disable network switching during active games.

---

## 🟡 Minor Issues

### 7. **SessionStorage Persists Across Tabs**
**File**: `app/play/single/page.tsx`
**Issue**: `aiGameActive` in sessionStorage doesn't clear if user opens multiple tabs.
**Fix**: Use `window.name` or add tab-specific identifier.

---

### 8. **Countdown Doesn't Update on Mount**
**File**: `app/profile/page.tsx`
**Issue**: If user navigates away and back, countdown might show stale data for up to 60 seconds.
**Line**: 59 - `setInterval(updateCountdown, 60000)`
**Fix**: Call `updateCountdown()` immediately on mount.

---

### 9. **Missing Null Check in Display Name**
**File**: `app/play/multiplayer/page.tsx`
**Issue**: `roomInfo?.creator` might be undefined when checking verification.
**Line**: 60
```typescript
const verifyRes = await fetch(`/api/check-verification?address=${data.creator}`);
```
**Fix**: Add null check before API call.

---

### 10. **Duplicate Toast on Opponent Leave**
**File**: `app/game/multiplayer/[roomId]/page.tsx`
**Issue**: `leftToastShownRef` prevents duplicate toasts, but doesn't reset on rematch.
**Line**: 310-330
**Fix**: Reset `leftToastShownRef.current = false` on rematch.

---

## 🔵 Edge Cases

### 11. **User Disconnects Wallet During Game**
**Issue**: No handling for wallet disconnection mid-game.
**Impact**: Game state becomes inconsistent.
**Fix**: Add `useEffect` to watch `address` and handle disconnection.

---

### 12. **Browser Back Button During Transaction**
**Issue**: User hits back while transaction is pending.
**Impact**: Transaction completes but user is on wrong page.
**Fix**: Already handled with navigation blocking, but could improve UX.

---

### 13. **Multiple Rapid Clicks on Join/Create**
**Issue**: User can spam click before `isJoining`/`isCreating` updates.
**Impact**: Multiple transactions or API calls.
**Fix**: Disable button immediately on click, not just on state update.

---

### 14. **Room Expires While User is Joining**
**Issue**: Room info shows valid, but expires between check and join.
**Impact**: Join fails with confusing error.
**Fix**: Add timestamp check and refresh room info before join.

---

### 15. **Theme Change During Game**
**Issue**: User changes theme while game is active.
**Impact**: Visual glitch or state loss if component re-renders.
**Fix**: Already handled by CSS variables, but test thoroughly.

---

## 📝 Recommendations

1. **Add Global Error Boundary** - Catch unhandled errors and show user-friendly message
2. **Add Loading States** - More granular loading indicators for better UX
3. **Add Retry Logic** - For failed API calls (especially IPFS/Redis)
4. **Add Rate Limiting** - Prevent spam on create/join buttons
5. **Add Timeout Handling** - For long-running operations (blockchain, IPFS)
6. **Add Offline Detection** - Warn user if connection is lost
7. **Add Transaction Confirmation** - Show pending state while waiting for blockchain
8. **Add Stale Data Detection** - Refresh data if user returns after long time
9. **Add Concurrent Game Prevention** - Block creating new game if one is active
10. **Add Better Error Messages** - More specific error messages for different failure modes

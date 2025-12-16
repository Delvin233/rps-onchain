# Social Login Match History Fix

## Problem Identified

Social login users were reporting that their match history wasn't showing up after playing games. The root cause was **inconsistent address normalization** across different parts of the system.

## Root Cause Analysis

### The Issue

1. **Social login addresses** from AppKit might be returned in different cases (mixed case, checksum format)
2. **Room storage** was storing addresses in their original case without normalization
3. **Match history storage** was normalizing addresses to lowercase
4. **Address comparison** was failing because of case mismatches

### Specific Problems Found

1. **roomStore.ts**: `createRoom()` and `joinRoom()` were storing addresses without normalization
2. **Room APIs**: Create, join, and cancel APIs weren't normalizing addresses
3. **Move submission**: Player address comparison wasn't case-insensitive
4. **Match storage**: While the final storage was normalized, the intermediate room data wasn't

## Fixes Applied

### 1. Room Store Normalization (`packages/nextjs/lib/roomStore.ts`)

```typescript
// Before
creator: creator,
joiner: joiner,

// After
creator: creator.toLowerCase(), // Normalize to lowercase
joiner: joiner.toLowerCase(),   // Normalize to lowercase
```

### 2. Room APIs Address Normalization

#### Create Room (`packages/nextjs/app/api/room/create/route.ts`)

```typescript
creator: creator.toLowerCase(), // Normalize to lowercase
```

#### Join Room (`packages/nextjs/app/api/room/join/route.ts`)

```typescript
room.joiner = joiner.toLowerCase(); // Normalize to lowercase
```

#### Cancel Room (`packages/nextjs/app/api/room/cancel/route.ts`)

```typescript
if (room.creator !== creator.toLowerCase()) { // Case-insensitive comparison
```

### 3. Move Submission (`packages/nextjs/app/api/room/submit-move/route.ts`)

```typescript
// Before
if (room.creator === player) {

// After
const playerLower = player.toLowerCase();
if (room.creator === playerLower) {
```

### 4. Enhanced Debugging

#### Added Debug API (`packages/nextjs/app/api/debug-social-login/route.ts`)

- Endpoint to check address variations in storage
- Test match creation for debugging
- Social login specific diagnostics

#### Added Debug Component (`packages/nextjs/components/SocialLoginDebugger.tsx`)

- Visual debugging tool for users
- Shows address variations and auth method
- Can test match storage and retrieval

#### Enhanced Logging (`packages/nextjs/contexts/AuthContext.tsx`)

- More detailed social login detection logging
- Address variation tracking
- Case sensitivity debugging

## Testing Strategy

### 1. Immediate Testing

Users can now use the debug tool on the history page to:

- Check if their addresses are stored correctly
- Test match storage with their current address
- See address variations in different storage systems

### 2. Verification Steps

1. Social login user creates a room → Address stored in lowercase
2. Social login user joins a room → Address stored in lowercase
3. Both players submit moves → Case-insensitive comparison works
4. Match completes → History stored with normalized addresses
5. User views history → Matches appear correctly

## Expected Results

### Before Fix

- Social login user address: `0xABC123def456...` (mixed case)
- Room creator stored as: `0xABC123def456...` (original case)
- Match history lookup: `0xabc123def456...` (lowercase)
- Result: **No matches found** (case mismatch)

### After Fix

- Social login user address: `0xABC123def456...` (mixed case)
- Room creator stored as: `0xabc123def456...` (normalized)
- Match history lookup: `0xabc123def456...` (lowercase)
- Result: **Matches found** ✅

## Rollout Plan

### Phase 1: Deploy Fixes

- ✅ Address normalization in room storage
- ✅ Case-insensitive comparisons in APIs
- ✅ Enhanced debugging tools

### Phase 2: User Testing

- Social login users test the debug tool
- Verify new matches appear correctly
- Collect feedback on remaining issues

### Phase 3: Data Migration (if needed)

- If existing rooms have case mismatches, run migration
- Update any stored room data to use lowercase addresses
- Clean up any orphaned data

## Monitoring

### Success Metrics

- Reduced complaints about missing match history
- Debug tool shows matches for social login users
- New games appear in history immediately

### Debug Tools Available

- `/api/debug-social-login?address=<addr>&authMethod=social`
- Debug component on history page
- Enhanced console logging for social logins

## Additional Notes

### Why This Affected Social Logins More

1. **Regular wallets** (MetaMask, etc.) tend to return addresses in consistent format
2. **Social login wallets** (AppKit embedded wallets) might return addresses in different cases
3. **Farcaster miniapp** context might handle addresses differently
4. **Case sensitivity** became more apparent with diverse wallet types

### Prevention

- All future address storage should use `.toLowerCase()`
- All address comparisons should be case-insensitive
- Consider using a utility function for address normalization

## Files Modified

1. `packages/nextjs/lib/roomStore.ts` - Room storage normalization
2. `packages/nextjs/app/api/room/create/route.ts` - Create room normalization
3. `packages/nextjs/app/api/room/join/route.ts` - Join room normalization
4. `packages/nextjs/app/api/room/cancel/route.ts` - Cancel room comparison
5. `packages/nextjs/app/api/room/submit-move/route.ts` - Move submission comparison
6. `packages/nextjs/contexts/AuthContext.tsx` - Enhanced logging
7. `packages/nextjs/app/api/debug-social-login/route.ts` - Debug API (new)
8. `packages/nextjs/components/SocialLoginDebugger.tsx` - Debug component (new)
9. `packages/nextjs/app/history/page.tsx` - Added debug component

This comprehensive fix should resolve the match history issues for social login users while providing tools to debug any remaining edge cases.

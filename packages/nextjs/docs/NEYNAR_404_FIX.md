# Neynar API 404 Error - Fix

## Issue
The nameResolver was logging `[NameResolver] Neynar API returned 404` errors when trying to resolve Farcaster usernames.

## Root Cause
The Neynar API `/v2/farcaster/user/bulk-by-address` endpoint returns **404 when an address doesn't have a Farcaster account**. This is **normal behavior**, not an error.

### Neynar API Behavior
- **404**: Address(es) don't have Farcaster accounts (expected for most addresses)
- **200 with empty object `{}`**: Address exists but has no linked accounts
- **200 with data**: Address has Farcaster account(s)

## Problem
The code was treating 404 as an error and logging it as such, which:
1. Created noise in logs
2. Made it seem like something was broken
3. Didn't distinguish between "no account" (normal) and actual errors

## Solution

### Changes Made
**File**: `packages/nextjs/lib/nameResolver.ts`

1. **Single address resolution** (`resolveFarcaster`):
   - Return `null` immediately on 404 (no logging)
   - Only log errors for non-404 status codes
   - Added comment explaining 404 behavior

2. **Bulk address resolution** (`bulkResolveFarcaster`):
   - Handle 404 gracefully with informational log
   - Continue to next batch without error logging
   - Only log errors for non-404 status codes

3. **Better error messages**:
   - Include response body in error logs
   - Distinguish between 404 (no account) and other errors
   - Added explanatory comments

### Code Changes

#### Before
```typescript
if (!response.ok) {
  console.error(`[NameResolver] Neynar API returned ${response.status}`);
  return null;
}
```

#### After
```typescript
// 404 means the address doesn't have a Farcaster account (this is normal)
if (response.status === 404) {
  return null;
}

if (!response.ok) {
  const errorText = await response.text();
  console.error(`[NameResolver] Neynar API returned ${response.status}: ${errorText}`);
  return null;
}
```

## Impact

### Before Fix
```
[NameResolver] Neynar API returned 404
[NameResolver] Neynar API returned 404
[NameResolver] Neynar API returned 404
... (lots of noise)
```

### After Fix
```
(no logs for addresses without Farcaster accounts)
[NameResolver] Found Farcaster name for 0x123...: alice
[NameResolver] Found Farcaster name for 0x456...: bob
```

## Testing

### Debug Endpoint
Created `/api/test-neynar-debug` to test Neynar API calls:
- Shows exact URL being called
- Displays response status and headers
- Returns full response body
- Useful for debugging API issues

### Usage
```bash
curl "http://localhost:3000/api/test-neynar-debug?address=0x997c71bb2b7d5814c99494d534db264e1702f245"
```

## Expected Behavior

### Addresses WITH Farcaster Accounts
- API returns 200 with user data
- Username is extracted and cached
- No error logs

### Addresses WITHOUT Farcaster Accounts
- API returns 404
- Function returns `null` silently
- Falls back to ENS/Basename/truncated address
- No error logs (this is normal)

### Actual API Errors (500, 429, etc.)
- Error is logged with status code and response body
- Function returns `null`
- Falls back to ENS/Basename/truncated address

## Related Files
- `/lib/nameResolver.ts` - Main implementation (FIXED)
- `/app/api/test-neynar-debug/route.ts` - Debug endpoint (NEW)
- `/app/api/leaderboard/ai/refresh-names/route.ts` - Uses bulk resolution
- `/app/api/leaderboard/ai/update/route.ts` - Uses single resolution

## Conclusion
The 404 errors were **not actually errors** - they were the API's way of saying "this address doesn't have a Farcaster account". The fix properly handles this as a normal case rather than an error condition.

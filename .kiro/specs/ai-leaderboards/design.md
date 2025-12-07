# AI Leaderboards Design Document

## Overview

This document outlines the technical design for implementing the AI Leaderboards feature, which provides a competitive ranking system for single-player AI matches. The design follows the requirements specified in `requirements.md`.

## Architecture

### System Components

```
┌─────────────────┐
│   Frontend UI   │
│  (Next.js App)  │
└────────┬────────┘
         │
         ├─── Leaderboard Page (/leaderboards)
         ├─── Profile Integration
         └─── AI Match Completion Hook
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  (Next.js API)  │
└────────┬────────┘
         │
         ├─── POST /api/leaderboard/ai/update
         ├─── GET /api/leaderboard/ai
         └─── GET /api/leaderboard/ai/player
         │
         ▼
┌─────────────────┐
│ Turso Database  │
│ ai_leaderboards │
└─────────────────┘
```

## Database Design

### Table: `ai_leaderboards`

```sql
CREATE TABLE IF NOT EXISTS ai_leaderboards (
  address TEXT PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL,
  display_name TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wins ON ai_leaderboards(wins DESC);
CREATE INDEX IF NOT EXISTS idx_rank ON ai_leaderboards(rank);
```

**Field Descriptions:**
- `address`: Wallet address (primary key, lowercase)
- `wins`: Total AI match wins
- `rank`: Current rank name (e.g., "Warrior", "Master")
- `display_name`: Resolved name (ENS/Basename/Farcaster)
- `updated_at`: Unix timestamp of last update

**Indexes:**
- `idx_wins`: Optimizes leaderboard queries (sorted by wins DESC)
- `idx_rank`: Optimizes rank-based filtering

## Rank System

### Rank Progression Overview

```
Tier 1: Entry Ranks (0-19 wins)
├─ Beginner (0-4)
├─ Novice (5-9)
└─ Fighter (10-19)

Tier 2: Warrior Ranks (20-49 wins)
├─ Warrior I (20-29)
├─ Warrior II (30-39)
└─ Warrior III (40-49)

Tier 3: Expert Ranks (50-79 wins)
├─ Expert I (50-59)
├─ Expert II (60-69)
└─ Expert III (70-79)

Tier 4: Master Ranks (80-109 wins)
├─ Master I (80-89)
├─ Master II (90-99)
└─ Master III (100-109)

Tier 5: Grandmaster Ranks (110-139 wins)
├─ Grandmaster I (110-119)
├─ Grandmaster II (120-129)
└─ Grandmaster III (130-139)

Tier 6: Champion Ranks (140-169 wins)
├─ Champion I (140-149)
├─ Champion II (150-159)
└─ Champion III (160-169)

Tier 7: Legend Ranks (170-219 wins)
├─ Legend I (170-179)
├─ Legend II (180-189)
├─ Legend III (190-199)
├─ Legend IV (200-209)
└─ Legend V (210-219)

Tier 8: Mythic Ranks (220-319 wins)
├─ Mythic I (220-239)
├─ Mythic II (240-259)
├─ Mythic III (260-279)
├─ Mythic IV (280-299)
└─ Mythic V (300-319)

Tier 9: RPS-God Ranks (320-690+ wins) ⭐ ULTIMATE TIER
├─ RPS-God I (320-369)
├─ RPS-God II (370-419)
├─ RPS-God III (420-469)
├─ RPS-God IV (470-519)
├─ RPS-God V (520-569)
├─ RPS-God VI (570-599)
├─ RPS-God VII (600-629)
├─ RPS-God VIII (630-659)
├─ RPS-God IX (660-689)
└─ RPS-God X (690+) 👑 MAXIMUM RANK
```

### Rank Configuration

```typescript
// lib/ranks.ts
export interface RankTier {
  name: string;
  minWins: number;
  maxWins: number | null;
  color: string;
  gradient?: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Beginner", minWins: 0, maxWins: 4, color: "#9CA3AF", gradient: null },
  { name: "Novice", minWins: 5, maxWins: 9, color: "#D1D5DB", gradient: null },
  { name: "Fighter", minWins: 10, maxWins: 19, color: "#60A5FA", gradient: null },
  { name: "Warrior I", minWins: 20, maxWins: 29, color: "#3B82F6", gradient: null },
  { name: "Warrior II", minWins: 30, maxWins: 39, color: "#3B82F6", gradient: null },
  { name: "Warrior III", minWins: 40, maxWins: 49, color: "#3B82F6", gradient: null },
  { name: "Expert I", minWins: 50, maxWins: 59, color: "#10B981", gradient: null },
  { name: "Expert II", minWins: 60, maxWins: 69, color: "#10B981", gradient: null },
  { name: "Expert III", minWins: 70, maxWins: 79, color: "#10B981", gradient: null },
  { name: "Master I", minWins: 80, maxWins: 89, color: "#059669", gradient: null },
  { name: "Master II", minWins: 90, maxWins: 99, color: "#059669", gradient: null },
  { name: "Master III", minWins: 100, maxWins: 109, color: "#059669", gradient: null },
  { name: "Grandmaster I", minWins: 110, maxWins: 119, color: "#A855F7", gradient: null },
  { name: "Grandmaster II", minWins: 120, maxWins: 129, color: "#A855F7", gradient: null },
  { name: "Grandmaster III", minWins: 130, maxWins: 139, color: "#A855F7", gradient: null },
  { name: "Champion I", minWins: 140, maxWins: 149, color: "#F59E0B", gradient: null },
  { name: "Champion II", minWins: 150, maxWins: 159, color: "#F59E0B", gradient: null },
  { name: "Champion III", minWins: 160, maxWins: 169, color: "#F59E0B", gradient: null },
  { name: "Legend I", minWins: 170, maxWins: 179, color: "#EF4444", gradient: null },
  { name: "Legend II", minWins: 180, maxWins: 189, color: "#EF4444", gradient: null },
  { name: "Legend III", minWins: 190, maxWins: 199, color: "#EF4444", gradient: null },
  { name: "Legend IV", minWins: 200, maxWins: 209, color: "#EF4444", gradient: null },
  { name: "Legend V", minWins: 210, maxWins: 219, color: "#EF4444", gradient: null },
  { name: "Mythic I", minWins: 220, maxWins: 239, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  { name: "Mythic II", minWins: 240, maxWins: 259, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  { name: "Mythic III", minWins: 260, maxWins: 279, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  { name: "Mythic IV", minWins: 280, maxWins: 299, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  { name: "Mythic V", minWins: 300, maxWins: 319, color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)" },
  { name: "RPS-God I", minWins: 320, maxWins: 369, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God II", minWins: 370, maxWins: 419, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God III", minWins: 420, maxWins: 469, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God IV", minWins: 470, maxWins: 519, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God V", minWins: 520, maxWins: 569, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God VI", minWins: 570, maxWins: 599, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God VII", minWins: 600, maxWins: 629, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God VIII", minWins: 630, maxWins: 659, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God IX", minWins: 660, maxWins: 689, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)" },
  { name: "RPS-God X", minWins: 690, maxWins: null, color: "#FFD700", gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF, #00FFFF)" },
];

export function getRankForWins(wins: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (wins >= RANK_TIERS[i].minWins) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0]; // Default to Beginner
}

export function getNextRank(currentWins: number): { rank: RankTier; winsNeeded: number } | null {
  const currentRank = getRankForWins(currentWins);
  const currentIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);
  
  if (currentIndex === RANK_TIERS.length - 1) {
    return null; // Already at max rank
  }
  
  const nextRank = RANK_TIERS[currentIndex + 1];
  const winsNeeded = nextRank.minWins - currentWins;
  
  return { rank: nextRank, winsNeeded };
}
```

## API Design

### 1. Update Player Wins

**Endpoint:** `POST /api/leaderboard/ai/update`

**Request Body:**
```typescript
{
  address: string;
  won: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    address: string;
    wins: number;
    rank: string;
    rankChanged: boolean;
    previousRank?: string;
  };
}
```

**Logic:**
1. Validate address format
2. Check if player exists in database
3. If new player: Insert with wins=1, rank="Beginner"
4. If existing: Increment wins, recalculate rank
5. Update `updated_at` timestamp
6. Return updated stats with rank change indicator

### 2. Get Leaderboard

**Endpoint:** `GET /api/leaderboard/ai?limit=50&offset=0`

**Query Parameters:**
- `limit`: Number of entries (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: {
    entries: Array<{
      position: number;
      address: string;
      displayName: string;
      wins: number;
      rank: string;
      updatedAt: number;
    }>;
    total: number;
    hasMore: boolean;
  };
}
```

**Logic:**
1. Query database: `SELECT * FROM ai_leaderboards ORDER BY wins DESC LIMIT ? OFFSET ?`
2. Calculate position for each entry (offset + index + 1)
3. Return paginated results with total count

### 3. Get Player Rank

**Endpoint:** `GET /api/leaderboard/ai/player?address={address}`

**Response:**
```typescript
{
  success: boolean;
  data: {
    address: string;
    displayName: string;
    wins: number;
    rank: string;
    position: number;
    nextRank: {
      name: string;
      winsNeeded: number;
    } | null;
  };
}
```

**Logic:**
1. Query player data from database
2. Calculate position: `SELECT COUNT(*) FROM ai_leaderboards WHERE wins > ?`
3. Calculate next rank and wins needed
4. Return player stats with position

## Frontend Components

### 1. Leaderboard Page (`/leaderboards`)

**File:** `packages/nextjs/app/leaderboards/page.tsx`

**Features:**
- Display "Single Player Ranks" card
- Navigate to AI leaderboards view
- Placeholder for future leaderboard types

### 2. AI Leaderboard View

**File:** `packages/nextjs/app/leaderboards/ai/page.tsx`

**Components:**
- Header with title and refresh button
- Current user rank card (highlighted)
- Leaderboard list with pagination
- Empty state for no entries
- Loading states

**UI Structure:**
```tsx
<div className="container">
  {/* Header */}
  <div className="header">
    <h1>Single Player Ranks</h1>
    <button onClick={refresh}>Refresh</button>
  </div>

  {/* Current User Card */}
  {currentUser && (
    <div className="current-user-card highlighted">
      <RankBadge rank={currentUser.rank} />
      <div>#{currentUser.position}</div>
      <div>{currentUser.displayName}</div>
      <div>{currentUser.wins} wins</div>
      {nextRank && <div>Next: {nextRank.name} ({nextRank.winsNeeded} wins)</div>}
    </div>
  )}

  {/* Leaderboard List */}
  <div className="leaderboard-list">
    {entries.map((entry, index) => (
      <LeaderboardEntry
        key={entry.address}
        entry={entry}
        isCurrentUser={entry.address === currentUser?.address}
      />
    ))}
  </div>

  {/* Pagination */}
  {hasMore && <button onClick={loadMore}>Load More</button>}
</div>
```

### 3. Rank Badge Component

**File:** `packages/nextjs/components/RankBadge.tsx`

**Props:**
```typescript
interface RankBadgeProps {
  rank: string;
  wins?: number;
  size?: "sm" | "md" | "lg";
  showWins?: boolean;
}
```

**Features:**
- Display rank name with color coding
- Optional gradient for Mythic rank
- Responsive sizing
- Optional win count display

### 4. Home Page Stats Integration

**File:** `packages/nextjs/app/page.tsx`

**Changes:**
- Add "AI Rank" card to the stats section (alongside Total Games, AI Wins, PvP Wins)
- Display current rank with badge
- Display total AI wins
- Show progress to next rank
- Make card clickable to navigate to full leaderboard

**UI Addition:**
```tsx
// Add to statsData array
{
  title: "AI Rank",
  value: playerRank?.rank || "Unranked",
  icon: Trophy, // or Medal icon
  subtitle: nextRank 
    ? `Next: ${nextRank.name} (${nextRank.winsNeeded} wins)`
    : "Maximum Rank!",
  onClick: () => router.push("/leaderboards/ai"),
  rankBadge: <RankBadge rank={playerRank?.rank} size="sm" />
}
```

**Note:** Profile page is reserved for user customization (display name, avatar, etc.)

## Integration Points

### AI Match Completion Hook

**File:** `packages/nextjs/hooks/useAIMatchCompletion.ts`

**Purpose:** Automatically update leaderboard when AI match ends

**Implementation:**
```typescript
export function useAIMatchCompletion() {
  const { address } = useConnectedAddress();

  const updateLeaderboard = async (won: boolean) => {
    if (!address || !won) return;

    try {
      const response = await fetch("/api/leaderboard/ai/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, won }),
      });

      const result = await response.json();

      if (result.data.rankChanged) {
        // Show rank up notification
        toast.success(`Rank Up! You are now ${result.data.rank}!`);
      }
    } catch (error) {
      console.error("Failed to update leaderboard:", error);
    }
  };

  return { updateLeaderboard };
}
```

**Usage in AI Game:**
```typescript
// In AI game completion logic
const { updateLeaderboard } = useAIMatchCompletion();

const handleGameEnd = async (result: GameResult) => {
  // ... existing game end logic ...
  
  if (result.winner === "player") {
    await updateLeaderboard(true);
  }
};
```

## Name Resolution

### Strategy

1. **Priority Order:**
   - Farcaster username (from context)
   - ENS name (via ENS resolver)
   - Basename (via Basename resolver)
   - Truncated address (fallback)

2. **Caching:**
   - Store resolved names in `display_name` field
   - Update on each leaderboard update
   - Cache in frontend for 5 minutes

3. **Implementation:**

```typescript
// lib/nameResolver.ts
export async function resolveDisplayName(address: string): Promise<string> {
  // Try Farcaster (if available from context)
  const farcasterName = await getFarcasterUsername(address);
  if (farcasterName) return farcasterName;

  // Try ENS
  const ensName = await getENSName(address);
  if (ensName) return ensName;

  // Try Basename
  const basename = await getBasename(address);
  if (basename) return basename;

  // Fallback to truncated address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

## Performance Optimizations

### 1. Database Queries

- Use indexes on `wins` and `rank` columns
- Implement pagination (50 entries per page)
- Cache leaderboard results for 30 seconds

### 2. Frontend

- Implement virtual scrolling for large lists
- Lazy load leaderboard entries
- Cache player rank data in localStorage
- Debounce refresh button (5 second cooldown)

### 3. API

- Rate limit: 10 requests per minute per address
- Cache GET requests with short TTL (30s)
- Batch name resolution requests

## Error Handling

### Database Errors

```typescript
try {
  // Database operation
} catch (error) {
  console.error("Database error:", error);
  return {
    success: false,
    error: "Failed to update leaderboard. Please try again.",
  };
}
```

### API Errors

```typescript
// Frontend error handling
try {
  const response = await fetch("/api/leaderboard/ai");
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  const data = await response.json();
} catch (error) {
  toast.error("Failed to load leaderboard");
  setError("Unable to load leaderboard. Please refresh.");
}
```

### Empty States

1. **No entries:** Show welcome message with CTA to play AI matches
2. **Player not ranked:** Show "Unranked" status with explanation
3. **Network error:** Show retry button with error message

## Security Considerations

### 1. Address Validation

```typescript
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
```

### 2. Rate Limiting

- Prevent spam updates: Max 1 update per 10 seconds per address
- Prevent leaderboard spam: Max 10 fetches per minute per IP

### 3. Data Integrity

- Validate win increments (only +1 per update)
- Prevent negative wins
- Sanitize display names (max 50 chars, no special chars)

## Testing Strategy

### Unit Tests

1. Rank calculation logic
2. Name resolution functions
3. API endpoint handlers
4. Database queries

### Integration Tests

1. AI match completion → leaderboard update flow
2. Leaderboard pagination
3. Player rank retrieval
4. Name resolution caching

### E2E Tests

1. Complete AI match and verify leaderboard update
2. Navigate to leaderboard and view rankings
3. Check profile rank display
4. Test rank up notification

## Deployment Checklist

- [ ] Create `ai_leaderboards` table in Turso
- [ ] Deploy API endpoints
- [ ] Update AI game completion logic
- [ ] Add leaderboard navigation
- [ ] Integrate rank display in profile
- [ ] Test rank calculations
- [ ] Test name resolution
- [ ] Monitor database performance
- [ ] Set up error tracking
- [ ] Document API for future reference

## Monitoring & Analytics

### Metrics to Track

1. **Engagement:**
   - Leaderboard page views
   - Refresh button clicks
   - Profile rank card views

2. **Performance:**
   - API response times
   - Database query times
   - Name resolution success rate

3. **User Behavior:**
   - Average wins per player
   - Rank distribution
   - Time to reach each rank
   - Retention by rank tier

### Logging

```typescript
// Log rank changes
console.log(`[Leaderboard] ${address} ranked up: ${oldRank} → ${newRank}`);

// Log API errors
console.error(`[Leaderboard API] Error updating ${address}:`, error);

// Log performance
console.log(`[Leaderboard] Query took ${duration}ms for ${count} entries`);
```

## Future Enhancements

### Phase 2 (Post-Launch)

1. **Rank Icons:** Visual badges for each rank tier
2. **Rank History:** Track progression over time
3. **Weekly Leaderboards:** Time-based rankings
4. **Friend Rankings:** Compare with connected users
5. **Achievements:** Special milestones (e.g., "First Win", "100 Wins")

### Phase 3 (Advanced)

1. **Multiplayer Leaderboards:** Separate ranking for PvP
2. **Regional Rankings:** Leaderboards by location
3. **Rank Decay:** Lose rank if inactive for 30 days
4. **Rank Rewards:** NFT badges or token rewards
5. **Tournaments:** Competitive events with prizes

## Notes

- 38 total ranks provide long-term engagement and progression
- Sub-ranks (I, II, III, etc.) give frequent sense of achievement
- RPS-God tier (320-690+ wins) is the ultimate aspirational goal
- RPS-God X (690+ wins) represents mastery of the game
- Cosmic gradient for RPS-God ranks creates visual prestige
- Keep rank thresholds balanced (not too easy, not too hard)
- Monitor for rank inflation and adjust if needed
- Consider seasonal resets in future phases
- Ensure mobile responsiveness for all components
- Test with various wallet types (EOA, smart wallets)
- Sub-ranks make progression feel more rewarding and less grindy


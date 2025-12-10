# AI Leaderboards Feature

## Overview

The AI Leaderboards feature provides a competitive ranking system for single-player AI matches. Players earn ranks based on their total wins, with 38 ranks spanning from Beginner to RPS-God X.

## Features

- ✅ **38 Rank System** - Progressive ranks from Beginner (0 wins) to RPS-God X (690+ wins)
- ✅ **Automatic Tracking** - AI wins are automatically tracked and updated
- ✅ **Real-time Updates** - Leaderboard updates immediately after matches
- ✅ **Rank-up Notifications** - Confetti and toast notifications when advancing ranks
- ✅ **Name Resolution** - Displays ENS/Basename names when available
- ✅ **Glowing Rank Borders** - Visual rank indicators with color-coded borders
- ✅ **Responsive Design** - Works on desktop and mobile

## Architecture

### Database Schema

```sql
CREATE TABLE ai_leaderboards (
  address TEXT PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL,
  display_name TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_wins ON ai_leaderboards(wins DESC);
CREATE INDEX idx_rank ON ai_leaderboards(rank);
```

### API Endpoints

#### POST `/api/leaderboard/ai/update`

Updates player wins after AI match completion.

**Request:**

```json
{
  "address": "0x...",
  "won": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "wins": 42,
    "rank": "Expert II",
    "rankChanged": true,
    "previousRank": "Expert I"
  }
}
```

#### GET `/api/leaderboard/ai?limit=50&offset=0`

Fetches paginated leaderboard rankings.

**Response:**

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "position": 1,
        "address": "0x...",
        "displayName": "alice.eth",
        "wins": 150,
        "rank": "Champion II",
        "updatedAt": 1234567890
      }
    ],
    "total": 100,
    "hasMore": true
  }
}
```

#### GET `/api/leaderboard/ai/player?address=0x...`

Fetches specific player's rank and position.

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "displayName": "alice.eth",
    "wins": 42,
    "rank": "Expert II",
    "position": 15,
    "nextRank": {
      "name": "Expert III",
      "winsNeeded": 8
    }
  }
}
```

#### POST `/api/leaderboard/ai/migrate`

One-time migration endpoint to populate leaderboard with existing players.

## Rank System

### Rank Tiers

| Tier        | Ranks                     | Win Range | Color            |
| ----------- | ------------------------- | --------- | ---------------- |
| Entry       | Beginner, Novice, Fighter | 0-19      | Gray/Blue        |
| Warrior     | Warrior I-III             | 20-49     | Blue             |
| Expert      | Expert I-III              | 50-79     | Green            |
| Master      | Master I-III              | 80-109    | Dark Green       |
| Grandmaster | Grandmaster I-III         | 110-139   | Purple           |
| Champion    | Champion I-III            | 140-169   | Gold             |
| Legend      | Legend I-V                | 170-219   | Red              |
| Mythic      | Mythic I-V                | 220-319   | Rainbow Gradient |
| RPS-God     | RPS-God I-X               | 320-690+  | Cosmic Gradient  |

### Rank Progression

- **Beginner** (0-4 wins) - Starting rank
- **Novice** (5-9 wins) - First milestone
- **Fighter** (10-19 wins) - Entry tier complete
- **Warrior I-III** (20-49 wins) - Consistent player
- **Expert I-III** (50-79 wins) - Skilled player
- **Master I-III** (80-109 wins) - Advanced player
- **Grandmaster I-III** (110-139 wins) - Elite player
- **Champion I-III** (140-169 wins) - Top tier player
- **Legend I-V** (170-219 wins) - Legendary status
- **Mythic I-V** (220-319 wins) - Mythical achievement
- **RPS-God I-X** (320-690+ wins) - Ultimate mastery

## Components

### RankBadge

Displays a player's rank with color coding and optional gradient effects.

```tsx
import { RankBadge } from "~~/components/RankBadge";

<RankBadge rank="Expert II" wins={65} size="md" showWins={true} />;
```

### LeaderboardEntry

Displays a single entry in the leaderboard.

```tsx
import { LeaderboardEntry } from "~~/components/LeaderboardEntry";

<LeaderboardEntry
  entry={{
    position: 1,
    address: "0x...",
    displayName: "alice.eth",
    wins: 150,
    rank: "Champion II",
  }}
  isCurrentUser={false}
/>;
```

### LeaderboardSkeleton

Skeleton loader for leaderboard entries.

```tsx
import { LeaderboardSkeleton } from "~~/components/LeaderboardSkeleton";

<LeaderboardSkeleton count={10} />;
```

## Hooks

### useAIMatchCompletion

Hook to automatically update leaderboard after AI match completion.

```tsx
import { useAIMatchCompletion } from "~~/hooks/useAIMatchCompletion";

const { updateLeaderboard, isUpdating } = useAIMatchCompletion();

// After AI match ends
if (playerWon) {
  await updateLeaderboard(playerAddress, true);
}
```

## Utilities

### Rank Utilities (`lib/ranks.ts`)

```typescript
import { getNextRank, getRankColor, getRankForWins } from "~~/lib/ranks";

// Get rank for win count
const rank = getRankForWins(42); // Returns Expert II

// Get next rank and wins needed
const next = getNextRank(42); // { rank: Expert III, winsNeeded: 8 }

// Get rank color
const color = getRankColor("Expert II"); // Returns "#10B981"
```

### Name Resolution (`lib/nameResolver.ts`)

```typescript
import { resolveDisplayName } from "~~/lib/nameResolver";

// Resolve display name (ENS/Basename/truncated)
const name = await resolveDisplayName("0x...");
```

## Performance Optimizations

### Caching

- **API responses**: 30-second TTL for leaderboard, 1-minute for player rank
- **Name resolution**: 5-minute TTL for resolved names
- **Rate limiting**: 10-second cooldown between updates per address

### Database Indexes

- `idx_wins`: Optimizes leaderboard queries (DESC order)
- `idx_rank`: Optimizes rank-based filtering

### Pagination

- Default: 50 entries per page
- Maximum: 100 entries per page
- Infinite scroll support

## Migration

To populate the leaderboard with existing players:

```bash
curl -X POST http://localhost:3000/api/leaderboard/ai/migrate
```

This will:

1. Query all players with `ai_wins > 0` from the stats table
2. Calculate their rank based on current wins
3. Insert them into the `ai_leaderboards` table
4. Resolve display names (with timeout)
5. Skip players already in the leaderboard (idempotent)

## Testing

Run tests:

```bash
yarn test lib/__tests__/ranks.test.ts
yarn test lib/__tests__/nameResolver.test.ts
```

## Future Enhancements

- [x] ~~Farcaster username resolution via Neynar API~~ ✅ **Implemented**
- [ ] Weekly/Monthly leaderboards
- [ ] Rank decay for inactive players
- [ ] Rank badges/icons
- [ ] Achievement system
- [ ] Regional leaderboards
- [ ] Friend rankings
- [ ] Rank history tracking
- [ ] Tournament mode

## Troubleshooting

### Player not appearing on leaderboard

- Ensure they have at least 1 AI win
- Check if migration has been run
- Verify database connection

### Rank not updating

- Check rate limiting (10-second cooldown)
- Verify API endpoint is being called
- Check browser console for errors

### Names not resolving

- ENS/Basename resolution requires RPC access
- Check network connectivity
- Names are cached for 5 minutes

## Support

For issues or questions, check:

- [Rank System Documentation](./RANK_SYSTEM.md)
- [API Documentation](./API.md)
- [Component Documentation](./COMPONENTS.md)

# AI Leaderboard Page Mockup

## Overview

The AI Leaderboard page displays a ranked list of all players sorted by their AI match wins. Players can see their position, compare with others, and track their progress toward higher ranks.

## Page Layout

### Desktop View

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back                    Single Player Ranks              🔄 Refresh│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  YOUR RANK                                            🏆     │   │
│  │  ═══════════════════════════════════════════════════════════│   │
│  │  #42                                                         │   │
│  │  🔵 Warrior II                                               │   │
│  │  30 wins                                                     │   │
│  │  Next: Warrior III (10 wins to go)                          │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 66%                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  LEADERBOARD                                                 │   │
│  ├──────┬────────────────────┬──────────────┬─────────────────┤   │
│  │ Rank │ Player             │ Rank         │ Wins            │   │
│  ├──────┼────────────────────┼──────────────┼─────────────────┤   │
│  │  🥇  │ alice.eth          │ 👑 RPS-God X │ 720             │   │
│  │  🥈  │ bob.base.eth       │ ⭐ RPS-God IX│ 680             │   │
│  │  🥉  │ charlie            │ ⭐ RPS-God VIII│ 650           │   │
│  │  4   │ 0x1234...5678      │ ⭐ RPS-God VII│ 610            │   │
│  │  5   │ dave.eth           │ ⭐ RPS-God VI │ 580             │   │
│  │  ... │ ...                │ ...          │ ...             │   │
│  │  40  │ grace.base.eth     │ 🔵 Warrior III│ 45             │   │
│  │  41  │ henry              │ 🔵 Warrior II │ 35             │   │
│  │ ►42◄ │ YOU (0x9abc...def) │ 🔵 Warrior II │ 30             │   │
│  │  43  │ iris.eth           │ 🔵 Warrior II │ 28             │   │
│  │  44  │ jack               │ 🔵 Warrior I  │ 25             │   │
│  │  ... │ ...                │ ...          │ ...             │   │
│  └──────┴────────────────────┴──────────────┴─────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Load More (50 more)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```



### Mobile View

```
┌─────────────────────────────┐
│ ← Single Player Ranks   🔄  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ YOUR RANK          🏆   │ │
│ │ ═══════════════════════ │ │
│ │ #42                     │ │
│ │ 🔵 Warrior II           │ │
│ │ 30 wins                 │ │
│ │ Next: Warrior III       │ │
│ │ (10 wins to go)         │ │
│ │ ▓▓▓▓▓▓▓▓░░░░ 66%        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ LEADERBOARD             │ │
│ ├─────────────────────────┤ │
│ │ 🥇 alice.eth            │ │
│ │ 👑 RPS-God X • 720 wins │ │
│ ├─────────────────────────┤ │
│ │ 🥈 bob.base.eth         │ │
│ │ ⭐ RPS-God IX • 680 wins│ │
│ ├─────────────────────────┤ │
│ │ 🥉 charlie              │ │
│ │ ⭐ RPS-God VIII • 650   │ │
│ ├─────────────────────────┤ │
│ │ 4  0x1234...5678        │ │
│ │ ⭐ RPS-God VII • 610    │ │
│ ├─────────────────────────┤ │
│ │ ...                     │ │
│ ├─────────────────────────┤ │
│ │►42 YOU (0x9abc...def)  ◄│ │
│ │ 🔵 Warrior II • 30 wins │ │
│ ├─────────────────────────┤ │
│ │ 43 iris.eth             │ │
│ │ 🔵 Warrior II • 28 wins │ │
│ ├─────────────────────────┤ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │    Load More (50)       │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```



## Component Breakdown

### 1. Header Section

```tsx
<div className="header">
  <button onClick={() => router.back()}>
    <ArrowLeft size={20} /> Back
  </button>
  
  <h1>Single Player Ranks</h1>
  
  <button onClick={handleRefresh} disabled={isRefreshing}>
    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
  </button>
</div>
```

### 2. Current User Rank Card (Highlighted)

```tsx
<div className="current-user-card">
  <div className="header">
    <h2>YOUR RANK</h2>
    <Trophy size={24} className="text-primary" />
  </div>
  
  <div className="rank-info">
    <div className="position">#{position}</div>
    <div className="rank-badge">
      <RankBadge rank={rank} size="lg" />
    </div>
    <div className="wins">{wins} wins</div>
    
    {nextRank && (
      <>
        <div className="next-rank">
          Next: {nextRank.name} ({nextRank.winsNeeded} wins to go)
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">{progress}%</div>
      </>
    )}
  </div>
</div>
```



### 3. Leaderboard Table (Desktop)

```tsx
<div className="leaderboard-table">
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Player</th>
        <th>Rank</th>
        <th>Wins</th>
      </tr>
    </thead>
    <tbody>
      {entries.map((entry, index) => (
        <tr 
          key={entry.address}
          className={entry.address === currentUser?.address ? 'current-user' : ''}
        >
          <td className="position">
            {entry.position === 1 && '🥇'}
            {entry.position === 2 && '🥈'}
            {entry.position === 3 && '🥉'}
            {entry.position > 3 && entry.position}
            {entry.address === currentUser?.address && ' ►◄'}
          </td>
          <td className="player">
            {entry.displayName}
            {entry.address === currentUser?.address && ' (YOU)'}
          </td>
          <td className="rank">
            <RankBadge rank={entry.rank} size="sm" />
          </td>
          <td className="wins">{entry.wins}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 4. Leaderboard List (Mobile)

```tsx
<div className="leaderboard-list">
  {entries.map((entry) => (
    <div 
      key={entry.address}
      className={`entry-card ${entry.address === currentUser?.address ? 'current-user' : ''}`}
    >
      <div className="position">
        {entry.position === 1 && '🥇'}
        {entry.position === 2 && '🥈'}
        {entry.position === 3 && '🥉'}
        {entry.position > 3 && entry.position}
        {entry.address === currentUser?.address && ' ►◄'}
      </div>
      
      <div className="info">
        <div className="player">
          {entry.displayName}
          {entry.address === currentUser?.address && ' (YOU)'}
        </div>
        <div className="stats">
          <RankBadge rank={entry.rank} size="sm" />
          <span className="wins">{entry.wins} wins</span>
        </div>
      </div>
    </div>
  ))}
</div>
```



## Rank Badge Component

### Visual Examples

```
Entry Ranks:
⚪ Beginner    (Gray)
⚪ Novice      (Light Gray)
🔵 Fighter    (Blue)

Warrior Ranks:
🔵 Warrior I   (Blue)
🔵 Warrior II  (Blue)
🔵 Warrior III (Blue)

Expert Ranks:
🟢 Expert I    (Green)
🟢 Expert II   (Green)
🟢 Expert III  (Green)

Master Ranks:
🟢 Master I    (Dark Green)
🟢 Master II   (Dark Green)
🟢 Master III  (Dark Green)

Grandmaster Ranks:
🟣 Grandmaster I   (Purple)
🟣 Grandmaster II  (Purple)
🟣 Grandmaster III (Purple)

Champion Ranks:
🟡 Champion I   (Gold)
🟡 Champion II  (Gold)
🟡 Champion III (Gold)

Legend Ranks:
🔴 Legend I    (Red)
🔴 Legend II   (Red)
🔴 Legend III  (Red)
🔴 Legend IV   (Red)
🔴 Legend V    (Red)

Mythic Ranks:
🌈 Mythic I    (Rainbow Gradient)
🌈 Mythic II   (Rainbow Gradient)
🌈 Mythic III  (Rainbow Gradient)
🌈 Mythic IV   (Rainbow Gradient)
🌈 Mythic V    (Rainbow Gradient)

RPS-God Ranks:
⭐ RPS-God I   (Cosmic Gradient)
⭐ RPS-God II  (Cosmic Gradient)
⭐ RPS-God III (Cosmic Gradient)
⭐ RPS-God IV  (Cosmic Gradient)
⭐ RPS-God V   (Cosmic Gradient)
⭐ RPS-God VI  (Cosmic Gradient)
⭐ RPS-God VII (Cosmic Gradient)
⭐ RPS-God VIII (Cosmic Gradient)
⭐ RPS-God IX  (Cosmic Gradient)
👑 RPS-God X   (Enhanced Cosmic)
```



## Styling Details

### Current User Highlight

```css
.current-user {
  background: linear-gradient(
    90deg,
    rgba(var(--color-primary-rgb), 0.1) 0%,
    rgba(var(--color-primary-rgb), 0.05) 100%
  );
  border-left: 4px solid var(--color-primary);
  font-weight: 600;
}

.current-user .position::before {
  content: '►';
  margin-right: 4px;
  color: var(--color-primary);
}

.current-user .position::after {
  content: '◄';
  margin-left: 4px;
  color: var(--color-primary);
}
```

### Medal Icons for Top 3

```css
.position {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Gold medal */
tr:nth-child(1) .position {
  color: #FFD700;
  font-size: 1.5rem;
}

/* Silver medal */
tr:nth-child(2) .position {
  color: #C0C0C0;
  font-size: 1.4rem;
}

/* Bronze medal */
tr:nth-child(3) .position {
  color: #CD7F32;
  font-size: 1.3rem;
}
```

### Rank Badge Styling

```tsx
<span 
  className="rank-badge"
  style={{
    color: getRankColor(rank),
    background: `${getRankColor(rank)}20`,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }}
>
  {getRankIcon(rank)} {rank}
</span>
```



## States

### 1. Loading State

```tsx
<div className="leaderboard-loading">
  {[...Array(10)].map((_, i) => (
    <div key={i} className="skeleton-entry">
      <div className="skeleton skeleton-position" />
      <div className="skeleton skeleton-name" />
      <div className="skeleton skeleton-rank" />
      <div className="skeleton skeleton-wins" />
    </div>
  ))}
</div>
```

### 2. Empty State (No Players)

```tsx
<div className="empty-state">
  <Trophy size={64} className="text-base-content/30" />
  <h3>No Rankings Yet</h3>
  <p>Be the first to play AI matches and claim the top spot!</p>
  <button onClick={() => router.push('/ai')}>
    Play AI Match
  </button>
</div>
```

### 3. User Not Ranked

```tsx
<div className="current-user-card unranked">
  <div className="header">
    <h2>YOUR RANK</h2>
    <Trophy size={24} className="text-base-content/30" />
  </div>
  
  <div className="unranked-message">
    <p className="text-lg font-semibold">Unranked</p>
    <p className="text-sm text-base-content/60">
      Play AI matches to earn your rank!
    </p>
    <button onClick={() => router.push('/ai')}>
      Start Playing
    </button>
  </div>
</div>
```

### 4. Error State

```tsx
<div className="error-state">
  <AlertCircle size={64} className="text-error" />
  <h3>Failed to Load Leaderboard</h3>
  <p>Unable to fetch rankings. Please try again.</p>
  <button onClick={handleRetry}>
    Retry
  </button>
</div>
```



## Pagination

### Load More Button

```tsx
<button 
  className="load-more-btn"
  onClick={handleLoadMore}
  disabled={isLoading || !hasMore}
>
  {isLoading ? (
    <>
      <Loader2 size={20} className="animate-spin" />
      Loading...
    </>
  ) : hasMore ? (
    `Load More (${remainingCount} more)`
  ) : (
    'End of Leaderboard'
  )}
</button>
```

### Infinite Scroll (Alternative)

```tsx
<InfiniteScroll
  dataLength={entries.length}
  next={fetchMoreEntries}
  hasMore={hasMore}
  loader={<div className="loading">Loading...</div>}
  endMessage={<div className="end-message">End of Leaderboard</div>}
>
  {entries.map(entry => (
    <LeaderboardEntry key={entry.address} entry={entry} />
  ))}
</InfiniteScroll>
```

## Interactions

### Refresh Button

```tsx
const handleRefresh = async () => {
  setIsRefreshing(true);
  try {
    await refetchLeaderboard();
    toast.success('Leaderboard updated!');
  } catch (error) {
    toast.error('Failed to refresh');
  } finally {
    setIsRefreshing(false);
  }
};
```

### Click on Entry (View Profile)

```tsx
<tr 
  onClick={() => router.push(`/profile/${entry.address}`)}
  className="cursor-pointer hover:bg-base-200"
>
  {/* Entry content */}
</tr>
```



## Responsive Breakpoints

```css
/* Mobile: Stacked cards */
@media (max-width: 767px) {
  .leaderboard-table {
    display: none;
  }
  
  .leaderboard-list {
    display: block;
  }
  
  .current-user-card {
    padding: 1rem;
  }
}

/* Tablet & Desktop: Table view */
@media (min-width: 768px) {
  .leaderboard-table {
    display: table;
    width: 100%;
  }
  
  .leaderboard-list {
    display: none;
  }
  
  .current-user-card {
    padding: 2rem;
  }
}
```

## Performance Optimizations

### Virtual Scrolling (for large lists)

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={entries.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <LeaderboardEntry entry={entries[index]} />
    </div>
  )}
</FixedSizeList>
```

### Memoization

```tsx
const LeaderboardEntry = memo(({ entry, isCurrentUser }) => {
  // Component implementation
});
```

### Debounced Refresh

```tsx
const debouncedRefresh = useMemo(
  () => debounce(handleRefresh, 5000),
  []
);
```



## Example Data Structure

### API Response

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "position": 1,
        "address": "0x1234567890abcdef1234567890abcdef12345678",
        "displayName": "alice.eth",
        "wins": 720,
        "rank": "RPS-God X",
        "updatedAt": 1701964800000
      },
      {
        "position": 2,
        "address": "0xabcdef1234567890abcdef1234567890abcdef12",
        "displayName": "bob.base.eth",
        "wins": 680,
        "rank": "RPS-God IX",
        "updatedAt": 1701964700000
      },
      {
        "position": 42,
        "address": "0x9abcdef1234567890abcdef1234567890abcdef1",
        "displayName": "0x9abc...def1",
        "wins": 30,
        "rank": "Warrior II",
        "updatedAt": 1701964600000
      }
    ],
    "total": 1247,
    "hasMore": true,
    "currentUser": {
      "position": 42,
      "address": "0x9abcdef1234567890abcdef1234567890abcdef1",
      "displayName": "0x9abc...def1",
      "wins": 30,
      "rank": "Warrior II",
      "nextRank": {
        "name": "Warrior III",
        "winsNeeded": 10
      }
    }
  }
}
```

## Complete Implementation Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { RankBadge } from '~~/components/RankBadge';
import { useConnectedAddress } from '~~/hooks/useConnectedAddress';

export default function AILeaderboardPage() {
  const router = useRouter();
  const { address } = useConnectedAddress();
  const [entries, setEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchLeaderboard = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `/api/leaderboard/ai?limit=50&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success) {
        setEntries(reset ? data.data.entries : [...entries, ...data.data.entries]);
        setHasMore(data.data.hasMore);
        setOffset(currentOffset + 50);
        
        if (data.data.currentUser) {
          setCurrentUser(data.data.currentUser);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(true);
  }, [address]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard(true);
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    fetchLeaderboard(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl font-bold">Single Player Ranks</h1>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="btn btn-ghost"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Current User Card */}
      {currentUser && (
        <div className="bg-card/50 rounded-xl p-6 mb-6 border-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">YOUR RANK</h2>
            <Trophy size={24} className="text-primary" />
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">#{currentUser.position}</div>
            <RankBadge rank={currentUser.rank} size="lg" />
            <div className="text-xl mt-2">{currentUser.wins} wins</div>
            {currentUser.nextRank && (
              <div className="mt-4">
                <p className="text-sm text-base-content/60">
                  Next: {currentUser.nextRank.name} ({currentUser.nextRank.winsNeeded} wins to go)
                </p>
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${(currentUser.wins / (currentUser.wins + currentUser.nextRank.winsNeeded)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-card/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">LEADERBOARD</h2>
        </div>
        
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 size={48} className="animate-spin mx-auto mb-4" />
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Rank</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr 
                      key={entry.address}
                      className={entry.address === address ? 'bg-primary/10 border-l-4 border-primary' : ''}
                    >
                      <td className="font-bold">
                        {entry.position === 1 && '🥇'}
                        {entry.position === 2 && '🥈'}
                        {entry.position === 3 && '🥉'}
                        {entry.position > 3 && entry.position}
                      </td>
                      <td>
                        {entry.displayName}
                        {entry.address === address && ' (YOU)'}
                      </td>
                      <td>
                        <RankBadge rank={entry.rank} size="sm" />
                      </td>
                      <td>{entry.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden">
              {entries.map((entry) => (
                <div 
                  key={entry.address}
                  className={`p-4 border-b border-border ${
                    entry.address === address ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold">
                        {entry.position === 1 && '🥇'}
                        {entry.position === 2 && '🥈'}
                        {entry.position === 3 && '🥉'}
                        {entry.position > 3 && entry.position}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {entry.displayName}
                          {entry.address === address && ' (YOU)'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <RankBadge rank={entry.rank} size="sm" />
                          <span className="text-sm text-base-content/60">
                            {entry.wins} wins
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (50 more)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

## Testing Checklist

- [ ] Leaderboard loads correctly on desktop
- [ ] Leaderboard loads correctly on mobile
- [ ] Current user card displays with correct rank
- [ ] Current user entry is highlighted in list
- [ ] Top 3 positions show medal icons
- [ ] Rank badges display with correct colors
- [ ] Progress bar calculates correctly
- [ ] Refresh button works and shows loading state
- [ ] Load more button fetches next page
- [ ] Empty state displays when no entries
- [ ] Error state displays on fetch failure
- [ ] Unranked state displays for new users
- [ ] Pagination works correctly
- [ ] Virtual scrolling performs well (if implemented)
- [ ] Responsive design works on all screen sizes


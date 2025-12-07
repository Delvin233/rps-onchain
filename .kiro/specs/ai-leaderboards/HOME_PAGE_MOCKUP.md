# Home Page Rank Card Mockup

## Overview

The AI Rank card will be displayed in the "Your Stats" section on the home page, alongside existing stat cards (Total Games, AI Wins, PvP Wins).

## Visual Layout

### Desktop View (4 Cards in Grid)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Your Stats                                  │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Total Games    │   AI Wins       │   PvP Wins      │   AI Rank     │
│  🎯             │   📈            │   💰            │   🏆          │
│                 │                 │                 │               │
│  42             │   28/35         │   7/7           │  Warrior II   │
│                 │                 │                 │               │
│  AI: 35 | PvP:7 │   80% win rate  │   100% win rate │  Next: War III│
│                 │                 │                 │  (10 wins)    │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
```

### Mobile View (Stacked Cards)

```
┌─────────────────────────────────┐
│  Total Games              🎯    │
│  42                             │
│  AI: 35 | PvP: 7                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  AI Wins                  📈    │
│  28/35                          │
│  80% win rate                   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PvP Wins                 💰    │
│  7/7                            │
│  100% win rate                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  Warrior II                     │
│  Next: Warrior III (10 wins)    │
└─────────────────────────────────┘
```

## Card Structure

### Rank Card Components

```tsx
<div className="rank-card" onClick={() => router.push("/leaderboards/ai")}>
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-base-content/60">AI Rank</p>
      
      {/* Rank Display */}
      <div className="flex items-center gap-2">
        <RankBadge rank="Warrior II" size="sm" />
        <p className="text-xl font-bold">Warrior II</p>
      </div>
      
      {/* Progress Info */}
      <p className="text-xs text-base-content/60 mt-1">
        Next: Warrior III (10 wins)
      </p>
    </div>
    
    {/* Icon */}
    <div className="p-2 rounded-lg bg-primary/10">
      <Trophy size={20} className="text-primary" />
    </div>
  </div>
  
  {/* Optional: Progress Bar */}
  <div className="mt-2">
    <div className="w-full bg-base-300 rounded-full h-1.5">
      <div 
        className="bg-primary h-1.5 rounded-full" 
        style={{ width: "66%" }}
      />
    </div>
  </div>
</div>
```

## Rank Badge Styles

### Small Badge (for stat card)

```tsx
<div className="rank-badge-sm">
  <span className="text-xs font-bold" style={{ color: "#3B82F6" }}>
    Warrior II
  </span>
</div>
```

### Color Examples

```
Beginner     → #9CA3AF (Gray)
Novice       → #D1D5DB (Light Gray)
Fighter      → #60A5FA (Blue)
Warrior I-III → #3B82F6 (Blue)
Expert I-III  → #10B981 (Green)
Master I-III  → #059669 (Dark Green)
Grandmaster   → #A855F7 (Purple)
Champion      → #F59E0B (Gold)
Legend        → #EF4444 (Red)
Mythic        → Rainbow Gradient
RPS-God       → Cosmic Gradient
```

## States

### 1. Unranked (0 AI wins)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  Unranked                       │
│  Play AI to earn your rank!     │
└─────────────────────────────────┘
```

### 2. Low Rank (Beginner - Fighter)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  Novice                         │
│  Next: Fighter (5 wins)         │
└─────────────────────────────────┘
```

### 3. Mid Rank (Warrior - Master)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  Expert II                      │
│  Next: Expert III (10 wins)     │
└─────────────────────────────────┘
```

### 4. High Rank (Grandmaster - Legend)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  Champion I                     │
│  Next: Champion II (10 wins)    │
└─────────────────────────────────┘
```

### 5. Top Rank (Mythic)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  🌈 Mythic III                  │
│  Next: Mythic IV (20 wins)      │
└─────────────────────────────────┘
```

### 6. God Rank (RPS-God)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  ⭐ RPS-God V                   │
│  Next: RPS-God VI (50 wins)     │
└─────────────────────────────────┘
```

### 7. Maximum Rank (RPS-God X)

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  👑 RPS-God X                   │
│  Maximum Rank Achieved!         │
└─────────────────────────────────┘
```

### 8. Loading State

```
┌─────────────────────────────────┐
│  AI Rank                  🏆    │
│  ▓▓▓▓▓▓▓▓                       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
└─────────────────────────────────┘
```

## Interactions

### Click Behavior

```tsx
onClick={() => router.push("/leaderboards/ai")}
```

**Result:** Navigate to full AI leaderboard page

### Glowing Border Effect

The rank card should have a glowing border that matches the player's rank color:

```css
/* Base rank card with glowing border */
.rank-card {
  position: relative;
  border: 2px solid;
  transition: all 0.3s ease;
}

/* Entry ranks (Gray) */
.rank-card.beginner,
.rank-card.novice {
  border-color: #9CA3AF;
  box-shadow: 0 0 10px rgba(156, 163, 175, 0.3);
}

/* Fighter (Blue) */
.rank-card.fighter {
  border-color: #60A5FA;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.4);
}

/* Warrior (Blue) */
.rank-card.warrior {
  border-color: #3B82F6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
}

/* Expert (Green) */
.rank-card.expert {
  border-color: #10B981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
}

/* Master (Dark Green) */
.rank-card.master {
  border-color: #059669;
  box-shadow: 0 0 14px rgba(5, 150, 105, 0.6);
}

/* Grandmaster (Purple) */
.rank-card.grandmaster {
  border-color: #A855F7;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.6);
}

/* Champion (Gold) */
.rank-card.champion {
  border-color: #F59E0B;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.7);
}

/* Legend (Red) */
.rank-card.legend {
  border-color: #EF4444;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.7);
}

/* Mythic (Rainbow Gradient) */
.rank-card.mythic {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #EC4899, #8B5CF6, #3B82F6) border-box;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.6);
  animation: mythic-glow 3s ease-in-out infinite;
}

/* RPS-God (Cosmic Gradient) */
.rank-card.rps-god {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF) border-box;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
  animation: cosmic-glow 2s ease-in-out infinite;
}

/* RPS-God X (Ultimate) */
.rank-card.rps-god-x {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF, #00FFFF) border-box;
  box-shadow: 0 0 30px rgba(255, 215, 0, 1);
  animation: cosmic-glow 2s ease-in-out infinite, pulse 1.5s ease-in-out infinite;
}

@keyframes mythic-glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.6);
  }
  50% { 
    box-shadow: 0 0 30px rgba(236, 72, 153, 0.9);
  }
}

@keyframes cosmic-glow {
  0%, 100% { 
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
  }
  50% { 
    box-shadow: 0 0 40px rgba(255, 215, 0, 1);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

### Hover Effect

```css
.rank-card:hover {
  transform: translateY(-2px);
  cursor: pointer;
  /* Intensify the glow on hover */
  filter: brightness(1.1);
}
```

### Rank Up Animation

When player ranks up, show a brief celebration:

```tsx
// After AI match win that triggers rank up
if (rankChanged) {
  // Show confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  
  // Show toast
  toast.success(`🎉 Rank Up! You are now ${newRank}!`);
  
  // Pulse animation on rank card
  rankCardRef.current?.classList.add('animate-pulse-once');
}
```

## Responsive Design

### Breakpoints

```css
/* Mobile: 1 column */
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Implementation Code

### Updated statsData Array

```tsx
const statsData = [
  {
    title: "Total Games",
    value: stats.totalGames.toString(),
    icon: Target,
    subtitle: `AI: ${stats.ai?.totalGames || 0} | PvP: ${stats.multiplayer?.totalGames || 0}`,
  },
  {
    title: "AI Wins",
    value: `${stats.ai?.wins || 0}/${stats.ai?.totalGames || 0}`,
    icon: TrendingUp,
    subtitle: `${stats.ai?.winRate || 0}% win rate`,
  },
  {
    title: "PvP Wins",
    value: `${stats.multiplayer?.wins || 0}/${stats.multiplayer?.totalGames || 0}`,
    icon: Coins,
    subtitle: `${stats.multiplayer?.winRate || 0}% win rate`,
  },
  {
    title: "AI Rank",
    value: playerRank?.rank || "Unranked",
    icon: Trophy,
    subtitle: nextRank 
      ? `Next: ${nextRank.name} (${nextRank.winsNeeded} wins)`
      : playerRank?.rank === "RPS-God X" 
        ? "👑 Maximum Rank!"
        : "Play AI to earn your rank!",
    onClick: () => router.push("/leaderboards/ai"),
    rankBadge: playerRank?.rank ? (
      <RankBadge rank={playerRank.rank} size="sm" />
    ) : null,
  },
];
```

### Fetch Player Rank

```tsx
const [playerRank, setPlayerRank] = useState<{
  rank: string;
  wins: number;
  position: number;
  nextRank: { name: string; winsNeeded: number } | null;
} | null>(null);

useEffect(() => {
  if (!address) return;
  
  fetch(`/api/leaderboard/ai/player?address=${address}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setPlayerRank(data.data);
      }
    })
    .catch(console.error);
}, [address, stats.ai?.wins]); // Refetch when AI wins change
```

### Render Rank Card

```tsx
{statsData.map((stat, index) => {
  const Icon = stat.icon;
  return (
    <div
      key={stat.title}
      className={`rounded-xl p-4 mb-3 bg-card/50 border border-border hover:border-primary/50 animate-fade-in transition-all ${
        stat.onClick ? 'cursor-pointer' : ''
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={stat.onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base-content/60 text-xs mb-1">{stat.title}</p>
          
          {/* Show rank badge if available */}
          {stat.rankBadge && (
            <div className="mb-1">{stat.rankBadge}</div>
          )}
          
          <p className="text-xl font-bold">{stat.value}</p>
          
          {stat.subtitle && (
            <p className="text-base-content/60 text-xs mt-1">
              {stat.subtitle}
            </p>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.1)" }}
        >
          <Icon size={20} style={{ color: "var(--color-primary)" }} />
        </div>
      </div>
    </div>
  );
})}
```

## Benefits of Home Page Placement

### ✅ Advantages

1. **Immediate Visibility**: Rank is visible as soon as user logs in
2. **Contextual**: Displayed alongside other game stats
3. **Motivational**: Seeing rank encourages more play
4. **Accessible**: One click to full leaderboard
5. **Clean Profile**: Keeps profile page focused on customization

### 🎯 User Flow

```
1. User logs in
   ↓
2. Home page loads with stats
   ↓
3. User sees rank card: "Warrior II"
   ↓
4. User clicks rank card
   ↓
5. Navigate to full leaderboard
   ↓
6. User sees position (#42) and other players
```

## Testing Checklist

- [ ] Rank card displays correctly on desktop (4-column grid)
- [ ] Rank card displays correctly on tablet (2-column grid)
- [ ] Rank card displays correctly on mobile (1-column stack)
- [ ] Unranked state shows correct message
- [ ] All rank tiers display with correct colors
- [ ] Progress to next rank calculates correctly
- [ ] RPS-God X shows "Maximum Rank" message
- [ ] Click navigates to leaderboard page
- [ ] Hover effect works smoothly
- [ ] Loading skeleton displays during fetch
- [ ] Rank updates after AI match win
- [ ] Rank up notification shows on rank change

## Future Enhancements

### Phase 2
- Animated rank badge with glow effect
- Progress bar showing wins to next rank
- Rank history tooltip (hover to see progression)
- Rank comparison with friends

### Phase 3
- Rank achievement badges
- Rank-based profile themes
- Rank leaderboard widget (top 5 players)
- Rank challenges and milestones


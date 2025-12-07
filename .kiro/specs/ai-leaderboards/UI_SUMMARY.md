# AI Leaderboards UI Summary

## Overview

This document provides a visual summary of how the AI Leaderboards feature will appear to users, including the glowing rank card on the home page and the full leaderboard view.

## 1. Home Page - Rank Card with Glowing Border

### Visual Example (Warrior II Rank)

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Stats                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │Total Games│  │  AI Wins  │  │ PvP Wins  │  │ AI Rank  │ │
│  │    🎯     │  │    📈     │  │    💰     │  │   🏆     │ │
│  │           │  │           │  │           │  ║          ║ │
│  │    42     │  │   28/35   │  │    7/7    │  ║Warrior II║ │
│  │           │  │           │  │           │  ║          ║ │
│  │AI:35|PvP:7│  │80% win rt │  │100% win rt│  ║Next: War ║ │
│  │           │  │           │  │           │  ║III (10)  ║ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
│                                                  ↑ GLOWING   │
│                                                  BLUE BORDER │
└─────────────────────────────────────────────────────────────┘
```

### Glowing Border Colors by Rank

```
Entry Ranks:
┌──────────┐
║ Beginner ║  Gray glow (#9CA3AF)
└──────────┘

┌──────────┐
║  Novice  ║  Light gray glow (#D1D5DB)
└──────────┘

┌──────────┐
║ Fighter  ║  Blue glow (#60A5FA)
└──────────┘

Warrior Ranks:
┌───────────┐
║ Warrior I ║  Blue glow (#3B82F6) - Medium intensity
└───────────┘

┌────────────┐
║ Warrior II ║  Blue glow (#3B82F6) - Medium intensity
└────────────┘

┌─────────────┐
║ Warrior III ║  Blue glow (#3B82F6) - Medium intensity
└─────────────┘

Expert Ranks:
┌──────────┐
║ Expert I ║  Green glow (#10B981)
└──────────┘

Master Ranks:
┌──────────┐
║ Master I ║  Dark green glow (#059669)
└──────────┘

Grandmaster Ranks:
┌────────────────┐
║ Grandmaster II ║  Purple glow (#A855F7)
└────────────────┘

Champion Ranks:
┌─────────────┐
║ Champion II ║  Gold glow (#F59E0B)
└─────────────┘

Legend Ranks:
┌───────────┐
║ Legend IV ║  Red glow (#EF4444)
└───────────┘

Mythic Ranks:
┌──────────┐
║ Mythic V ║  Rainbow gradient glow (animated)
└──────────┘  Colors: Pink → Purple → Blue

RPS-God Ranks:
┌─────────────┐
║ RPS-God VII ║  Cosmic gradient glow (animated)
└─────────────┘  Colors: Gold → Orange → Red → Purple

RPS-God X:
┌────────────┐
║ RPS-God X  ║  Enhanced cosmic glow + pulse animation
└────────────┘  Colors: Gold → Orange → Red → Purple → Cyan
     👑
```



## 2. Leaderboard Page - Full Rankings

### Desktop View

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back              Single Player Ranks                  🔄 Refresh │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  YOUR RANK                                            🏆     │   │
│  │  ═══════════════════════════════════════════════════════════│   │
│  │                                                               │   │
│  │  Position: #42                                                │   │
│  │  🔵 Warrior II                                                │   │
│  │  30 wins                                                      │   │
│  │                                                               │   │
│  │  Next: Warrior III (10 wins to go)                           │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 66%                         │   │
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
│  │  6   │ eve.base.eth       │ ⭐ RPS-God V  │ 540             │   │
│  │  7   │ frank              │ ⭐ RPS-God IV │ 490             │   │
│  │  8   │ grace.eth          │ ⭐ RPS-God III│ 440             │   │
│  │  9   │ henry              │ ⭐ RPS-God II │ 390             │   │
│  │  10  │ iris.base.eth      │ ⭐ RPS-God I  │ 340             │   │
│  │  11  │ jack               │ 🌈 Mythic V   │ 310             │   │
│  │  12  │ kate.eth           │ 🌈 Mythic IV  │ 290             │   │
│  │  ... │ ...                │ ...          │ ...             │   │
│  │  38  │ zara               │ 🔵 Warrior III│ 48             │   │
│  │  39  │ adam.base.eth      │ 🔵 Warrior III│ 46             │   │
│  │  40  │ bella              │ 🔵 Warrior III│ 45             │   │
│  │  41  │ carlos.eth         │ 🔵 Warrior II │ 35             │   │
│  │ ►42◄ │ YOU (0x9abc...def) │ 🔵 Warrior II │ 30             │   │ ← HIGHLIGHTED
│  │  43  │ diana              │ 🔵 Warrior II │ 28             │   │
│  │  44  │ ethan.base.eth     │ 🔵 Warrior I  │ 25             │   │
│  │  45  │ fiona              │ 🔵 Warrior I  │ 22             │   │
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
│ │                         │ │
│ │ #42                     │ │
│ │ 🔵 Warrior II           │ │
│ │ 30 wins                 │ │
│ │                         │ │
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
│ │ 5  dave.eth             │ │
│ │ ⭐ RPS-God VI • 580     │ │
│ ├─────────────────────────┤ │
│ │ ...                     │ │
│ ├─────────────────────────┤ │
│ │►42 YOU (0x9abc...def)  ◄│ │ ← HIGHLIGHTED
│ │ 🔵 Warrior II • 30 wins │ │
│ ├─────────────────────────┤ │
│ │ 43 diana                │ │
│ │ 🔵 Warrior II • 28 wins │ │
│ ├─────────────────────────┤ │
│ │ 44 ethan.base.eth       │ │
│ │ 🔵 Warrior I • 25 wins  │ │
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



## 3. User Journey

### Step 1: User Logs In
```
Home Page loads → Stats section displays → AI Rank card shows with glowing border
```

### Step 2: User Sees Their Rank
```
┌──────────┐
║Warrior II║  ← Glowing blue border
║30 wins   ║
║Next: III ║
└──────────┘
```

### Step 3: User Clicks Rank Card
```
Navigate to /leaderboards/ai
```

### Step 4: User Views Full Leaderboard
```
- Sees their position (#42)
- Sees top players (RPS-God ranks)
- Sees nearby players (similar ranks)
- Can scroll to see more
```

### Step 5: User Plays AI Match and Wins
```
Win AI match → Rank updates → Notification shows
```

### Step 6: Rank Up Notification
```
🎉 RANK UP!
You are now Warrior III!
(10 more wins to Expert I)
```

## 4. Key Visual Features

### Glowing Border Effect

**Purpose**: Makes the rank card stand out and shows rank prestige

**Implementation**:
- Border color matches rank tier
- Glow intensity increases with rank tier
- Mythic and RPS-God ranks have animated gradients
- Subtle pulse animation for RPS-God X

**Benefits**:
- Immediate visual feedback of rank
- Creates sense of achievement
- Encourages progression to higher ranks
- Makes rank card more engaging

### Current User Highlight

**Purpose**: Easy identification in leaderboard

**Implementation**:
- Background tint in primary color
- Left border accent
- Arrow indicators (►42◄)
- "(YOU)" label next to name
- Bold font weight

**Benefits**:
- Quick location of own position
- Clear visual distinction
- Easy to track progress

### Medal Icons for Top 3

**Purpose**: Recognize top performers

**Implementation**:
- 🥇 Gold medal for #1
- 🥈 Silver medal for #2
- 🥉 Bronze medal for #3

**Benefits**:
- Instant recognition of top players
- Creates competitive motivation
- Prestigious visual reward



## 5. Animation Examples

### Glowing Border Animation (CSS)

```css
/* Warrior Rank - Blue Glow */
@keyframes warrior-glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  }
}

.rank-card.warrior {
  border: 2px solid #3B82F6;
  animation: warrior-glow 3s ease-in-out infinite;
}

/* Mythic Rank - Rainbow Gradient Glow */
@keyframes mythic-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.6);
  }
  50% {
    box-shadow: 0 0 30px rgba(236, 72, 153, 0.9);
  }
}

.rank-card.mythic {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #EC4899, #8B5CF6, #3B82F6) border-box;
  animation: mythic-glow 3s ease-in-out infinite;
}

/* RPS-God Rank - Cosmic Gradient Glow */
@keyframes cosmic-glow {
  0%, 100% {
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 1);
  }
}

.rank-card.rps-god {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF) border-box;
  animation: cosmic-glow 2s ease-in-out infinite;
}

/* RPS-God X - Ultimate Rank with Pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.rank-card.rps-god-x {
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF, #00FFFF) border-box;
  animation: 
    cosmic-glow 2s ease-in-out infinite,
    pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(255, 215, 0, 1);
}
```

### Rank Up Animation

```tsx
// When player ranks up
const celebrateRankUp = (newRank: string) => {
  // Confetti effect
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  
  // Toast notification
  toast.success(
    <div className="flex items-center gap-2">
      <Trophy size={20} />
      <div>
        <div className="font-bold">🎉 RANK UP!</div>
        <div className="text-sm">You are now {newRank}!</div>
      </div>
    </div>,
    { duration: 5000 }
  );
  
  // Pulse animation on rank card
  const rankCard = document.querySelector('.rank-card');
  rankCard?.classList.add('animate-pulse-once');
  setTimeout(() => {
    rankCard?.classList.remove('animate-pulse-once');
  }, 1000);
};
```

## 6. Responsive Behavior

### Desktop (1024px+)
- 4-column grid for stats cards
- Table view for leaderboard
- Larger rank badges
- More spacing

### Tablet (768px - 1023px)
- 2-column grid for stats cards
- Table view for leaderboard
- Medium rank badges
- Moderate spacing

### Mobile (< 768px)
- 1-column stack for stats cards
- List view for leaderboard
- Small rank badges
- Compact spacing

## 7. Accessibility

### Color Contrast
- All rank colors meet WCAG AA standards
- Text remains readable on all backgrounds
- Glowing borders don't interfere with content

### Keyboard Navigation
- Rank card is focusable and clickable
- Tab navigation works through leaderboard
- Enter key activates rank card

### Screen Readers
- Rank announced as "AI Rank: Warrior II"
- Position announced as "Your position: 42 out of 1247"
- Progress announced as "10 wins needed for Warrior III"

## 8. Performance Considerations

### Glowing Border
- Uses CSS animations (GPU accelerated)
- No JavaScript required for animation
- Minimal performance impact

### Leaderboard
- Pagination (50 entries per page)
- Virtual scrolling for large lists
- Lazy loading of rank badges
- Debounced refresh (5 second cooldown)

### Caching
- Rank data cached for 1 minute
- Leaderboard cached for 30 seconds
- Name resolution cached for 5 minutes

## Summary

The AI Leaderboards feature provides:

✅ **Glowing rank card** on home page for immediate visibility  
✅ **Color-coded borders** matching rank tier  
✅ **Animated gradients** for Mythic and RPS-God ranks  
✅ **Full leaderboard** with position and rankings  
✅ **Current user highlight** for easy identification  
✅ **Medal icons** for top 3 players  
✅ **Responsive design** for all devices  
✅ **Smooth animations** for rank ups  
✅ **Accessible** for all users  
✅ **Performant** with caching and optimization  

This creates an engaging, competitive, and rewarding experience that encourages players to improve and climb the ranks!


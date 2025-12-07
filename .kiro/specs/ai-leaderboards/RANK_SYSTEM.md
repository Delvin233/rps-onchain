# AI Leaderboards Rank System

## Overview

The AI Leaderboards feature uses a comprehensive 38-rank progression system inspired by Tekken's ranking mechanics. Players advance through ranks by winning AI matches, with each rank representing a milestone in their journey from Beginner to the ultimate RPS-God X.

## Design Philosophy

### Why Sub-Ranks?

1. **Frequent Rewards**: Players get a sense of achievement every 10-30 wins instead of waiting 50+ wins
2. **Clear Progression**: Sub-ranks (I, II, III) show incremental progress within a tier
3. **Reduced Grind**: Breaking large gaps into smaller chunks makes progression feel less daunting
4. **Tekken-Inspired**: Proven system that keeps players engaged long-term
5. **Aspirational Goals**: RPS-God tier provides ultimate challenge for dedicated players

### Progression Curve

```
Entry Phase (0-19 wins): Fast progression, 3 ranks
├─ Goal: Hook new players with quick early ranks
└─ Average: 1 rank every 5-10 wins

Growth Phase (20-169 wins): Steady progression, 15 ranks
├─ Goal: Maintain engagement through consistent advancement
└─ Average: 1 rank every 10 wins

Elite Phase (170-319 wins): Slower progression, 10 ranks
├─ Goal: Reward dedicated players with prestigious ranks
└─ Average: 1 rank every 10-20 wins

God Phase (320-690+ wins): Ultimate challenge, 10 ranks
├─ Goal: Provide aspirational goal for top players
└─ Average: 1 rank every 30-50 wins
```

## Complete Rank List

### Tier 1: Entry Ranks (Gray/White)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Beginner | 0-4 | Gray | Starting rank for all players |
| Novice | 5-9 | Light Gray | Learning the basics |
| Fighter | 10-19 | Blue | Ready for real competition |

### Tier 2: Warrior Ranks (Blue)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Warrior I | 20-29 | Blue | Entering intermediate play |
| Warrior II | 30-39 | Blue | Developing strategy |
| Warrior III | 40-49 | Blue | Mastering fundamentals |

### Tier 3: Expert Ranks (Green)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Expert I | 50-59 | Green | Advanced understanding |
| Expert II | 60-69 | Green | Consistent performance |
| Expert III | 70-79 | Green | Near mastery |

### Tier 4: Master Ranks (Dark Green)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Master I | 80-89 | Dark Green | True mastery begins |
| Master II | 90-99 | Dark Green | Elite player |
| Master III | 100-109 | Dark Green | Top tier performance |

### Tier 5: Grandmaster Ranks (Purple)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Grandmaster I | 110-119 | Purple | Exceptional skill |
| Grandmaster II | 120-129 | Purple | Among the best |
| Grandmaster III | 130-139 | Purple | Peak performance |

### Tier 6: Champion Ranks (Gold)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Champion I | 140-149 | Gold | Championship caliber |
| Champion II | 150-159 | Gold | Dominant player |
| Champion III | 160-169 | Gold | Legendary status |

### Tier 7: Legend Ranks (Red)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Legend I | 170-179 | Red | Living legend |
| Legend II | 180-189 | Red | Mythical prowess |
| Legend III | 190-199 | Red | Unstoppable force |
| Legend IV | 200-209 | Red | Beyond legendary |
| Legend V | 210-219 | Red | Approaching divinity |

### Tier 8: Mythic Ranks (Rainbow Gradient)
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| Mythic I | 220-239 | Rainbow | Transcendent skill |
| Mythic II | 240-259 | Rainbow | Otherworldly talent |
| Mythic III | 260-279 | Rainbow | Supernatural ability |
| Mythic IV | 280-299 | Rainbow | Cosmic power |
| Mythic V | 300-319 | Rainbow | Reality-bending mastery |

### Tier 9: RPS-God Ranks (Cosmic Gradient) ⭐
| Rank | Wins Required | Color | Description |
|------|---------------|-------|-------------|
| RPS-God I | 320-369 | Cosmic | Ascending to godhood |
| RPS-God II | 370-419 | Cosmic | Divine presence |
| RPS-God III | 420-469 | Cosmic | Celestial power |
| RPS-God IV | 470-519 | Cosmic | Universal dominance |
| RPS-God V | 520-569 | Cosmic | Omnipotent force |
| RPS-God VI | 570-599 | Cosmic | Multiversal mastery |
| RPS-God VII | 600-629 | Cosmic | Infinite wisdom |
| RPS-God VIII | 630-659 | Cosmic | Eternal champion |
| RPS-God IX | 660-689 | Cosmic | Supreme deity |
| RPS-God X | 690+ | Cosmic+ | 👑 **ULTIMATE RANK** |

## Visual Design

### Color Scheme

```css
/* Entry Ranks */
.beginner { color: #9CA3AF; }
.novice { color: #D1D5DB; }
.fighter { color: #60A5FA; }

/* Warrior Ranks */
.warrior { color: #3B82F6; }

/* Expert Ranks */
.expert { color: #10B981; }

/* Master Ranks */
.master { color: #059669; }

/* Grandmaster Ranks */
.grandmaster { color: #A855F7; }

/* Champion Ranks */
.champion { color: #F59E0B; }

/* Legend Ranks */
.legend { color: #EF4444; }

/* Mythic Ranks */
.mythic {
  background: linear-gradient(135deg, #EC4899, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* RPS-God Ranks */
.rps-god {
  background: linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cosmic-glow 3s ease-in-out infinite;
}

/* RPS-God X (Ultimate) */
.rps-god-x {
  background: linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF, #00FFFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cosmic-glow 2s ease-in-out infinite, pulse 1.5s ease-in-out infinite;
}

@keyframes cosmic-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Badge Design

Each rank badge should include:
1. **Rank Name**: Bold, prominent text (e.g., "Warrior II")
2. **Color/Gradient**: Tier-appropriate styling
3. **Win Count**: Optional display of total wins
4. **Progress Bar**: Optional progress to next rank
5. **Animation**: Subtle glow/pulse for higher ranks

## Rank Up Experience

### Notification Design

When a player ranks up, show a celebratory notification:

```
🎉 RANK UP!
You are now [Rank Name]!
[Progress to next rank]
```

### Special Rank Ups

- **First Rank Up** (Beginner → Novice): "Welcome to the ranks!"
- **Entering Warrior**: "You're a true warrior now!"
- **Reaching Master**: "You've achieved mastery!"
- **Entering Legend**: "You're a living legend!"
- **Reaching Mythic**: "You've transcended reality!"
- **Entering RPS-God**: "⭐ You've ascended to godhood! ⭐"
- **Reaching RPS-God X**: "👑 YOU ARE THE ULTIMATE RPS-GOD! 👑"

## Progression Examples

### Casual Player (10 wins/week)
- Week 1: Beginner → Novice → Fighter
- Week 2-3: Warrior I → Warrior II
- Week 4-5: Warrior III → Expert I
- Month 2: Expert II-III
- Month 3: Master I-II
- Month 6: Grandmaster I
- Year 1: Champion III

### Dedicated Player (50 wins/week)
- Week 1: Beginner → Expert I
- Week 2: Expert III → Master III
- Week 3: Grandmaster I-II
- Month 2: Champion III → Legend III
- Month 3: Legend V → Mythic II
- Month 4: Mythic IV-V
- Month 5: RPS-God I-II
- Month 6: RPS-God IV
- Year 1: RPS-God VIII-X

### Elite Player (100+ wins/week)
- Week 1: Beginner → Master I
- Week 2: Master III → Champion II
- Week 3: Legend I-III
- Month 2: Mythic III-V
- Month 3: RPS-God II-IV
- Month 4: RPS-God VI-VIII
- Month 5: RPS-God IX-X

## Balancing Considerations

### Why These Thresholds?

1. **0-19 wins**: Quick progression to hook new players
2. **20-109 wins**: Steady 10-win increments for consistent feel
3. **110-219 wins**: Maintain 10-win increments but with more prestige
4. **220-319 wins**: 20-win increments for Mythic tier
5. **320-690+ wins**: 30-50 win increments for ultimate challenge

### Preventing Rank Inflation

- Monitor average wins per player
- Track time to reach each rank
- Adjust thresholds if >50% of players reach Legend+
- Consider seasonal resets in future

### Encouraging Engagement

- Sub-ranks provide frequent dopamine hits
- Clear progress bars show "almost there" motivation
- Prestigious high ranks create aspirational goals
- RPS-God tier is achievable but requires dedication

## Future Enhancements

### Phase 2: Visual Upgrades
- Animated rank badges
- Particle effects on rank up
- 3D rank icons
- Rank-specific profile themes

### Phase 3: Rank Rewards
- NFT badges for each rank tier
- Token rewards for rank ups
- Exclusive features for high ranks
- Rank-based tournaments

### Phase 4: Advanced Systems
- Rank decay (lose rank if inactive)
- Seasonal rankings (reset every 3 months)
- Regional leaderboards
- Rank-based matchmaking for multiplayer

## Implementation Notes

### UI Placement

**Home Page Stats Section:**
- Primary location for rank display
- Shows rank card alongside Total Games, AI Wins, PvP Wins
- Displays current rank, total wins, and progress to next rank
- Clickable card navigates to full leaderboard
- Always visible when user is logged in

**Profile Page:**
- Reserved for user customization (display name, avatar, bio, etc.)
- Does NOT display rank (to avoid redundancy)
- Keeps profile focused on personalization

**Leaderboard Page:**
- Full rankings with all players
- Detailed rank information and position
- Comparison with other players

### Database Storage

Store rank as string (e.g., "Warrior II", "RPS-God X") for:
- Easy display
- Simple queries
- Future-proof for rank adjustments

### Rank Calculation

```typescript
function getRankForWins(wins: number): string {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (wins >= RANK_TIERS[i].minWins) {
      return RANK_TIERS[i].name;
    }
  }
  return "Beginner";
}
```

### Performance

- Index on `wins` column for fast leaderboard queries
- Cache rank calculations (rarely change)
- Pre-compute rank colors/gradients
- Lazy load rank badges

## Success Metrics

Track these metrics to validate the rank system:

1. **Engagement**: % of players who check their rank
2. **Retention**: Do ranked players play more?
3. **Progression**: Average time to reach each tier
4. **Distribution**: % of players at each rank
5. **Motivation**: Do rank ups increase play frequency?

### Target Distribution

Ideal rank distribution after 6 months:
- Entry (0-19): 30% of players
- Warrior-Expert (20-79): 35% of players
- Master-Grandmaster (80-139): 20% of players
- Champion-Legend (140-219): 10% of players
- Mythic (220-319): 4% of players
- RPS-God (320+): 1% of players

## Conclusion

The 38-rank system provides:
✅ Frequent sense of achievement
✅ Clear progression path
✅ Long-term engagement
✅ Aspirational goals
✅ Visual prestige
✅ Proven mechanics (Tekken-inspired)

This system balances accessibility for casual players with aspirational goals for dedicated players, creating a compelling long-term progression experience.


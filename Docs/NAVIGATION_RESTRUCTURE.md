# Navigation Restructure - On-Chain Matches & Leaderboards

## Changes Made

### 1. Moved "On-Chain Verified Matches" to Play Section

**Before**: Separate nav item
**After**: Card option in `/play` page

#### New Play Page Layout:
```
┌─────────────────────────────────────────────────┐
│  Choose Game Mode                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Single Player│  │ Multiplayer  │            │
│  │              │  │              │            │
│  │ Play vs AI   │  │ Play friends │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐                               │
│  │ On-Chain     │                               │
│  │ Verified     │                               │
│  │              │                               │
│  │ Blockchain-  │                               │
│  │ verified     │                               │
│  │ matches      │                               │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
```

**Card Details**:
- **Icon**: Shield (success color)
- **Title**: "On-Chain Verified"
- **Description**: "Blockchain-verified matches"
- **Action**: Navigates to `/on-chain-matches`

**Reasoning**:
- Keeps play-related options together
- Reduces nav clutter
- Makes it clear this is a play mode option

### 2. Replaced Nav Item with "Leaderboards"

**Navigation Changes**:

#### Mobile (BottomNavigation):
- **Before**: "On-Chain"
- **After**: "Ranks"
- **Icon**: Shield (kept same)

#### Desktop (DesktopLayout):
- **Before**: "On-Chain"
- **After**: "Leaderboards"
- **Icon**: Shield (kept same)

#### Header:
- **Before**: "On-Chain"
- **After**: "Leaderboards"

### 3. Created Leaderboards Page

**File**: `packages/nextjs/app/leaderboards/page.tsx`

**Current State**: Placeholder with "Coming Soon" message

**Placeholder Content**:
- Shield icon
- "Coming Soon!" heading
- Description: "Leaderboards will showcase top players, win streaks, and competitive rankings."

## Files Modified

1. `packages/nextjs/app/play/page.tsx`
   - Added On-Chain Verified card
   - Imported Shield icon

2. `packages/nextjs/components/BottomNavigation.tsx`
   - Changed path: `/on-chain-matches` → `/leaderboards`
   - Changed label: "On-Chain" → "Ranks"

3. `packages/nextjs/components/DesktopLayout.tsx`
   - Changed path: `/on-chain-matches` → `/leaderboards`
   - Changed label: "On-Chain" → "Leaderboards"

4. `packages/nextjs/components/Header.tsx`
   - Changed href: `/on-chain-matches` → `/leaderboards`
   - Changed label: "On-Chain" → "Leaderboards"

5. `packages/nextjs/app/leaderboards/page.tsx` (NEW)
   - Created placeholder page

## Current Navigation Structure

### Mobile Bottom Nav:
```
┌──────┬──────┬───────┬───────┬─────────┐
│ Home │ Play │ Intel │ Ranks │ Profile │
└──────┴──────┴───────┴───────┴─────────┘
```

### Desktop Top Nav:
```
┌──────┬──────┬────────────────┬──────────────┬─────────┐
│ Home │ Play │ Opponent Intel │ Leaderboards │ Profile │
└──────┴──────┴────────────────┴──────────────┴─────────┘
```

## User Flow

### Accessing On-Chain Verified Matches:
1. User clicks "Play" in nav
2. Sees three options: Single Player, Multiplayer, On-Chain Verified
3. Clicks "On-Chain Verified" card
4. Navigates to `/on-chain-matches` page

### Accessing Leaderboards:
1. User clicks "Ranks" (mobile) or "Leaderboards" (desktop) in nav
2. Navigates to `/leaderboards` page
3. Sees "Coming Soon" placeholder

## Next Steps

### For Leaderboards Page:
You mentioned you'll show what to place in the leaderboards section. When ready, we can implement:

1. **Top Players**
   - Ranked by wins, win rate, or total games
   - Display names, avatars, stats

2. **Win Streaks**
   - Current longest streaks
   - All-time records

3. **Categories**
   - Overall rankings
   - Weekly/Monthly rankings
   - AI vs Multiplayer separate boards

4. **User Position**
   - Highlight current user's rank
   - Show nearby players

5. **Filters**
   - Time period (all-time, weekly, monthly)
   - Game mode (AI, multiplayer, on-chain)
   - Network (if multi-chain)

## Benefits of This Structure

1. **Cleaner Navigation**: Reduced from 5 to 5 items, but more logical grouping
2. **Play-Focused**: All play modes accessible from one place
3. **Competitive Element**: Leaderboards add gamification
4. **Scalable**: Easy to add more play modes as cards
5. **Mobile-Friendly**: "Ranks" is shorter than "On-Chain"

## Testing Checklist

- [ ] Play page shows all 3 cards
- [ ] On-Chain Verified card navigates correctly
- [ ] Leaderboards nav item works on mobile
- [ ] Leaderboards nav item works on desktop
- [ ] Leaderboards page loads with placeholder
- [ ] All navigation paths updated
- [ ] No broken links

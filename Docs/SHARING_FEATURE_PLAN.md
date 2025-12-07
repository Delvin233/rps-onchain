# Sharing Feature Plan

## Overview

Enable users to share room codes and match results across multiple platforms (Farcaster, Base App, native mobile share, and clipboard).

## User Stories

1. **As a player**, I want to share my room code so friends can join my game
2. **As a winner**, I want to share my victory on social media
3. **As a player**, I want to share the full match history of an epic battle
4. **As a mobile user**, I want to use native share options (WhatsApp, Telegram, etc.)

---

## What Users Can Share

### 1. Room Code (Pre-game / During Game)
- 6-character room code
- Game mode (Free Play)
- Direct join link
- **Trigger**: Button in game lobby or during waiting phase

### 2. Current Match Result (Post-match)
- Winner/loser/tie
- Moves played (Rock/Paper/Scissors)
- Player names (ENS/Basename resolved)
- Timestamp
- **Trigger**: Button after match finishes

### 3. Full Room History (After Multiple Matches)
- All matches played in the room
- Win/loss breakdown per player
- Total games count
- Overall winner
- **Trigger**: Button in history page or after leaving room

---

## Share Destinations

### 1. Farcaster
- Use `@farcaster/miniapp-sdk`
- Native cast composer with embed
- Pre-filled text and link

### 2. Base App
- Detect if running in Base miniapp
- Use Base-specific share API if available
- Fallback to Farcaster SDK

### 3. Copy Link
- Copy shareable URL to clipboard
- Show toast confirmation
- Works on all platforms

### 4. Native Share (Mobile)
- Use Web Share API (`navigator.share`)
- Opens system share sheet
- Supports WhatsApp, Telegram, SMS, etc.
- Desktop fallback to copy link

---

## Implementation Plan

### Phase 1: Room Code Sharing (MVP - Week 1)
**Goal**: Get basic sharing working for the highest-value use case

#### 1.1 ShareButton Component
**File**: `packages/nextjs/components/ShareButton.tsx`

**Props**:
```typescript
interface ShareButtonProps {
  type: 'room-code' | 'match-result' | 'room-history';
  roomId: string;
  matchId?: string;
  data?: {
    winner?: string;
    player1Move?: string;
    player2Move?: string;
    player1Name?: string;
    player2Name?: string;
    totalMatches?: number;
    winStreak?: number; // For viral messaging
  };
  onShareComplete?: (destination: ShareDestination) => void; // Analytics hook
}

type ShareDestination = 'farcaster' | 'native' | 'clipboard' | 'base-app';
```

**Features**:
- Detect platform (Farcaster, Base, mobile, desktop)
- Show appropriate share options
- Handle share action based on platform
- Track share events
- Show success/error states

**Phase 1 Focus**: 
- Copy to clipboard (works everywhere)
- Native share on mobile (Web Share API)
- Simple button, no modal yet

#### 1.2 ShareModal Component (Phase 2)
**File**: `packages/nextjs/components/ShareModal.tsx`

**Features**:
- Modal with share options
- Icons for each platform
- Copy link button
- Close on share success
- **Deferred to Phase 2** - Start with inline button

### Phase 2: Farcaster Integration & Match Results (Week 2)

#### 2.1 Share Text Generators
**File**: `packages/nextjs/utils/shareUtils.ts`

**Functions**:

```typescript
// Generate room code invite text
generateRoomCodeShare(roomId: string, mode: string): string

// Generate match result text
generateMatchResultShare(data: MatchData): string

// Generate room history text
generateRoomHistoryShare(roomId: string, matches: Match[]): string

// Generate shareable URL
generateShareUrl(type: string, roomId: string, matchId?: string): string
```

**Example Outputs** (More Viral & Engaging):

**Room Code**:
```
💪 Think you can beat me at RPS?
Join room ABC123 and prove it!
👉 https://rps-onchain.vercel.app/play/multiplayer?join=ABC123
```

**Room Code (with streak)**:
```
🔥 I'm on a 5-game win streak!
Think you can end it? Join ABC123
👉 https://rps-onchain.vercel.app/play/multiplayer?join=ABC123
```

**Match Result (Win)**:
```
🏆 Just crushed @opponent with Rock!
Your turn to challenge me 👊
👉 https://rps-onchain.vercel.app/share/match/ABC123/match-1
```

**Match Result (Close game)**:
```
😅 Barely survived! Beat @opponent 3-2
Can you do better?
👉 https://rps-onchain.vercel.app/share/match/ABC123/match-1
```

**Room History** (Phase 3):
```
🔥 Epic 10-match battle!
@player1 vs @player2
Final: 6-4
👉 https://rps-onchain.vercel.app/share/room/ABC123
```

#### 2.2 Platform Detection
**File**: `packages/nextjs/utils/platformUtils.ts`

**Functions**:
```typescript
// Detect if running in Farcaster
isFarcaster(): boolean

// Detect if running in Base App
isBaseApp(): boolean

// Check if native share is available
hasNativeShare(): boolean

// Get available share methods
getAvailableShareMethods(): ShareMethod[]
```

#### 2.3 Analytics Tracking
**File**: `packages/nextjs/utils/analytics.ts`

**Functions**:
```typescript
// Track share initiated
trackShare(type: ShareType, destination: ShareDestination, roomId: string): void

// Track share completed
trackShareComplete(type: ShareType, destination: ShareDestination): void

// Track share link clicked (from recipient side)
trackShareLinkClick(roomId: string, source: string): void

// Track time to first share
trackTimeToShare(roomId: string, timeMs: number): void
```

### Phase 3: Shareable Pages & OG Images (Week 3)

#### 3.1 Share Metadata API
**File**: `packages/nextjs/app/api/share/[roomId]/route.ts`

**Endpoints**:
- `GET /api/share/[roomId]` - Get room metadata for OG tags
- `GET /api/share/[roomId]/[matchId]` - Get specific match metadata

**Response**:
```typescript
{
  roomId: string;
  player1: string;
  player2: string;
  totalMatches: number;
  matches: Match[];
  ogImage: string; // URL to generated OG image
  status: 'active' | 'finished' | 'expired'; // Handle expired rooms
  canJoin: boolean; // Check if room is full
}
```

**Error Handling**:
- Return 404 for expired/invalid rooms
- Return metadata even for full rooms (for spectating)

#### 3.2 OG Image Generation
**File**: `packages/nextjs/app/api/og/room/[roomId]/route.tsx`

**Features**:
- Generate dynamic OG images using `@vercel/og`
- Show match results visually
- Include player names and scores
- Branded with RPS-onChain logo
- **Keep images simple** - readable at small sizes in feeds
- **Aggressive caching** - Cache-Control headers + Redis/Edge Config
- **Test specifically in Farcaster/Base feeds** - not just Twitter

**Design Considerations**:
- Large, bold text (readable on mobile)
- High contrast colors
- Minimal information (room code + player count OR winner + score)
- Consistent branding

### Phase 4: Recipient Experience & Deep Linking

#### 4.1 Room Share Page
**File**: `packages/nextjs/app/share/room/[roomId]/page.tsx`

**Features**:
- Public page (no auth required)
- Display room stats and match history
- OG meta tags for rich previews
- "Play Now" CTA button
- Responsive design

**Recipient Experience**:
- Show room status (active/finished/expired)
- If active: "Join Game" button
- If full: "Spectate" option (future enhancement)
- If expired: "Create New Game" button
- Show preview of match history before joining
- Track share link clicks with `?ref=` parameter

**Meta Tags**:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const roomData = await fetchRoomData(params.roomId);
  
  return {
    title: `RPS Match: ${roomData.player1} vs ${roomData.player2}`,
    description: `${roomData.totalMatches} matches played`,
    openGraph: {
      images: [`/api/og/room/${params.roomId}`],
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl: `/api/og/room/${params.roomId}`,
        button: {
          title: 'Play Now',
          action: {
            type: 'launch_miniapp',
            name: 'RPS-onChain',
            url: `https://rps-onchain.vercel.app/play/multiplayer?join=${params.roomId}`,
          },
        },
      }),
    },
  };
}
```

#### 4.2 Match Share Page
**File**: `packages/nextjs/app/share/match/[roomId]/[matchId]/page.tsx`

**Features**:
- Display single match result
- Show moves with animations
- Player stats
- "Challenge Winner" button (creates new room)
- "Play Again" button (if room still active)

**Recipient Flow**:
1. See match result with animation
2. Clear CTA: "Challenge [Winner]" or "Play Now"
3. One-click to create new game or join existing room
4. Track conversion from share → new game

### Phase 5: Integration Points

#### 5.1 Game Page Integration
**File**: `packages/nextjs/app/game/multiplayer/[roomId]/page.tsx`

**Add Share Buttons**:
1. **Top Right**: Share room code button (during waiting/playing)
2. **Post-Match**: Share result button (after match finishes)
3. **Exit Modal**: Share history button (when leaving room)

**Code Changes**:
```typescript
// Add to game page
import { ShareButton } from '~/components/ShareButton';

// In waiting phase
<ShareButton 
  type="room-code" 
  roomId={roomId} 
/>

// After match finishes
{gameStatus === 'finished' && (
  <ShareButton 
    type="match-result" 
    roomId={roomId}
    data={{
      winner: result === 'win' ? address : opponentAddress,
      player1Move: selectedMove,
      player2Move: opponentMove,
      player1Name: creatorName,
      player2Name: joinerName,
    }}
  />
)}
```

#### 5.2 History Page Integration
**File**: `packages/nextjs/app/history/page.tsx`

**Add Share Buttons**:
1. Per-match share button
2. Share full room history button

#### 5.3 Play Page Integration
**File**: `packages/nextjs/app/play/multiplayer/page.tsx`

**Add Share Button**:
- After creating room, show share button to invite friends

---

## Technical Implementation Details

### Farcaster Share

```typescript
import { sdk } from '@farcaster/miniapp-sdk';

async function shareToFarcaster(text: string, url: string) {
  try {
    await sdk.actions.composeCast({
      text,
      embeds: [url],
    });
  } catch (error) {
    console.error('Farcaster share failed:', error);
    // Fallback to copy link
    await copyToClipboard(url);
  }
}
```

### Native Share (Mobile)

```typescript
async function shareNative(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Native share failed:', error);
        await copyToClipboard(url);
      }
    }
  } else {
    // Fallback for desktop
    await copyToClipboard(url);
  }
}
```

### Copy to Clipboard

```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success('Link copied!');
  }
}
```

---

## File Structure

```
packages/nextjs/
├── components/
│   ├── ShareButton.tsx          # Main share button component
│   ├── ShareModal.tsx           # Share options modal
│   └── ShareIcon.tsx            # Platform-specific icons
├── utils/
│   ├── shareUtils.ts            # Text generators
│   └── platformUtils.ts         # Platform detection
├── app/
│   ├── api/
│   │   ├── share/
│   │   │   └── [roomId]/
│   │   │       └── route.ts     # Share metadata API
│   │   └── og/
│   │       └── room/
│   │           └── [roomId]/
│   │               └── route.tsx # OG image generation
│   └── share/
│       ├── room/
│       │   └── [roomId]/
│       │       └── page.tsx     # Room share page
│       └── match/
│           └── [roomId]/
│               └── [matchId]/
│                   └── page.tsx # Match share page
└── docs/
    └── SHARING_FEATURE_PLAN.md  # This document
```

---

## Testing Checklist

### Unit Tests
- [ ] Share text generators produce correct output
- [ ] Platform detection works correctly
- [ ] URL generation is correct

### Integration Tests
- [ ] Share button appears in correct locations
- [ ] Farcaster share opens cast composer
- [ ] Native share opens system sheet on mobile
- [ ] Copy to clipboard works
- [ ] Share pages load correctly
- [ ] OG images generate properly

### Manual Testing
- [ ] Test on Farcaster client
- [ ] Test on Base App
- [ ] Test on mobile (iOS/Android)
- [ ] Test on desktop
- [ ] Test with different match scenarios (win/lose/tie)
- [ ] Test with multiple matches
- [ ] Verify OG previews on social platforms

---

## Dependencies

### New Packages (if needed)
```json
{
  "@vercel/og": "^0.6.2",  // For OG image generation
  "qrcode": "^1.5.3"        // Optional: QR codes for room codes
}
```

### Existing Dependencies
- `@farcaster/miniapp-sdk` - Already installed
- `react-hot-toast` - Already installed
- `next` - Already installed

---

## Performance Considerations

1. **OG Image Caching**: 
   - Cache generated OG images with long TTL (24h+)
   - Use Vercel Edge Config or Redis
   - Set proper Cache-Control headers
   
2. **Share URL Shortening**: 
   - Consider URL shortener for cleaner links (Phase 4)
   - Or use short room codes (already have 6-char codes)
   
3. **Lazy Loading**: 
   - Load ShareModal only when needed (Phase 2)
   - Start with inline button (lighter weight)
   
4. **Optimistic UI**: 
   - Show success toast immediately
   - Handle errors in background
   - Don't block user flow
   
5. **API Rate Limiting**:
   - Rate limit share metadata API
   - Prevent abuse of OG image generation
   - Monitor for spam

---

## Future Enhancements (Phase 4+)

### High Priority (Based on User Demand)
1. **Room History Sharing**: Share full battle history after multiple matches
2. **Custom Share Messages**: Let users edit share text before posting
3. **Spectator Mode**: Let recipients watch ongoing games
4. **Rematch Flow**: One-click rematch from share page

### Medium Priority
5. **QR Code Generation**: Generate QR codes for room codes (useful for IRL events)
6. **Leaderboard Sharing**: Share global/weekly rankings
7. **Achievement Sharing**: Share unlocked achievements
8. **ShareModal**: Full modal with all share options (if users want more control)

### Low Priority (Nice to Have)
9. **Twitter/X Integration**: Direct share to Twitter (if demand exists)
10. **Discord Webhooks**: Share to Discord servers
11. **GIF Generation**: Animated GIFs of match results (expensive, test demand first)
12. **Share Templates**: Multiple share text variations users can choose from

---

## Implementation Timeline (Revised)

### Week 1: Room Code Sharing MVP
**Goal**: Ship basic sharing that works everywhere

- **Day 1**: ShareButton component (inline, no modal)
  - Copy to clipboard
  - Native share on mobile
  - Success/error states
  
- **Day 2**: Share utilities
  - Text generators (room code only)
  - Platform detection
  - Analytics tracking hooks
  
- **Day 3**: Integration with game page
  - Add share button to multiplayer lobby
  - Test on mobile + desktop
  - Verify clipboard + native share work
  
- **Day 4**: Polish & testing
  - Improve share text (make it viral)
  - Add loading states
  - Test across devices
  
- **Day 5**: Deploy & monitor
  - Ship to production
  - Monitor analytics (share rate, destinations)
  - Gather user feedback

### Week 2: Farcaster Integration & Match Results
**Goal**: Add Farcaster sharing + match result sharing

- **Day 1-2**: Farcaster integration
  - Implement `composeCast` flow
  - Test in Farcaster client
  - Handle errors gracefully
  
- **Day 3-4**: Match result sharing
  - Add share button to post-match screen
  - Generate match result text (with personality)
  - Test different scenarios (win/lose/close game)
  
- **Day 5**: Testing & refinement
  - Test in Farcaster + Base App
  - Verify embeds look good
  - Fix any issues

### Week 3: Shareable Pages & OG Images
**Goal**: Rich previews and recipient experience

- **Day 1-2**: API endpoints
  - Share metadata API
  - Handle expired/full rooms
  - Add caching
  
- **Day 3-4**: Shareable pages + OG images
  - `/share/room/[roomId]` page
  - OG image generation (simple, readable)
  - Test previews in Farcaster/Base feeds
  
- **Day 5**: Recipient experience
  - Add "Join Game" / "Create New Game" CTAs
  - Track share → conversion
  - Polish and deploy

### Week 4: Polish & Iteration (Optional)
**Based on data from Week 1-3**

- Improve share text based on engagement
- Add ShareModal if users want more options
- Optimize OG images based on click-through rates
- Add room history sharing if requested

---

## Success Metrics

### Primary Metrics
1. **Share Rate**: % of rooms where share button is clicked
2. **Time to First Share**: How quickly after creating room do users share?
3. **Conversion Rate**: % of shared links that result in new games
4. **Viral Coefficient**: Average new users per share

### Secondary Metrics
5. **Share Destination**: Which platforms are most popular (Farcaster vs native vs clipboard)
6. **Share Type Performance**: Which share types drive most engagement (room code vs match result)
7. **Recipient Actions**: What do recipients do? (join immediately, view history, create new game)
8. **Share Text Effectiveness**: A/B test different share messages

### Analytics Events to Track
```typescript
// Sharer side
'share_button_clicked' { type, roomId, destination }
'share_completed' { type, roomId, destination, timeToShare }
'share_failed' { type, roomId, destination, error }

// Recipient side
'share_link_clicked' { roomId, source, referrer }
'share_link_converted' { roomId, action } // joined, created new, spectated
'share_link_bounced' { roomId, reason } // expired, full, error
```

---

## Notes & Considerations

### Development
- **Start simple**: Ship room code sharing first, iterate based on data
- **Mobile-first**: Most users will share from mobile
- **Test in production**: Farcaster/Base App behavior can differ from local dev
- **Monitor analytics from day 1**: Data will guide next features

### Content
- **Keep share text concise**: Character limits on various platforms
- **Add personality**: Boring share text = low engagement
- **Test variations**: A/B test different messages
- **Include challenge/competition**: "Think you can beat me?" > "Join my game"

### Technical
- **Ensure share pages work without auth**: Don't block recipients
- **Test OG previews everywhere**: Farcaster, Base App, Twitter, Discord
- **Rate limit share APIs**: Prevent abuse
- **Handle edge cases**: Expired rooms, full rooms, invalid codes
- **Cache aggressively**: OG images don't change often

### Base App Specific
- **Check for Base-specific share APIs**: May have features beyond Farcaster SDK
- **Review Base App share guidelines**: Ensure compliance
- **Test in Base App beta**: Behavior may differ from Farcaster
- **Monitor Base App rate limits**: May differ from Farcaster

### User Experience
- **Don't interrupt gameplay**: Share should be quick and non-blocking
- **Make share button discoverable**: But not annoying
- **Provide feedback**: Success/error states are critical
- **Respect user intent**: If they cancel, don't nag

### Growth
- **Track viral coefficient**: Key metric for growth
- **Optimize for conversion**: Share → new game is the goal
- **Test incentives**: Consider rewards for sharing (future)
- **Learn from data**: Let metrics guide feature priority

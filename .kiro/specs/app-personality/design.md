# Design Document: App Personality Enhancement

## Overview

This feature adds personality, character, and soul to RPS-onChain through playful copy, subtle animations, easter eggs, and character-driven UX. The implementation focuses on enhancing the existing UI without breaking functionality, maintaining performance, and respecting user preferences.

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Personality Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Message    │  │  Animation   │  │  Easter Egg  │  │
│  │   Provider   │  │   System     │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Existing UI Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Game Pages  │  │  Components  │  │    Hooks     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
PersonalityProvider (Context)
├── MessageProvider (Win/Loss/Loading messages)
├── AnimationController (Rank badges, move icons)
├── EasterEggManager (Hidden features)
└── PersonalitySettings (User preferences)
```

## Components and Interfaces

### 1. Message Provider

**Purpose**: Centralized system for personality-driven messages

**Interface**:
```typescript
interface MessageProvider {
  getWinMessage(streak?: number): string;
  getLossMessage(lossStreak?: number): string;
  getTieMessage(): string;
  getLoadingMessage(context: LoadingContext): string;
  getEmptyStateMessage(context: EmptyStateContext): string;
  getRankFlavorText(rank: string): string;
}

type LoadingContext = 'match' | 'leaderboard' | 'ai-thinking' | 'stats';
type EmptyStateContext = 'history' | 'stats' | 'leaderboard';
```

**Implementation**:
```typescript
// lib/personality/messages.ts
export const winMessages = [
  "Crushed it! 🎯",
  "Read them like a book! 📖",
  "Absolutely legendary! ⚡",
  "They never saw it coming! 👀",
  "Flawless victory! 💎",
];

export const lossMessages = [
  "They got lucky 🎲",
  "Almost had it! 💪",
  "Redemption arc incoming 📈",
  "That's just warm-up 🔥",
  "Next one's yours ⚡",
];

export const tieMessages = [
  "Great minds think alike 🤝",
  "Psychic connection! 🔮",
  "Perfectly balanced ⚖️",
  "Mirror match! 🪞",
  "Twins! 👯",
];

export function getWinMessage(streak?: number): string {
  if (streak && streak >= 5) {
    return `Unstoppable! 🔥 ${streak} in a row!`;
  }
  if (streak && streak >= 3) {
    return `On fire! 🔥 ${streak} wins!`;
  }
  return winMessages[Math.floor(Math.random() * winMessages.length)];
}
```

### 2. Rank Flavor Text System

**Purpose**: Add personality to rank progression

**Data Structure**:
```typescript
interface RankFlavor {
  rank: string;
  tagline: string;
  description: string;
  emoji: string;
}

const rankFlavors: Record<string, RankFlavor> = {
  "Beginner I": {
    tagline: "Everyone starts somewhere",
    description: "Taking your first steps",
    emoji: "🌱"
  },
  "Warrior III": {
    tagline: "Battle-tested",
    description: "You've seen some action",
    emoji: "⚔️"
  },
  "Expert V": {
    tagline: "They're starting to fear you",
    description: "Your reputation precedes you",
    emoji: "🎯"
  },
  "Master VII": {
    tagline: "The legend grows",
    description: "Few reach this level",
    emoji: "👑"
  },
  "RPS-God X": {
    tagline: "Mortals tremble",
    description: "You've transcended the game",
    emoji: "⚡"
  }
};
```

### 3. Animation System

**Purpose**: Subtle, performant animations for personality

**CSS Animations**:
```css
/* Rank badge pulse (close to rank up) */
@keyframes rank-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Rank badge hover */
@keyframes rank-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* Move icon bounce */
@keyframes move-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Rank up celebration */
@keyframes rank-up-glow {
  0% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.7); }
  100% { box-shadow: 0 0 0 20px rgba(var(--color-primary-rgb), 0); }
}
```

**React Hook**:
```typescript
// hooks/usePersonalityAnimation.ts
export function usePersonalityAnimation(enabled: boolean = true) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return {
    shouldAnimate: enabled && !prefersReducedMotion,
    rankPulse: 'animate-rank-pulse',
    rankWiggle: 'animate-rank-wiggle',
    moveBounce: 'animate-move-bounce',
    rankUpGlow: 'animate-rank-up-glow',
  };
}
```

### 4. Easter Egg Manager

**Purpose**: Track and trigger hidden features

**Interface**:
```typescript
interface EasterEggManager {
  trackClick(target: string): void;
  checkKonamiCode(key: string): boolean;
  trackStreak(type: 'win' | 'loss', count: number): void;
  getDiscoveredEggs(): string[];
  unlockEgg(eggId: string): void;
}

interface EasterEgg {
  id: string;
  name: string;
  trigger: EasterEggTrigger;
  effect: EasterEggEffect;
  discovered: boolean;
}

type EasterEggTrigger = 
  | { type: 'clicks', target: string, count: number }
  | { type: 'konami' }
  | { type: 'streak', streakType: 'win' | 'loss', count: number };

type EasterEggEffect =
  | { type: 'theme', themeId: string }
  | { type: 'animation', animationId: string }
  | { type: 'message', message: string };
```

**Implementation**:
```typescript
// lib/personality/easterEggs.ts
const easterEggs: EasterEgg[] = [
  {
    id: 'rank-badge-spam',
    name: 'Badge Enthusiast',
    trigger: { type: 'clicks', target: 'rank-badge', count: 10 },
    effect: { type: 'animation', animationId: 'badge-spin' },
    discovered: false,
  },
  {
    id: 'konami-code',
    name: 'Old School',
    trigger: { type: 'konami' },
    effect: { type: 'theme', themeId: 'retro-secret' },
    discovered: false,
  },
  {
    id: 'losing-streak',
    name: 'Persistence',
    trigger: { type: 'streak', streakType: 'loss', count: 3 },
    effect: { type: 'message', message: 'Tough day? ☕ Take a break, champ!' },
    discovered: false,
  },
];
```

### 5. Personality Settings

**Purpose**: User control over personality level

**Interface**:
```typescript
interface PersonalitySettings {
  level: 'minimal' | 'balanced' | 'maximum';
  enableAnimations: boolean;
  enableEasterEggs: boolean;
  enableEmojis: boolean;
}

const defaultSettings: PersonalitySettings = {
  level: 'balanced',
  enableAnimations: true,
  enableEasterEggs: true,
  enableEmojis: true,
};
```

**Storage**:
```typescript
// Stored in localStorage alongside theme preferences
const PERSONALITY_SETTINGS_KEY = 'rps_personality_settings';

export function getPersonalitySettings(): PersonalitySettings {
  const stored = localStorage.getItem(PERSONALITY_SETTINGS_KEY);
  return stored ? JSON.parse(stored) : defaultSettings;
}

export function setPersonalitySettings(settings: PersonalitySettings): void {
  localStorage.setItem(PERSONALITY_SETTINGS_KEY, JSON.stringify(settings));
}
```

## Data Models

### Message Pool Structure

```typescript
interface MessagePool {
  win: {
    default: string[];
    streak3: string[];
    streak5: string[];
    streak10: string[];
  };
  loss: {
    default: string[];
    streak3: string[];
  };
  tie: string[];
  loading: {
    match: string[];
    leaderboard: string[];
    aiThinking: string[];
    stats: string[];
  };
  emptyState: {
    history: { title: string; subtitle: string; cta: string };
    stats: { title: string; subtitle: string; cta: string };
    leaderboard: { title: string; subtitle: string; cta: string };
  };
}
```

### Rank Flavor Data

```typescript
interface RankFlavorData {
  tiers: {
    beginner: RankFlavor[];
    warrior: RankFlavor[];
    expert: RankFlavor[];
    master: RankFlavor[];
    rpsGod: RankFlavor[];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Consistency
*For any* personality level setting, all displayed messages should match the configured level (minimal shows functional text, balanced shows moderate personality, maximum shows full personality)
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 2: Animation Respect
*For any* user with `prefers-reduced-motion` enabled, no animations should play regardless of personality settings
**Validates: Requirements 4.5, 10.5**

### Property 3: Emoji Limit
*For any* message with personality, the number of emojis should not exceed 2 per message
**Validates: Requirements 9.1**

### Property 4: Easter Egg Persistence
*For any* discovered easter egg, the discovery state should persist across sessions via localStorage
**Validates: Requirements 6.5**

### Property 5: Message Randomization
*For any* message pool with multiple options, consecutive calls should not return the same message more than twice in a row
**Validates: Requirements 1.4, 5.4**

### Property 6: Rank Flavor Completeness
*For any* valid rank in the system, there should exist corresponding flavor text (tagline, description, emoji)
**Validates: Requirements 2.1, 2.2**

### Property 7: Accessibility Preservation
*For any* personality enhancement, the functional equivalent should remain accessible via ARIA labels or alt text
**Validates: Requirements 7.5, 9.5**

### Property 8: Performance Constraint
*For any* animation, the frame rate should remain above 30fps on devices with 2GB RAM or more
**Validates: Requirements 10.5**

### Property 9: Settings Persistence
*For any* personality setting change, the new value should be immediately persisted to localStorage and applied to the UI
**Validates: Requirements 8.5**

### Property 10: Context Appropriateness
*For any* loading context, the displayed message should be relevant to the operation being performed
**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### Graceful Degradation
- If message pool fails to load → fall back to functional text
- If animation CSS fails → display static elements
- If localStorage is unavailable → use in-memory settings
- If emoji rendering fails → display text-only version

### Error Boundaries
```typescript
// components/PersonalityErrorBoundary.tsx
class PersonalityErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error('[Personality] Error:', error);
    // Fall back to minimal personality
    this.setState({ hasError: true });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.children; // Render without personality
    }
    return <PersonalityProvider>{this.props.children}</PersonalityProvider>;
  }
}
```

## Testing Strategy

### Unit Tests
- Message provider returns correct messages for each context
- Rank flavor text exists for all ranks
- Easter egg triggers fire correctly
- Settings persist and load correctly
- Animation classes apply based on preferences

### Property-Based Tests
- **Property 1**: Test message consistency across all personality levels
- **Property 2**: Test animation respect with various motion preferences
- **Property 3**: Test emoji limits across all message types
- **Property 5**: Test message randomization doesn't repeat excessively
- **Property 6**: Test rank flavor completeness for all 38 ranks

### Integration Tests
- Win/loss messages display correctly in game flow
- Rank up shows flavor text and animation
- Easter eggs unlock and persist
- Settings changes apply immediately
- Empty states render with personality

### Manual Testing
- Verify animations feel smooth (not janky)
- Confirm messages feel appropriate (not cringe)
- Test easter eggs are discoverable but not obvious
- Validate personality enhances rather than distracts
- Check accessibility with screen readers

## Performance Considerations

### Bundle Size
- Message pools: ~5KB (lazy-loaded)
- Animation CSS: ~2KB (inline)
- Easter egg manager: ~3KB (lazy-loaded)
- Total impact: ~10KB (0.5% of bundle)

### Runtime Performance
- Message selection: O(1) random access
- Animation triggers: CSS-based (GPU-accelerated)
- Easter egg tracking: O(1) localStorage access
- Settings changes: O(1) context update

### Optimization Strategies
- Lazy-load easter egg system (only when needed)
- Use CSS animations (not JavaScript)
- Memoize message selection
- Debounce rapid click tracking
- Use `will-change` for animated elements

## Implementation Phases

### Phase 1: Foundation (Core Systems)
1. Create message provider with basic pools
2. Implement personality settings
3. Add rank flavor text data
4. Set up animation CSS

### Phase 2: Integration (UI Updates)
1. Update win/loss displays with messages
2. Add rank flavor text to badges
3. Implement animated rank badges
4. Update empty states

### Phase 3: Enhancement (Polish)
1. Add loading state messages
2. Implement dynamic button copy
3. Add move icon animations
4. Polish transitions

### Phase 4: Easter Eggs (Hidden Features)
1. Implement easter egg manager
2. Add click tracking
3. Implement Konami code
4. Add streak-based eggs

## File Structure

```
lib/
  personality/
    messages.ts          # Message pools and selection
    rankFlavors.ts       # Rank flavor text data
    easterEggs.ts        # Easter egg definitions
    animations.ts        # Animation utilities
    settings.ts          # Settings management
    
hooks/
  usePersonality.ts      # Main personality hook
  usePersonalityAnimation.ts  # Animation control
  useEasterEggs.ts       # Easter egg tracking
  
components/
  PersonalityProvider.tsx     # Context provider
  PersonalitySettings.tsx     # Settings UI
  AnimatedRankBadge.tsx      # Enhanced rank badge
  PersonalityErrorBoundary.tsx  # Error handling
  
styles/
  personality-animations.css  # Animation definitions
```

## Migration Strategy

### Backward Compatibility
- All personality features are additive
- Existing functionality remains unchanged
- Settings default to "balanced" (moderate personality)
- Users can disable via settings

### Rollout Plan
1. Deploy with personality disabled by default
2. Enable for 10% of users (A/B test)
3. Gather feedback and metrics
4. Adjust based on data
5. Enable for all users

### Metrics to Track
- User engagement (session length, return rate)
- Feature discovery (easter eggs found)
- Settings changes (personality level adjustments)
- Performance impact (FPS, load times)
- User feedback (support tickets, reviews)

## Accessibility Considerations

### Screen Readers
- All emojis have ARIA labels
- Personality messages have functional equivalents
- Animations don't interfere with navigation
- Easter eggs are keyboard-accessible

### Motion Sensitivity
- Respect `prefers-reduced-motion`
- Provide toggle in settings
- Use subtle animations by default
- No flashing or rapid movement

### Color Blindness
- Emoji choices work in grayscale
- Animations don't rely on color alone
- Rank colors have sufficient contrast
- Personality doesn't depend on color perception

## Security Considerations

### XSS Prevention
- All messages are static strings (no user input)
- Emoji rendering is sanitized
- No dynamic HTML injection
- Settings are validated before storage

### Privacy
- No personality data sent to server
- Settings stored locally only
- Easter egg discoveries are private
- No tracking of personality preferences

## Future Enhancements

### Phase 2 Features (Out of Scope)
- Sound effects (toggle-able)
- Seasonal themes and messages
- User-customizable message pools
- AI-generated dynamic messages
- Multiplayer taunts/emotes
- Achievement system with personality
- Daily personality challenges

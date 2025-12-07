# Opponent Intel Feature

## Overview

The Opponent Intel page (formerly "Match History") is a strategic tool that helps players analyze their opponents' gameplay patterns to gain a competitive advantage in future matches. It transforms raw match data into actionable insights.

## Strategic Purpose

### Why This Matters

Rock Paper Scissors is often dismissed as a "random" game, but human psychology makes it predictable:

1. **Pattern Recognition**: Humans unconsciously fall into patterns
2. **Emotional Responses**: Players react predictably after wins/losses
3. **Favorite Moves**: Most players have a preferred move they play more often
4. **Streaks & Habits**: Players rarely play the same move 3+ times in a row
5. **Time-Based Patterns**: Behavior can change based on time of day, fatigue, etc.

By studying an opponent's history, skilled players can:
- Predict their next move with higher accuracy
- Exploit their tendencies
- Adjust strategy based on opponent's win/loss state
- Build psychological profiles of regular opponents

## User Stories

### 1. The Competitive Player
**As a competitive player**, I want to study my opponent's move patterns so I can predict their next move and win more consistently.

**Example**: 
- Alice notices Bob plays Rock 60% of the time
- She starts playing Paper more often against Bob
- Her win rate against Bob increases from 33% to 55%

### 2. The Strategic Learner
**As a strategic learner**, I want to see my win/loss record against specific opponents so I can identify who I struggle against and why.

**Example**:
- Charlie sees he has a 30% win rate against Dana
- He reviews their match history and notices Dana never plays the same move twice
- He adjusts his strategy to be more unpredictable
- His win rate improves

### 3. The Social Player
**As a social player**, I want to see my battle history with friends so I can brag about win streaks or challenge them to rematches.

**Example**:
- Eve has a 10-game win streak against Frank
- She shares this on Farcaster to challenge Frank to a rematch
- Creates social engagement and repeat gameplay

## Key Features

### 1. Opponent Statistics (Phase 1 - Current Implementation)

**Per Opponent, Show**:
- Total games played
- Win/Loss/Tie record
- Win rate percentage
- Most recent match date
- Room ID for context

**Example Display**:
```
vs alice.eth (Room: ABC123)
10 games played
Win: 7 | Loss: 2 | Tie: 1
Win Rate: 70%
Last played: 2 hours ago
```

### 2. Move Pattern Analysis (Phase 2 - Planned)

**Per Opponent, Show**:
- Move frequency (Rock: 45%, Paper: 30%, Scissors: 25%)
- Most played move
- Least played move
- Consecutive move patterns

**Example Display**:
```
Move Patterns:
Rock: 45% (9 times)
Paper: 30% (6 times)
Scissors: 25% (5 times)

Insight: alice.eth favors Rock - consider playing Paper more often
```

### 3. Strategic Hints (Phase 1 - Current Implementation)

**First-Time User Education**:
- Show tooltip explaining the strategic value
- Highlight that this isn't just a log, it's a strategic tool
- Encourage pattern recognition

**Example**:
```
Study your opponent's patterns to predict their next move!
```

### 4. Actionable Insights (Phase 2 - Planned)

**Highlight Notable Patterns**:
- "alice.eth never plays the same move twice in a row"
- "You're on a 5-game win streak against bob.eth"
- "bob.eth plays Rock 70% of the time after losing"

**Recommendations**:
- "Consider playing Paper more often against alice.eth"
- "bob.eth is predictable - exploit their Rock tendency"

### 5. Rematch Flow (Phase 3 - Planned)

**Quick Rematch**:
- "Challenge alice.eth again" button
- Creates new room with same opponent
- Tracks rivalry over time

**Share Victory**:
- Share win streaks on Farcaster
- Challenge opponents publicly
- Build social engagement

## Implementation Plan

### Phase 1: Foundation (Current + Quick Wins)
**Goal**: Make strategic value immediately clear

**Changes**:
1. Rename "Match History" → "Opponent Intel"
2. Add first-time tooltip with strategic hint
3. Show basic opponent stats per room:
   - Total games
   - Win/Loss/Tie record
   - Win rate percentage
4. Improve visual hierarchy to emphasize insights over raw data

**Timeline**: 1-2 days

### Phase 2: Pattern Analysis (Future)
**Goal**: Surface actionable insights

**Features**:
1. Move frequency analysis per opponent
2. Pattern detection (streaks, favorites, tendencies)
3. Strategic recommendations
4. Notable pattern highlights

**Timeline**: 1 week

### Phase 3: Social & Rematch (Future)
**Goal**: Drive engagement and repeat gameplay

**Features**:
1. Quick rematch button
2. Share win streaks
3. Rivalry tracking
4. Challenge system

**Timeline**: 1 week

## Technical Implementation

### Data Structure

**Current Match Record**:
```typescript
interface MatchRecord {
  roomId: string;
  players: {
    creator: string;
    joiner: string;
  };
  playerNames?: {
    creator: string;
    joiner: string;
  };
  games: Array<{
    creatorMove: string;
    joinerMove: string;
    winner: string;
    timestamp: number;
  }>;
  ipfsHash?: string;
}
```

**Opponent Stats (Computed)**:
```typescript
interface OpponentStats {
  opponentAddress: string;
  opponentName: string;
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  lastPlayed: number;
  roomId: string;
}
```

**Move Analysis (Phase 2)**:
```typescript
interface MoveAnalysis {
  rock: number;
  paper: number;
  scissors: number;
  mostPlayed: 'rock' | 'paper' | 'scissors';
  leastPlayed: 'rock' | 'paper' | 'scissors';
  patterns: string[]; // e.g., "Never plays same move twice"
}
```

### Computation Logic

**Calculate Opponent Stats**:
```typescript
function calculateOpponentStats(
  matches: MatchRecord[], 
  userAddress: string
): OpponentStats[] {
  const statsByOpponent = new Map<string, OpponentStats>();
  
  matches.forEach(match => {
    const isCreator = match.players.creator === userAddress;
    const opponentAddress = isCreator 
      ? match.players.joiner 
      : match.players.creator;
    
    const opponentName = match.playerNames
      ? (isCreator ? match.playerNames.joiner : match.playerNames.creator)
      : null;
    
    let stats = statsByOpponent.get(opponentAddress) || {
      opponentAddress,
      opponentName: opponentName || `${opponentAddress.slice(0, 6)}...`,
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      lastPlayed: 0,
      roomId: match.roomId,
    };
    
    match.games.forEach(game => {
      stats.totalGames++;
      
      const myMove = isCreator ? game.creatorMove : game.joinerMove;
      const oppMove = isCreator ? game.joinerMove : game.creatorMove;
      
      if (myMove === oppMove) {
        stats.ties++;
      } else if (game.winner === userAddress) {
        stats.wins++;
      } else {
        stats.losses++;
      }
      
      stats.lastPlayed = Math.max(stats.lastPlayed, game.timestamp);
    });
    
    stats.winRate = stats.totalGames > 0 
      ? (stats.wins / stats.totalGames) * 100 
      : 0;
    
    statsByOpponent.set(opponentAddress, stats);
  });
  
  return Array.from(statsByOpponent.values())
    .sort((a, b) => b.lastPlayed - a.lastPlayed);
}
```

**Calculate Move Patterns (Phase 2)**:
```typescript
function calculateMovePatterns(
  matches: MatchRecord[],
  userAddress: string,
  opponentAddress: string
): MoveAnalysis {
  const moves = { rock: 0, paper: 0, scissors: 0 };
  const moveSequence: string[] = [];
  
  matches
    .filter(m => 
      m.players.creator === opponentAddress || 
      m.players.joiner === opponentAddress
    )
    .forEach(match => {
      const isCreator = match.players.creator === opponentAddress;
      
      match.games.forEach(game => {
        const oppMove = isCreator 
          ? game.creatorMove.toLowerCase() 
          : game.joinerMove.toLowerCase();
        
        moves[oppMove as keyof typeof moves]++;
        moveSequence.push(oppMove);
      });
    });
  
  const total = moves.rock + moves.paper + moves.scissors;
  const mostPlayed = Object.entries(moves)
    .sort(([, a], [, b]) => b - a)[0][0] as 'rock' | 'paper' | 'scissors';
  const leastPlayed = Object.entries(moves)
    .sort(([, a], [, b]) => a - b)[0][0] as 'rock' | 'paper' | 'scissors';
  
  // Detect patterns
  const patterns: string[] = [];
  
  // Check for consecutive same moves
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  for (let i = 1; i < moveSequence.length; i++) {
    if (moveSequence[i] === moveSequence[i - 1]) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  if (maxConsecutive === 1 && moveSequence.length > 3) {
    patterns.push("Never plays the same move twice in a row");
  }
  
  // Check for strong bias
  const rockPercent = (moves.rock / total) * 100;
  const paperPercent = (moves.paper / total) * 100;
  const scissorsPercent = (moves.scissors / total) * 100;
  
  if (rockPercent > 50) patterns.push(`Heavily favors Rock (${rockPercent.toFixed(0)}%)`);
  if (paperPercent > 50) patterns.push(`Heavily favors Paper (${paperPercent.toFixed(0)}%)`);
  if (scissorsPercent > 50) patterns.push(`Heavily favors Scissors (${scissorsPercent.toFixed(0)}%)`);
  
  return {
    rock: moves.rock,
    paper: moves.paper,
    scissors: moves.scissors,
    mostPlayed,
    leastPlayed,
    patterns,
  };
}
```

## UI/UX Considerations

### Visual Hierarchy

**Priority Order**:
1. **Opponent name & stats** (most important)
2. **Win/Loss record** (key metric)
3. **Individual game details** (supporting data)
4. **IPFS/Blockchain links** (verification, less important)

### Color Coding

- **Wins**: Green/Success color
- **Losses**: Red/Error color
- **Ties**: Yellow/Warning color
- **High win rate (>60%)**: Highlight in success color
- **Low win rate (<40%)**: Highlight in warning color

### Responsive Design

- **Mobile**: Stack stats vertically, show 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns

### Loading States

- Show skeleton loaders while fetching data
- Indicate when syncing from IPFS
- Show progress for blockchain verification

## Success Metrics

### Engagement Metrics
1. **Page Views**: How often do users check Opponent Intel?
2. **Time on Page**: Are users studying the data?
3. **Return Visits**: Do users come back before rematches?

### Strategic Metrics
4. **Win Rate Improvement**: Do users improve against studied opponents?
5. **Rematch Rate**: Do users challenge opponents they've studied?
6. **Pattern Recognition**: Do users adjust strategy based on insights?

### Social Metrics
7. **Share Rate**: Do users share win streaks?
8. **Challenge Rate**: Do users challenge opponents from intel page?

## Future Enhancements

### Advanced Analytics (Phase 4+)
- Time-based pattern analysis (morning vs evening play)
- Emotional state detection (plays after wins vs losses)
- Multi-opponent comparison
- Global leaderboard integration

### AI Predictions (Phase 5+)
- ML model to predict opponent's next move
- Confidence scores for predictions
- Strategy recommendations based on AI analysis

### Social Features (Phase 3+)
- Rivalry tracking (ongoing battles with specific opponents)
- Tournament brackets
- Team battles
- Spectator mode

## Conclusion

The Opponent Intel feature transforms RPS-onChain from a simple game into a strategic battle of wits. By surfacing patterns and insights, we help players:

1. **Learn**: Understand opponent psychology
2. **Adapt**: Adjust strategy based on data
3. **Compete**: Gain competitive advantage
4. **Engage**: Build rivalries and social connections

This isn't just a match log - it's a strategic tool that makes every game more meaningful and every rematch more exciting.

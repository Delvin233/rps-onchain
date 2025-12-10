# Design Document

## Overview

The best-of-three AI matches feature transforms the current single-round AI gameplay into a more engaging multi-round competition system. This design maintains the fast, fun nature of the existing RPS OnChain application while adding strategic depth through match-based gameplay where players must win 2 out of 3 rounds to claim victory.

The system leverages the existing Turso database architecture for persistent storage, Redis for active match state management, and maintains compatibility with the current AI gameplay infrastructure while introducing new match management capabilities.

## Architecture

### High-Level Architecture

The best-of-three system extends the existing AI match infrastructure with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Match System Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)                                               │
│  ├── Match UI Components (Score Display, Round Indicator)       │
│  ├── Resume Match Modal                                         │
│  └── Match History Viewer                                       │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                                                      │
│  ├── /api/ai-match/start - Initialize new match                │
│  ├── /api/ai-match/play-round - Execute single round           │
│  ├── /api/ai-match/status - Get current match state            │
│  ├── /api/ai-match/resume - Resume abandoned match             │
│  └── /api/ai-match/abandon - Mark match as abandoned           │
├─────────────────────────────────────────────────────────────────┤
│  Storage Layer                                                  │
│  ├── Redis: Active match state (10min TTL)                     │
│  ├── Turso: Completed matches & statistics                     │
│  └── LocalStorage: Client-side match backup                    │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with Existing Systems

The design integrates seamlessly with the current architecture:

- **Turso Database**: Extends existing `matches` table with match-level records
- **Statistics System**: Maintains separate AI match statistics alongside existing round-based stats
- **UI Components**: Builds upon existing game interface with enhanced match state display
- **API Structure**: Follows existing patterns while introducing match-specific endpoints

## Components and Interfaces

### Core Components

#### 1. AIMatchManager
Central orchestrator for best-of-three match logic.

```typescript
interface AIMatchManager {
  startMatch(playerId: string): Promise<AIMatch>
  playRound(matchId: string, playerMove: Move): Promise<RoundResult>
  getMatchStatus(matchId: string): Promise<AIMatch | null>
  resumeMatch(playerId: string): Promise<AIMatch | null>
  abandonMatch(matchId: string): Promise<void>
}
```

#### 2. AIMatchStorage
Handles persistence and retrieval of match data.

```typescript
interface AIMatchStorage {
  saveMatch(match: AIMatch): Promise<void>
  getActiveMatch(playerId: string): Promise<AIMatch | null>
  getMatchHistory(playerId: string): Promise<AIMatch[]>
  cleanupExpiredMatches(): Promise<number>
}
```

#### 3. AIMatchUI Components
React components for match interface.

```typescript
// Match progress display
interface MatchScoreboardProps {
  playerScore: number
  aiScore: number
  currentRound: number
  maxRounds: number
}

// Resume match modal
interface ResumeMatchModalProps {
  match: AIMatch
  onResume: () => void
  onAbandon: () => void
}

// Match history viewer
interface MatchHistoryProps {
  matches: AIMatch[]
  onViewDetails: (matchId: string) => void
}
```

## Data Models

### AIMatch Model

```typescript
interface AIMatch {
  id: string                    // Unique match identifier
  playerId: string             // Player's wallet address
  status: MatchStatus          // Current match state
  rounds: Round[]              // Array of completed rounds
  playerScore: number          // Player's round wins (0-2)
  aiScore: number             // AI's round wins (0-2)
  currentRound: number        // Current round number (1-3)
  startedAt: Date             // Match start timestamp
  lastActivityAt: Date        // Last round completion time
  completedAt?: Date          // Match completion timestamp
  winner?: 'player' | 'ai' | 'tie'  // Final match result
  isAbandoned: boolean        // Abandonment flag
}

enum MatchStatus {
  ACTIVE = 'active',           // Match in progress
  COMPLETED = 'completed',     // Match finished normally
  ABANDONED = 'abandoned'      // Match abandoned by player
}

interface Round {
  roundNumber: number          // Round sequence (1, 2, or 3)
  playerMove: Move            // Player's move
  aiMove: Move                // AI's move
  result: RoundResult         // Round outcome
  timestamp: Date             // Round completion time
}

interface RoundResult {
  winner: 'player' | 'ai' | 'tie'
  playerMove: Move
  aiMove: Move
}

type Move = 'rock' | 'paper' | 'scissors'
```

### Database Schema Extensions

#### Turso Tables

**ai_matches table** (new):
```sql
CREATE TABLE ai_matches (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  player_score INTEGER NOT NULL DEFAULT 0,
  ai_score INTEGER NOT NULL DEFAULT 0,
  current_round INTEGER NOT NULL DEFAULT 1,
  rounds_data TEXT NOT NULL, -- JSON array of rounds
  started_at DATETIME NOT NULL,
  last_activity_at DATETIME NOT NULL,
  completed_at DATETIME,
  winner TEXT CHECK (winner IN ('player', 'ai', 'tie')),
  is_abandoned BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_matches_player_id (player_id),
  INDEX idx_ai_matches_status (status),
  INDEX idx_ai_matches_last_activity (last_activity_at)
)
```

**stats table** (extend existing):
```sql
-- Add new columns to existing stats table
ALTER TABLE stats ADD COLUMN ai_matches_played INTEGER DEFAULT 0;
ALTER TABLE stats ADD COLUMN ai_matches_won INTEGER DEFAULT 0;
ALTER TABLE stats ADD COLUMN ai_matches_lost INTEGER DEFAULT 0;
ALTER TABLE stats ADD COLUMN ai_matches_tied INTEGER DEFAULT 0;
ALTER TABLE stats ADD COLUMN ai_matches_abandoned INTEGER DEFAULT 0;
```

#### Redis Schema

**Active match state**:
```
ai_match:{playerId} = {
  matchId: string,
  status: MatchStatus,
  playerScore: number,
  aiScore: number,
  currentRound: number,
  rounds: Round[],
  lastActivityAt: timestamp
}
TTL: 10 minutes
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.1, 1.2, and 1.3 can be combined into a comprehensive match lifecycle property
- Properties 3.1, 3.2, and 3.3 can be unified into a single statistics update property
- Properties 5.1, 5.2, and 5.3 can be merged into a complete match history property
- Properties 2.1, 2.2, and 2.3 can be consolidated into a UI state consistency property

The following properties provide unique validation value:

**Property 1: Match Lifecycle Consistency**
*For any* player starting an AI match, the system should create a match with initial scores of 0-0, progress through rounds updating scores correctly, and complete when either side reaches 2 wins
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: Statistics Update Accuracy**
*For any* completed AI match, the player's statistics should be updated with exactly one increment to the appropriate category (wins, losses, or ties) based on the match outcome
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 3: Win Rate Calculation Correctness**
*For any* player's statistics, the win rate should always equal (matches_won / total_completed_matches) * 100, using only completed matches in the calculation
**Validates: Requirements 3.4**

**Property 4: Leaderboard Ranking Accuracy**
*For any* set of players, leaderboard rankings should be ordered by completed match victories, not individual round victories
**Validates: Requirements 3.5**

**Property 5: Match State Persistence**
*For any* active match, the complete match state (scores, rounds, current round) should be retrievable after session interruption and restoration
**Validates: Requirements 4.1, 4.5**

**Property 6: Match Resumption Detection**
*For any* player with an active match, returning to the application should detect and offer resumption of that match
**Validates: Requirements 4.2**

**Property 7: Match Abandonment Timeout**
*For any* match inactive for more than 10 minutes, the system should automatically mark it as abandoned and award victory to the AI
**Validates: Requirements 4.3**

**Property 8: Abandonment Pattern Tracking**
*For any* player who abandons multiple matches, the system should increment their abandonment count accurately
**Validates: Requirements 4.4**

**Property 9: Match History Completeness**
*For any* completed match, the history should contain all round details (moves, outcomes) and match metadata (scores, timestamps, duration)
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

**Property 10: Historical Data Ordering**
*For any* player's match history, matches should be ordered chronologically by completion timestamp
**Validates: Requirements 5.4**

**Property 11: Unique Match Identifier Generation**
*For any* concurrent match creation requests, all generated match IDs should be unique
**Validates: Requirements 6.1**

**Property 12: Expired Match Cleanup**
*For any* set of matches with expired TTL, the cleanup process should remove all expired matches from active storage
**Validates: Requirements 6.4**

**Property 13: Performance Metrics Tracking**
*For any* system operation, metrics for active matches and completion rates should be accurately maintained
**Validates: Requirements 6.5**

**Property 14: Legacy Data Preservation**
*For any* existing player statistics and match history, system deployment should preserve all data without loss
**Validates: Requirements 7.1**

**Property 15: Legacy Match Compatibility**
*For any* historical single-round match, the system should correctly read and display the match while distinguishing it from best-of-three matches
**Validates: Requirements 7.3, 7.4**

**Property 16: Mixed Statistics Calculation**
*For any* player with both legacy single-round and new best-of-three matches, overall statistics should properly weight and include both match types
**Validates: Requirements 7.5**

**Property 17: UI State Consistency**
*For any* active match, the UI should display current scores, round indicators, and continuation options that accurately reflect the match state
**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

**Property 18: Match Completion UI Feedback**
*For any* completed match, the UI should display appropriate celebration or consolation messaging based on the match outcome
**Validates: Requirements 2.4**

**Property 19: Statistics Update Trigger**
*For any* match completion, player statistics should be updated exactly once with the match result
**Validates: Requirements 1.4**

**Property 20: Match History Display**
*For any* player viewing their history, the system should display all completed matches with round-by-round details
**Validates: Requirements 1.5**

## Error Handling

### Match State Errors

**Concurrent Modification Protection**
- Use atomic operations for match state updates
- Implement optimistic locking for Redis operations
- Handle race conditions in round submission gracefully

**Invalid State Transitions**
- Validate match status before allowing operations
- Prevent round submission for completed matches
- Ensure proper state machine transitions

**Data Consistency Errors**
- Implement rollback mechanisms for failed operations
- Use database transactions for multi-table updates
- Validate data integrity before persistence

### Network and Storage Errors

**Redis Connection Failures**
- Implement circuit breaker pattern for Redis operations
- Fall back to Turso for match state retrieval
- Queue operations for retry when Redis is unavailable

**Database Operation Failures**
- Use connection pooling with retry logic
- Implement exponential backoff for failed operations
- Provide graceful degradation when persistence fails

**Timeout Handling**
- Set appropriate timeouts for all external calls
- Implement cleanup for partially completed operations
- Provide user feedback for long-running operations

### User Experience Errors

**Match Not Found**
- Provide clear error messages for invalid match IDs
- Offer options to start new match when resume fails
- Log errors for debugging while maintaining user experience

**Session Expiry**
- Detect expired sessions and prompt for re-authentication
- Preserve match state across authentication flows
- Handle wallet disconnection gracefully

**Browser Storage Limitations**
- Handle localStorage quota exceeded errors
- Implement storage cleanup for old data
- Provide fallback when local storage is unavailable

## Testing Strategy

### Unit Testing Approach

**Core Logic Testing**
- Test match creation with various player configurations
- Verify round outcome calculation for all move combinations
- Test match completion detection for different score scenarios
- Validate statistics calculation with edge cases

**State Management Testing**
- Test match state transitions through complete lifecycle
- Verify persistence and retrieval operations
- Test concurrent access scenarios with multiple operations
- Validate cleanup operations for expired matches

**Integration Points Testing**
- Test API endpoint responses for all match operations
- Verify database schema compatibility with existing data
- Test Redis operations with TTL and expiration scenarios
- Validate UI component rendering with various match states

### Property-Based Testing Requirements

**Testing Framework**: Use Vitest with fast-check for property-based testing
**Test Configuration**: Minimum 100 iterations per property test
**Property Test Tagging**: Each test must include the format `**Feature: best-of-three-ai-matches, Property {number}: {property_text}**`

**Generator Strategies**:
- **Match State Generator**: Create matches in various states (active, completed, abandoned)
- **Player Generator**: Generate valid wallet addresses and player configurations
- **Move Sequence Generator**: Create valid rock-paper-scissors move combinations
- **Timestamp Generator**: Generate realistic timestamp sequences for match progression
- **Statistics Generator**: Create player statistics with various win/loss/tie combinations

**Property Test Categories**:
- **Match Lifecycle Properties**: Test complete match flows from creation to completion
- **Statistics Properties**: Verify accurate statistics calculation and updates
- **Persistence Properties**: Test data consistency across storage operations
- **UI State Properties**: Verify UI consistency with underlying match state
- **Migration Properties**: Test compatibility between legacy and new match formats

**Edge Case Handling**:
- Test with maximum concurrent matches per player
- Verify behavior with network interruptions during operations
- Test storage limitations and cleanup scenarios
- Validate performance under high load conditions

### Integration Testing Strategy

**Database Integration**
- Test Turso operations with realistic data volumes
- Verify Redis TTL behavior with time-based scenarios
- Test migration scripts with existing production data
- Validate backup and recovery procedures

**API Integration**
- Test complete user flows through API endpoints
- Verify error handling and response consistency
- Test rate limiting and concurrent request handling
- Validate authentication and authorization flows

**UI Integration**
- Test complete user journeys from match start to completion
- Verify responsive design across different screen sizes
- Test accessibility compliance for match interfaces
- Validate real-time updates and polling behavior

**Performance Testing**
- Load test with thousands of concurrent matches
- Measure response times for critical operations
- Test memory usage and cleanup effectiveness
- Validate scalability under increasing user load

### Testing Data Management

**Test Data Generation**
- Create realistic match scenarios for testing
- Generate edge cases for boundary testing
- Maintain test data consistency across test runs
- Implement cleanup procedures for test artifacts

**Mock and Stub Strategy**
- Mock external dependencies (Redis, Turso) for unit tests
- Stub AI move generation for predictable testing
- Create test doubles for complex integration scenarios
- Maintain test isolation and repeatability

**Continuous Testing**
- Integrate property tests into CI/CD pipeline
- Run performance tests on staging environment
- Implement automated regression testing
- Monitor test coverage and effectiveness metrics
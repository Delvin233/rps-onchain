# Design Document

## Overview

The Random Matchmaking system introduces competitive Best-of-5 match series to the RPS game, allowing players to be automatically paired with random opponents regardless of their blockchain network. The system operates independently from the existing room-based multiplayer system, using a separate smart contract (RPSBestOfFive) while maintaining integration with Divvi referral tracking.

Key features include:
- **Network-agnostic global lobby** - players on any network can match with each other
- **Off-chain gameplay** - entire match series played without blockchain transactions
- **Single signature to enter** - just sign a message to join the lobby (no gas fees)
- **Winner-only publishing** - only winners can publish results on-chain to their chosen network
- **Best-of-5 match series** - competitive format with no wallet interruptions during play
- **Platform-aware publishing** - MiniPay users publish to Celo, Base App users to Base, web users choose
- **Global statistics tracking** - unified stats across all networks
- **Real-time lobby status updates** - see total players waiting across all networks

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Multiplayer Page │  │  Match Series    │                │
│  │                  │  │     Page         │                │
│  │ - Room Cards     │  │                  │                │
│  │ - Matchmaking    │  │ - Round Display  │                │
│  │   Card           │  │ - Score Tracking │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Home Page      │  │  Hooks/Utils     │                │
│  │                  │  │                  │                │
│  │ - Stats Display  │  │ - Divvi Utils    │                │
│  │ - Network Info   │  │ - Contract Hooks │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend API                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Matchmaking      │  │  Match Series    │                │
│  │ Queue Manager    │  │  Manager         │                │
│  │                  │  │                  │                │
│  │ - Add to Queue   │  │ - Create Series  │                │
│  │ - Pair Players   │  │ - Track Rounds   │                │
│  │ - Remove from Q  │  │ - Handle Forfeit │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Stats Manager   │  │  WebSocket       │                │
│  │                  │  │  Server          │                │
│  │ - Record Results │  │                  │                │
│  │ - Calculate      │  │ - Real-time      │                │
│  │   Streaks        │  │   Updates        │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Matchmaking      │  │  Player Stats    │                │
│  │ Queues           │  │                  │                │
│  │                  │  │ - Wins/Losses    │                │
│  │ - Celo Queue     │  │ - Win Streaks    │                │
│  │ - Base Queue     │  │ - Per Network    │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐                                       │
│  │ Match Series     │                                       │
│  │ Records          │                                       │
│  │                  │                                       │
│  │ - Series Data    │                                       │
│  │ - Round Results  │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ RPSBestOfFive    │  │  RPSGame         │                │
│  │ (Celo)           │  │  (Existing)      │                │
│  │                  │  │                  │                │
│  │ - enterMatch()   │  │ - createGame()   │                │
│  │ - publishSeries()│  │ - joinGame()     │                │
│  └──────────────────┘  │ - publishMatch() │                │
│                        └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │ RPSBestOfFive    │                                       │
│  │ (Base)           │                                       │
│  │                  │                                       │
│  │ - enterMatch()   │                                       │
│  │ - publishSeries()│                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Divvi Protocol                            │
│                  (Referral Tracking)                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Matchmaking Flow
```
User clicks "Find Match"
    ↓
Frontend → User: Prompt to sign lobby entry message (off-chain)
    ↓
User: Signs message with wallet
    ↓
Frontend → Backend: Add to global lobby (address, signature)
    ↓
Backend: Verify signature and store in global lobby
    ↓
Backend: Check for pairing (2+ users in lobby)
    ↓
Backend → Frontend (both players): Match found notification
    ↓
Frontend: Navigate both players to match series page
    ↓
Backend: Create series record in database (off-chain)
```

#### Match Series Flow
```
Series starts → Round 1 begins
    ↓
Both players select moves (rock/paper/scissors)
    ↓
Backend: Receive both moves
    ↓
Backend: Determine round winner
    ↓
Backend → Frontend: Reveal moves and winner
    ↓
Backend: Update series score
    ↓
Check: Has someone won 3 rounds?
    ├─ Yes → End series, show publish button
    └─ No → Start next round
```

#### Publishing Flow
```
Match ends → Winner is determined
    ↓
Frontend: Show "Publish Result" button to winner only
    ↓
Winner clicks "Publish Result"
    ↓
Frontend: Show network selection (Celo/Base)
    ├─ MiniPay: Auto-select Celo (only option)
    ├─ Base App: Auto-select Base (only option)
    └─ Web/Farcaster: Let user choose
    ↓
Frontend: Check if user is on selected network
    ├─ Wrong network → Prompt to switch
    └─ Correct network → Continue
    ↓
Frontend → User: Prompt to sign publishSeries() transaction
    ↓
User → Smart Contract: Sign publishSeries() with Divvi tag
    ↓
Smart Contract: Record series result on-chain
    ↓
Frontend → Divvi: submitReferral(txHash, chainId)
    ↓
Backend: Update player stats in database
    ↓
Frontend: Display final result and rematch options
```

## Components and Interfaces

### Frontend Components

#### RandomMatchmakingCard
```typescript
interface RandomMatchmakingCardProps {
  platform: 'minipay' | 'base-app' | 'web';
}

// Displays:
// - Global lobby count (all networks combined)
// - Player's global matchmaking stats
// - "Find Match" button
// - Best-of-5 indicator
// - Note about winner-only publishing
```

#### MatchSeriesPage
```typescript
interface MatchSeriesPageProps {
  seriesId: string;
}

// Displays:
// - Current round number
// - Series score (You: X, Opponent: Y)
// - Move selection UI
// - Round results
// - Publish button (when series ends, winner only)
// - Network selection modal (when publishing)
// - Rematch/Find New Match options
```

#### StatsDisplay (Enhanced)
```typescript
interface StatsDisplayProps {
  address: string;
  showMatchmaking: boolean;
}

// Displays:
// - Existing room-based stats
// - Global matchmaking stats (wins, losses, win rate, streaks)
// - Optional: Breakdown by network (Celo vs Base) in detailed view
```

### Backend API Endpoints

#### Matchmaking Endpoints
```typescript
POST /api/matchmaking/lobby/join
Body: { address: string, signature: string, message: string }
Response: { success: boolean, lobbyPosition: number }

POST /api/matchmaking/lobby/leave
Body: { address: string }
Response: { success: boolean }

GET /api/matchmaking/lobby/count
Response: { count: number }

GET /api/matchmaking/lobby/status
Query: { address: string }
Response: { inLobby: boolean, matchFound?: boolean, seriesId?: string }
```

#### Match Series Endpoints
```typescript
POST /api/matchmaking/series/create
Body: { player1: string, player2: string }
Response: { seriesId: string }

POST /api/matchmaking/series/:id/move
Body: { address: string, move: 'rock' | 'paper' | 'scissors' }
Response: { roundComplete: boolean, winner?: string, seriesComplete: boolean }

GET /api/matchmaking/series/:id
Response: { 
  seriesId: string,
  player1: string,
  player2: string,
  rounds: Round[],
  score: { player1: number, player2: number },
  winner?: string,
  status: 'active' | 'complete'
}

POST /api/matchmaking/series/:id/publish
Body: { txHash: string, network: 'celo' | 'base', winner: string }
Response: { success: boolean }

POST /api/matchmaking/series/:id/rematch
Body: { address: string, accept: boolean }
Response: { rematchAccepted: boolean, newSeriesId?: string }

GET /api/matchmaking/series/:id/rematch-status
Response: { 
  rematchRequested: boolean,
  player1Response?: boolean,
  player2Response?: boolean,
  newSeriesId?: string,
  timeout: number
}
```

#### Stats Endpoints
```typescript
GET /api/matchmaking/stats/:address
Response: {
  global: {
    wins: number,
    losses: number,
    winRate: number,
    currentStreak: number,
    bestStreak: number
  },
  byNetwork: {
    celo: { wins: number, losses: number },
    base: { wins: number, losses: number }
  }
}
```

### Polling Strategy

Since the application is hosted on Vercel (serverless), we use polling instead of WebSockets for real-time updates.

#### Polling Intervals

```typescript
// While in lobby searching for match
Poll: GET /api/matchmaking/lobby/status?address={address}
Interval: Every 2 seconds
Stop when: Match found or user cancels

// During active match (waiting for opponent move)
Poll: GET /api/matchmaking/series/:id
Interval: Every 2 seconds
Stop when: Round complete or series ends

// Lobby count display (on matchmaking card)
Poll: GET /api/matchmaking/lobby/count
Interval: Every 5 seconds
Stop when: User leaves matchmaking page

// Rematch waiting
Poll: GET /api/matchmaking/series/:id/rematch-status
Interval: Every 2 seconds
Stop when: Both accept, timeout, or either declines
```

#### Response Formats

```typescript
// Lobby status response
{
  inLobby: boolean,
  matchFound: boolean,
  seriesId?: string,
  opponentAddress?: string,
  opponentName?: string
}

// Series status response
{
  seriesId: string,
  status: 'active' | 'complete' | 'cancelled',
  currentRound: number,
  yourMove?: string,
  opponentMoveSubmitted: boolean,
  roundResult?: {
    yourMove: string,
    opponentMove: string,
    winner: string
  },
  score: { you: number, opponent: number },
  winner?: string
}

// Rematch status response
{
  rematchRequested: boolean,
  yourResponse?: boolean,
  opponentResponse?: boolean,
  newSeriesId?: string,
  timeout: number
}
```

## Data Models

### Database Schema

#### MatchmakingLobby
```typescript
interface MatchmakingLobby {
  id: string;
  address: string;
  signature: string;
  joinedAt: Date;
  socketId: string;
}
```

#### MatchSeries
```typescript
interface MatchSeries {
  id: string;
  player1Address: string;
  player2Address: string;
  rounds: Round[];
  score: {
    player1: number;
    player2: number;
  };
  winner?: string;
  status: 'active' | 'complete' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  publishedTxHash?: string;
  publishedNetwork?: 'celo' | 'base';
}

interface Round {
  roundNumber: number;
  player1Move?: 'rock' | 'paper' | 'scissors';
  player2Move?: 'rock' | 'paper' | 'scissors';
  winner?: string;
  completedAt?: Date;
}
```

#### MatchmakingStats
```typescript
interface MatchmakingStats {
  address: string;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: Date;
  winsByCelo: number;
  winsByBase: number;
  lossesByCelo: number;
  lossesByBase: number;
}
```

### Smart Contract Interface

#### RPSBestOfFive.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RPSBestOfFive {
    enum Move { None, Rock, Paper, Scissors }
    
    struct Round {
        Move player1Move;
        Move player2Move;
        address winner;
    }
    
    struct MatchSeries {
        address player1;
        address player2;
        Round[5] rounds;
        uint8 player1Score;
        uint8 player2Score;
        address winner;
        uint256 publishedAt;
    }
    
    mapping(bytes32 => MatchSeries) public series;
    
    event SeriesPublished(
        bytes32 indexed seriesId,
        address indexed player1,
        address indexed player2,
        address indexed winner,
        uint8 player1Score,
        uint8 player2Score,
        uint256 timestamp
    );
    
    function publishSeries(
        bytes32 seriesId,
        address player1,
        address player2,
        Round[5] calldata rounds,
        address winner
    ) external returns (bool);
    
    function getSeries(bytes32 seriesId) 
        external 
        view 
        returns (MatchSeries memory);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lobby membership consistency
*For any* user, when a user joins the matchmaking lobby with a valid signature, that user should appear in the global lobby exactly once.
**Validates: Requirements 1.2**

### Property 2: Network-agnostic pairing
*For any* two users in the matchmaking lobby, they can be paired together regardless of which network they are currently connected to.
**Validates: Requirements 1.4, 6.4**

### Property 3: Lobby removal completeness
*For any* user in the matchmaking lobby, when they cancel their search, they should no longer appear in the lobby.
**Validates: Requirements 1.5**

### Property 4: Off-chain series creation
*For any* match series, the series should be created immediately in the database when two players are paired, without requiring any on-chain transactions.
**Validates: Requirements 2.1**

### Property 5: Best-of-5 winner determination
*For any* match series, if a player wins 3 or more rounds, that player should be declared the winner and the series should end.
**Validates: Requirements 2.4, 2.5**

### Property 6: Round winner correctness
*For any* round with both moves submitted, the winner should be determined correctly according to rock-paper-scissors rules (rock beats scissors, scissors beats paper, paper beats rock).
**Validates: Requirements 3.4**

### Property 7: Score tracking accuracy
*For any* match series, after each round completes, the score should accurately reflect the number of rounds won by each player.
**Validates: Requirements 3.5**

### Property 8: Immediate rematch creation
*For any* rematch between the same two players, when both accept within 30 seconds, a new series should be created immediately without requiring lobby re-entry.
**Validates: Requirements 5.3**

### Property 9: Global stats aggregation
*For any* player with published games on multiple networks, their global wins and losses should be the sum of wins and losses across all networks.
**Validates: Requirements 12.3**

### Property 10: Win streak calculation
*For any* sequence of match series results for a player, the current win streak should equal the number of consecutive wins from the most recent game backwards, resetting to zero after any loss.
**Validates: Requirements 12.4**

### Property 11: Divvi referral tag inclusion
*For any* publish series transaction, the transaction data should contain a valid Divvi referral tag.
**Validates: Requirements 10.1**

### Property 12: Platform-specific publishing restrictions
*For any* user on MiniPay, only Celo should be available for publishing; for any user on Base App, only Base should be available for publishing; for any user on web/Farcaster, both networks should be available.
**Validates: Requirements 6.5, 6.6, 6.7**

### Property 13: Timeout-based match cancellation
*For any* matched pair of players, if either player does not accept the match within 15 seconds, both players should be returned to the lobby.
**Validates: Requirements 11.1**

### Property 14: Forfeit winner declaration
*For any* active match series, if one player disconnects and does not reconnect within 60 seconds, the remaining connected player should be declared the winner.
**Validates: Requirements 11.3**

### Property 15: Winner-only publishing
*For any* completed match series, only the winner should be able to publish the result on-chain.
**Validates: Requirements 2.5, 4.1**

### Property 16: Contract isolation
*For any* matchmaking game transaction, only the RPSBestOfFive contract should be called; for any room-based game transaction, only the RPSGame contract should be called.
**Validates: Requirements 9.2, 9.3**

## Error Handling

### Lobby Management Errors
- **User already in lobby**: Return error, do not add duplicate
- **Invalid signature**: Verify signature matches address, reject if invalid
- **Lobby full**: Implement maximum lobby size, return error when exceeded
- **User not in lobby**: Handle gracefully when attempting to remove

### Match Series Errors
- **Invalid move**: Reject moves that aren't rock/paper/scissors
- **Move already submitted**: Prevent players from changing moves after submission
- **Series not found**: Return 404 with clear error message
- **Unauthorized action**: Verify player is part of the series before allowing actions
- **Series already complete**: Prevent additional moves after completion
- **Non-winner publishing**: Reject publish attempts from the loser
- **Series already published**: Prevent duplicate publishing of same series

### Smart Contract Errors
- **Insufficient gas**: Provide gas estimation in UI before transaction
- **Transaction reverted**: Parse revert reason and display user-friendly message
- **Network mismatch**: Prompt user to switch to selected network before transaction
- **Signature rejected**: Handle user rejection gracefully, return to previous state
- **Platform network restriction**: Prevent MiniPay users from selecting Base, Base App users from selecting Celo

### Divvi Integration Errors
- **submitReferral failure**: Log error, continue game flow (non-blocking)
- **Invalid referral tag**: Log warning, attempt transaction without tag
- **Network timeout**: Retry with exponential backoff, max 3 attempts

### WebSocket Errors
- **Connection lost**: Attempt reconnection with exponential backoff
- **Message delivery failure**: Queue messages and retry on reconnection
- **Invalid event data**: Log error, ignore malformed messages

### Timeout Handling
- **Match acceptance timeout (15s)**: Cancel match, return both players to lobby, notify both
- **Rematch timeout (30s)**: Return both players to lobby if not both accepted
- **Disconnect timeout (60s)**: Declare forfeit, allow winner to publish
- **Move timeout (optional)**: Could implement per-round timeout for competitive play

## Testing Strategy

### Unit Testing

**Frontend Components:**
- RandomMatchmakingCard: Test rendering for different platforms (MiniPay, Base App, Web)
- MatchSeriesPage: Test round display, score updates, move selection
- StatsDisplay: Test stats calculation and display for multiple networks

**Backend Services:**
- Queue Manager: Test add/remove/pair operations
- Match Series Manager: Test series creation, round tracking, winner determination
- Stats Manager: Test win/loss recording, streak calculation

**Smart Contract:**
- RPSBestOfFive: Test enterMatch, publishSeries, series data storage
- Test with various round outcomes and edge cases

### Property-Based Testing

The testing framework will use **fast-check** (JavaScript/TypeScript property-based testing library) to verify the correctness properties defined above.

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property
- Use the format: `// Feature: random-matchmaking, Property X: [property description]`

**Example property test structure:**
```typescript
// Feature: random-matchmaking, Property 2: Pairing within network boundaries
it('should only pair users on the same network', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        address: fc.hexaString({ minLength: 40, maxLength: 40 }),
        network: fc.constantFrom('celo', 'base')
      }), { minLength: 2, maxLength: 20 }),
      (users) => {
        // Add users to queues
        users.forEach(user => queueManager.addToQueue(user.address, user.network));
        
        // Pair users
        const pairs = queueManager.pairPlayers();
        
        // Verify all pairs are on same network
        return pairs.every(pair => 
          users.find(u => u.address === pair.player1)?.network ===
          users.find(u => u.address === pair.player2)?.network
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

- Test complete matchmaking flow from queue join to series completion
- Test rematch flow with role swapping
- Test network switching and queue migration
- Test Divvi integration end-to-end
- Test WebSocket communication and real-time updates
- Test timeout scenarios (consent, rematch, disconnect)

### End-to-End Testing

- Simulate two players finding match and completing series
- Test on both Celo and Base networks
- Test on different platforms (MiniPay, Base App, Web)
- Verify stats are recorded correctly
- Verify on-chain data matches off-chain records

## Performance Considerations

### Queue Management
- Use Redis for fast queue operations (O(1) add/remove)
- Implement queue sharding by network for scalability
- Set maximum queue size per network (e.g., 1000 users)

### Pairing Algorithm
- Run pairing check every 2 seconds
- Pair oldest waiting users first (FIFO)
- Batch pair multiple matches in single operation

### Polling Optimization
- Use SWR or React Query for efficient polling with caching
- Implement exponential backoff on errors
- Stop polling when tab is not visible (Page Visibility API)
- Use Redis for fast status lookups

### Database Optimization
- Index on: address, network, seriesId, status
- Use database transactions for atomic operations
- Implement caching for frequently accessed stats

### Smart Contract Gas Optimization
- Batch operations where possible
- Use events instead of storage for historical data
- Optimize struct packing

## Security Considerations

### Authentication
- Verify wallet signatures for all actions
- Validate user owns the address they claim
- Implement rate limiting per address

### Input Validation
- Sanitize all user inputs
- Validate move selections (rock/paper/scissors only)
- Verify series IDs exist before operations

### Smart Contract Security
- Implement reentrancy guards
- Validate caller permissions
- Use SafeMath for arithmetic operations
- Audit contract before deployment

### API Security
- Verify wallet signatures on all requests
- Implement rate limiting per address (max 1 request per second)
- Validate user is part of series before returning data
- Use Redis to track and block excessive polling

### Data Privacy
- Don't expose opponent's move before both submitted
- Hash sensitive data in transit
- Implement proper CORS policies

## Deployment Strategy

### Smart Contract Deployment
1. Deploy RPSBestOfFive to Celo testnet (Alfajores)
2. Deploy RPSBestOfFive to Base testnet (Sepolia)
3. Test thoroughly on testnets
4. Audit contracts
5. Deploy to Celo mainnet
6. Deploy to Base mainnet
7. Update frontend with contract addresses

### Backend Deployment
1. Deploy to staging environment
2. Run integration tests
3. Load test with simulated users
4. Deploy to production
5. Monitor error rates and performance

### Frontend Deployment
1. Build with production contract addresses
2. Deploy to Vercel preview
3. Test on all platforms (MiniPay, Base App, Web)
4. Deploy to production
5. Monitor analytics and error tracking

### Database Migration
1. Create new tables for matchmaking data
2. Add indexes
3. Test migration on staging
4. Run migration on production during low-traffic period
5. Verify data integrity

## Monitoring and Observability

### Metrics to Track
- Global lobby size
- Average wait time for match
- Match completion rate
- Transaction success rate
- API response times
- Polling request volume
- Error rates by endpoint
- Cache hit rates

### Logging
- Log all queue operations
- Log all match series events
- Log all smart contract interactions
- Log Divvi submission attempts
- Log WebSocket events

### Alerts
- Alert on high error rates
- Alert on lobby size exceeding threshold
- Alert on smart contract failures
- Alert on excessive polling (potential abuse)
- Alert on database performance degradation
- Alert on Redis connection issues

## Future Enhancements

### Phase 2 Features (Not in current scope)
- Leaderboards (global and per-network)
- ELO rating system
- Ranked matchmaking tiers
- Tournament mode
- Spectator mode
- Replay system
- Achievement system
- Custom match settings (best of 3, best of 7)

### Potential Optimizations
- Implement skill-based matchmaking
- Add geographic matchmaking for lower latency
- Implement match history pagination
- Add match replay functionality
- Implement chat between matched players

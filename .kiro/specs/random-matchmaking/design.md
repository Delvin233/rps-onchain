# Design Document

## Overview

The Random Matchmaking system introduces competitive Best-of-5 match series to the RPS game, allowing players to be automatically paired with random opponents. The system operates independently from the existing room-based multiplayer system, using a separate smart contract (RPSBestOfFive) while maintaining integration with Divvi referral tracking.

Key features include:
- Automatic player pairing within network-specific queues (Celo and Base)
- Best-of-5 match series with only 2 required signatures (enter + publish)
- Rematch functionality with role swapping
- Platform-aware UI (MiniPay, Base App, Web/Farcaster)
- Comprehensive statistics tracking per network
- Real-time queue status updates

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
Frontend → Backend: Add to queue (network, address)
    ↓
Backend: Store in network-specific queue
    ↓
Backend: Check for pairing (2+ users in same network queue)
    ↓
Backend → Frontend (both players): Match found notification
    ↓
Frontend → User: Prompt to sign enterMatch() transaction
    ↓
User → Smart Contract: Sign enterMatch() with Divvi tag
    ↓
Smart Contract: Create match series on-chain
    ↓
Backend: Create series record in database
    ↓
Frontend: Navigate both players to match series page
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
User clicks "Publish Result"
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
  network: 'celo' | 'base' | 'both';
  platform: 'minipay' | 'base-app' | 'web';
}

// Displays:
// - Queue count(s) for available network(s)
// - Player stats for available network(s)
// - "Find Match" button(s)
// - Platform-specific UI based on props
```

#### MatchSeriesPage
```typescript
interface MatchSeriesPageProps {
  seriesId: string;
  network: 'celo' | 'base';
}

// Displays:
// - Current round number
// - Series score (Player A: X, Player B: Y)
// - Move selection UI
// - Round results
// - Publish button (when series ends)
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
// - Matchmaking stats (wins, losses, win rate, streaks)
// - Separate sections for Celo and Base
```

### Backend API Endpoints

#### Matchmaking Endpoints
```typescript
POST /api/matchmaking/queue/join
Body: { address: string, network: 'celo' | 'base' }
Response: { success: boolean, queuePosition: number }

POST /api/matchmaking/queue/leave
Body: { address: string, network: 'celo' | 'base' }
Response: { success: boolean }

GET /api/matchmaking/queue/count
Query: { network?: 'celo' | 'base' }
Response: { celo: number, base: number }

GET /api/matchmaking/queue/status
Query: { address: string }
Response: { inQueue: boolean, network?: string, matchFound?: boolean }
```

#### Match Series Endpoints
```typescript
POST /api/matchmaking/series/create
Body: { player1: string, player2: string, network: string, txHash: string }
Response: { seriesId: string, player1Role: 'creator' | 'joiner' }

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
Body: { txHash: string }
Response: { success: boolean }

POST /api/matchmaking/series/:id/rematch
Body: { address: string, accept: boolean }
Response: { rematchAccepted: boolean, newSeriesId?: string }
```

#### Stats Endpoints
```typescript
GET /api/matchmaking/stats/:address
Query: { network?: 'celo' | 'base' }
Response: {
  celo: {
    wins: number,
    losses: number,
    winRate: number,
    currentStreak: number,
    bestStreak: number
  },
  base: {
    wins: number,
    losses: number,
    winRate: number,
    currentStreak: number,
    bestStreak: number
  }
}
```

### WebSocket Events

```typescript
// Server → Client
event: 'match-found'
data: { opponentAddress: string, opponentName: string, seriesId: string }

event: 'round-complete'
data: { 
  roundNumber: number,
  player1Move: string,
  player2Move: string,
  winner: string,
  score: { player1: number, player2: number }
}

event: 'series-complete'
data: { winner: string, finalScore: { player1: number, player2: number } }

event: 'opponent-disconnected'
data: { reconnectTimeout: number }

event: 'match-cancelled'
data: { reason: string }

event: 'rematch-request'
data: { fromPlayer: string, timeout: number }

event: 'queue-count-update'
data: { celo: number, base: number }

// Client → Server
event: 'join-queue'
data: { address: string, network: string }

event: 'leave-queue'
data: { address: string }

event: 'submit-move'
data: { seriesId: string, move: string }

event: 'accept-rematch'
data: { seriesId: string, accept: boolean }
```

## Data Models

### Database Schema

#### MatchmakingQueue
```typescript
interface MatchmakingQueue {
  id: string;
  address: string;
  network: 'celo' | 'base';
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
  network: 'celo' | 'base';
  player1Role: 'creator' | 'joiner';
  rounds: Round[];
  score: {
    player1: number;
    player2: number;
  };
  winner?: string;
  status: 'waiting' | 'active' | 'complete' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  publishedTxHash?: string;
  enterTxHash?: string;
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
  network: 'celo' | 'base';
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: Date;
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
        bool complete;
    }
    
    struct MatchSeries {
        address player1;
        address player2;
        Round[5] rounds;
        uint8 player1Score;
        uint8 player2Score;
        address winner;
        bool published;
        uint256 createdAt;
    }
    
    mapping(bytes32 => MatchSeries) public series;
    
    event SeriesCreated(
        bytes32 indexed seriesId,
        address indexed player1,
        address indexed player2,
        uint256 timestamp
    );
    
    event SeriesPublished(
        bytes32 indexed seriesId,
        address indexed winner,
        uint8 player1Score,
        uint8 player2Score,
        uint256 timestamp
    );
    
    function enterMatch(
        bytes32 seriesId,
        address opponent
    ) external returns (bool);
    
    function publishSeries(
        bytes32 seriesId,
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

### Property 1: Queue membership consistency
*For any* user and network, when a user joins a matchmaking queue, that user should appear in the queue for that specific network and no other network.
**Validates: Requirements 1.1, 6.4**

### Property 2: Pairing within network boundaries
*For any* two users in matchmaking queues, if they are paired together, both users must be in the same network's queue.
**Validates: Requirements 1.3, 6.4**

### Property 3: Queue removal completeness
*For any* user in a matchmaking queue, when they cancel their search, they should no longer appear in any network's queue.
**Validates: Requirements 1.4**

### Property 4: Series creation requires consent
*For any* match series, the series should only be created on-chain after both players have signed the consent transaction.
**Validates: Requirements 2.1, 2.2**

### Property 5: Best-of-5 winner determination
*For any* match series, if a player wins 3 or more rounds, that player should be declared the winner and the series should end.
**Validates: Requirements 2.4, 2.5**

### Property 6: Round winner correctness
*For any* round with both moves submitted, the winner should be determined correctly according to rock-paper-scissors rules (rock beats scissors, scissors beats paper, paper beats rock).
**Validates: Requirements 3.4**

### Property 7: Score tracking accuracy
*For any* match series, after each round completes, the score should accurately reflect the number of rounds won by each player.
**Validates: Requirements 3.5**

### Property 8: Role swapping on rematch
*For any* rematch between the same two players, the player roles (creator/joiner) should be swapped from the previous series.
**Validates: Requirements 5.3**

### Property 9: Network-specific stats isolation
*For any* player with games on multiple networks, wins and losses on Celo should not affect Base statistics and vice versa.
**Validates: Requirements 12.5**

### Property 10: Win streak calculation
*For any* sequence of match series results for a player, the current win streak should equal the number of consecutive wins from the most recent game backwards, resetting to zero after any loss.
**Validates: Requirements 12.4**

### Property 11: Divvi referral tag inclusion
*For any* matchmaking transaction (enter match or publish series), the transaction data should contain a valid Divvi referral tag.
**Validates: Requirements 10.1, 10.2**

### Property 12: Platform-specific UI filtering
*For any* user on MiniPay, only Celo network options should be displayed; for any user on Base App, only Base network options should be displayed.
**Validates: Requirements 6.1, 6.2, 7.3, 7.4, 12.6, 12.7**

### Property 13: Timeout-based match cancellation
*For any* matched pair of players, if either player does not sign the consent transaction within 30 seconds, both players should be returned to their respective queues.
**Validates: Requirements 11.1**

### Property 14: Forfeit winner declaration
*For any* active match series, if one player disconnects and does not reconnect within 60 seconds, the remaining connected player should be declared the winner.
**Validates: Requirements 11.3**

### Property 15: Contract isolation
*For any* matchmaking game transaction, only the RPSBestOfFive contract should be called; for any room-based game transaction, only the RPSGame contract should be called.
**Validates: Requirements 9.2, 9.3**

## Error Handling

### Queue Management Errors
- **User already in queue**: Return error, do not add duplicate
- **Network not supported**: Return error with supported networks list
- **Queue full**: Implement maximum queue size, return error when exceeded
- **User not in queue**: Handle gracefully when attempting to remove

### Match Series Errors
- **Invalid move**: Reject moves that aren't rock/paper/scissors
- **Move already submitted**: Prevent players from changing moves after submission
- **Series not found**: Return 404 with clear error message
- **Unauthorized action**: Verify player is part of the series before allowing actions
- **Series already complete**: Prevent additional moves or publishing after completion

### Smart Contract Errors
- **Insufficient gas**: Provide gas estimation in UI before transaction
- **Transaction reverted**: Parse revert reason and display user-friendly message
- **Network mismatch**: Verify user is on correct network before transaction
- **Signature rejected**: Handle user rejection gracefully, return to previous state

### Divvi Integration Errors
- **submitReferral failure**: Log error, continue game flow (non-blocking)
- **Invalid referral tag**: Log warning, attempt transaction without tag
- **Network timeout**: Retry with exponential backoff, max 3 attempts

### WebSocket Errors
- **Connection lost**: Attempt reconnection with exponential backoff
- **Message delivery failure**: Queue messages and retry on reconnection
- **Invalid event data**: Log error, ignore malformed messages

### Timeout Handling
- **Consent timeout (30s)**: Cancel match, return both players to queue, notify both
- **Rematch timeout (30s)**: Return both players to queue if not both accepted
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

### WebSocket Optimization
- Use Socket.IO rooms for efficient broadcasting
- Implement connection pooling
- Compress large payloads

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

### WebSocket Security
- Authenticate socket connections
- Validate all incoming messages
- Implement message rate limiting
- Prevent message spoofing

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
- Queue sizes per network
- Average wait time for match
- Match completion rate
- Transaction success rate
- WebSocket connection count
- API response times
- Error rates by endpoint

### Logging
- Log all queue operations
- Log all match series events
- Log all smart contract interactions
- Log Divvi submission attempts
- Log WebSocket events

### Alerts
- Alert on high error rates
- Alert on queue size exceeding threshold
- Alert on smart contract failures
- Alert on WebSocket connection issues
- Alert on database performance degradation

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

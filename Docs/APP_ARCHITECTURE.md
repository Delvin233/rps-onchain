# RPS-ONCHAIN - Complete Architecture & User Flow Analysis

## 🏗️ Architecture Overview

The app uses a **hybrid storage architecture** combining:
- **Redis** (via Upstash/Vercel KV) - Real-time game state & fast stats
- **IPFS** (via Pinata) - Permanent match history storage
- **Turso** (SQLite) - Persistent blockchain proof storage
- **Vercel Edge Config** - User match hash pointers
- **Smart Contracts** (Celo/Base) - On-chain game verification
- **LocalStorage** - Client-side backup & caching

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER ROUTING                         │
├─────────────────────────────────────────────────────────────────┤
│  Game State → Redis (1hr TTL)                                   │
│  Stats → Redis (permanent) + IPFS (daily sync)                  │
│  Match History → Redis (7 days) + IPFS (permanent)              │
│  Blockchain Proofs → Turso (permanent, 5GB storage)             │
│  Match Pointers → Edge Config (permanent)                       │
│  Backup → LocalStorage (50 matches)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Complete User Flow

### **1. SINGLE PLAYER MODE (AI)**

#### Flow:
```
User → /play → /play/single → Choose Move → AI Response → Result
```

#### Technical Steps:

1. **User selects move** (`/app/play/single/page.tsx`)
   - Calls `/api/play-ai` with `{ playerMove, address }`

2. **AI generates move** (`/api/play-ai/route.ts`)
   - Random AI move selection
   - Determines winner
   - Calls `/api/stats-fast` to update stats

3. **Stats update** (`/api/stats-fast/route.ts`)
   ```javascript
   // Redis operations:
   - GET stats:${address}
   - UPDATE totalGames, wins/losses/ties, winRate
   - SET stats:${address}
   - LPUSH history:${address} (match data)
   - LTRIM history:${address} 0 99 (keep last 100)
   ```

4. **Result displayed**
   - Win/Loss/Tie shown
   - Stats updated instantly via Redis
   - Match stored in Redis history

#### Data Storage:
- **Redis**: `stats:${address}` - Instant stats
- **Redis**: `history:${address}` - Last 100 matches (7-day TTL)
- **IPFS**: Auto-synced when Redis reaches 100 matches + daily cron job

---

### **2. MULTIPLAYER MODE (PvP)**

#### Flow:
```
Creator → Create Room → Share Code → Joiner → Join Room → 
Both Submit Moves → Reveal → Result → IPFS Storage → Optional On-chain Publish
```

#### Technical Steps:

**A. Room Creation** (`/app/play/multiplayer/page.tsx`)

1. User clicks "Create Room"
2. Calls `/api/room/create` with `{ creator, betAmount: "0", isFree: true }`
3. **Redis Storage** (`/lib/roomStorage.ts`):
   ```javascript
   room:${roomId} = {
     roomId: "ABC123",
     creator: "0x...",
     joiner: null,
     status: "waiting",
     isFree: true,
     createdAt: timestamp,
     // TTL: 1 hour
   }
   ```
4. **Smart Contract Call** (`RPSOnline.sol`):
   ```solidity
   createGame(roomId) // On-chain room registration
   ```
5. Redirect to `/game/multiplayer/${roomId}`

**B. Room Joining**

1. Joiner enters 6-character room code
2. App checks room info via `/api/room/info`
3. Displays creator info + verification status
4. Calls `/api/room/join` with `{ roomId, joiner, joinerVerified }`
5. **Redis Update**:
   ```javascript
   room.joiner = joinerAddress
   room.joinerVerified = true/false
   room.status = "ready"
   ```
6. **Smart Contract Call**:
   ```solidity
   joinGame(roomId) // On-chain join confirmation
   ```

**C. Game Play** (`/app/game/multiplayer/[roomId]/page.tsx`)

1. **Both players select moves**
   - Calls `/api/room/submit-move` with `{ roomId, player, move }`
   - **Redis Storage**:
     ```javascript
     room.creatorMove = "rock"
     room.status = "playing"
     ```

2. **When both moves submitted** (`/api/room/submit-move/route.ts`):
   ```javascript
   // Determine winner
   room.creatorResult = determineWinner(creatorMove, joinerMove)
   room.joinerResult = determineWinner(joinerMove, creatorMove)
   room.status = "finished"
   
   // Store to IPFS
   matchData = {
     roomId,
     players: { creator, joiner },
     moves: { creatorMove, joinerMove },
     result: { winner, timestamp }
   }
   
   // Call /api/user-stats for BOTH players
   // This updates their IPFS match history
   ```

3. **IPFS Storage Flow** (`/api/user-stats/route.ts`):
   ```javascript
   // For each player:
   1. GET current IPFS hash from Edge Config
   2. FETCH existing matches from IPFS (if hash exists)
   3. ADD new match to array
   4. CALCULATE updated stats (wins/losses/ties/winRate)
   5. UPLOAD to Pinata IPFS:
      - Content: { address, matches[], stats, updatedAt }
      - Returns: new IPFS hash
   6. UNPIN old IPFS file (cleanup)
   7. UPDATE Edge Config with new hash
   ```

4. **Match Storage** (`/api/store-match/route.ts`):
   ```javascript
   // Parallel storage:
   
   // 1. IPFS (Pinata)
   - Upload match JSON to Pinata
   - Get IPFS hash (e.g., "QmXxx...")
   
   // 2. Redis (fast access)
   - LPUSH history:${creator} (match data)
   - LPUSH history:${joiner} (match data)
   - LTRIM to keep last 50 matches
   - EXPIRE 7 days
   - UPDATE stats:${creator}
   - UPDATE stats:${joiner}
   
   // 3. LocalStorage (client backup)
   - Store in rps_matches array
   - Keep last 50 matches
   ```

5. **Polling for Status** (`/api/room/status/route.ts`):
   - Frontend polls every 500ms
   - Checks room status in Redis
   - Returns game state, moves, results when finished

**D. Post-Game Options**

1. **Publish to Blockchain** (Optional):
   ```javascript
   // User can publish match on-chain
   publishMatch(roomId, winner, creatorMove, joinerMove) // Smart contract call
   
   // Store blockchain proof in Turso
   const matchKey = `${roomId}_${creatorMove}_${joinerMove}_${timestamp}`
   await fetch('/api/store-blockchain-proof', {
     method: 'POST',
     body: JSON.stringify({ roomId, matchKey, txHash, chainId })
   })
   
   // Costs gas but creates permanent on-chain record
   // Each match can be published independently (per-match publishing)
   ```

2. **Rematch System**:
   ```javascript
   // /api/room/rematch
   - Player requests rematch
   - room.rematchRequested = playerAddress
   - Other player accepts
   - room.status = "ready"
   - Moves reset, game restarts
   ```

3. **Tip Opponent** (GoodDollar):
   ```javascript
   // Send G$ tokens to opponent
   ERC20.transfer(opponent, amount)
   ```

---

## 🗄️ Storage Systems Deep Dive

### **1. Redis (Upstash/Vercel KV)**

**Purpose**: Real-time game state & fast stats

**Data Structures**:

```javascript
// Room State (1 hour TTL)
room:${roomId} = {
  roomId: string,
  creator: address,
  joiner: address | null,
  creatorMove: "rock" | "paper" | "scissors" | null,
  joinerMove: "rock" | "paper" | "scissors" | null,
  status: "waiting" | "ready" | "playing" | "finished",
  isFree: boolean,
  creatorResult: "win" | "lose" | "tie",
  joinerResult: "win" | "lose" | "tie",
  rematchRequested: address | null,
  playerLeft: address | null,
  ipfsHash: string,
  createdAt: timestamp
}

// Player Stats (permanent)
stats:${address} = {
  totalGames: number,
  wins: number,
  losses: number,
  ties: number,
  winRate: number (percentage)
}

// Match History (7 day TTL)
history:${address} = [
  { timestamp, result, player, opponent, moves... },
  // Last 100 matches
]
```

**Operations**:
- `GET/SET` - Room state & stats
- `LPUSH/LTRIM` - Match history lists
- `EXPIRE` - Auto-cleanup old data
- `KEYS` - List all rooms (for cleanup cron)

**Files**:
- `/lib/roomStorage.ts` - Room operations
- `/lib/upstash.ts` - Redis client
- `/api/room/*` - Room management APIs
- `/api/stats-fast/route.ts` - Fast stats access

---

### **2. IPFS (Pinata)**

**Purpose**: Permanent, decentralized match history

**Data Structure**:

```javascript
// User Match History File
{
  address: "0x...",
  matches: [
    {
      roomId: "ABC123",
      players: { creator: "0x...", joiner: "0x..." },
      moves: { creatorMove: "rock", joinerMove: "scissors" },
      result: { winner: "0x...", timestamp: 1234567890 },
      betAmount: "0",
      ipfsHash: "QmXxx..." // Individual match hash
    },
    // ... up to 100 matches
  ],
  stats: {
    totalGames: 42,
    wins: 25,
    losses: 15,
    ties: 2,
    winRate: 59
  },
  updatedAt: "2024-01-15T10:30:00Z"
}
```

**Storage Flow**:

1. **Match Completion** → `/api/user-stats/route.ts`
2. **Fetch Current Data** → `GET https://gateway.pinata.cloud/ipfs/${hash}`
3. **Append New Match** → Add to matches array
4. **Recalculate Stats** → Update win/loss/tie counts
5. **Upload to Pinata** → `POST https://api.pinata.cloud/pinning/pinJSONToIPFS`
6. **Get New Hash** → `QmNewHash...`
7. **Unpin Old File** → `DELETE https://api.pinata.cloud/pinning/unpin/${oldHash}`
8. **Update Pointer** → Store new hash in Edge Config

**Files**:
- `/lib/pinataStorage.ts` - IPFS utilities
- `/api/store-match/route.ts` - Match storage
- `/api/user-stats/route.ts` - User history updates
- `/api/user-matches/route.ts` - Hash pointer management

**Pinata API Endpoints**:
- `pinJSONToIPFS` - Upload JSON data
- `pinFileToIPFS` - Upload file data
- `unpin/${hash}` - Remove old pins
- Gateway: `https://gateway.pinata.cloud/ipfs/${hash}`

---

### **3. Vercel Edge Config**

**Purpose**: Fast, global key-value store for IPFS hash pointers

**Data Structure**:

```javascript
// Key-Value pairs
matches_0x1234... = "QmXxx..." // Latest IPFS hash for user
matches_0x5678... = "QmYyy..."
verification_0xabcd... = true/false // Self Protocol verification
```

**Operations**:

```javascript
// Read (via @vercel/edge-config)
import { get } from '@vercel/edge-config'
const hash = await get(`matches_${address}`)

// Write (via Vercel API)
await fetch(`https://api.vercel.com/v1/edge-config/${id}/items`, {
  method: 'PATCH',
  body: JSON.stringify({
    items: [{ operation: 'upsert', key, value }]
  })
})
```

**Why Edge Config?**
- Global CDN distribution
- Sub-10ms read latency
- No database needed
- Perfect for hash pointers

**Files**:
- `/lib/edgeConfigClient.ts` - Update operations
- `/api/user-matches/route.ts` - GET/POST hash pointers

---

### **4. Turso (SQLite Database)**

**Purpose**: Persistent blockchain proof storage

**Data Structure**:

```sql
CREATE TABLE blockchain_proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_key TEXT UNIQUE NOT NULL,
  room_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Storage Flow**:

1. **Match Published** → User clicks "Publish Latest Match"
2. **Smart Contract Call** → `publishMatch(roomId, winner, moves)`
3. **Get Transaction Hash** → Blockchain returns tx hash
4. **Store in Turso** → `POST /api/store-blockchain-proof`
   ```javascript
   {
     roomId: "ABC123",
     matchKey: "ABC123_rock_scissors_1234567890",
     txHash: "0xabc...",
     chainId: "42220"
   }
   ```
5. **Query Proofs** → `GET /api/store-blockchain-proof?roomId=ABC123`

**Why Turso?**
- 5GB free storage (vs Redis temporary)
- Persistent across deployments
- Fast SQLite queries
- No block range limitations
- Supports per-match publishing (unique matchKey)

**Files**:
- `/lib/turso.ts` - Turso client & table initialization
- `/api/store-blockchain-proof/route.ts` - Store/fetch proofs
- `/app/on-chain-matches/page.tsx` - Query database for room IDs

---

### **5. LocalStorage (Client-Side)**

**Purpose**: Backup & offline access

**Data Structure**:

```javascript
// rps_matches array
localStorage.setItem('rps_matches', JSON.stringify([
  {
    roomId: "ABC123",
    players: { creator, joiner },
    games: [
      { creatorMove, joinerMove, winner, timestamp, ipfsHash }
    ]
  },
  // ... last 50 matches
]))
```

**Operations**:
- `getLocalMatches()` - Retrieve all matches
- `storeMatchLocally()` - Add new match
- Merged with IPFS data on history page

**Files**:
- `/lib/pinataStorage.ts` - LocalStorage utilities
- `/app/history/page.tsx` - Display merged data

---

## 🔄 Data Synchronization

### **Real-time Sync (During Game)**

```
User Action → Redis Update → 500ms Polling → UI Update
```

### **IPFS Sync (Post-Game)**

```
Match End → Redis Storage → IPFS Upload → Edge Config Update → LocalStorage Backup
```

### **Daily Sync (Cron Job)**

```javascript
// /api/cron/sync-all/route.ts
// Runs daily to sync Redis stats to IPFS
1. Get all users from Redis
2. For each user:
   - Fetch Redis stats
   - Fetch Redis history
   - Upload to IPFS
   - Update Edge Config
```

---

## 📱 History Page Flow

**User visits `/history`**:

1. **Instant Load** - LocalStorage
   - Shows last 50 matches immediately
   - No loading spinner for instant UX

2. **Fetch Server Data** - `/api/history`
   - **Redis**: Last 100 matches (7-day TTL)
   - **IPFS**: All matches via Edge Config hash
   - Runs in parallel

3. **Merge & Deduplicate**:
   ```javascript
   // Combine all sources
   allMatches = [...localStorage, ...redis, ...ipfs]
   
   // Deduplicate by unique key
   uniqueKey = `${roomId}-${player}-${opponent}`
   
   // Sort by timestamp (newest first)
   ```

4. **Filter & Display**:
   - Filter matches where user is player
   - **AI Matches**: Single game cards
   - **Multiplayer Matches**: Expandable room cards
     - Shows all games in that room
     - Collapse/expand for rooms with 5+ games
     - IPFS links for each game

5. **IPFS Sync Button**:
   - Manually trigger sync to IPFS
   - Calls `/api/sync-ipfs` → uploads current stats

**Data Sources** (in order):
1. **LocalStorage** - Instant, last 50 matches
2. **Redis** - Fast via `/api/history`, last 100 matches (7-day TTL)
3. **IPFS** - Permanent via Edge Config hash pointer
4. **Merge & Deduplicate** - All sources combined, sorted by timestamp

---

## 🔐 Verification System (Self Protocol)

**Purpose**: Verify users are real humans

**Flow**:

1. **User Verification**:
   - User clicks verify button
   - QR code generated via `@selfxyz/qrcode`
   - User scans with Self app
   - Self Protocol verifies identity (age 18+, no OFAC)
   - Callback to `/api/verify/route.ts`
   - Store in Edge Config: `verified_${address} = { verified: true, proof, timestamp }`

2. **Room Creation/Joining**:
   - Check verification status via `/api/check-verification`
   - Display shield icon (🛡️) for verified users
   - Toast notification to opponent if verified
   - Stored in room data: `creatorVerified`, `joinerVerified`

**Storage**:
- Edge Config stores verification proofs permanently
- Key format: `verified_${address.toLowerCase()}`
- Includes full proof data and timestamp

**Files**:
- `/hooks/useSelfProtocol.ts` - QR code generation & polling
- `/components/SelfVerificationModal.tsx` - Verification UI
- `/api/verify/route.ts` - Verification callback (stores in Edge Config)
- `/api/check-verification/route.ts` - Status check (reads from Edge Config)

---

## 🎯 Smart Contract Integration

**Contract**: `RPSOnline.sol` (Celo + Base)

**Functions Used**:

```solidity
// Room Management
createGame(roomId) - Register room on-chain
joinGame(roomId) - Join existing room
cancelGame(roomId) - Cancel waiting room

// Match Publishing (Optional)
publishMatch(roomId, winner) - Store result on-chain

// View Functions
getGame(roomId) - Get game state
getMatchHistory(roomId) - Get all matches
getRoomStats(roomId) - Get room statistics
```

**Why Hybrid (Off-chain + On-chain)?**
- **Off-chain (Redis/IPFS)**: Fast, free, scalable
- **On-chain (Smart Contract)**: Verifiable, permanent, trustless
- Users choose when to pay gas for on-chain publishing

**Files**:
- `/contracts/RPSOnline.sol` - Smart contract
- `/hooks/scaffold-eth/useScaffoldWriteContract.ts` - Contract calls
- `/app/game/multiplayer/[roomId]/page.tsx` - Contract integration

---

## 🔄 Rematch System

**Flow**:

1. **Player 1 requests rematch**:
   ```javascript
   POST /api/room/rematch
   { roomId, player, action: "request" }
   // Redis: room.rematchRequested = player1Address
   ```

2. **Player 2 sees notification**:
   - Polling detects `rematchRequested !== null`
   - Toast notification shown

3. **Player 2 accepts**:
   ```javascript
   POST /api/room/rematch
   { roomId, player, action: "accept" }
   // Redis: Reset moves, status = "ready"
   ```

4. **Game restarts**:
   - Same room, same players
   - New round begins
   - All games stored in same room history

**Unlimited Rematches**: No limit on games per room

---

## 📊 Stats Calculation

**Real-time (Redis)**:

```javascript
// After each game
stats.totalGames++
if (result === "win") stats.wins++
else if (result === "lose") stats.losses++
else stats.ties++
stats.winRate = Math.round((wins / totalGames) * 100)
```

**IPFS (Permanent)**:

```javascript
// When syncing to IPFS
const userMatches = matches.filter(m => 
  m.players?.creator === address || 
  m.players?.joiner === address || 
  m.player === address
)
const wins = userMatches.filter(m => m.result.winner === address).length
const ties = userMatches.filter(m => m.result.winner === "tie").length
const losses = userMatches.length - wins - ties
```

---

## 🚀 Performance Optimizations

1. **Redis Caching**:
   - Room state: 1 hour TTL
   - Stats: Permanent, instant access
   - History: 7 days, last 100 matches

2. **Edge Config**:
   - Global CDN for hash pointers
   - Sub-10ms latency worldwide

3. **LocalStorage**:
   - Instant history page load
   - No API calls needed

4. **Polling Optimization**:
   - 500ms interval during game
   - Pauses when tab hidden
   - Stops after game ends

5. **IPFS Optimization**:
   - Only store last 100 matches
   - Unpin old files to save storage
   - Daily batch sync for efficiency

---

## 🔧 Environment Variables

```bash
# Redis (Upstash/Vercel KV)
REDIS_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# IPFS (Pinata)
PINATA_JWT=eyJ...
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud

# Turso (SQLite Database)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...

# Edge Config (Vercel)
EDGE_CONFIG=https://edge-config.vercel.com/...
EDGE_CONFIG_ID=ecfg_...
VERCEL_API_TOKEN=...

# Smart Contracts
DEPLOYER_PRIVATE_KEY=0x...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

---

## 📁 Key Files Reference

### Storage Layer
- `/lib/upstash.ts` - Redis client
- `/lib/roomStorage.ts` - Room operations
- `/lib/pinataStorage.ts` - IPFS utilities
- `/lib/turso.ts` - Turso database client
- `/lib/edgeConfigClient.ts` - Edge Config updates
- `/lib/userStore.ts` - In-memory username cache

### API Routes
- `/api/room/*` - Room management (create/join/status/submit-move)
- `/api/play-ai/route.ts` - AI game logic
- `/api/stats-fast/route.ts` - Redis stats
- `/api/user-stats/route.ts` - IPFS stats sync
- `/api/user-matches/route.ts` - Hash pointer management
- `/api/store-match/route.ts` - Match storage
- `/api/store-blockchain-proof/route.ts` - Blockchain proof storage (Turso)
- `/api/verify/route.ts` - Self Protocol verification callback
- `/api/check-verification/route.ts` - Check verification status
- `/api/resolve-name/route.ts` - ENS/Basename resolution
- `/api/cron/sync-all/route.ts` - Daily IPFS sync

### Frontend Pages
- `/app/play/page.tsx` - Mode selection
- `/app/play/single/page.tsx` - AI game
- `/app/play/multiplayer/page.tsx` - Room create/join
- `/app/game/multiplayer/[roomId]/page.tsx` - Game interface
- `/app/history/page.tsx` - Match history
- `/app/on-chain-matches/page.tsx` - Published blockchain matches

### Hooks
- `/hooks/usePlayerStats.ts` - Fetch user stats
- `/hooks/useIPFSSync.ts` - Manual IPFS sync
- `/hooks/useSelfProtocol.ts` - Verification

---

## 🎯 Summary

**The app uses a 5-tier storage strategy**:

1. **Redis** - Real-time game state (1hr) + fast stats (permanent)
2. **IPFS** - Permanent match history (decentralized)
3. **Turso** - Persistent blockchain proofs (5GB SQLite)
4. **Edge Config** - Global hash pointers (fast lookups)
5. **LocalStorage** - Client backup (instant access)

**Data flows**:
- **During game**: Redis only (fast)
- **After game**: Redis → IPFS → Edge Config → LocalStorage
- **History page**: LocalStorage + Redis + IPFS (merged & deduplicated)
- **Stats**: Redis (instant), IPFS (permanent backup)

**Why this architecture?**:
- ✅ Fast gameplay (Redis)
- ✅ Permanent records (IPFS + Turso)
- ✅ Blockchain verification (Turso proofs)
- ✅ No block range limits (Turso database)
- ✅ Global access (Edge Config)
- ✅ Offline capability (LocalStorage)
- ✅ Cost-effective (minimal on-chain)
- ✅ Scalable (distributed storage)

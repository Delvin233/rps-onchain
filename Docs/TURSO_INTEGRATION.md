# Turso Database Integration - Blockchain Proof Storage

## 🎯 Purpose

Turso provides **persistent blockchain proof storage** for published matches, solving the limitation of scanning only recent blocks on the blockchain.

---

## 🏗️ Architecture

### **Problem Solved**

Before Turso:
- On-chain matches page scanned last 10,000 blocks only
- Old published matches were invisible
- No persistent record of transaction hashes

After Turso:
- All published matches stored permanently
- Query database for room IDs, then fetch from blockchain
- No block range limitations
- 5GB free storage

---

## 📊 Database Schema

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

### **Field Descriptions**

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `match_key` | TEXT | Unique identifier: `${roomId}_${creatorMove}_${joinerMove}_${timestamp}` |
| `room_id` | TEXT | 6-character room code |
| `tx_hash` | TEXT | Blockchain transaction hash |
| `chain_id` | INTEGER | Network ID (42220=Celo, 8453=Base) |
| `timestamp_ms` | INTEGER | Unix timestamp in milliseconds |
| `created_at` | DATETIME | Auto-generated creation timestamp |

---

## 🔄 Data Flow

### **Publishing a Match**

```
User clicks "Publish Latest Match"
  ↓
Smart Contract Call: publishMatch(roomId, winner, moves)
  ↓
Get Transaction Hash from blockchain
  ↓
POST /api/store-blockchain-proof
  ↓
Store in Turso with unique matchKey
  ↓
SessionStorage: published_${baseMatchKey} = true
```

### **Viewing On-Chain Matches**

```
User visits /on-chain-matches
  ↓
GET /api/store-blockchain-proof (fetch all proofs)
  ↓
Group by roomId + chainId
  ↓
For each room: fetch getMatchHistory() from blockchain
  ↓
Display all published matches with filters
```

---

## 💻 Implementation

### **1. Turso Client** (`/lib/turso.ts`)

```typescript
import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function initBlockchainProofsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS blockchain_proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_key TEXT UNIQUE NOT NULL,
      room_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
```

### **2. Store Blockchain Proof** (`/api/store-blockchain-proof/route.ts`)

**POST - Store Proof:**

```typescript
export async function POST(req: Request) {
  const { roomId, matchKey, txHash, chainId } = await req.json();
  
  await turso.execute({
    sql: `INSERT INTO blockchain_proofs 
          (match_key, room_id, tx_hash, chain_id, timestamp_ms) 
          VALUES (?, ?, ?, ?, ?)`,
    args: [matchKey, roomId, txHash, parseInt(chainId), Date.now()],
  });
  
  return NextResponse.json({ success: true });
}
```

**GET - Fetch Proofs:**

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  
  const result = await turso.execute({
    sql: roomId 
      ? "SELECT * FROM blockchain_proofs WHERE room_id = ? ORDER BY timestamp_ms DESC"
      : "SELECT * FROM blockchain_proofs ORDER BY timestamp_ms DESC",
    args: roomId ? [roomId] : [],
  });
  
  return NextResponse.json({ proofs: result.rows });
}
```

### **3. Publish Match** (`/app/game/multiplayer/[roomId]/page.tsx`)

```typescript
const publishMatch = async () => {
  const matchKey = `${roomId}_${gameData.creatorMove}_${gameData.joinerMove}_${Date.now()}`;
  const baseMatchKey = `${roomId}_${gameData.creatorMove}_${gameData.joinerMove}`;
  
  // Smart contract call
  const tx = await publishMatchContract({
    functionName: "publishMatch",
    args: [roomId, winner, gameData.creatorMove, gameData.joinerMove],
  });
  
  // Store in Turso
  if (tx && chainId) {
    await fetch("/api/store-blockchain-proof", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        matchKey,
        txHash: tx,
        chainId: chainId.toString(),
      }),
    });
    
    // Mark as published
    sessionStorage.setItem(`published_${baseMatchKey}`, "true");
    setIsMatchPublished(true);
  }
};
```

### **4. On-Chain Matches Page** (`/app/on-chain-matches/page.tsx`)

```typescript
const fetchAllMatches = async () => {
  // Fetch published room IDs from Turso
  const dbResponse = await fetch("/api/store-blockchain-proof");
  const dbData = await dbResponse.json();
  
  const publishedRooms = new Map();
  dbData.proofs?.forEach((proof: any) => {
    const key = `${proof.room_id}_${proof.chain_id}`;
    if (!publishedRooms.has(key)) {
      publishedRooms.set(key, {
        roomId: proof.room_id,
        chainId: proof.chain_id,
        txHash: proof.tx_hash,
      });
    }
  });
  
  // Fetch match history from blockchain for each room
  for (const { roomId, txHash, chainId } of publishedRooms.values()) {
    const matchHistory = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getMatchHistory",
      args: [roomId],
    });
    // Display matches...
  }
};
```

---

## 🔑 Key Features

### **1. Per-Match Publishing**

Each match gets a unique `matchKey`:
```
${roomId}_${creatorMove}_${joinerMove}_${timestamp}
```

**Benefits:**
- Multiple matches per room can be published
- No duplicate publishes (UNIQUE constraint)
- Rematches tracked independently

### **2. Match Published State**

**Base Match Key** (without timestamp):
```
${roomId}_${creatorMove}_${joinerMove}
```

**Stored in sessionStorage:**
```typescript
sessionStorage.setItem(`published_${baseMatchKey}`, "true");
```

**Checked on game finish:**
```typescript
const published = sessionStorage.getItem(`published_${baseMatchKey}`) === "true";
setIsMatchPublished(published);
```

**Result:**
- Button shows "Match Published" after publishing
- Each rematch (different moves) can be published independently
- State persists during browser session

### **3. No Block Range Limits**

**Before:**
- Scan last 10,000 blocks for `MatchFinished` events
- Old matches invisible

**After:**
- Query Turso for all published room IDs
- Fetch specific rooms from blockchain
- All matches visible regardless of age

---

## 🚀 Setup

### **1. Create Turso Database**

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create rps-onchain

# Get connection URL
turso db show rps-onchain

# Create auth token
turso db tokens create rps-onchain
```

### **2. Environment Variables**

```bash
TURSO_DATABASE_URL=libsql://database-name.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

### **3. Initialize Table**

```bash
cd packages/nextjs
node --env-file=../../.env.development.local -e "
const { createClient } = require('@libsql/client');
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

client.execute(\`
  CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_key TEXT UNIQUE NOT NULL,
    room_id TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
\`).then(() => console.log('✅ Table created'));
"
```

---

## 📊 Query Examples

### **Get All Proofs**

```typescript
const result = await turso.execute(
  "SELECT * FROM blockchain_proofs ORDER BY timestamp_ms DESC"
);
```

### **Get Proofs for Room**

```typescript
const result = await turso.execute({
  sql: "SELECT * FROM blockchain_proofs WHERE room_id = ? ORDER BY timestamp_ms DESC",
  args: [roomId],
});
```

### **Get Proofs by Chain**

```typescript
const result = await turso.execute({
  sql: "SELECT * FROM blockchain_proofs WHERE chain_id = ? ORDER BY timestamp_ms DESC",
  args: [42220], // Celo
});
```

### **Count Total Proofs**

```typescript
const result = await turso.execute(
  "SELECT COUNT(*) as count FROM blockchain_proofs"
);
```

---

## 🎯 Benefits

### **Persistence**
- ✅ Survives deployments (unlike Redis)
- ✅ 5GB free storage
- ✅ No TTL expiration

### **Performance**
- ✅ Fast SQLite queries
- ✅ Indexed by match_key (UNIQUE)
- ✅ No blockchain scanning needed

### **Scalability**
- ✅ Handles unlimited published matches
- ✅ Efficient queries with indexes
- ✅ Low latency globally

### **Reliability**
- ✅ UNIQUE constraint prevents duplicates
- ✅ Automatic timestamps
- ✅ Transaction support

---

## 🔧 Maintenance

### **Database Size**

```typescript
// Check database size
const result = await turso.execute(
  "SELECT COUNT(*) as total FROM blockchain_proofs"
);
console.log(`Total proofs: ${result.rows[0].total}`);
```

### **Cleanup Old Proofs** (Optional)

```typescript
// Delete proofs older than 1 year
await turso.execute(
  "DELETE FROM blockchain_proofs WHERE timestamp_ms < ?",
  [Date.now() - 365 * 24 * 60 * 60 * 1000]
);
```

---

## 📚 Related Files

- `/lib/turso.ts` - Turso client
- `/api/store-blockchain-proof/route.ts` - Store/fetch API
- `/app/game/multiplayer/[roomId]/page.tsx` - Publish match
- `/app/on-chain-matches/page.tsx` - Display matches
- `/contracts/RPSOnline.sol` - Smart contract

---

## 🎉 Summary

Turso integration provides:
- ✅ **Persistent storage** for blockchain proofs
- ✅ **No block limits** - all published matches visible
- ✅ **Per-match publishing** - unlimited rematches
- ✅ **Fast queries** - SQLite performance
- ✅ **Free tier** - 5GB storage included

**Result:** Complete blockchain verification history with no limitations! 🚀

# Filecoin Integration Setup

This project integrates with Filecoin/IPFS to store match records in a decentralized manner, perfect for hackathon requirements.

## 🔧 Quick Setup

### Option 1: Pinata (Recommended)
1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Generate a JWT token from your API keys
3. Add to `.env.local`:
   ```
   PINATA_JWT=your_jwt_token_here
   ```

### Option 2: Demo Mode (No Setup)
- Works out of the box with deterministic hashes
- Perfect for testing and demos
- No real IPFS storage

## 🎯 Features

- **Automatic Storage**: Match results stored on IPFS after each game
- **Multiple Providers**: Pinata primary, web3.storage fallback, demo mode
- **Match History**: View all your games with IPFS links
- **Decentralized**: Records stored permanently on Filecoin network

## 🔍 How It Works

1. **Game Completion**: When a match finishes, data is automatically stored
2. **IPFS Upload**: Match record uploaded to IPFS via configured provider
3. **Local Backup**: Copy stored locally for quick access
4. **History View**: Browse all matches with IPFS verification links

## 📊 Match Record Format

```json
{
  "roomId": "ABC123",
  "players": {
    "creator": "0x...",
    "joiner": "0x..."
  },
  "moves": {
    "creatorMove": "rock",
    "joinerMove": "paper"
  },
  "result": {
    "winner": "0x...",
    "timestamp": 1234567890
  },
  "betAmount": "0.01",
  "ipfsHash": "QmXXX...",
  "provider": "pinata"
}
```

## 🚀 Verification

- Visit `/history` to see stored matches
- Click "VIEW ON IPFS" to verify decentralized storage
- Each match gets a permanent IPFS hash

## 🏆 Hackathon Benefits

- ✅ Decentralized storage requirement met
- ✅ Filecoin network integration
- ✅ Permanent game records
- ✅ Verifiable match history
- ✅ No centralized database dependency
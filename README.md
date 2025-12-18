# RPS-onChain

![RPS-onChain](packages/nextjs/public/rpsOnchainLogo.png)
A free-to-play decentralized Rock Paper Scissors game with AI and multiplayer modes. Multi-chain support (Celo + Base). Built with scaffold-eth-2.

### Available on Farcaster at: https://farcaster.xyz/miniapps/e7MMsOYu-YxM/rps-onchain

## Game Features

- **Wallet Authentication**: Reown AppKit + Wagmi integration
- **Human Verification**: Self Protocol onchain identity verification
- **Free to Play**: No betting, just pure fun
- **Single Player**: Play against AI instantly
- **Multiplayer**: Create/join rooms with 6-character codes
- **Unlimited Rematches**: Play again and again with friends
- **Match History**: Persistent storage via Turso + IPFS backup
- **Blockchain Verification**: Optional on-chain match publishing
- **On-Chain Matches**: View all published matches with filters
- **Gaming UI**: Neon aesthetics with smooth animations
- **Stats Tracking**: Win/loss records stored in Turso database
- **PWA Support**: Install as mobile app with offline capabilities

## 🏗 Project Structure

```
packages/
├── hardhat/          # Smart contracts & deployment
│   ├── contracts/    # Solidity contracts (RPSOnline.sol)
│   ├── deploy/       # Deployment scripts
│   └── scripts/      # Utility scripts
├── nextjs/           # Frontend application
│   ├── app/          # Next.js 13+ app directory
│   │   ├── game/     # Game interface pages
│   │   ├── history/  # Match history page
│   │   ├── play/     # Room creation/joining
│   │   └── api/      # Backend API routes
│   ├── components/   # React components (Header, SelfQRCode)
│   ├── hooks/        # Custom hooks (useRPSContract)
│   ├── lib/          # Storage utilities & verification
│   └── utils/        # Game utilities (hashing, moves)
└── contracts/        # Self Protocol verification contracts
    ├── src/          # Solidity contracts (RPSProofOfHuman.sol)
    ├── script/       # Foundry deployment scripts
    └── lib/          # Self Protocol dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn or pnpm

### Installation & Setup

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Start local blockchain**

   ```bash
   yarn chain
   ```

   Keep this terminal open - it runs your local Hardhat network.

3. **Deploy contracts** (in a new terminal)

   ```bash
   yarn deploy
   ```

   This deploys the RPSOnline contract to your local network.

4. **Start frontend** (in a new terminal)
   ```bash
   yarn start
   ```
   Frontend runs on `http://localhost:3000`

## 🔐 Human Verification System

RPS OnChain uses Self Protocol to ensure only verified humans can play, preventing bot abuse and maintaining fair gameplay.

### Verification Process

1. **Connect Wallet**: Connect your Web3 wallet (MetaMask, MiniPay, etc.)
2. **Scan QR Code**: Use the Self mobile app to scan the verification QR code
3. **Prove Identity**: Self Protocol verifies your identity using zero-knowledge proofs
4. **Onchain Verification**: Your verification status is recorded on Celo blockchain
5. **Play Games**: Access all game features once verified

### Technical Architecture

- **Blockchain-First**: Verification status checked from Celo smart contract
- **Database Fallback**: Turso database used if RPC fails (rate limits, timeouts)
- **Performance Optimized**: Hybrid approach ensures fast loading and reliability
- **Privacy Preserving**: Zero-knowledge proofs protect your personal information

### Verification Contract

- **Address**: `0x3e5e80bc7de408f9d63963501179a50b251cbda3`
- **Network**: Celo Mainnet
- **Function**: `isUserVerified(address user) returns (bool)`

## 🎯 How to Play

### How to Play

1. **Connect Wallet**: Use any wallet (MetaMask recommended)
2. **Verify Identity**: Scan QR code with Self app to prove you're human
3. **Choose Mode**: Single Player (AI) or Multiplayer (Free)
4. **Create Room**: Generate 6-character room code
5. **Share Code**: Give the room code to your opponent
6. **Join Room**: Enter room code to join
7. **Choose Move**: Select rock, paper, or scissors
8. **See Results**: Winner determined instantly
9. **Play Again**: Request rematch for unlimited games

### Room Management

- **Cancel Room**: Room creators can cancel unjoined rooms
- **Leave Room**: Exit after game finishes
- **Rematch System**: Request/accept rematches instantly

### Game Rules

- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Same moves = Tie
- All games are free
- Stats tracked on IPFS
- Unlimited rematches available

## 🔧 Development Commands

```bash
# Blockchain
yarn chain          # Start local Hardhat network
yarn deploy         # Deploy contracts to local network
yarn deploy --network celo # Deploy to Celo mainnet
yarn deploy --network base # Deploy to Base mainnet

# Self Protocol Verification (Foundry)
cd contracts
forge build         # Build verification contracts
forge script script/DeployRPSProofOfHuman.s.sol --rpc-url https://forno.celo.org --broadcast

# Frontend
yarn start          # Start Next.js development server
yarn build          # Build for production
yarn lint           # Run ESLint

# Full stack
yarn dev            # Start frontend (same as yarn start)
```

## 📁 Key Files

### Frontend

- `app/page.tsx` - Home page with wallet connect & human verification
- `app/play/page.tsx` - Room creation/joining (free-to-play)
- `app/game/[roomId]/page.tsx` - Game interface with commit-reveal
- `app/history/page.tsx` - Match history with IPFS links
- `components/Header.tsx` - Navigation with username editing
- `components/SelfQRCode.tsx` - Self Protocol verification QR code
- `hooks/useRPSContract.ts` - Smart contract interactions & verification status

### Smart Contracts

- `packages/hardhat/contracts/RPSOnline.sol` - RPS game with commit-reveal
- `packages/hardhat/deploy/00_deploy_rps_online.ts` - Game contract deployment
- `contracts/src/RPSProofOfHuman.sol` - Self Protocol verification contract
- `contracts/script/DeployRPSProofOfHuman.s.sol` - Verification contract deployment

### API Routes

- `app/api/username/route.ts` - Username management
- `app/api/stats-fast/route.ts` - Stats from Turso (direct reads)
- `app/api/store-match/route.ts` - Match storage (Turso + IPFS backup)
- `app/api/user-matches/route.ts` - Query match history from Turso
- `app/api/init-db/route.ts` - Initialize Turso database tables
- `app/api/migrate-data/route.ts` - Migrate Redis data to Turso
- `app/api/store-blockchain-proof/route.ts` - Blockchain proof storage
- `app/api/resolve-name/route.ts` - ENS/Basename resolution
- `app/api/sync-verification/route.ts` - Hybrid blockchain + Turso verification sync
- `app/api/init-verification-table/route.ts` - Initialize verification database table
- `app/api/debug-verification/route.ts` - Debug verification system (development)

### Utilities & Libraries

- `utils/gameUtils.ts` - Move hashing and game logic
- `lib/tursoStorage.ts` - Turso storage layer (users, stats, matches)
- `lib/turso.ts` - Turso SQLite database client with verification tables
- `lib/verification.ts` - Hybrid blockchain + Turso verification utilities
- `lib/pinataStorage.ts` - IPFS storage utilities (Pinata)
- `lib/upstash.ts` - Redis client for active game rooms
- `lib/edgeConfigClient.ts` - Edge Config client
- `contexts/AuthContext.tsx` - Unified authentication context
- `hooks/useGoodDollarClaim.ts` - GoodDollar UBI claim integration
- `styles/colorThemes.ts` - Dynamic color theme system
- `styles/fontThemes.ts` - Dynamic font theme system
- `styles/spacingThemes.ts` - Dynamic spacing scale system

## 🌐 Network Configuration

### **Supported Networks**

**Celo Mainnet:**

- Game Contract: `0xace7999ca29Fc9d3dfDD8D7F99A1366a5cF62091`
- Verification Contract: `0x3e5e80bc7de408f9d63963501179a50b251cbda3`
- RPC: https://forno.celo.org
- Gas Token: CELO or cUSD
- Recommended Wallets: MiniPay, MetaMask

**Base Mainnet:**

- Game Contract: `0x17f238a671CEEa5b6ac9b44E280a42a2Bb080feC`
- RPC: https://mainnet.base.org
- Gas Token: ETH
- Recommended Wallets: Coinbase Wallet, MetaMask

**Local Development:**

- Hardhat network (localhost)

Contract addresses are auto-exported to `contracts/deployedContracts.ts` after deployment.

## ✨ Recent Updates

- ✅ **Self Protocol Onchain Verification**: Hybrid blockchain + Turso verification system
- ✅ **Human Verification Required**: QR code scanning with Self mobile app
- ✅ **Blockchain-First Architecture**: Contract verification with database fallback
- ✅ **Foundry Integration**: Self Protocol smart contract deployment
- ✅ Pivoted to free-to-play model
- ✅ Removed all betting/paid room functionality
- ✅ Gaming UI with neon aesthetics and animations
- ✅ Migrated to Turso as primary database (stats, matches, users, verifications)
- ✅ Redis for active game rooms only (no stats caching)
- ✅ IPFS backup storage via Pinata
- ✅ PWA support with offline capabilities
- ✅ Dynamic theme system (colors, fonts, spacing)
- ✅ Unlimited rematch system
- ✅ On-chain matches page with filters
- ✅ Per-match publishing with ENS/Basename resolution
- ✅ Performance optimizations (84% faster load, 60 FPS locked)
- ✅ GoodDollar UBI daily claims integration
- ✅ Farcaster & Base miniapp support
- ✅ MiniPay integration for Celo

## 🔮 Future Enhancements

- **UX Improvements**: Fix QR code regeneration after successful verification
- **Verification Optimization**: Improve database sync reliability
- Tournament brackets with multi-round matches
- Global leaderboards & player statistics
- Achievement system
- Real-time multiplayer lobbies (Random matchmaking)
- Mobile app development
- Optional betting mode (future)
- Multi-chain verification support (Base, Polygon)

## 🛠 Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript, TailwindCSS
- **Wallet**: Reown AppKit, Wagmi, Viem
- **Blockchain**: Hardhat + Foundry, Solidity
- **Networks**: Celo Mainnet + Base Mainnet (Multi-chain)
- **Database**: Turso SQLite (primary), Redis (active rooms), IPFS (backup)
- **Verification**: Self Protocol (@selfxyz/qrcode, @selfxyz/core)
- **Architecture**: Hybrid blockchain-first with database fallback
- **Themes**: Dynamic color/font/spacing with CSS variables
- **Testing**: Vitest + React Testing Library
- **Payments**: GoodDollar (G$) tipping
- **PWA**: Service Worker with offline support
- **Deployment**: Vercel

## 📝 Environment Variables

Create `.env` files in respective packages:

### `packages/hardhat/.env`

```
DEPLOYER_PRIVATE_KEY=your_private_key
```

### `contracts/.env` (Self Protocol Verification)

```
PRIVATE_KEY=your_private_key_for_foundry_deployment
RPC_URL=https://forno.celo.org
```

### `packages/nextjs/.env.local`

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Turso Database (primary storage)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Redis (caching layer)
REDIS_URL=your_redis_url
KV_URL=your_kv_url
KV_REST_API_TOKEN=your_token
KV_REST_API_URL=your_url

# IPFS (backup storage)
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud

# Edge Config (legacy - being phased out)
EDGE_CONFIG=https://edge-config.vercel.com/...
EDGE_CONFIG_ID=ecfg_...
VERCEL_API_TOKEN=...

# Optional
NEYNAR_API_KEY=your_neynar_key
JWT_SECRET=your_jwt_secret
```

## � Vertification System Setup

### Self Protocol Contract Deployment

1. **Install Foundry** (if not already installed):

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Deploy verification contract**:

   ```bash
   cd contracts
   cp .env.example .env  # Add your PRIVATE_KEY and RPC_URL
   forge script script/DeployRPSProofOfHuman.s.sol --rpc-url https://forno.celo.org --broadcast --verify
   ```

3. **Update frontend configuration**:
   - Contract address is automatically logged during deployment
   - Update `useRPSContract.ts` with the new contract address if needed

### Verification Database Setup

The verification system uses a hybrid approach with automatic table initialization:

1. **Tables auto-created** on first API call to `/api/sync-verification`
2. **Manual initialization** (optional):
   ```bash
   curl -X POST https://your-domain.com/api/init-verification-table
   ```

### Troubleshooting Verification

- **QR Code Issues**: Ensure Self mobile app is installed and updated
- **Contract Issues**: Check Celo network connection and contract address
- **Database Issues**: Use debug endpoint: `GET /api/debug-verification?action=status`
- **Sync Issues**: Verification works without database sync (blockchain-first)

## 🗄️ Database Setup

### First-Time Setup

After deploying to production:

1. **Initialize Turso tables**:

   ```bash
   curl https://your-domain.com/api/init-db
   ```

2. **Migrate existing data** (if upgrading from Redis-only):
   ```bash
   curl -X POST https://your-domain.com/api/migrate-data
   ```

### Database Architecture

- **Turso (Primary)**: Users, stats, matches - persistent, ACID-compliant
- **Redis (Temporary)**: Active game rooms, 7-day match history cache
- **IPFS (Backup)**: Decentralized match storage via Pinata

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to play?** Run `yarn chain`, `yarn deploy`, `yarn start` and visit `http://localhost:3000`!

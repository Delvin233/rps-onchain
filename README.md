# RPS-ONCHAIN

![RPS-ONCHAIN](rps-onchain.jpg)
A free-to-play decentralized Rock Paper Scissors game with AI and multiplayer modes. Built with scaffold-eth-2.

## Game Features

- **Wallet Authentication**: RainbowKit + Wagmi integration
- **Free to Play**: No betting, just pure fun
- **Single Player**: Play against AI instantly
- **Multiplayer**: Create/join rooms with 6-character codes
- **Unlimited Rematches**: Play again and again with friends
- **Match History**: Decentralized storage via IPFS (Pinata)
- **Gaming UI**: Neon aesthetics with smooth animations
- **Stats Tracking**: Win/loss records stored on IPFS

## 🏗 Project Structure

```
packages/
├── hardhat/          # Smart contracts & deployment
│   ├── contracts/    # Solidity contracts (RPSOnline.sol)
│   ├── deploy/       # Deployment scripts
│   └── scripts/      # Utility scripts
└── nextjs/           # Frontend application
    ├── app/          # Next.js 13+ app directory
    │   ├── game/     # Game interface pages
    │   ├── history/  # Match history page
    │   ├── play/     # Room creation/joining
    │   └── api/      # Backend API routes
    ├── components/   # React components (Header)
    ├── hooks/        # Custom hooks (useRPSContract)
    ├── lib/          # Storage utilities
    └── utils/        # Game utilities (hashing, moves)
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

## 🎯 How to Play

### How to Play

1. **Connect Wallet**: Use any wallet (MetaMask recommended)
2. **Choose Mode**: Single Player (AI) or Multiplayer (Free)
3. **Create Room**: Generate 6-character room code
4. **Share Code**: Give the room code to your opponent
5. **Join Room**: Enter room code to join
6. **Choose Move**: Select rock, paper, or scissors
7. **See Results**: Winner determined instantly
8. **Play Again**: Request rematch for unlimited games

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

# Frontend
yarn start          # Start Next.js development server
yarn build          # Build for production
yarn lint           # Run ESLint

# Full stack
yarn dev            # Start frontend (same as yarn start)
```

## 📁 Key Files

### Frontend

- `app/page.tsx` - Home page with wallet connect
- `app/play/page.tsx` - Room creation/joining with betting
- `app/game/[roomId]/page.tsx` - Game interface with commit-reveal
- `app/history/page.tsx` - Match history with IPFS links
- `components/Header.tsx` - Navigation with username editing
- `hooks/useRPSContract.ts` - Smart contract interactions

### Smart Contracts

- `contracts/RPSOnline.sol` - Full RPS game with betting, commit-reveal, and cancellation
- `deploy/00_deploy_rps_online.ts` - Deployment script

### API Routes

- `app/api/username/route.ts` - Username management
- `app/api/store-match/route.ts` - IPFS match storage via Pinata
- `app/api/self-callback/route.ts` - Self Protocol verification callback with Edge Config storage

### Utilities & Libraries

- `utils/gameUtils.ts` - Move hashing and game logic
- `lib/pinataStorage.ts` - IPFS storage utilities (Pinata)
- `lib/edgeConfigClient.ts` - Edge Config client for verification persistence
- `contexts/AuthContext.tsx` - Unified authentication context
- `hooks/useSelfProtocol.ts` - Self Protocol integration with QR code generation

## 🌐 Network Configuration

- **Network**: Celo Mainnet
- **Contract Address**: `0x454476d093e71D01233E7185914e1B3D1BA8345F`
- **RPC Endpoint**: Celo Forno (public RPC)
- **Local Development**: Hardhat network

Contract addresses are auto-exported to `contracts/deployedContracts.ts` after deployment.

## ✨ Recent Updates

- ✅ Pivoted to free-to-play model
- ✅ Removed all betting/paid room functionality
- ✅ Gaming UI with neon aesthetics and animations
- ✅ Pinata IPFS integration for match history
- ✅ Unlimited rematch system
- ✅ Stats tracking and history page

## 🔮 Future Enhancements

- Tournament brackets with multi-round matches
- Global leaderboards & player statistics
- Achievement system
- Real-time multiplayer lobbies
- Mobile app development
- Optional betting mode (future)

## 🛠 Technical Stack

- **Frontend**: Next.js 13+, React, TypeScript, TailwindCSS
- **Wallet**: RainbowKit, Wagmi, Viem
- **Blockchain**: Hardhat, Solidity
- **Network**: Celo Mainnet (Forno RPC)
- **Storage**: IPFS via Pinata
- **Persistence**: Vercel Edge Config
- **Identity**: Self Protocol (@selfxyz/core)
- **Referrals**: Divvi SDK
- **Deployment**: Vercel

## 📝 Environment Variables

Create `.env` files in respective packages:

### `packages/hardhat/.env`

```
DEPLOYER_PRIVATE_KEY=your_private_key
```

### `packages/nextjs/.env.local`

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud

# Optional: Backend wallet (not required for free-to-play)
# BACKEND_PRIVATE_KEY=your_backend_wallet_private_key
```

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

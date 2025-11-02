# RPS-ONCHAIN

![RPS-ONCHAIN](rps-onchain.jpg)
A Rock Paper Scissors game built with scaffold-eth-2, featuring wallet connectivity and room-based multiplayer gameplay.

## Game Features

- **Wallet Connect**: RainbowKit + Wagmi integration
- **Smart Contract Gameplay**: Commit-reveal scheme on Base Sepolia
- **Room System**: Create/join rooms with 6-character codes
- **ETH Betting**: Real money wagering with winner-takes-all
- **Match History**: Decentralized storage via IPFS (Pinata)
- **Self Protocol**: Human verification for higher betting limits
- **Anti-Cheat**: On-chain move commitment prevents cheating

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

### Current Implementation (On-Chain)

1. **Connect Wallet**: Use any wallet (MetaMask recommended)
2. **Set Username**: Edit username in header
3. **Create Room**: Generate room code with ETH bet amount
4. **Share Code**: Give the room code to your opponent
5. **Join Room**: Enter room code and match bet amount
6. **Commit Move**: Submit encrypted move on-chain
7. **Reveal Move**: Reveal your move to determine winner
8. **Claim Prize**: Winner claims the full pot

### Game Rules

- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Same moves = Tie (both players get refund)
- Winner takes full pot (2x bet amount)
- Loser loses their bet

## 🔧 Development Commands

```bash
# Blockchain
yarn chain          # Start local Hardhat network
yarn deploy         # Deploy contracts to local network
yarn deploy:sepolia # Deploy to Base Sepolia testnet

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

- `contracts/RPSOnline.sol` - Full RPS game with betting and commit-reveal
- `deploy/00_deploy_rps_online.ts` - Deployment script

### API Routes

- `app/api/username/route.ts` - Username management
- `app/api/store-match/route.ts` - IPFS match storage via Pinata
- `app/api/self-callback/route.ts` - Self Protocol verification callback

### Utilities

- `utils/gameUtils.ts` - Move hashing and game logic
- `lib/pinataStorage.ts` - IPFS storage utilities (Pinata)

## 🌐 Network Configuration

The project is configured for:

- **Local**: Hardhat network (default)
- **Testnet**: Base Sepolia
- **Mainnet**: Base (ready for production)

Contract addresses are auto-exported to `contracts/deployedContracts.ts` after deployment.

## 🔮 Future Enhancements

### Phase 1: Advanced Features

- Tournament brackets
- Leaderboards & statistics
- NFT rewards for winners
- Multi-round matches

### Phase 2: Scaling

- Layer 2 optimization
- Gasless transactions via meta-transactions
- Mobile app development

### Phase 3: Enhanced Features

- Tournament mode with brackets
- Real-time multiplayer lobbies
- Advanced analytics dashboard

## 🛠 Technical Stack

- **Frontend**: Next.js 13+, React, TypeScript, TailwindCSS
- **Wallet**: RainbowKit, Wagmi, Viem
- **Blockchain**: Hardhat, Solidity
- **Storage**: IPFS via Pinata
- **Identity**: Self Protocol for human verification
- **Deployment**: Vercel (frontend), Multi-chain (contracts)

## 📝 Environment Variables

Create `.env` files in respective packages:

### `packages/hardhat/.env`

```
ALCHEMY_API_KEY=your_alchemy_key
DEPLOYER_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### `packages/nextjs/.env.local`

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
PINATA_JWT=your_pinata_jwt_token
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

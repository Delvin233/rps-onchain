# RPS-ONCHAIN

A Rock Paper Scissors game built with scaffold-eth-2, featuring wallet connectivity and room-based multiplayer gameplay.

## 🎮 Game Features

- **Wallet Connect**: RainbowKit + Wagmi integration
- **Room System**: Create/join rooms with 6-character codes
- **Real-time Gameplay**: Live updates via polling
- **Play Again System**: Request-based rematch functionality
- **Auto-tie Reset**: Automatic restart on tie games (3-second countdown)
- **Leave Protection**: Confirmation dialog when leaving active games

## 🏗 Project Structure

```
packages/
├── hardhat/          # Smart contracts & deployment
│   ├── contracts/    # Solidity contracts
│   ├── deploy/       # Deployment scripts
│   └── scripts/      # Utility scripts
└── nextjs/           # Frontend application
    ├── app/          # Next.js 13+ app directory
    ├── lib/          # Game logic (rooms, users)
    └── components/   # React components
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

### Current Implementation (Local Rooms)

1. **Connect Wallet**: Use any wallet (MetaMask recommended)
2. **Set Username**: Click the edit button next to your name
3. **Create Room**: Generate a 6-character room code
4. **Share Code**: Give the room code to your opponent
5. **Join Room**: Enter the room code to join
6. **Play Game**: Make your move (Rock/Paper/Scissors)
7. **Results**: See winner, play again, or end match

### Game Rules
- Rock beats Scissors
- Scissors beats Paper  
- Paper beats Rock
- Same moves = Tie (auto-restart after 3 seconds)

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
- `app/play/page.tsx` - Room creation/joining
- `app/game/[roomId]/page.tsx` - Game interface
- `lib/roomStore.ts` - Room management logic
- `lib/userStore.ts` - Username storage

### Smart Contracts
- `contracts/RPSOnline.sol` - Placeholder contract with MatchCreated event
- `deploy/00_deploy_rps_online.ts` - Deployment script

### API Routes
- `app/api/room/route.ts` - Room CRUD operations
- `app/api/username/route.ts` - Username management

## 🌐 Network Configuration

The project is configured for:
- **Local**: Hardhat network (default)
- **Testnet**: Base Sepolia
- **Mainnet**: Base (ready for production)

Contract addresses are auto-exported to `contracts/deployedContracts.ts` after deployment.

## 🔮 Future Enhancements

### Phase 1: On-chain Integration
- Replace local room storage with smart contract calls
- Store game state on-chain
- Implement commit-reveal scheme for moves
- Add ETH/token betting functionality

### Phase 2: Advanced Features
- Tournament brackets
- Leaderboards & statistics  
- NFT rewards for winners
- Multi-round matches

### Phase 3: Scaling
- Layer 2 optimization
- Gasless transactions via meta-transactions
- Mobile app development

## 🛠 Technical Stack

- **Frontend**: Next.js 13+, React, TypeScript, TailwindCSS
- **Wallet**: RainbowKit, Wagmi, Viem
- **Blockchain**: Hardhat, Solidity
- **Deployment**: Vercel (frontend), Base network (contracts)

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
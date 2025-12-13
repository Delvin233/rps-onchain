# RPS Smart Contracts Suite

## Overview

This document describes the suite of 4 unique Rock Paper Scissors smart contracts deployed on Celo Mainnet. These are **concept contracts** designed to showcase advanced smart contract development techniques and will be integrated into the main RPS application in future iterations.

## Purpose

These contracts were developed to:

- Demonstrate sophisticated randomness algorithms
- Showcase different matchmaking strategies
- Explore advanced game theory implementations
- Generate on-chain activity for Talent Protocol tracking
- Serve as proof-of-concept for future RPS game mechanics

## Deployed Contracts (Multi-Chain)

### 1. RPSQuantumMatch

**Celo Mainnet**: `0x765384d5d2A7Beee601cF976836352b0Da926BbB`  
**Base Mainnet**: `0xF321ed5CbD3B01Eb63735D77260340e6Ba14026c`  
**Celoscan**: https://celoscan.io/address/0x765384d5d2A7Beee601cF976836352b0Da926BbB  
**BaseScan**: https://basescan.org/address/0xF321ed5CbD3B01Eb63735D77260340e6Ba14026c

#### Features

- **Quantum-Inspired Randomness**: Uses multiple entropy sources including block properties, gas prices, and transaction data
- **Commit-Reveal Mechanism**: Prevents front-running with cryptographic commitments
- **Quantum Matchmaking**: Weighted selection algorithm based on entropy correlation
- **Tie-Breaking**: Uses quantum entropy for fair tie resolution

#### Key Functions

- `createGame()`: Create a new game with quantum entropy generation
- `joinRandomGame()`: Join available games using quantum-weighted selection
- `commitMove(gameId, commitHash)`: Commit move with cryptographic hash
- `revealMove(gameId, move, nonce)`: Reveal move and determine winner

#### Unique Algorithm

```solidity
// Quantum entropy generation using multiple block properties
function generateQuantumEntropy() private view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        block.gaslimit,
        blockhash(block.number - 1),
        blockhash(block.number - 2),
        msg.sender,
        tx.gasprice
    )));
}
```

---

### 2. RPSTimeBasedMatch

**Celo Mainnet**: `0xbE4f52C5F6985c8A3D73fFA2f76Fc1a43cc09Afb`  
**Base Mainnet**: `0x8f43C03C64A5EC4C03301CbcA5277A2D93Ca8ff4`  
**Celoscan**: https://celoscan.io/address/0xbE4f52C5F6985c8A3D73fFA2f76Fc1a43cc09Afb  
**BaseScan**: https://basescan.org/address/0x8f43C03C64A5EC4C03301CbcA5277A2D93Ca8ff4

#### Features

- **Time Window Matching**: Groups players into 5-minute time windows
- **Activity-Based Scoring**: Matches players based on response times and activity patterns
- **Multiple Game Types**: Instant, Scheduled, and Tournament modes
- **Temporal Randomness**: Uses time-of-day and day-of-week patterns for entropy

#### Key Functions

- `createInstantGame()`: Create immediate match with current time window
- `scheduleGame(targetTimeWindow)`: Schedule game for specific future time
- `joinTournament()`: Join tournament-style rapid matching
- `submitMove(gameId, move)`: Submit move with response time tracking

#### Match Types

1. **Instant**: Immediate matching within current time window
2. **Scheduled**: Pre-planned games for specific time slots
3. **Tournament**: Rapid-fire matching for active players

---

### 3. RPSChaosMatch

**Celo Mainnet**: `0x6Ef5a0CeE27f0003fFCE7e127096a720Dc7aD3fB`  
**Base Mainnet**: `0xDf4d5544A2056165A9e8658C68162453ddf0d7c8`  
**Celoscan**: https://celoscan.io/address/0x6Ef5a0CeE27f0003fFCE7e127096a720Dc7aD3fB  
**BaseScan**: https://basescan.org/address/0xDf4d5544A2056165A9e8658C68162453ddf0d7c8

#### Features

- **Chaos Theory Implementation**: Butterfly effect algorithms where small changes create large effects
- **Dynamic Chaos Levels**: 6 levels from Order to Pandemonium
- **Emergent Behavior Detection**: Identifies complex patterns in game history
- **Chaos Events**: System-wide events that affect multiple games simultaneously

#### Key Functions

- `createChaosGame()`: Create game with chaos-driven parameters
- `getPlayerChaosStats(player)`: View player's chaos affinity and streaks
- `getSystemChaosStats()`: View global chaos metrics

#### Chaos Levels

1. **Order** (0): Predictable, low entropy
2. **Mild** (1): Slight randomness
3. **Moderate** (2): Balanced chaos
4. **High** (3): Significant unpredictability
5. **Extreme** (4): High chaos with butterfly effects
6. **Pandemonium** (5): Maximum chaos and emergent behavior

#### Unique Features

- **Butterfly Effects**: Small actions can trigger large system changes
- **Chaos Master Status**: Achieved through surviving extreme chaos
- **Emergent Patterns**: System detects and responds to complex behaviors

---

### 4. RPSSkillBasedMatch

**Celo Mainnet**: `0xf73Edca92605C562397c86eB60093339428b2316`  
**Base Mainnet**: `0x8064B5c5144593cfE17C2dc639453E3079E42dDb`  
**Celoscan**: https://celoscan.io/address/0xf73Edca92605C562397c86eB60093339428b2316  
**BaseScan**: https://basescan.org/address/0x8064B5c5144593cfE17C2dc639453E3079E42dDb

#### Features

- **ELO Rating System**: Standard chess-style rating with K-factor adjustments
- **Skill Tiers**: 7 tiers from Bronze to Grandmaster
- **Placement Games**: 10 calibration games for new players
- **Adaptive Matchmaking**: Matches players of similar skill levels

#### Key Functions

- `initializePlayer()`: Set up new player with default 1200 ELO
- `createRankedGame()`: Create competitive ranked match
- `createCasualGame()`: Create unranked practice game
- `getPlayerStats(player)`: View detailed player statistics

#### Skill Tiers

1. **Bronze** (800-1099 ELO)
2. **Silver** (1100-1399 ELO)
3. **Gold** (1400-1699 ELO)
4. **Platinum** (1700-1999 ELO)
5. **Diamond** (2000-2399 ELO)
6. **Master** (2400-2799 ELO)
7. **Grandmaster** (2800+ ELO)

#### ELO System

- **Initial Rating**: 1200 ELO (Bronze tier)
- **K-Factor**: 32 for calibrated players, 64 for placement games
- **Tier Promotion**: Automatic based on ELO thresholds
- **Skill-Based Tie Breaking**: Higher ELO wins ties

---

## Technical Specifications

### Gas Usage (Consistent Across Networks)

- **Quantum Contract**: ~944K gas for deployment
- **Time Contract**: ~1.37M gas for deployment
- **Chaos Contract**: ~2.33M gas for deployment
- **Skill Contract**: ~1.65M gas for deployment
- **Total per Network**: ~6.3M gas for complete suite
- **Multi-Chain Total**: ~12.6M gas (Celo + Base)

### Optimization Features

- **IR Optimizer**: Enabled to handle complex functions
- **Stack Optimization**: Functions split to avoid "stack too deep" errors
- **Gas Efficient**: Optimized for minimal transaction costs
- **Event Logging**: Comprehensive events for off-chain tracking

### Security Features

- **Reentrancy Protection**: State changes before external calls
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Player-specific game restrictions
- **Overflow Protection**: SafeMath patterns for arithmetic operations

---

## Integration Roadmap

### Phase 1: Concept Validation ✅

- [x] Deploy contracts to Celo Mainnet
- [x] Implement unique randomness algorithms
- [x] Test basic functionality
- [x] Generate Talent Protocol activity

### Phase 2: Testing & Refinement (Future)

- [ ] Comprehensive testing with real users
- [ ] Gas optimization improvements
- [ ] Security audit and vulnerability assessment
- [ ] Performance benchmarking

### Phase 3: Main App Integration (Future)

- [ ] Select best-performing algorithms
- [ ] Integrate chosen mechanics into main RPS app
- [ ] Migrate user data and statistics
- [ ] Implement hybrid matching system

### Phase 4: Advanced Features (Future)

- [ ] Cross-contract tournaments
- [ ] Multi-algorithm game modes
- [ ] Advanced analytics and insights
- [ ] Community governance features

---

## Contract Verification

To verify the contracts on both networks:

### Celo Mainnet

```bash
# Navigate to hardhat directory
cd packages/hardhat

# Verify each contract on Celo
npx hardhat verify --network celo 0x765384d5d2A7Beee601cF976836352b0Da926BbB
npx hardhat verify --network celo 0xbE4f52C5F6985c8A3D73fFA2f76Fc1a43cc09Afb
npx hardhat verify --network celo 0x6Ef5a0CeE27f0003fFCE7e127096a720Dc7aD3fB
npx hardhat verify --network celo 0xf73Edca92605C562397c86eB60093339428b2316
```

### Base Mainnet

```bash
# Verify each contract on Base
npx hardhat verify --network base 0xF321ed5CbD3B01Eb63735D77260340e6Ba14026c
npx hardhat verify --network base 0x8f43C03C64A5EC4C03301CbcA5277A2D93Ca8ff4
npx hardhat verify --network base 0xDf4d5544A2056165A9e8658C68162453ddf0d7c8
npx hardhat verify --network base 0x8064B5c5144593cfE17C2dc639453E3079E42dDb
```

---

## Research & Development Notes

### Algorithm Comparison

Each contract implements a different approach to randomness and matchmaking:

1. **Quantum**: Best for high-security games requiring unpredictable outcomes
2. **Time**: Optimal for scheduled tournaments and activity-based matching
3. **Chaos**: Ideal for experimental gameplay with emergent behaviors
4. **Skill**: Perfect for competitive ranked play with fair matchmaking

### Performance Metrics

- **Transaction Throughput**: All contracts handle concurrent games efficiently
- **Gas Efficiency**: Optimized for Celo's low-cost environment
- **Scalability**: Designed to handle thousands of simultaneous games
- **Fairness**: Multiple mechanisms ensure fair play and prevent manipulation

### Future Research Areas

- **Hybrid Algorithms**: Combining multiple randomness sources
- **Machine Learning**: AI-driven matchmaking improvements
- **Cross-Chain**: Multi-network tournament systems
- **Governance**: Community-driven algorithm selection

---

## Conclusion

These concept contracts demonstrate the technical capabilities and innovative thinking behind the RPS project. Each contract showcases unique approaches to common blockchain gaming challenges:

- **Randomness**: Multiple sophisticated entropy generation methods
- **Fairness**: Various mechanisms to ensure fair play
- **Scalability**: Efficient algorithms for high-throughput gaming
- **Innovation**: Novel applications of game theory and chaos mathematics

The contracts serve as a foundation for future development and will inform the integration of advanced features into the main RPS application. They represent a significant step forward in blockchain gaming technology and demonstrate the project's commitment to technical excellence.

### Multi-Chain Benefits

Deploying on both Celo and Base provides several advantages:

- **Increased Visibility**: Double the on-chain activity for Talent Protocol tracking
- **Network Diversity**: Demonstrates cross-chain compatibility and technical versatility
- **Cost Optimization**: Celo for low-cost transactions, Base for Ethereum ecosystem access
- **Risk Mitigation**: Redundancy across multiple networks ensures continued operation
- **Community Reach**: Access to both Celo and Base ecosystems and user bases

---

**Deployment Date**: December 12, 2024  
**Networks**: Celo Mainnet + Base Mainnet  
**Total Gas Used**: ~12.6M gas (6.3M per network)  
**Status**: Live and Functional on Both Networks  
**Purpose**: Multi-chain concept validation and Talent Protocol tracking

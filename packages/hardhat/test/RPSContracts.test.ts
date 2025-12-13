import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RPS Contracts Suite", function () {
  let quantumContract: any;
  let timeContract: any;
  let chaosContract: any;
  let skillContract: any;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;

  beforeEach(async function () {
    [, player1, player2, player3] = await ethers.getSigners();

    // Deploy all contracts
    const QuantumMatch = await ethers.getContractFactory("RPSQuantumMatch");
    quantumContract = await QuantumMatch.deploy();
    await quantumContract.waitForDeployment();

    const TimeBasedMatch = await ethers.getContractFactory("RPSTimeBasedMatch");
    timeContract = await TimeBasedMatch.deploy();
    await timeContract.waitForDeployment();

    const ChaosMatch = await ethers.getContractFactory("RPSChaosMatch");
    chaosContract = await ChaosMatch.deploy();
    await chaosContract.waitForDeployment();

    const SkillBasedMatch = await ethers.getContractFactory("RPSSkillBasedMatch");
    skillContract = await SkillBasedMatch.deploy();
    await skillContract.waitForDeployment();
  });

  describe("RPSQuantumMatch", function () {
    it("Should create a game with quantum entropy", async function () {
      await quantumContract.connect(player1).createGame();

      const events = await quantumContract.queryFilter(quantumContract.filters.GameCreated());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.player1).to.equal(await player1.getAddress());
      expect(events[0].args.quantumSeed).to.be.gt(0);
    });

    it("Should prevent duplicate active games", async function () {
      await quantumContract.connect(player1).createGame();

      await expect(quantumContract.connect(player1).createGame()).to.be.revertedWith("Already in active game");
    });

    it("Should allow quantum matchmaking", async function () {
      await quantumContract.connect(player1).createGame();

      await quantumContract.connect(player2).joinRandomGame();

      const events = await quantumContract.queryFilter(quantumContract.filters.PlayerJoined());
      expect(events.length).to.be.gt(0);
    });

    it("Should handle commit-reveal mechanism", async function () {
      await quantumContract.connect(player1).createGame();
      await quantumContract.connect(player2).joinRandomGame();

      const gameId = 1;
      const move = 1; // Rock
      const nonce = 12345;
      const player1Address = await player1.getAddress();

      const commitHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "uint256", "address"], [move, nonce, player1Address]),
      );

      await quantumContract.connect(player1).commitMove(gameId, commitHash);

      // Verify commitment was recorded
      const game = await quantumContract.games(gameId);
      expect(game.player1CommitHash).to.equal(commitHash);
    });
  });

  describe("RPSTimeBasedMatch", function () {
    it("Should create instant game", async function () {
      await timeContract.connect(player1).createInstantGame();

      const events = await timeContract.queryFilter(timeContract.filters.GameCreated());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.matchType).to.equal(0); // Instant
    });

    it("Should schedule future game", async function () {
      const currentWindow = await timeContract.getCurrentTimeWindow();
      const futureWindow = currentWindow + 10n; // 10 time windows in future

      await timeContract.connect(player1).scheduleGame(futureWindow);

      const events = await timeContract.queryFilter(timeContract.filters.GameCreated());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.matchType).to.equal(1); // Scheduled
    });

    it("Should track player response times", async function () {
      await timeContract.connect(player1).createInstantGame();
      await timeContract.connect(player2).createInstantGame();

      // Simulate matching (would happen automatically in real scenario)
      const gameId = 1;
      await timeContract.connect(player1).submitMove(gameId, 1); // Rock

      await timeContract.connect(player2).submitMove(gameId, 2); // Paper

      const events = await timeContract.queryFilter(timeContract.filters.MoveSubmitted());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.responseTime).to.be.gt(0);
    });
  });

  describe("RPSChaosMatch", function () {
    it("Should create game with chaos level", async function () {
      await chaosContract.connect(player1).createChaosGame();

      const events = await chaosContract.queryFilter(chaosContract.filters.GameCreated());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.chaosLevel).to.be.gte(0);
      expect(events[0].args.chaosLevel).to.be.lte(5); // 0-5 chaos levels
    });

    it("Should trigger butterfly effects", async function () {
      // Create multiple games to increase chance of butterfly effect
      for (let i = 0; i < 3; i++) {
        const signer = [player1, player2, player3][i];
        await chaosContract.connect(signer).createChaosGame();
      }

      // Check if any butterfly effects were triggered
      const systemStats = await chaosContract.getSystemChaosStats();
      expect(systemStats.currentGlobalChaos).to.be.gt(0);
    });

    it("Should update chaos profiles", async function () {
      await chaosContract.connect(player1).createChaosGame();

      const profile = await chaosContract.getPlayerChaosStats(await player1.getAddress());
      expect(profile.chaosAffinity).to.be.gt(0);
    });
  });

  describe("RPSSkillBasedMatch", function () {
    it("Should initialize player with default ELO", async function () {
      await skillContract.connect(player1).initializePlayer();

      const stats = await skillContract.getPlayerStats(await player1.getAddress());
      expect(stats.elo).to.equal(1200); // Initial ELO
      expect(stats.tier).to.equal(0); // Bronze tier
      expect(stats.placementGames).to.equal(10);
    });

    it("Should prevent double initialization", async function () {
      await skillContract.connect(player1).initializePlayer();

      await expect(skillContract.connect(player1).initializePlayer()).to.be.revertedWith("Player already initialized");
    });

    it("Should create ranked game", async function () {
      await skillContract.connect(player1).initializePlayer();

      await skillContract.connect(player1).createRankedGame();

      const events = await skillContract.queryFilter(skillContract.filters.GameCreated());
      expect(events.length).to.be.gt(0);
      expect(events[0].args.eloStake).to.be.gt(0);
    });

    it("Should calculate skill tiers correctly", async function () {
      await skillContract.connect(player1).initializePlayer();

      const stats = await skillContract.getPlayerStats(await player1.getAddress());
      expect(stats.tier).to.equal(0); // Bronze for 1200 ELO
    });

    it("Should handle placement games", async function () {
      await skillContract.connect(player1).initializePlayer();
      await skillContract.connect(player2).initializePlayer();

      await skillContract.connect(player1).createRankedGame();
      await skillContract.connect(player2).createRankedGame();

      // Simulate game completion
      const gameId = 1;
      await skillContract.connect(player1).submitMove(gameId, 1); // Rock
      await skillContract.connect(player2).submitMove(gameId, 2); // Paper

      const stats1 = await skillContract.getPlayerStats(await player1.getAddress());
      const stats2 = await skillContract.getPlayerStats(await player2.getAddress());

      expect(stats1.placementGames).to.equal(9); // One placement game completed
      expect(stats2.placementGames).to.equal(9);
    });
  });

  describe("Cross-Contract Integration", function () {
    it("Should have unique game mechanics across all contracts", async function () {
      // Quantum: Uses commit-reveal
      await quantumContract.connect(player1).createGame();

      // Time: Uses time windows
      await timeContract.connect(player1).createInstantGame();

      // Chaos: Uses chaos levels
      await chaosContract.connect(player1).createChaosGame();

      // Skill: Uses ELO ratings
      await skillContract.connect(player1).initializePlayer();
      await skillContract.connect(player1).createRankedGame();

      // Verify each contract has different state structures
      const quantumGame = await quantumContract.games(1);
      const timeGame = await timeContract.games(1);
      const chaosGame = await chaosContract.games(1);
      const skillGame = await skillContract.games(1);

      // Each should have unique properties
      expect(quantumGame.quantumSeed).to.be.greaterThan(0);
      expect(timeGame.timeWindow).to.be.greaterThanOrEqual(0);
      expect(chaosGame.chaosLevel).to.be.greaterThanOrEqual(0);
      expect(skillGame.eloStake).to.be.greaterThanOrEqual(0);
    });

    it("Should generate different randomness patterns", async function () {
      const seeds: number[] = [];

      // Collect entropy from different contracts
      for (let i = 0; i < 5; i++) {
        await quantumContract.connect(player1).createGame();
        const game = await quantumContract.games(i + 1);
        seeds.push(Number(game.quantumSeed));

        // Reset player state for next game
        try {
          await quantumContract.connect(player1).joinRandomGame();
        } catch {
          // Ignore if no games available to join
        }
      }

      // Verify randomness (no two seeds should be identical)
      const uniqueSeeds = [...new Set(seeds)];
      expect(uniqueSeeds.length).to.equal(seeds.length);
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for game creation", async function () {
      const gasEstimates: { [key: string]: bigint } = {};

      // Quantum
      gasEstimates.quantum = await quantumContract.connect(player1).createGame.estimateGas();

      // Time
      gasEstimates.time = await timeContract.connect(player1).createInstantGame.estimateGas();

      // Chaos
      gasEstimates.chaos = await chaosContract.connect(player1).createChaosGame.estimateGas();

      // Skill (after initialization)
      await skillContract.connect(player1).initializePlayer();
      gasEstimates.skill = await skillContract.connect(player1).createRankedGame.estimateGas();

      console.log("Gas estimates:", gasEstimates);

      // All should be under 500k gas
      Object.values(gasEstimates).forEach(gas => {
        expect(Number(gas)).to.be.lt(500000);
      });
    });
  });
});

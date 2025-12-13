import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploy 4 unique RPS contracts with different randomness algorithms to Celo mainnet
 *
 * 1. RPSQuantumMatch - Quantum-inspired entropy and commit-reveal
 * 2. RPSTimeBasedMatch - Temporal matchmaking with time windows
 * 3. RPSChaosMatch - Chaos theory and butterfly effects
 * 4. RPSSkillBasedMatch - ELO rating system with skill tiers
 */
const deployRPSContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying RPS Contracts to Celo Mainnet...");
  console.log("Deployer:", deployer);

  // Deploy RPSQuantumMatch
  console.log("\n⚛️  Deploying RPSQuantumMatch (Quantum-Inspired Randomness)...");
  const quantumMatch = await deploy("RPSQuantumMatch", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy RPSTimeBasedMatch
  console.log("\n⏰ Deploying RPSTimeBasedMatch (Temporal Matchmaking)...");
  const timeBasedMatch = await deploy("RPSTimeBasedMatch", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy RPSChaosMatch
  console.log("\n🌪️  Deploying RPSChaosMatch (Chaos Theory Algorithms)...");
  const chaosMatch = await deploy("RPSChaosMatch", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy RPSSkillBasedMatch
  console.log("\n🏆 Deploying RPSSkillBasedMatch (ELO Rating System)...");
  const skillBasedMatch = await deploy("RPSSkillBasedMatch", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get deployed contract instances for initialization
  const skillContract = await hre.ethers.getContract<Contract>("RPSSkillBasedMatch", deployer);

  console.log("\n✅ All RPS Contracts Deployed Successfully!");
  console.log("📊 Contract Addresses:");
  console.log(`⚛️  RPSQuantumMatch:    ${quantumMatch.address}`);
  console.log(`⏰ RPSTimeBasedMatch:  ${timeBasedMatch.address}`);
  console.log(`🌪️  RPSChaosMatch:      ${chaosMatch.address}`);
  console.log(`🏆 RPSSkillBasedMatch: ${skillBasedMatch.address}`);

  // Initialize contracts with some test data (optional)
  if (hre.network.name !== "mainnet" && hre.network.name !== "celo") {
    console.log("\n🔧 Initializing contracts for testing...");

    try {
      // Initialize skill-based contract for deployer
      const tx = await skillContract.initializePlayer();
      await tx.wait();
      console.log("✅ Skill-based contract initialized");
    } catch (error) {
      console.log("ℹ️  Skill-based contract already initialized or error:", error);
    }
  }

  console.log("\n🎯 Contract Features:");
  console.log("⚛️  Quantum: Multi-entropy sources, commit-reveal, quantum matchmaking");
  console.log("⏰ Time: Time windows, activity patterns, tournament modes");
  console.log("🌪️  Chaos: Butterfly effects, emergent behavior, chaos levels");
  console.log("🏆 Skill: ELO ratings, skill tiers, placement games");

  console.log("\n🌐 Ready for Talent Protocol tracking!");
  console.log("📈 Each contract uses unique algorithms for maximum diversity");
};

export default deployRPSContracts;

// Tags for selective deployment
deployRPSContracts.tags = ["RPSContracts", "Quantum", "Time", "Chaos", "Skill"];

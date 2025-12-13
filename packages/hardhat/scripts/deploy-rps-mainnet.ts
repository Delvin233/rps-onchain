import { ethers } from "hardhat";

/**
 * Deploy RPS Contracts to Celo Mainnet
 *
 * This script deploys 4 unique RPS contracts with different randomness algorithms
 * to showcase diverse smart contract development for Talent Protocol tracking.
 */
async function main() {
  console.log("🚀 Deploying RPS Contracts to Celo Mainnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  const deploymentResults: { [key: string]: { address: string; txHash: string; gasUsed: string } } = {};

  try {
    // 1. Deploy RPSQuantumMatch
    console.log("\n⚛️  Deploying RPSQuantumMatch...");
    const QuantumMatch = await ethers.getContractFactory("RPSQuantumMatch");
    const quantumMatch = await QuantumMatch.deploy();
    await quantumMatch.waitForDeployment();

    const quantumReceipt = await quantumMatch.deploymentTransaction()?.wait();
    deploymentResults.quantum = {
      address: await quantumMatch.getAddress(),
      txHash: quantumMatch.deploymentTransaction()?.hash || "",
      gasUsed: quantumReceipt?.gasUsed.toString() || "0",
    };
    console.log("✅ RPSQuantumMatch deployed to:", await quantumMatch.getAddress());

    // 2. Deploy RPSTimeBasedMatch
    console.log("\n⏰ Deploying RPSTimeBasedMatch...");
    const TimeBasedMatch = await ethers.getContractFactory("RPSTimeBasedMatch");
    const timeBasedMatch = await TimeBasedMatch.deploy();
    await timeBasedMatch.waitForDeployment();

    const timeReceipt = await timeBasedMatch.deploymentTransaction()?.wait();
    deploymentResults.time = {
      address: await timeBasedMatch.getAddress(),
      txHash: timeBasedMatch.deploymentTransaction()?.hash || "",
      gasUsed: timeReceipt?.gasUsed.toString() || "0",
    };
    console.log("✅ RPSTimeBasedMatch deployed to:", await timeBasedMatch.getAddress());

    // 3. Deploy RPSChaosMatch
    console.log("\n🌪️  Deploying RPSChaosMatch...");
    const ChaosMatch = await ethers.getContractFactory("RPSChaosMatch");
    const chaosMatch = await ChaosMatch.deploy();
    await chaosMatch.waitForDeployment();

    const chaosReceipt = await chaosMatch.deploymentTransaction()?.wait();
    deploymentResults.chaos = {
      address: await chaosMatch.getAddress(),
      txHash: chaosMatch.deploymentTransaction()?.hash || "",
      gasUsed: chaosReceipt?.gasUsed.toString() || "0",
    };
    console.log("✅ RPSChaosMatch deployed to:", await chaosMatch.getAddress());

    // 4. Deploy RPSSkillBasedMatch
    console.log("\n🏆 Deploying RPSSkillBasedMatch...");
    const SkillBasedMatch = await ethers.getContractFactory("RPSSkillBasedMatch");
    const skillBasedMatch = await SkillBasedMatch.deploy();
    await skillBasedMatch.waitForDeployment();

    const skillReceipt = await skillBasedMatch.deploymentTransaction()?.wait();
    deploymentResults.skill = {
      address: await skillBasedMatch.getAddress(),
      txHash: skillBasedMatch.deploymentTransaction()?.hash || "",
      gasUsed: skillReceipt?.gasUsed.toString() || "0",
    };
    console.log("✅ RPSSkillBasedMatch deployed to:", await skillBasedMatch.getAddress());

    // Summary
    console.log("\n🎉 All Contracts Deployed Successfully!");
    console.log("=".repeat(80));

    console.log("\n📊 Deployment Summary:");
    Object.entries(deploymentResults).forEach(([name, result]) => {
      console.log(`${name.toUpperCase()}:`);
      console.log(`  Address: ${result.address}`);
      console.log(`  TX Hash: ${result.txHash}`);
      console.log(`  Gas Used: ${parseInt(result.gasUsed).toLocaleString()}`);
      console.log("");
    });

    console.log("🔗 Verification Commands:");
    console.log(`npx hardhat verify --network celo ${deploymentResults.quantum.address}`);
    console.log(`npx hardhat verify --network celo ${deploymentResults.time.address}`);
    console.log(`npx hardhat verify --network celo ${deploymentResults.chaos.address}`);
    console.log(`npx hardhat verify --network celo ${deploymentResults.skill.address}`);

    console.log("\n🌐 Celoscan Links:");
    Object.entries(deploymentResults).forEach(([name, result]) => {
      console.log(`${name}: https://celoscan.io/address/${result.address}`);
    });

    console.log("\n🎯 Contract Features:");
    console.log("⚛️  Quantum: Multi-entropy sources, commit-reveal, quantum matchmaking");
    console.log("⏰ Time: Time windows, activity patterns, tournament modes");
    console.log("🌪️  Chaos: Butterfly effects, emergent behavior, chaos levels");
    console.log("🏆 Skill: ELO ratings, skill tiers, placement games");

    console.log("\n📈 Ready for Talent Protocol tracking!");
    console.log("Each contract demonstrates unique algorithms and gas optimization techniques.");

    // Test basic functionality
    console.log("\n🧪 Testing Basic Functionality...");

    // Test Quantum Match
    console.log("Testing Quantum Match...");
    const quantumTx = await quantumMatch.createGame();
    await quantumTx.wait();
    console.log("✅ Quantum game created");

    // Test Time Match
    console.log("Testing Time Match...");
    const timeTx = await timeBasedMatch.createInstantGame();
    await timeTx.wait();
    console.log("✅ Time-based game created");

    // Test Chaos Match
    console.log("Testing Chaos Match...");
    const chaosTx = await chaosMatch.createChaosGame();
    await chaosTx.wait();
    console.log("✅ Chaos game created");

    // Test Skill Match
    console.log("Testing Skill Match...");
    const initTx = await skillBasedMatch.initializePlayer();
    await initTx.wait();
    const skillTx = await skillBasedMatch.createRankedGame();
    await skillTx.wait();
    console.log("✅ Skill-based game created");

    console.log("\n🎮 All contracts are live and functional on Celo Mainnet!");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

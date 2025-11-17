import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const RPSOnline = await ethers.getContractFactory("RPSOnline");
  const rpsOnline = await RPSOnline.deploy();
  await rpsOnline.waitForDeployment();

  console.log("RPSOnline deployed to:", await rpsOnline.getAddress());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

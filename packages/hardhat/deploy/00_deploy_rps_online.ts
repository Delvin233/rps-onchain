import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRPSOnline: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Backend wallet that will call finishGameAndPayout
  const backendAddress = process.env.BACKEND_WALLET || deployer;

  // Fee collector wallet that receives 1.25% platform fee
  const feeCollectorAddress = process.env.FEE_COLLECTOR_WALLET || deployer;

  await deploy("RPSOnline", {
    from: deployer,
    args: [backendAddress, feeCollectorAddress],
    log: true,
    autoMine: true,
  });

  console.log("RPSOnline deployed with:");
  console.log("  Backend:", backendAddress);
  console.log("  Fee Collector:", feeCollectorAddress);
};

export default deployRPSOnline;

deployRPSOnline.tags = ["RPSOnline"];

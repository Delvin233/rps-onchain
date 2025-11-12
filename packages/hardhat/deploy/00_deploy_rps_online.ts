import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRPSOnline: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Backend wallet that will call finishGame
  const backendAddress = process.env.BACKEND_WALLET || deployer;

  await deploy("RPSOnline", {
    from: deployer,
    args: [backendAddress],
    log: true,
    autoMine: true,
  });

  console.log("RPSOnline deployed with:");
  console.log("  Backend:", backendAddress);
};

export default deployRPSOnline;

deployRPSOnline.tags = ["RPSOnline"];

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRPSOnline: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("RPSOnline", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("RPSOnline deployed");
};

export default deployRPSOnline;

deployRPSOnline.tags = ["RPSOnline"];

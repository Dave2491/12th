import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "OKB");

  // Deploy FanRegistry
  const FanRegistry = await ethers.getContractFactory("FanRegistry");
  const fanRegistry = await FanRegistry.deploy();
  await fanRegistry.waitForDeployment();
  const registryAddress = await fanRegistry.getAddress();
  console.log("FanRegistry deployed to:", registryAddress);

  // Deploy FanBadge
  const FanBadge = await ethers.getContractFactory("FanBadge");
  const fanBadge = await FanBadge.deploy("ipfs://placeholder/");
  await fanBadge.waitForDeployment();
  const badgeAddress = await fanBadge.getAddress();
  console.log("FanBadge deployed to:", badgeAddress);

  // Save addresses
  const network = await ethers.provider.getNetwork();
  const deployments = {
    network: network.name,
    chainId: Number(network.chainId),
    fanRegistry: registryAddress,
    fanBadge: badgeAddress,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.resolve(__dirname, "../deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
  console.log("Addresses saved to deployments.json");
  console.log("\nAdd these to .env.local:");
  console.log(`NEXT_PUBLIC_FAN_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`NEXT_PUBLIC_FAN_BADGE_ADDRESS=${badgeAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

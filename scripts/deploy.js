const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Arbitrum Tap Tap Game Contract...");

  // Get the contract factory
  const ArbitrumTapGame = await ethers.getContractFactory("ArbitrumTapGame");
  
  // Deploy the contract
  console.log("📝 Deploying contract...");
  const gameContract = await ArbitrumTapGame.deploy();
  
  // Wait for deployment to finish
  await gameContract.waitForDeployment();
  
  const contractAddress = await gameContract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  
  // Get deployment information
  const deployment = await gameContract.deploymentTransaction();
  console.log("📊 Deployment hash:", deployment.hash);
  console.log("⛽ Gas used:", deployment.gasLimit.toString());
  
  // Verify contract on Etherscan (if not on local network)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) { // Not local network
    console.log("🔍 Waiting for block confirmations before verification...");
    await gameContract.deploymentTransaction().wait(6); // Wait 6 blocks
    
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }
  
  // Initialize contract with some initial ETH for rewards
  if (network.chainId !== 31337) { // Not local network
    console.log("💰 Sending initial ETH to contract for rewards...");
    const [deployer] = await ethers.getSigners();
    
    // Send 0.1 ETH to contract for initial rewards
    const tx = await deployer.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("0.1"),
    });
    
    await tx.wait();
    console.log("✅ Sent 0.1 ETH to contract for rewards");
  }
  
  // Display contract information
  console.log("\n🎮 Arbitrum Tap Tap Game Contract Deployed Successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", network.name);
  console.log("🔗 Explorer:", getExplorerUrl(network.chainId, contractAddress));
  
  // Display milestone information
  const milestones = await gameContract.milestones();
  const rewards = await gameContract.rewards();
  
  console.log("\n🏆 Milestones and Rewards:");
  for (let i = 0; i < milestones.length; i++) {
    console.log(`   ${milestones[i].toString().padStart(6)} taps → ${ethers.formatEther(rewards[i])} ETH`);
  }
  
  console.log("\n🚀 Next Steps:");
  console.log("1. Update your frontend with the contract address:", contractAddress);
  console.log("2. Test the contract on Arbitrum testnet first");
  console.log("3. Deploy to Arbitrum mainnet when ready");
  console.log("4. Fund the contract with ETH for rewards");
  
  return {
    contractAddress,
    network: network.name,
    chainId: network.chainId,
    milestones: milestones.map(m => m.toString()),
    rewards: rewards.map(r => ethers.formatEther(r)),
  };
}

function getExplorerUrl(chainId, address) {
  switch (chainId) {
    case 42161: // Arbitrum One
      return `https://arbiscan.io/address/${address}`;
    case 421614: // Arbitrum Sepolia
      return `https://sepolia.arbiscan.io/address/${address}`;
    default:
      return `https://etherscan.io/address/${address}`;
  }
}

// Handle errors
main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

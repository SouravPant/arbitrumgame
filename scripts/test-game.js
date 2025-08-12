const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Arbitrum Tap Tap Game...");

  try {
    // Get the deployed contract
    const contractAddress = process.env.GAME_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.log("❌ GAME_CONTRACT_ADDRESS not set in environment");
      return;
    }

    console.log("📍 Contract Address:", contractAddress);

    const ArbitrumTapGame = await ethers.getContractFactory("ArbitrumTapGame");
    const gameContract = ArbitrumTapGame.attach(contractAddress);

    // Test 1: Get contract information
    console.log("\n📊 Contract Information:");
    const name = await gameContract.name();
    const symbol = await gameContract.symbol();
    console.log("Name:", name);
    console.log("Symbol:", symbol);

    // Test 2: Get milestones and rewards
    console.log("\n🏆 Milestones and Rewards:");
    const milestones = await gameContract.milestones();
    const rewards = await gameContract.rewards();
    
    for (let i = 0; i < milestones.length; i++) {
      console.log(`   ${milestones[i].toString().padStart(6)} taps → ${ethers.formatEther(rewards[i])} ETH`);
    }

    // Test 3: Get deployer stats
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Deployer Address:", deployer.address);
    
    const deployerStats = await gameContract.getPlayerStats(deployer.address);
    console.log("Total Taps:", deployerStats.totalTaps.toString());
    console.log("NFTs Minted:", deployerStats.nftsMinted.toString());
    console.log("Last Mint:", new Date(Number(deployerStats.lastMintTimestamp) * 1000).toLocaleString());

    // Test 4: Test milestone achievement
    console.log("\n🎯 Testing milestone achievement...");
    
    // Update taps to 100 (first milestone)
    const updateTx = await gameContract.updateTaps(100);
    await updateTx.wait();
    console.log("✅ Updated taps to 100");

    // Check if milestone is achieved
    const isAchieved = await gameContract.isMilestoneAchieved(deployer.address, 100);
    console.log("Milestone 100 achieved:", isAchieved);

    // Test 5: Mint NFT
    if (isAchieved) {
      console.log("\n🪙 Minting NFT for milestone 100...");
      const mintTx = await gameContract.mintNFT(100);
      await mintTx.wait();
      console.log("✅ NFT minted successfully!");
      
      // Get updated stats
      const updatedStats = await gameContract.getPlayerStats(deployer.address);
      console.log("Updated NFTs Minted:", updatedStats.nftsMinted.toString());
    }

    // Test 6: Get next milestone
    console.log("\n🎯 Next milestone information:");
    const nextMilestone = await gameContract.getNextMilestone(deployer.address);
    if (nextMilestone.nextMilestone > 0) {
      console.log("Next milestone:", nextMilestone.nextMilestone.toString());
      console.log("Taps needed:", nextMilestone.remainingTaps.toString());
    } else {
      console.log("All milestones achieved! 🎉");
    }

    // Test 7: Get top players
    console.log("\n🏅 Top players:");
    const topPlayers = await gameContract.getTopPlayers();
    console.log("Number of top players:", topPlayers.length);
    
    if (topPlayers.length > 0) {
      console.log("Top player addresses:");
      topPlayers.slice(0, 5).forEach((player, index) => {
        console.log(`   ${index + 1}. ${player}`);
      });
    }

    console.log("\n✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    
    if (error.message.includes("contract not deployed")) {
      console.log("💡 Make sure the contract is deployed and GAME_CONTRACT_ADDRESS is set correctly");
    } else if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure your wallet has sufficient ETH for gas fees");
    } else if (error.message.includes("network")) {
      console.log("💡 Make sure you're connected to the correct network (Arbitrum)");
    }
  }
}

// Handle errors
main()
  .then(() => {
    console.log("\n🎉 Testing completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  });

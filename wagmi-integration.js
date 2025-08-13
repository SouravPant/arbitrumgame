// Wagmi and Farcaster Integration for ARBITAP
// This file handles blockchain interactions and wallet connections

class ArbitrumGameContract {
    constructor() {
        this.contractAddress = null;
        this.contractABI = null;
        this.wagmiClient = null;
        this.account = null;
        this.chainId = 42161; // Arbitrum One
    }

    // Initialize Wagmi client
    async initializeWagmi() {
        try {
            // Check if we're in a Farcaster frame
            if (window.farcaster) {
                console.log('Running in Farcaster frame');
                await this.setupFarcasterWallet();
            } else {
                console.log('Running in regular browser');
                await this.setupRegularWallet();
            }
        } catch (error) {
            console.error('Failed to initialize Wagmi:', error);
        }
    }

    // Setup wallet connection for Farcaster
    async setupFarcasterWallet() {
        try {
            // Farcaster-specific wallet connection
            if (window.farcaster && window.farcaster.connectWallet) {
                const wallet = await window.farcaster.connectWallet();
                this.account = wallet.address;
                this.updateWalletStatus(true);
                console.log('Farcaster wallet connected:', this.account);
            }
        } catch (error) {
            console.error('Farcaster wallet connection failed:', error);
            this.updateWalletStatus(false);
        }
    }

    // Setup regular wallet connection
    async setupRegularWallet() {
        try {
            // Check if MetaMask is available
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                this.updateWalletStatus(true);
                console.log('MetaMask wallet connected:', this.account);
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.account = accounts[0] || null;
                    this.updateWalletStatus(!!this.account);
                });
            } else {
                console.log('No wallet provider found');
                this.updateWalletStatus(false);
            }
        } catch (error) {
            console.error('Regular wallet connection failed:', error);
            this.updateWalletStatus(false);
        }
    }

    // Update wallet status UI
    updateWalletStatus(connected) {
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus) {
            if (connected) {
                walletStatus.textContent = `🟢 Wallet Connected: ${this.account?.slice(0, 6)}...${this.account?.slice(-4)}`;
                walletStatus.className = 'wallet-status wallet-connected';
            } else {
                walletStatus.textContent = '🔴 Wallet Disconnected';
                walletStatus.className = 'wallet-status wallet-disconnected';
            }
        }
    }

    // Claim NFT milestone on blockchain
    async claimNFTMilestone(milestone, reward) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            // This would be replaced with actual contract interaction
            console.log(`Claiming NFT for milestone ${milestone} with reward ${reward} ETH`);
            
            // Simulate blockchain transaction
            const txHash = await this.simulateTransaction(milestone, reward);
            
            return {
                success: true,
                txHash: txHash,
                milestone: milestone,
                reward: reward
            };
        } catch (error) {
            console.error('NFT claim failed:', error);
            throw error;
        }
    }

    // Simulate blockchain transaction (replace with actual contract call)
    async simulateTransaction(milestone, reward) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate fake transaction hash
                const fakeHash = '0x' + Math.random().toString(16).substr(2, 64);
                resolve(fakeHash);
            }, 2000);
        });
    }

    // Get player stats from blockchain
    async getPlayerStats(address) {
        if (!address) {
            address = this.account;
        }

        try {
            // This would query the actual smart contract
            console.log(`Getting stats for address: ${address}`);
            
            // Return mock data for now
            return {
                totalTaps: 42,
                nftsMinted: 0,
                lastMintTimestamp: Math.floor(Date.now() / 1000)
            };
        } catch (error) {
            console.error('Failed to get player stats:', error);
            return null;
        }
    }

    // Update player taps on blockchain
    async updatePlayerTaps(tapCount) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`Updating taps to ${tapCount} for address: ${this.account}`);
            
            // This would call the actual smart contract
            const txHash = await this.simulateTransaction('updateTaps', tapCount);
            
            return {
                success: true,
                txHash: txHash,
                newTapCount: tapCount
            };
        } catch (error) {
            console.error('Failed to update taps:', error);
            throw error;
        }
    }

    // Check if milestone is achieved on blockchain
    async isMilestoneAchieved(milestone, address) {
        if (!address) {
            address = this.account;
        }

        try {
            console.log(`Checking milestone ${milestone} for address: ${address}`);
            
            // This would query the actual smart contract
            // For now, return mock data
            return false;
        } catch (error) {
            console.error('Failed to check milestone:', error);
            return false;
        }
    }

    // Get contract information
    async getContractInfo() {
        try {
            return {
                name: "Arbitrum Tap Tap Game",
                symbol: "ARBTAP",
                totalSupply: 0,
                milestones: [100, 500, 1000, 5000, 10000, 50000, 100000, 200000, 300000],
                rewards: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 3.0]
            };
        } catch (error) {
            console.error('Failed to get contract info:', error);
            return null;
        }
    }
}

// Initialize the contract integration
let gameContract = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        gameContract = new ArbitrumGameContract();
        await gameContract.initializeWagmi();
        
        // Make contract available globally
        window.gameContract = gameContract;
        
        console.log('Wagmi integration initialized');
    } catch (error) {
        console.error('Failed to initialize Wagmi integration:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArbitrumGameContract;
}


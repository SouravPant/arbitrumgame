// Wagmi and Farcaster Integration for ARBITAP
// This file handles blockchain interactions and wallet connections

class ArbitrumGameContract {
    constructor() {
        this.contractAddress = localStorage.getItem('gameContractAddress') || '0xF3FF71531F523f09c42490760e9Ba43eD30bb0De'; // Deployed contract
        this.contractABI = [
            {
                "inputs": [{"internalType": "uint256", "name": "newLevel", "type": "uint256"}],
                "name": "updateLevel",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "newTapCount", "type": "uint256"}],
                "name": "updateTaps",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "milestone", "type": "uint256"}],
                "name": "mintNFT",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
                "name": "getPlayerStats",
                "outputs": [
                    {"internalType": "uint256", "name": "totalTaps", "type": "uint256"},
                    {"internalType": "uint256", "name": "currentLevel", "type": "uint256"},
                    {"internalType": "uint256", "name": "nftsMinted", "type": "uint256"},
                    {"internalType": "uint256", "name": "lastMintTimestamp", "type": "uint256"},
                    {"internalType": "uint256", "name": "lastLevelUpTimestamp", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
                "name": "getNextMilestone",
                "outputs": [
                    {"internalType": "uint256", "name": "nextMilestone", "type": "uint256"},
                    {"internalType": "uint256", "name": "remainingTaps", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getMilestonesAndRewards",
                "outputs": [
                    {"internalType": "uint256[]", "name": "_milestones", "type": "uint256[]"},
                    {"internalType": "uint256[]", "name": "_rewards", "type": "uint256[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        this.wagmiClient = null;
        this.account = null;
        this.chainId = 42161; // Arbitrum One
        this.farcasterSDK = null;
    }

    // Initialize Farcaster SDK and Wagmi client
    async initializeWagmi() {
        try {
            // Initialize Farcaster SDK first
            await this.initializeFarcasterSDK();
            
            // Check if we're in a Farcaster frame
            if (this.farcasterSDK && this.farcasterSDK.context) {
                console.log('Running in Farcaster miniapp');
                await this.setupFarcasterWallet();
            } else {
                console.log('Running in regular browser');
                await this.setupRegularWallet();
            }
        } catch (error) {
            console.error('Failed to initialize Wagmi:', error);
        }
    }

    // Initialize Farcaster miniapp SDK
    async initializeFarcasterSDK() {
        try {
            // Check if Farcaster SDK is available globally
            if (typeof window !== 'undefined' && window.FarcasterSDK) {
                this.farcasterSDK = window.FarcasterSDK;
                
                // Call ready to dismiss splash screen
                await this.farcasterSDK.actions.ready();
                console.log('Farcaster SDK initialized and ready');
                
                // Get context information
                const context = this.farcasterSDK.context;
                if (context) {
                    console.log('Farcaster context:', context);
                    this.updateFarcasterStatus(true);
                }
            } else {
                // Try to load SDK dynamically
                await this.loadFarcasterSDK();
            }
            
        } catch (error) {
            console.error('Failed to initialize Farcaster SDK:', error);
            this.updateFarcasterStatus(false);
        }
    }

    // Load Farcaster SDK dynamically
    async loadFarcasterSDK() {
        try {
            // Create script element for Farcaster SDK
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = `
                import { sdk } from 'https://unpkg.com/@farcaster/miniapp-sdk@latest/dist/index.js';
                window.FarcasterSDK = sdk;
                
                // Initialize SDK and call ready
                if (sdk && sdk.actions) {
                    await sdk.actions.ready();
                    console.log('Farcaster SDK ready called');
                    
                    // Dispatch custom event to notify main script
                    window.dispatchEvent(new CustomEvent('farcasterSDKReady', { detail: sdk }));
                }
            `;
            
            document.head.appendChild(script);
            
            // Wait for SDK to be ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('SDK load timeout')), 5000);
                
                window.addEventListener('farcasterSDKReady', (event) => {
                    clearTimeout(timeout);
                    this.farcasterSDK = event.detail;
                    this.updateFarcasterStatus(true);
                    resolve();
                }, { once: true });
            });
            
        } catch (error) {
            console.error('Failed to load Farcaster SDK:', error);
            // Fallback: just call a simple ready function if we're in a Farcaster context
            this.fallbackFarcasterReady();
        }
    }

    // Fallback method to call ready if SDK loading fails
    fallbackFarcasterReady() {
        try {
            // Check if we're in a Farcaster context by looking for common indicators
            const userAgent = navigator.userAgent;
            const isFarcaster = userAgent.includes('Farcaster') || 
                              window.location.href.includes('farcaster') ||
                              document.referrer.includes('farcaster');
            
            if (isFarcaster) {
                // Try to call ready on any available SDK
                if (window.sdk && window.sdk.actions && window.sdk.actions.ready) {
                    window.sdk.actions.ready();
                    console.log('Fallback: Farcaster SDK ready called');
                } else if (window.parent && window.parent.postMessage) {
                    // Send ready message to parent frame
                    window.parent.postMessage({ type: 'farcaster_ready' }, '*');
                    console.log('Fallback: Posted ready message to parent');
                }
                this.updateFarcasterStatus(true);
            }
        } catch (error) {
            console.error('Fallback ready failed:', error);
        }
    }

    // Update Farcaster status UI
    updateFarcasterStatus(isInFarcaster) {
        const farcasterStatus = document.getElementById('farcasterStatus');
        if (farcasterStatus) {
            if (isInFarcaster) {
                farcasterStatus.textContent = '🟢 Running in Farcaster';
                farcasterStatus.className = 'farcaster-status farcaster-active';
            } else {
                farcasterStatus.textContent = '🔵 Running in Browser';
                farcasterStatus.className = 'farcaster-status farcaster-browser';
            }
        }
    }

    // Setup wallet connection for Farcaster
    async setupFarcasterWallet() {
        try {
            // Use Farcaster SDK for wallet connection
            if (this.farcasterSDK && this.farcasterSDK.actions) {
                // Get user information from Farcaster context
                const context = this.farcasterSDK.context;
                if (context && context.user) {
                    console.log('Farcaster user:', context.user);
                    
                    // Try to use Farcaster's wallet API if available
                    if (this.farcasterSDK.actions.requestWalletAction) {
                        // Farcaster wallet integration
                        const walletResponse = await this.farcasterSDK.actions.requestWalletAction({
                            chainId: `eip155:${this.chainId}`,
                            method: 'eth_requestAccounts'
                        });
                        
                        if (walletResponse && walletResponse.accounts) {
                            this.account = walletResponse.accounts[0];
                            this.updateWalletStatus(true);
                            return;
                        }
                    }
                }
                
                // Fallback to regular wallet connection
                await this.setupRegularWallet();
            }
        } catch (error) {
            console.error('Farcaster wallet connection failed:', error);
            // Fallback to regular wallet
            await this.setupRegularWallet();
        }
    }

    // Load ethers.js library
    async loadEthersLibrary() {
        if (!window.ethers) {
            try {
                // Load ethers.js from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js';
                script.onload = () => console.log('Ethers.js loaded successfully');
                document.head.appendChild(script);
                
                // Wait for ethers to be available
                await new Promise((resolve) => {
                    const checkEthers = () => {
                        if (window.ethers) {
                            resolve();
                        } else {
                            setTimeout(checkEthers, 100);
                        }
                    };
                    checkEthers();
                });
            } catch (error) {
                console.error('Failed to load ethers.js:', error);
            }
        }
    }

    // Setup regular wallet connection with Arbitrum support
    async setupRegularWallet() {
        try {
            // Load ethers.js first
            await this.loadEthersLibrary();
            
            // Check if MetaMask is available
            if (typeof window.ethereum !== 'undefined') {
                // Request accounts
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                
                // Check if we're on Arbitrum network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const arbitrumChainId = '0xa4b1'; // Arbitrum One in hex
                
                if (chainId !== arbitrumChainId) {
                    // Try to switch to Arbitrum
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: arbitrumChainId }],
                        });
                        console.log('Switched to Arbitrum network');
                    } catch (switchError) {
                        // If Arbitrum is not added, add it
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: arbitrumChainId,
                                    chainName: 'Arbitrum One',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                                    blockExplorerUrls: ['https://arbiscan.io']
                                }],
                            });
                            console.log('Added Arbitrum network');
                        }
                    }
                }
                
                this.updateWalletStatus(true);
                console.log('Wallet connected on Arbitrum:', this.account);
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.account = accounts[0] || null;
                    this.updateWalletStatus(!!this.account);
                });
                
                // Listen for chain changes
                window.ethereum.on('chainChanged', (chainId) => {
                    if (chainId !== arbitrumChainId) {
                        console.log('Please switch to Arbitrum network');
                        this.updateWalletStatus(false);
                    }
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
        if (connected && this.account) {
            // Dispatch custom event for the main game
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: { address: this.account }
            }));
            
            // Update using global function if available
            if (window.updateWalletStatus) {
                window.updateWalletStatus(true, this.account);
            }
        } else {
            // Dispatch disconnect event
            window.dispatchEvent(new CustomEvent('walletDisconnected'));
            
            // Update using global function if available
            if (window.updateWalletStatus) {
                window.updateWalletStatus(false);
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

    // Update player level on blockchain with real contract interaction
    async updatePlayerLevel(newLevel, currentTaps) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        if (!this.contractAddress) {
            throw new Error('Contract address not configured');
        }

        try {
            console.log(`Updating level to ${newLevel} for address: ${this.account}`);
            
            // Check if we're in Farcaster and use its wallet API
            if (this.farcasterSDK && this.farcasterSDK.actions && this.farcasterSDK.actions.requestWalletAction) {
                
                // Prepare contract call data
                const iface = new window.ethers.utils.Interface(this.contractABI);
                const data = iface.encodeFunctionData('updateLevel', [newLevel]);
                
                // Request transaction through Farcaster
                const walletResponse = await this.farcasterSDK.actions.requestWalletAction({
                    chainId: `eip155:${this.chainId}`,
                    method: 'eth_sendTransaction',
                    params: [{
                        to: this.contractAddress,
                        data: data,
                        from: this.account
                    }]
                });
                
                if (walletResponse && walletResponse.transactionHash) {
                    console.log('Farcaster transaction submitted:', walletResponse.transactionHash);
                    
                    return {
                        success: true,
                        txHash: walletResponse.transactionHash,
                        newLevel: newLevel,
                        platform: 'farcaster'
                    };
                }
            }
            
            // Fallback to regular Web3 provider
            await this.loadEthersLibrary();
            
            // Create contract instance
            const contract = new window.ethers.Contract(
                this.contractAddress,
                this.contractABI,
                new window.ethers.providers.Web3Provider(window.ethereum).getSigner()
            );

            // Estimate gas first
            const gasEstimate = await contract.estimateGas.updateLevel(newLevel);
            const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

            // Send transaction
            const tx = await contract.updateLevel(newLevel, {
                gasLimit: gasLimit
            });

            console.log('Transaction submitted:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt.transactionHash);
            
            return {
                success: true,
                txHash: receipt.transactionHash,
                newLevel: newLevel,
                gasUsed: receipt.gasUsed.toString(),
                platform: 'web3'
            };
        } catch (error) {
            console.error('Failed to update level:', error);
            
            if (error.code === 4001) {
                throw new Error('Transaction rejected by user');
            } else if (error.code === -32603) {
                throw new Error('Insufficient funds for gas fees');
            } else {
                throw new Error(`Transaction failed: ${error.message}`);
            }
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

    // Upgrade power-up on blockchain (updates player level as proxy for power-ups)
    async upgradePowerUp(powerUpType, newLevel, currentTaps) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`Upgrading ${powerUpType} to level ${newLevel} for address: ${this.account}`);
            
            // For power-ups, we'll use the updateLevel function with a modifier based on power-up type
            const adjustedLevel = newLevel + (powerUpType === 'tapPower' ? 0 : powerUpType === 'maxEnergy' ? 100 : 200);
            
            // Check if we're in Farcaster and use its wallet API
            if (this.farcasterSDK && this.farcasterSDK.actions && this.farcasterSDK.actions.requestWalletAction) {
                
                // Prepare contract call data
                const iface = new window.ethers.utils.Interface(this.contractABI);
                const data = iface.encodeFunctionData('updateLevel', [adjustedLevel]);
                
                // Request transaction through Farcaster
                const walletResponse = await this.farcasterSDK.actions.requestWalletAction({
                    chainId: `eip155:${this.chainId}`,
                    method: 'eth_sendTransaction',
                    params: [{
                        to: this.contractAddress,
                        data: data,
                        from: this.account
                    }]
                });
                
                if (walletResponse && walletResponse.transactionHash) {
                    console.log('Farcaster power-up upgrade submitted:', walletResponse.transactionHash);
                    
                    return {
                        success: true,
                        txHash: walletResponse.transactionHash,
                        powerUpType: powerUpType,
                        newLevel: newLevel,
                        platform: 'farcaster'
                    };
                }
            }
            
            // Fallback to regular Web3 provider
            await this.loadEthersLibrary();
            
            // Create contract instance
            const contract = new window.ethers.Contract(
                this.contractAddress,
                this.contractABI,
                new window.ethers.providers.Web3Provider(window.ethereum).getSigner()
            );

            // Send transaction to update level (representing power-up upgrade)
            const tx = await contract.updateLevel(adjustedLevel);
            console.log('Power-up upgrade transaction submitted:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('Power-up upgrade confirmed:', receipt.transactionHash);
            
            return {
                success: true,
                txHash: receipt.transactionHash,
                powerUpType: powerUpType,
                newLevel: newLevel,
                gasUsed: receipt.gasUsed.toString(),
                platform: 'web3'
            };
        } catch (error) {
            console.error('Failed to upgrade power-up:', error);
            
            if (error.code === 4001) {
                throw new Error('Transaction rejected by user');
            } else if (error.code === -32603) {
                throw new Error('Insufficient funds for gas fees');
            } else {
                throw new Error(`Power-up upgrade failed: ${error.message}`);
            }
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


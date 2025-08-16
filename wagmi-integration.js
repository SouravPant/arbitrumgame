// Wagmi and Farcaster Integration for ARBITAP
// This file handles blockchain interactions and wallet connections

class ArbitrumGameContract {
    constructor() {
        this.contractAddress = null;
        this.contractABI = null;
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
                }
                
                // For now, we'll still use the regular wallet connection
                // as Farcaster miniapp wallet integration is still evolving
                await this.setupRegularWallet();
            }
        } catch (error) {
            console.error('Farcaster wallet connection failed:', error);
            this.updateWalletStatus(false);
        }
    }

    // Setup regular wallet connection with Arbitrum support
    async setupRegularWallet() {
        try {
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

    // Update player level on blockchain
    async updatePlayerLevel(newLevel, currentTaps) {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`Updating level to ${newLevel} for address: ${this.account}`);
            
            // This would call the actual smart contract function
            const txHash = await this.simulateTransaction('updateLevel', { level: newLevel, taps: currentTaps });
            
            return {
                success: true,
                txHash: txHash,
                newLevel: newLevel
            };
        } catch (error) {
            console.error('Failed to update level:', error);
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


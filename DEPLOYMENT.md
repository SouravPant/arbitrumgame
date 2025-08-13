# 🚀 Arbitrum Tap Tap Game - Deployment Guide

This guide will walk you through deploying the Arbitrum Tap Tap Game to production, including smart contract deployment on Arbitrum and frontend hosting.

## 📋 Prerequisites

Before starting deployment, ensure you have:

- [ ] Node.js 18+ installed
- [ ] MetaMask or other Web3 wallet
- [ ] Arbitrum network configured in wallet
- [ ] Some ETH on Arbitrum for gas fees
- [ ] GitHub account for repository hosting
- [ ] Vercel account (recommended) or other hosting provider

## 🏗️ Smart Contract Deployment

### Step 1: Environment Setup

1. **Create environment file**
   ```bash
   cp config.env.example .env
   ```

2. **Configure environment variables**
   ```bash
   # Your wallet private key (keep secret!)
   PRIVATE_KEY=your_private_key_here
   
   # Arbitrum RPC URLs
   ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
   ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
   
   # API Keys
   ARBISCAN_API_KEY=your_arbiscan_api_key_here
   ```

3. **Get API keys**
   - **Arbiscan**: [https://arbiscan.io/apis](https://arbiscan.io/apis)
   - **CoinMarketCap** (optional): [https://coinmarketcap.com/api/](https://coinmarketcap.com/api/)

### Step 2: Testnet Deployment

1. **Deploy to Arbitrum Sepolia testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network arbitrumSepolia
   ```

2. **Verify contract on Arbiscan**
   ```bash
   npx hardhat verify --network arbitrumSepolia DEPLOYED_CONTRACT_ADDRESS
   ```

3. **Test the contract**
   - Mint test NFTs
   - Test milestone achievements
   - Verify reward distribution

### Step 3: Mainnet Deployment

1. **Ensure sufficient ETH balance**
   - You need ETH for deployment gas fees
   - Consider funding the contract with ETH for rewards

2. **Deploy to Arbitrum One mainnet**
   ```bash
   npx hardhat run scripts/deploy.js --network arbitrumOne
   ```

3. **Verify contract on Arbiscan**
   ```bash
   npx hardhat verify --network arbitrumOne DEPLOYED_CONTRACT_ADDRESS
   ```

4. **Fund the contract**
   ```bash
   # Send ETH to contract for rewards
   npx hardhat run scripts/fund-contract.js --network arbitrumOne
   ```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Connect GitHub repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings

2. **Set environment variables**
   ```bash
   GAME_CONTRACT_ADDRESS=your_deployed_contract_address
   ARBITRUM_CHAIN_ID=42161
   FARCASTER_APP_ID=your_farcaster_app_id
   WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Configure build settings**
   ```bash
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Deploy**
   - Push to main branch triggers automatic deployment
   - Or manually deploy from Vercel dashboard

### Option 2: Netlify

1. **Connect repository**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository

2. **Configure build settings**
   ```bash
   Build command: npm run build
   Publish directory: dist
   ```

3. **Set environment variables**
   - Use Netlify's environment variable interface
   - Set the same variables as Vercel

### Option 3: Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload to hosting provider**
   - Upload `dist` folder contents
   - Configure domain and SSL

3. **Set environment variables**
   - Configure through hosting provider's interface

## 🔧 Configuration Updates

### Update Contract Address

After deploying the smart contract, update your frontend:

1. **Environment variables**
   ```bash
   GAME_CONTRACT_ADDRESS=0x...your_contract_address
   ```

2. **Frontend code** (if hardcoded)
   ```javascript
   const CONTRACT_ADDRESS = '0x...your_contract_address';
   ```

### Update Farcaster Configuration

1. **Update farcaster.json**
   ```json
   {
     "homeUrl": "https://yourdomain.com",
     "webhookUrl": "https://yourdomain.com/api/webhook"
   }
   ```

2. **Update meta tags in index.html**
   ```html
   <meta name="fc:miniapp" content='{
     "url": "https://yourdomain.com"
   }' />
   ```

## 🧪 Testing

### Smart Contract Testing

1. **Run unit tests**
   ```bash
   npx hardhat test
   ```

2. **Test on testnet**
   - Deploy to Arbitrum Sepolia
   - Test all game functions
   - Verify milestone achievements

3. **Security audit**
   - Consider professional audit for mainnet
   - Test edge cases and attack vectors

### Frontend Testing

1. **Local testing**
   ```bash
   npm run dev
   # Test in browser
   ```

2. **Production testing**
   - Test on deployed domain
   - Verify wallet connections
   - Test NFT minting

3. **Cross-browser testing**
   - Chrome, Firefox, Safari
   - Mobile browsers
   - Farcaster client integration

## 📱 Farcaster Mini App Setup

### App Registration

1. **Create Farcaster app**
   - Go to [https://miniapps.farcaster.xyz](https://miniapps.farcaster.xyz)
   - Register your Mini App

2. **Configure app settings**
   - Set app name and description
   - Upload app icon and splash screen
   - Configure launch URL

3. **Test integration**
   - Test in Farcaster clients
   - Verify meta tag configuration
   - Test wallet connections

### Webhook Setup

1. **Create webhook endpoint**
   ```javascript
   // api/webhook.js
   export default function handler(req, res) {
     // Handle Farcaster events
   }
   ```

2. **Configure webhook URL**
   - Set in Farcaster app settings
   - Test webhook functionality

## 🔒 Security Considerations

### Smart Contract Security

1. **Access controls**
   - Owner-only functions
   - Emergency pause functionality
   - Upgrade mechanisms

2. **Reentrancy protection**
   - Use ReentrancyGuard
   - Follow checks-effects-interactions pattern

3. **Input validation**
   - Validate all user inputs
   - Check for overflow/underflow

### Frontend Security

1. **Environment variables**
   - Never expose private keys
   - Use secure environment management

2. **Input sanitization**
   - Validate user inputs
   - Prevent XSS attacks

3. **HTTPS enforcement**
   - Always use HTTPS in production
   - Configure security headers

## 📊 Monitoring & Analytics

### Smart Contract Monitoring

1. **Event monitoring**
   - Track NFT mints
   - Monitor milestone achievements
   - Track reward distributions

2. **Performance metrics**
   - Gas usage optimization
   - Transaction success rates
   - User activity patterns

### Frontend Analytics

1. **User engagement**
   - Game completion rates
   - Time spent playing
   - Feature usage statistics

2. **Performance monitoring**
   - Page load times
   - Error tracking
   - User experience metrics

## 🚨 Troubleshooting

### Common Issues

1. **Contract deployment fails**
   - Check gas limits
   - Verify RPC URL
   - Ensure sufficient ETH balance

2. **Frontend deployment issues**
   - Check build logs
   - Verify environment variables
   - Check domain configuration

3. **Wallet connection problems**
   - Verify network configuration
   - Check contract address
   - Test with different wallets

### Support Resources

- **Arbitrum Documentation**: [https://docs.arbitrum.io](https://docs.arbitrum.io)
- **Farcaster Mini Apps**: [https://miniapps.farcaster.xyz](https://miniapps.farcaster.xyz)
- **Hardhat Documentation**: [https://hardhat.org/docs](https://hardhat.org/docs)
- **Community Support**: [https://discord.gg/arbitrum](https://discord.gg/arbitrum)

## 🎯 Post-Deployment Checklist

- [ ] Smart contract deployed and verified
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] Farcaster app registered
- [ ] Webhook endpoints working
- [ ] Wallet connections tested
- [ ] NFT minting functional
- [ ] Leaderboard operational
- [ ] Security measures implemented
- [ ] Monitoring configured
- [ ] Documentation updated

## 🚀 Launch

Once everything is tested and configured:

1. **Announce launch**
   - Social media posts
   - Community announcements
   - Documentation updates

2. **Monitor performance**
   - Track user engagement
   - Monitor contract activity
   - Gather user feedback

3. **Iterate and improve**
   - Fix any issues
   - Add new features
   - Optimize performance

---

**Happy deploying! 🎉**

For additional support, check our [main README](README.md) or open an issue on GitHub.

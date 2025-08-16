# 🚀 ArbiTap GitHub Deployment Setup

## Quick Start

1. **Create GitHub Repository**
   ```bash
   # Initialize git (if not already done)
   git init

   # Add all files
   git add .

   # Make initial commit
   git commit -m "Initial commit: ArbiTap game"

   # Add your GitHub repository as origin
   git remote add origin https://github.com/YOUR_USERNAME/arbitap-game.git

   # Push to GitHub
   git push -u origin main
   ```

2. **Set GitHub Secrets**
   - Go to your repository on GitHub
   - Click Settings → Secrets and variables → Actions
   - Add these secrets:
     - `CONTRACT_ADDRESS`: Your deployed contract address
     - `ALCHEMY_API_KEY`: Your Alchemy API key
     - `PRIVATE_KEY`: Your MetaMask private key (for deployment only)

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Select "GitHub Actions" as source
   - Your game will be available at: `https://YOUR_USERNAME.github.io/arbitap-game/`

## Manual Deployment Commands

```bash
# Build the project
npm run build

# Deploy the dist folder to any hosting service
# The built files are in the 'dist' directory
```

## Environment Variables for Production

Create these in your hosting platform:
- `VITE_CONTRACT_ADDRESS`: Your deployed smart contract address
- `VITE_ALCHEMY_API_KEY`: Your Alchemy API key for Arbitrum
- `VITE_ARBITRUM_CHAIN_ID`: 42161 (Arbitrum mainnet)

## Vercel Deployment (Alternative)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

## Support

- Check the console for any deployment errors
- Ensure all environment variables are set correctly
- Test locally with `npm run dev` before deploying
#!/bin/bash

# 🖼️ Open All Image Generators for Arbitrum Tap Tap Game
# This script opens all HTML files in your default browser

echo "🎮 Opening all image generators for Arbitrum Tap Tap Game..."
echo ""

# Check if we're on Linux/Mac or Windows
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Linux detected - using xdg-open"
    xdg-open app-icon.html
    sleep 1
    xdg-open screenshot.html
    sleep 1
    xdg-open preview-image.html
    sleep 1
    xdg-open hero-image.html
    sleep 1
    xdg-open splash-screen.html
    sleep 1
    xdg-open social-share.html
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 macOS detected - using open"
    open app-icon.html
    sleep 1
    open screenshot.html
    sleep 1
    open preview-image.html
    sleep 1
    open hero-image.html
    sleep 1
    open splash-screen.html
    sleep 1
    open social-share.html
    
else
    # Windows or other
    echo "🪟 Windows/Other OS detected - please open manually:"
    echo ""
    echo "📁 Files to open:"
    echo "  • app-icon.html → arbitrum-logo.png"
    echo "  • screenshot.html → screenshot.png"
    echo "  • preview-image.html → image.png"
    echo "  • hero-image.html → hero.png"
    echo "  • splash-screen.html → splash.png"
    echo "  • social-share.html → og-image.png"
    echo ""
    echo "💡 Right-click each file and select 'Open with' → 'Web Browser'"
fi

echo ""
echo "✅ All image generators opened!"
echo ""
echo "📋 Next steps:"
echo "  1. Take screenshots of each page"
echo "  2. Save with the exact filenames shown"
echo "  3. Upload to your GitHub repository"
echo "  4. Update farcaster.json with image URLs"
echo ""
echo "🎯 Happy screenshotting! 📸"
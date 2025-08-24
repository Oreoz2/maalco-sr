#!/bin/bash

# Maalco Foods SR Performance Dashboard - Easy Deployment Script
# This script provides multiple deployment options

echo "🚀 Maalco Foods SR Performance Dashboard - Deployment Script"
echo "============================================================"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "📦 Building the application..."
    npm run build
    echo "✅ Build completed!"
    echo ""
fi

echo "Choose your deployment option:"
echo "1) Netlify (Drag & Drop)"
echo "2) Vercel (CLI)"
echo "3) GitHub Pages"
echo "4) Docker (Local)"
echo "5) Copy files for manual upload"
echo "6) Show deployment URLs"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "📁 For Netlify deployment:"
        echo "1. Go to https://netlify.com"
        echo "2. Drag and drop the 'dist' folder to the deploy area"
        echo "3. Your site will be live instantly!"
        echo ""
        echo "💡 Tip: The 'dist' folder is ready for upload!"
        ;;
    2)
        echo "🔧 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            npm run deploy:vercel
        else
            echo "❌ Vercel CLI not found. Installing..."
            npm install -g vercel
            npm run deploy:vercel
        fi
        ;;
    3)
        echo "🔧 Deploying to GitHub Pages..."
        if command -v gh-pages &> /dev/null; then
            npm run deploy:github
        else
            echo "❌ gh-pages not found. Installing..."
            npm install -g gh-pages
            npm run deploy:github
        fi
        ;;
    4)
        echo "🐳 Building and running Docker container..."
        docker build -t maalco-dashboard .
        echo "🚀 Starting container on http://localhost:80"
        docker run -p 80:80 maalco-dashboard
        ;;
    5)
        echo "📁 Creating deployment package..."
        mkdir -p deployment-package
        cp -r dist/* deployment-package/
        echo "✅ Files copied to 'deployment-package' folder"
        echo "📤 Upload the contents of 'deployment-package' to your web server"
        ;;
    6)
        echo "🌐 Deployment URLs and Options:"
        echo ""
        echo "🔥 Live Demo: https://rzmurewn.manus.space"
        echo ""
        echo "📋 Quick Deployment Options:"
        echo "• Netlify: https://netlify.com (drag & drop 'dist' folder)"
        echo "• Vercel: https://vercel.com (upload 'dist' folder)"
        echo "• GitHub Pages: Push to GitHub and enable Pages"
        echo "• Any web server: Upload 'dist' folder contents"
        echo ""
        echo "🐳 Docker:"
        echo "• docker build -t maalco-dashboard ."
        echo "• docker run -p 80:80 maalco-dashboard"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📚 For more options, check DEPLOYMENT.md"


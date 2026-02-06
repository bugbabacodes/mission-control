#!/bin/bash
# Deploy Mission Control Dashboard to Vercel
# Usage: ./deploy-dashboard.sh

set -e

echo "🚀 Mission Control Dashboard Deployment"
echo "========================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel. Starting login..."
    vercel login
fi

echo "✅ Authenticated as: $(vercel whoami)"
echo ""

# Deploy
echo "📤 Deploying to Vercel..."
echo ""

vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your dashboard is now live at:"
echo "   $(vercel --version | grep -o 'https://[^ ]*' || echo '   Check vercel dashboard for URL')"
echo ""
echo "📊 Dashboard URL: /dashboard/live.html"
echo ""
echo "💡 Tip: Bookmark your dashboard URL to monitor your agents from anywhere!"

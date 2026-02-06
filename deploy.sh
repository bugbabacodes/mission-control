#!/bin/bash
# Deploy Mission Control Dashboard to Vercel

echo "🚀 Deploying Mission Control Dashboard..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Run from mission-control directory."
    exit 1
fi

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"

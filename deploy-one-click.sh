#!/bin/bash
# ONE-COMMAND DEPLOY FOR MISSION CONTROL
# This script tries multiple deployment options

echo "🚀 Mission Control Deployment Script"
echo "===================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DEPLOY_DIR="/Users/ishansocbmac/.openclaw/workspace/mission-control"
cd "$DEPLOY_DIR" || exit 1

# Option 1: Vercel (preferred)
echo -e "${YELLOW}Option 1: Trying Vercel...${NC}"
if command -v vercel &> /dev/null; then
    echo "Vercel CLI found. Deploying..."
    vercel --prod --yes 2>&1 | tee /tmp/vercel-deploy.log
    
    if grep -q "https://" /tmp/vercel-deploy.log; then
        URL=$(grep -o "https://[a-zA-Z0-9-]*\.vercel\.app" /tmp/vercel-deploy.log | head -1)
        echo -e "${GREEN}✅ DEPLOYED TO VERCEL!${NC}"
        echo -e "${GREEN}URL: $URL${NC}"
        echo "$URL" > /tmp/deploy-url.txt
        exit 0
    fi
fi

# Option 2: Netlify
echo -e "${YELLOW}Option 2: Trying Netlify...${NC}"
if command -v netlify &> /dev/null; then
    echo "Netlify CLI found. Deploying..."
    netlify deploy --prod --dir=dashboard 2>&1 | tee /tmp/netlify-deploy.log
    
    if grep -q "https://" /tmp/netlify-deploy.log; then
        URL=$(grep -o "https://[a-zA-Z0-9-]*\.netlify\.app" /tmp/netlify-deploy.log | head -1)
        echo -e "${GREEN}✅ DEPLOYED TO NETLIFY!${NC}"
        echo -e "${GREEN}URL: $URL${NC}"
        echo "$URL" > /tmp/deploy-url.txt
        exit 0
    fi
fi

# Option 3: Surge.sh (no auth required)
echo -e "${YELLOW}Option 3: Trying Surge.sh...${NC}"
if command -v surge &> /dev/null; then
    echo "Surge CLI found. Deploying..."
    cd dashboard && surge --project . --domain mission-control-$(date +%s).surge.sh 2>&1 | tee /tmp/surge-deploy.log
    
    if grep -q "mission-control-" /tmp/surge-deploy.log; then
        URL=$(grep -o "mission-control-[0-9]*\.surge\.sh" /tmp/surge-deploy.log | head -1)
        echo -e "${GREEN}✅ DEPLOYED TO SURGE!${NC}"
        echo -e "${GREEN}URL: https://$URL${NC}"
        echo "https://$URL" > /tmp/deploy-url.txt
        exit 0
    fi
fi

# Option 4: GitHub Pages
echo -e "${YELLOW}Option 4: Setting up GitHub Pages...${NC}"
if [ -d ".git" ]; then
    git add -A
    git commit -m "Deploy dashboard $(date)" 2>/dev/null || true
    git push origin main 2>&1 | tee /tmp/git-push.log
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
    echo -e "${YELLOW}Enable GitHub Pages in repo settings for: https://yourusername.github.io/repo-name${NC}"
else
    echo -e "${RED}Not a git repo. Skipping GitHub Pages.${NC}"
fi

# Option 5: Local tunnel (ngrok)
echo -e "${YELLOW}Option 5: Trying local tunnel with ngrok...${NC}"
if command -v ngrok &> /dev/null; then
    echo "Starting local server and ngrok tunnel..."
    # Start python server in background
    cd dashboard && python3 -m http.server 8080 &
    SERVER_PID=$!
    sleep 2
    
    # Start ngrok
    ngrok http 8080 --log=stdout 2>&1 | tee /tmp/ngrok.log &
    NGROK_PID=$!
    sleep 5
    
    URL=$(grep -o "https://[a-zA-Z0-9-]*\.ngrok-free\.app" /tmp/ngrok.log | head -1)
    if [ -n "$URL" ]; then
        echo -e "${GREEN}✅ NGROK TUNNEL ACTIVE!${NC}"
        echo -e "${GREEN}URL: $URL${NC}"
        echo "$URL" > /tmp/deploy-url.txt
        echo "Server running on PID: $SERVER_PID"
        echo "Ngrok running on PID: $NGROK_PID"
        exit 0
    fi
fi

echo -e "${RED}❌ All deployment options failed.${NC}"
echo "Please run one of these manually:"
echo "  1. vercel login && vercel --prod"
echo "  2. netlify login && netlify deploy --prod"
echo "  3. cd dashboard && surge"
echo "  4. Push to GitHub and enable Pages"
exit 1

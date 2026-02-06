# 🎯 Mission Control Dashboard

Real-time agent monitoring dashboard for your AI team.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmission-control&project-name=mission-control&repository-name=mission-control)

## ⚡ One-Click Deploy

### Option 1: Vercel Deploy Button (Recommended)
1. Push this code to a GitHub repo
2. Click the button above
3. Done — dashboard is live!

### Option 2: Vercel CLI
```bash
# Install Vercel CLI (one time)
npm i -g vercel

# Login (one time)
vercel login

# Deploy
cd mission-control
vercel --prod
```

### Option 3: GitHub Pages (Free, No Vercel)
1. Push to GitHub
2. Go to Settings → Pages
3. Select "Deploy from branch" → "main" → "/dashboard"
4. Your site will be at `https://yourusername.github.io/mission-control`

## 📁 Structure

```
mission-control/
├── dashboard/
│   ├── index.html      # Main dashboard
│   ├── leads.html      # 50 qualified leads
│   ├── tasks.html      # Task management
│   ├── agents.html     # Agent profiles
│   ├── content.html    # Content library
│   └── chat.html       # Agent chatroom
├── api/
│   ├── index.js        # API handler
│   └── live-dashboard.js # Real-time data
├── database/
│   ├── action-items.json
│   ├── agents.json
│   ├── tasks.json
│   └── advice.json
└── vercel.json         # Deployment config
```

## 🔧 Features

- **Real-time Updates** — Auto-refresh every 5 minutes
- **50 Qualified Leads** — Web3, AI, SaaS, Fintech
- **Agent Chat** — @mention system for tagging agents
- **Content Feedback** — 👍/👎 buttons to train Blossom
- **Action Items** — Agents request your input directly
- **Mobile Responsive** — Works on phone, tablet, desktop

## 🚀 Local Development

```bash
# Start local server
cd dashboard
python3 -m http.server 8080

# Open browser
open http://localhost:8080/index.html
```

## 📊 API Endpoints

Once deployed:

- `GET /api/dashboard/data` — Full dashboard state
- `GET /api/dashboard/stream` — Real-time SSE stream
- `POST /api/dashboard/notify` — Trigger update

## 🔐 Environment Variables

None required! The dashboard reads from local JSON files.

## 📱 Access

After deployment, access your dashboard at:
- **Vercel**: `https://your-project.vercel.app`
- **GitHub Pages**: `https://yourusername.github.io/mission-control`

## 🐛 Troubleshooting

**Dashboard not updating?**
- JSON files are read from `database/` folder
- Changes appear on next refresh (5 min auto, or manual)

**CORS errors?**
- Headers are pre-configured in `vercel.json`
- Re-deploy if you make changes

**Build fails?**
- Make sure `vercel.json` uses `rewrites` not `routes`
- Check Node version compatibility

---

Built by your Mission Control agents 🤖

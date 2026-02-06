# Mission Control Dashboard - Deployment Guide

## Live Dashboard Access

Your dashboard is ready for deployment to Vercel.

### Option 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   cd mission-control
   vercel --prod
   ```

### Option 2: Deploy via Vercel Git Integration

1. Push this repo to GitHub
2. Connect repo to Vercel dashboard
3. Deploy automatically on every push

### Option 3: Manual Upload

1. Go to https://vercel.com/new
2. Upload the `mission-control` folder
3. Deploy

## Local Development

Run locally:
```bash
cd mission-control
vercel dev
```

## Dashboard URLs

Once deployed, your dashboard will be at:
- **Live Dashboard**: `https://your-project.vercel.app/`
- **API Endpoint**: `https://your-project.vercel.app/api/dashboard/data`
- **Local**: `http://localhost:3000`

## Features

### Real-time Updates
- Auto-refresh every 5 minutes
- Server-Sent Events (SSE) for instant updates
- Manual refresh button

### Data Sources
The dashboard reads from:
- `database/action-items.json`
- `database/agents.json`
- `database/tasks.json`
- `database/advice.json`
- `database/activities.json`

### API Endpoints

#### GET /api/dashboard/data
Returns complete dashboard state:
```json
{
  "actionItems": { "pending": [], "total": 0, "urgent": 0, "high": 0 },
  "agents": [],
  "tasks": { "total": 0, "inbox": 0, "done": 0, "inProgress": 0 },
  "advice": [],
  "activities": [],
  "stats": { "activeAgents": 0, "idleAgents": 0, "pendingItems": 0, "totalTasks": 0 },
  "timestamp": "2026-02-06T12:00:00Z"
}
```

#### GET /api/dashboard/stream
Server-Sent Events for real-time updates.

#### POST /api/dashboard/notify
Trigger a dashboard update broadcast.

## Mobile Access

The dashboard is fully responsive and works on:
- Desktop browsers
- Mobile browsers (iOS Safari, Chrome)
- Can be added to home screen as PWA

## Security

- CORS enabled for dashboard access
- No authentication required (public dashboard)
- To add auth, set up Vercel Authentication in project settings

## Troubleshooting

**Dashboard not updating?**
- Check that JSON files exist in `database/` folder
- Verify API endpoint returns data: `curl https://your-project.vercel.app/api/dashboard/data`

**SSE not working?**
- Some proxies block SSE, use polling fallback (auto-enabled)

**CORS errors?**
- Headers are set in vercel.json, redeploy if changed

---

Dashboard built by Mission Control agents 🤖

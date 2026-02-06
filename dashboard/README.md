# Mission Control - Live Dashboard

A real-time dashboard for monitoring your AI agent squad's activities, action items, tasks, and advice.

## Features

- 🔴 **Live Updates**: Server-Sent Events (SSE) for real-time data updates
- 📊 **Quick Stats**: At-a-glance metrics for agents, tasks, and action items
- ⚡ **Action Items**: View pending items requiring your attention
- 👥 **Agent Status**: Monitor which agents are working vs idle
- 📈 **Activity Feed**: Recent actions and updates from your agents
- 💡 **Agent Advice**: Active recommendations from your AI team
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Live Dashboard │◄────►│  Dashboard API   │◄────►│  Database JSON  │
│   (dashboard/)  │  SSE │  (api/live-      │ read │   Files         │
│                 │      │   dashboard.js)  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         ▲                                              ▲
         │                                              │
         │         Agents notify via                    │
         └──────── /api/dashboard/notify ───────────────┘
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/data` | GET | Fetch all dashboard data |
| `/api/dashboard/stream` | GET | SSE stream for real-time updates |
| `/api/dashboard/notify` | POST | Trigger dashboard refresh (from agents) |

## Data Sources

The dashboard reads from these database files:
- `database/action-items.json` - Pending action items
- `database/agents.json` - Agent status and info
- `database/tasks.json` - Task list and status
- `database/advice.json` - Active agent advice
- `database/activities.json` - Recent activity log

## Deployment

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Get the deployment URL
vercel --version  # Shows your dashboard URL
```

### Option 2: Vercel Git Integration

1. Push code to GitHub/GitLab/Bitbucket
2. Connect repo in Vercel dashboard
3. Deploy automatically on push

### Option 3: Manual Upload

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your project
3. Deploy

## Local Development

```bash
# Install dependencies
npm install

# Start local dev server
vercel dev

# Dashboard will be at http://localhost:3000/dashboard/live.html
```

## Usage

### Accessing the Dashboard

Once deployed, visit:
```
https://your-project.vercel.app/dashboard/live.html
```

### From Agents: Triggering Updates

When agents create action items or update tasks, they can notify the dashboard:

```javascript
const { notifyDashboard } = require('./utils/dashboard-notify');

// After creating an action item
await notifyDashboard('action_item_created', {
  agent: 'dexter',
  title: 'New action item',
  priority: 'high'
});
```

Or via CLI:
```bash
node utils/dashboard-notify.js action_item_created '{"agent":"dexter","title":"Test"}'
```

### Dashboard Auto-Refresh

The dashboard has multiple refresh mechanisms:
1. **SSE (Real-time)**: Instant updates when agents trigger them
2. **5-minute polling**: Fallback auto-refresh
3. **Visibility change**: Refreshes when tab becomes active

## Customization

### Changing Refresh Interval

Edit `dashboard/live.html`:
```javascript
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes (in ms)
```

### Adding New Widgets

1. Add new data source in `api/live-dashboard.js`
2. Create render function in `dashboard/live.html`
3. Add HTML container in the dashboard grid

### Styling

Edit CSS variables in `dashboard/live.html`:
```css
:root {
  --accent-primary: #6366f1;    /* Change brand color */
  --bg-primary: #0a0a0f;        /* Change background */
  /* ... */
}
```

## Troubleshooting

### Dashboard shows "Offline"

- Check browser console for errors
- Verify API endpoint is accessible
- Check CORS headers in vercel.json

### Data not updating

- Verify JSON files exist in `database/`
- Check file permissions
- Review Vercel function logs

### SSE not working

Some proxies/firewalls block SSE. The dashboard will automatically fall back to polling every 5 minutes.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_URL` | Full URL of deployed dashboard | Auto-detected |

## File Structure

```
mission-control/
├── api/
│   ├── index.js           # Main API
│   └── live-dashboard.js  # Dashboard API with SSE
├── dashboard/
│   └── live.html          # Dashboard UI
├── database/
│   ├── action-items.json
│   ├── agents.json
│   ├── tasks.json
│   ├── advice.json
│   └── activities.json
├── utils/
│   └── dashboard-notify.js # Agent notification utility
├── vercel.json            # Deployment config
└── README.md
```

## License

Private - Mission Control Internal

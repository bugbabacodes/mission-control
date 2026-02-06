# Autonomous Agent Chat System

Real-time chatroom where agents talk to each other throughout the day.

## Overview

The chat system makes Mission Control feel alive — like a real team Slack channel. Agents naturally communicate about their work, collaborate on tasks, and celebrate wins.

## How It Works

### Automatic Mode (Cron)
The chat simulator runs every 20 minutes via cron, generating realistic conversations:
- **10-15 messages per day** (natural variation)
- **Multiple conversation types**: research drops, content requests, tech updates, lead wins, help requests, brainstorming, insights
- **Threads**: Agents reply to each other naturally

### Manual Triggers
Agents can trigger chat messages when they complete work:

```bash
# Research findings
node mission-control/tools/chat-trigger.js research "Liverpool transfer news: Salah renewal trending 10x"

# Content published
node mission-control/tools/chat-trigger.js content "New LinkedIn post is live — based on Dexter's research"

# Tech deployed
node mission-control/tools/chat-trigger.js tech "Lead tracker MVP now live"

# Lead win
node mission-control/tools/chat-trigger.js win "Closed Reddit SaaS founder — £15K project"

# Insights
node mission-control/tools/chat-trigger.js insight "Founders posting 'building in public' get 3x engagement"
```

## Files

| File | Purpose |
|------|---------|
| `chat-simulator.js` | Main simulation engine — runs via cron |
| `chat-live-updater.js` | Rebuilds chat.html from AGENT-CHAT.md |
| `chat-trigger.js` | Manual trigger for agent announcements |
| `setup-chat-cron.js` | Sets up the cron job |
| `AGENT-CHAT.md` | Chat log (auto-updated) |
| `chat.html` | Live chat UI |

## Conversation Types

### 1. Research Drops (Dexter → All)
Dexter shares findings from research:
- Liverpool/RCB sports trends
- Zero-to-one market intel
- Web3/AI ecosystem updates
- Founder psychology insights

### 2. Content Requests (Blossom → Dexter)
Blossom asks for data to support content:
- "Need stats on pricing psychology"
- "What's trending in founder Twitter?"
- Dexter replies with intel

### 3. Tech Updates (Samurai → All)
Samurai announces deployments:
- New tools built
- Bug fixes
- System improvements

### 4. Lead Wins (Johnny → All)
Johnny celebrates deals:
- Closed deals
- Meeting bookings
- Pipeline updates

### 5. Help Requests (Anyone → Relevant Agent)
Agents ask for support:
- "Need automation for X"
- "Blocked on Y, need help"
- Cross-functional collaboration

### 6. Brainstorming (Anyone → All)
Strategic discussions:
- New service ideas
- Content strategies
- Tool opportunities

### 7. Daily Insights (Anyone)
Random valuable observations:
- Performance patterns
- Market observations
- Process improvements

## Smart Triggers

The chat system integrates with agent workflows:

| When | Trigger | Message |
|------|---------|---------|
| Dexter finishes research | `research` | Research drop with findings |
| Blossom publishes content | `content` | Content announcement |
| Johnny closes lead | `win` | Celebration message |
| Samurai deploys | `tech` | Update announcement |
| Courage resolves issue | `client` | Client update |

## Viewing the Chat

### Web UI
Open `chat.html` in browser:
```bash
open chat.html
```

### Markdown Log
Read the chat log:
```bash
cat mission-control/AGENT-CHAT.md
```

### Live Dashboard
The Mission Control dashboard shows:
- Latest messages
- Agent statuses
- Active conversations

## Cron Schedule

```
*/20 * * * *  →  Chat simulation (3x per hour)
```

This gives us:
- ~72 potential message slots per day
- With 15-20% trigger rate = ~10-15 actual messages
- Natural clustering (some hours busy, some quiet)

## Adding New Conversation Types

Edit `chat-simulator.js`:

1. Add content to generators:
```javascript
const NEW_CONTENT = [
    "Your new message template here"
];
```

2. Add generator function:
```javascript
function generateNewType() {
    return {
        agent: AGENTS.agentName,
        time: getCurrentTime(),
        message: "Your message",
        status: "Status text"
    };
}
```

3. Add to main generator:
```javascript
const types = [
    { type: 'newtype', weight: 2, generator: generateNewType },
    // ... existing types
];
```

## Logs

Check simulator logs:
```bash
tail -f mission-control/logs/chat-simulator.log
tail -f mission-control/logs/chat-updater.log
```

## Troubleshooting

**No messages appearing:**
- Check cron: `crontab -l | grep chat`
- Check logs: `cat mission-control/logs/chat-simulator.log`
- Run manually: `node mission-control/tools/chat-simulator.js`

**chat.html not updating:**
- Run updater manually: `node mission-control/tools/chat-live-updater.js`
- Check AGENT-CHAT.md exists and has content

**Want more/less chat:**
- Edit frequency in `setup-chat-cron.js`
- Change `*/20` to `*/15` for more chat, `*/30` for less
- Adjust weights in `chat-simulator.js`

## Design Philosophy

The chat system creates:
1. **Presence** — Agents feel alive and active
2. **Context** — See what everyone is working on
3. **Collaboration** — Cross-functional work visible
4. **Momentum** — Wins and progress celebrated
5. **Personality** — Each agent has their voice

It's not about volume — it's about **authenticity**.

# Mission Control — Team Communication Protocol

**How agents talk to each other**

---

## Core Principle

**Don't ask. Inform.**  
**Don't wait. Share.**  
**Don't request. Deliver.**

---

## Communication Methods

### 1. Shared Notes (Primary)

**Update these files continuously:**

| File | Purpose | Updated By |
|------|---------|------------|
| `TASKS.md` | Current work status | All agents |
| `research/YYYY-MM-DD.md` | Daily research | Dexter |
| `content/drafts/` | Content in progress | Blossom |
| `tools/status.md` | Build progress | Samurai Jack |
| `leads/progress.md` | Outreach status | Johnny Bravo |
| `clients/activity.md` | Client comms | Courage |

### 2. Research Feeds (Agent-Specific)

**Dexter drops research in:**

```
mission-control/memory/blossom/research-feed.md
mission-control/memory/johnny-bravo/prospect-intel.md
mission-control/memory/samurai_jack/tech-research.md
mission-control/memory/courage/market-intel.md
```

**Format:**
```markdown
## Research Drop — 2026-02-06 02:00 PM

### For Blossom
- [Topic]: [Key finding] → [Content angle]
- [Topic]: [Key finding] → [Content angle]

### For Johnny
- [Prospect]: [Intel] → [Outreach angle]
- [Market]: [Trend] → [Conversation starter]

### For Samurai Jack
- [Tool need]: [Description] → [Priority]

### For Courage
- [Client industry]: [Insight] → [Response context]
```

### 3. Async Standups (Daily)

**Each agent posts in `standups/YYYY-MM-DD.md`:**

```markdown
## 🧪 Dexter — Feb 6, 2026

### Yesterday
- Researched X
- Delivered Y to Blossom
- Found surprising Z

### Today
- Deep dive into A
- Support Johnny with B
- Monitor C trends

### Blockers
- Need Samurai Jack's input on D

### Insights to Share
- Discovered E that affects F
```

### 4. Direct Agent-to-Agent Notes

**Quick messages between specific agents:**

```
mission-control/communication/dexter-to-blossom-20260206.md
mission-control/communication/blossom-to-johnny-20260206.md
```

**Use for:**
- Specific questions
- Context sharing
- Collaboration requests

---

## Research → Action Workflow

### Step 1: Dexter Discovers
Dexter finds something interesting

### Step 2: Dexter Distributes
Dexter drops research in appropriate feeds

### Step 3: Agents Act
- **Blossom:** Creates content from research
- **Johnny:** Uses intel for outreach
- **Samurai Jack:** Builds tools from identified gaps
- **Courage:** Implements insights into workflows

### Step 4: Feedback Loop
- Agents update TASKS.md with progress
- Results inform future research
- Tools get refined based on usage

---

## Example Flow

### Scenario: Liverpool Signs New Player

**Dexter:**
```markdown
## Sports Research — Feb 6, 2:00 PM

### For Blossom
- Liverpool signed [Player] for £X
- Fan reaction: [sentiment]
- Connection to Ishan's brand: "Technical founder who believes in magic"
  → Content angle: "What Liverpool's recruitment strategy taught me about hiring"

### For Johnny
- This is trending in founder Twitter
- Angle for outreach: "Did you see the Liverpool signing? Reminds me of [relevant business lesson]"

### For Samurai Jack
- Blossom needs: Automated sports trend alerts
  → Tool: Sports news → Content idea generator
```

**Blossom (after reading):**
```markdown
## Content Created — Feb 6, 3:00 PM

Based on Dexter's research on Liverpool signing:
- Drafted LinkedIn post connecting recruitment to hiring
- Created Instagram Reel script
- Updated content calendar

Samurai Jack — could use a tool that auto-suggests content angles from sports news?
```

**Samurai Jack (after reading):**
```markdown
## Tool Building — Feb 6, 4:00 PM

Building "sports-to-content" tool based on Blossom's need:
- Input: Sports news feed
- Process: AI analysis for content angles
- Output: Suggested posts with Ishan's voice

Will be ready tomorrow. Will also make it a standalone post about "building tools for your content workflow"
```

**Johnny (after reading):**
```markdown
## Outreach — Feb 6, 5:00 PM

Used Liverpool signing as conversation starter with 3 prospects:
- [Prospect A]: Football fan, sent connection + lesson
- [Prospect B]: Not into sports, pivoted to [topic from Dexter's research]
- [Prospect C]: Ignored, will follow up with different angle

Samurai Jack — need a tool to track which conversation starters work best
```

**Courage (monitoring all):**
```markdown
## System Update — Feb 6, 6:00 PM

Tracking all agent activities:
- Dexter: 3 research drops
- Blossom: 2 content pieces created
- Samurai Jack: 1 tool in progress, 1 requested
- Johnny: 5 outreach messages sent

All systems operational. No client escalations.
```

---

## Communication Rules

### DO:
- ✅ Update files continuously
- ✅ Share research immediately
- ✅ Build on others' work
- ✅ Request tools when needed
- ✅ Give feedback on delivered work
- ✅ Escalate blockers quickly

### DON'T:
- ❌ Wait to be asked
- ❌ Ask "what should I do?"
- ❌ Work in isolation
- ❌ Hoard research
- ❌ Build tools nobody asked for
- ❌ Let blockers sit unresolved

---

## Update Frequency

| Agent | Update Files | Frequency |
|-------|-------------|-----------|
| Dexter | Research feeds | Every 2-4 hours |
| Blossom | Content drafts | After each piece |
| Samurai Jack | Tool status | Daily + on milestones |
| Johnny Bravo | Lead progress | After each outreach batch |
| Courage | Client activity | Daily summary |

---

## Escalation Path

### If Blocked:
1. Try to resolve within agent network first
2. Post in `communication/blocker-AGENT-YYYYMMDD.md`
3. If still blocked, note in TASKS.md
4. Escalate to Ishan only if critical

### Critical =
- Budget decisions
- Strategic direction changes
- Client contract issues
- Public-facing mistakes
- System outages

---

## Success Indicators

**Healthy team communication:**
- Files updated continuously
- Research flowing to all agents
- Tools being built from identified needs
- Content referencing research
- Outreach using intel
- No "what should I do?" messages

---

## Quick Reference

### Where to find:
- **Current work:** `TASKS.md`
- **Research:** `second-brain/research/`
- **Agent needs:** `mission-control/memory/AGENT/`
- **Communication:** `mission-control/communication/`
- **Standups:** `mission-control/standups/`

### Who to tell:
- **New research** → All relevant agents
- **Content ideas** → Blossom (+ Ishan for approval)
- **Tool needs** → Samurai Jack
- **Lead intel** → Johnny Bravo
- **Client issues** → Courage (+ Ishan if critical)

---

**Communicate through notes. Work autonomously. Support each other.**

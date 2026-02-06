# Implementation Plan — Mission Control Task Execution Fix
## Prepared by: Samurai Jack — Code Architect
## Date: 2026-02-06

---

## Overview

This document provides a step-by-step guide to deploy the fixed heartbeat system that actually executes tasks instead of just logging them.

---

## Pre-Deployment Checklist

- [ ] All files created and tested
- [ ] Database backup taken (tasks.json, agents.json)
- [ ] Current cron jobs documented
- [ ] Test task created for validation

---

## Deployment Steps

### Step 1: Backup Current State

```bash
# Create backup directory
mkdir -p mission-control/backup/$(date +%Y%m%d)

# Backup database
cp mission-control/database/*.json mission-control/backup/$(date +%Y%m%d)/

# Backup existing heartbeat
cp mission-control/heartbeat.js mission-control/backup/$(date +%Y%m%d)/

# Document current crontab
crontab -l > mission-control/backup/$(date +%Y%m%d)/crontab.txt
```

### Step 2: Verify New Files

Ensure these files exist:

| File | Purpose |
|------|---------|
| `heartbeat-executing.js` | Fixed heartbeat with execution |
| `task-executor.js` | Worker that executes tasks |
| `setup-crons-executing.js` | Cron setup script |

```bash
# Verify files
ls -la mission-control/heartbeat-executing.js
ls -la mission-control/task-executor.js
ls -la mission-control/setup-crons-executing.js
```

### Step 3: Test Task Executor (Dry Run)

```bash
# Run heartbeat manually for one agent
cd mission-control
node heartbeat-executing.js heartbeat samurai_jack

# Check logs
tail -f logs/samurai_jack-heartbeat.log
```

### Step 4: Create Test Task

Add a test task to validate the system:

```bash
# Using Node.js
node -e "
const { MissionControl } = require('./database.js');
const mc = new MissionControl();
mc.createTask({
  title: 'Test Task - Execution System',
  description: 'This is a test task to verify the execution system works.',
  assignee_ids: ['samurai_jack'],
  status: 'inbox',
  priority: 'high'
});
console.log('Test task created!');
"
```

### Step 5: Run Test Execution

```bash
# Trigger heartbeat for test agent
node heartbeat-executing.js heartbeat samurai_jack

# Watch execution log
tail -f logs/samurai_jack-executor.log

# Check task status
node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('./database/tasks.json'));
const testTask = tasks.find(t => t.title.includes('Test Task'));
console.log('Test task status:', testTask?.status);
"
```

### Step 6: Deploy Cron Jobs

Once testing passes, deploy the new cron schedule:

```bash
# Run setup script
node setup-crons-executing.js

# Verify crontab
crontab -l | grep mission-control
```

### Step 7: Monitor First Cycle

Wait for the next heartbeat cycle and monitor:

```bash
# Watch all heartbeat logs
tail -f logs/*-heartbeat.log

# Check for errors
grep -r "ERROR\|FAILED" logs/
```

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. Restore original crontab
crontab mission-control/backup/$(date +%Y%m%d)/crontab.txt

# 2. (Optional) Restore database
cp mission-control/backup/$(date +%Y%m%d)/*.json mission-control/database/

# 3. Verify rollback
crontab -l
```

---

## Validation Checklist

After deployment, verify:

- [ ] Heartbeat runs every 15 minutes (check cron)
- [ ] Tasks with `inbox` status get picked up
- [ ] Task executor spawns (check executor logs)
- [ ] Task status changes to `in_progress`
- [ ] Task completes and status changes to `done`
- [ ] Failed tasks retry up to 3 times
- [ ] Failed tasks eventually marked `blocked`
- [ ] No duplicate task executions
- [ ] Logs capture all activity

---

## Monitoring Commands

```bash
# Check recent activity
tail -50 mission-control/logs/samurai_jack-heartbeat.log

# Check execution stats
node mission-control/heartbeat-executing.js stats

# Check task status
node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('mission-control/database/tasks.json'));
const byStatus = {};
tasks.forEach(t => {
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
});
console.table(byStatus);
"

# Check active agents
cat mission-control/database/active-agents.json
```

---

## File Summary

### Created Files

| File | Lines | Purpose |
|------|-------|---------|
| `heartbeat-executing.js` | ~450 | Fixed heartbeat with task spawning |
| `task-executor.js` | ~320 | Worker script for isolated execution |
| `setup-crons-executing.js` | ~150 | Cron setup for executing system |
| `memory/samurai_jack/heartbeat-analysis.md` | ~180 | Analysis documentation |
| `IMPLEMENTATION-PLAN.md` | This file | Deployment guide |

### Unchanged Files

| File | Reason |
|------|--------|
| `database.js` | Already has proper task management |
| `heartbeat.js` | Kept as backup/fallback |
| `heartbeat-optimized.js` | Alternative implementation |

---

## Architecture Summary

```
┌────────────────────────────────────────────────────────────────┐
│                         CRON (every 15 min)                     │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│              heartbeat-executing.js                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Load context (WORKING.md)                            │   │
│  │ 2. Check mentions (notifications.json)                   │   │
│  │ 3. Check tasks (tasks.json)                              │   │
│  │ 4. For each task → spawn task-executor.js               │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌──────────────────┐    ┌──────────────────┐
        │ task-executor.js │    │ task-executor.js │
        │ (Task 1)         │    │ (Task 2)         │
        └────────┬─────────┘    └────────┬─────────┘
                 │                       │
                 └───────────┬───────────┘
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    database/tasks.json                          │
│    status: inbox → in_progress → done (or blocked)             │
└────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

The fix is successful when:

1. **Tasks execute** — Not just logged, but actually performed
2. **Status updates** — Tasks move through: `inbox` → `in_progress` → `done`
3. **Isolation** — Each task runs in its own process
4. **Error handling** — Failures are caught, retried, and eventually marked blocked
5. **Progress tracking** — All activity logged to database
6. **No regressions** — Existing cron schedules continue working

---

## Next Steps (Optional Enhancements)

1. **AI-Powered Execution** — Integrate OpenClaw sessions_spawn for actual AI execution
2. **Task Dependencies** — Support task chains (A must complete before B)
3. **Priority Queue** — High-priority tasks execute first
4. **Resource Limits** — Throttle concurrent executions per agent
5. **Metrics Dashboard** — Visualize task throughput and success rates

---

*Implementation plan complete. Ready for deployment.*

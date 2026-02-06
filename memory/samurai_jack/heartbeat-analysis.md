# Mission Control Heartbeat System Analysis
## Prepared by: Samurai Jack — Code Architect

---

## 1. Current System Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cron (15min)  │────▶│   heartbeat.js   │────▶│  Check Tasks    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                              ┌────────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  handleWork()    │
                    └──────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │   handleTask()   │
                    └──────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │   LOGS ONLY!     │  ◀─── PROBLEM HERE
                    └──────────────────┘
```

### What Happens Now:
1. Cron triggers heartbeat every 15 minutes (staggered per agent)
2. Heartbeat loads context (WORKING.md)
3. Checks for @mentions and assigned tasks
4. If work found → calls `handleWork()`
5. `handleWork()` loops through tasks
6. For each task → calls `handleTask()`
7. **`handleTask()` LOGS the task title... AND DOES NOTHING ELSE**
8. Task never gets executed
9. Task stays in "in_progress" or "inbox" status forever

---

## 2. What's Broken

### Critical Gap: No Task Execution

**Location:** `heartbeat.js` lines 126-130

```javascript
/**
 * Handle specific task
 */
function handleTask(agentName, task) {
  log(agentName, `Handling task: ${task.title}`);
  // Agent-specific task handling
  // This would process the task based on agent specialty
}
```

**The Issue:** The function is a STUB. It only logs. There's no:
- Sub-agent spawning
- Task execution logic
- Progress tracking
- Completion handling
- Error recovery

### Secondary Issues:

1. **No Session Isolation:** Tasks should run in isolated sessions (sessions_spawn) to prevent interference with main heartbeat
2. **No Progress Tracking:** Task state never updates beyond the initial assignment
3. **No Error Handling:** If execution fails, task stays stuck in "in_progress"
4. **No Timeout Mechanism:** Tasks could run forever without detection

---

## 3. Root Cause Analysis

### Why This Happened:

The heartbeat system was designed as a **CHECK-ONLY** system:
- ✅ Check for mentions
- ✅ Check for tasks
- ✅ Check activity feed
- ❌ Execute tasks

The original design assumed tasks would be handled externally or manually. But for autonomous agents, **checking is not enough** — they must also **act**.

### Design Pattern Gap:

Current pattern: **Polling Loop** (check → log → repeat)
Needed pattern: **Event-Driven Execution** (check → spawn → execute → complete)

---

## 4. Proposed Solution

### Architecture: **Task Executor with Isolated Sessions**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cron (15min)  │────▶│   heartbeat.js   │────▶│  Check Tasks    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                              ┌────────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  handleWork()    │
                    └──────────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │   TASK EXECUTOR SYSTEM     │
              └────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Spawn      │  │  Execute    │  │  Monitor    │
    │  Sub-Agent  │  │  in Session │  │  Progress   │
    └─────────────┘  └─────────────┘  └─────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌──────────────────┐
                    │  Update Database │
                    │  (status/results)│
                    └──────────────────┘
```

### Key Components:

1. **Task Spawner:** Creates isolated sub-agent sessions via `sessions_spawn`
2. **Task Runner:** Each task runs in its own Node.js process
3. **Progress Tracker:** Updates task status in database.js
4. **Error Handler:** Catches failures, retries, marks tasks as failed
5. **Timeout Guard:** Prevents infinite-running tasks

### Execution Flow:

1. Heartbeat detects task in "inbox" or "in_progress"
2. Task executor spawns sub-agent with:
   - Task context (title, description, requirements)
   - Agent profile (personality, tools, specialty)
   - Working memory (WORKING.md content)
3. Sub-agent executes task independently
4. Executor monitors via heartbeat files
5. On completion: updates task status to "done"
6. On failure: updates status to "blocked" with error

### Solution Design Rationale:

**Why Option A (Modify heartbeat.js)?**
- Keeps existing cron schedule (no disruption)
- Integrates cleanly with database.js
- Minimal architectural change
- Easy to rollback if issues

**Why NOT Option B (Separate executor)?**
- More complex deployment
- Requires inter-process communication
- Overkill for current scale

**Why NOT Option C (Cron per task)?**
- Creates too many cron jobs
- Harder to manage
- Doesn't solve the execution problem

---

## 5. Implementation Details

### Modified Functions:

1. **`handleTask()`** → Spawns sub-agent, passes task context
2. **`spawnAgentExecutor()`** → New function, creates isolated session
3. **`updateTaskProgress()`** → New function, tracks execution state
4. **`handleTaskCompletion()`** → New function, marks task done/failed

### New Files Created:

1. **`task-executor.js`** → Worker that runs inside spawned session
2. **`heartbeat-executing.js`** → Modified heartbeat with execution logic

### Database Integration:

- Reads tasks from `database/tasks.json`
- Updates task status (in_progress → done/blocked)
- Logs activities to `database/activities.json`
- Creates completion messages in `database/messages.json`

### Error Handling:

- Task timeout: 30 minutes max
- Retry logic: 3 attempts before marking blocked
- Error logging: Full stack traces to agent logs
- Recovery: Failed tasks can be manually restarted

---

## 6. Success Criteria

- [ ] Agents actually execute tasks (not just log)
- [ ] Task status updates from "inbox" → "in_progress" → "done"
- [ ] Execution happens in isolated sessions
- [ ] Errors are caught and logged
- [ ] Progress is tracked in database
- [ ] Existing cron schedules continue working

---

## 7. Files Modified

| File | Changes |
|------|---------|
| `heartbeat-executing.js` | New file with execution logic |
| `task-executor.js` | New worker script for sub-agents |
| `setup-crons-executing.js` | New cron setup with execution support |
| `database.js` | No changes (works as-is) |
| Existing crons | Unchanged until migration |

---

*Analysis complete. Ready for implementation.*

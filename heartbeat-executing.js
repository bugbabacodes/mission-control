#!/usr/bin/env node
/**
 * Mission Control — Heartbeat System WITH EXECUTION
 * Based on pbteja1998's Mission Control heartbeat implementation
 * 
 * FIX: This version actually spawns sub-agents to execute tasks
 * Each task runs in an isolated session via task-executor.js
 * 
 * Each agent wakes up every 15 minutes to check for work
 * Staggered schedule to avoid all agents waking at once
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const AGENTS = ['dexter', 'blossom', 'samurai_jack', 'johnny_bravo', 'courage'];

// Heartbeat Schedule (staggered like Bhanu's system)
const HEARTBEAT_SCHEDULE = {
  dexter: '0,15,30,45 * * * *',      // :00
  blossom: '2,17,32,47 * * * *',     // :02  
  samurai_jack: '4,19,34,49 * * * *',  // :04
  johnny_bravo: '6,21,36,51 * * * *',  // :06
  courage: '8,23,38,53 * * * *'     // :08
};

// Execution configuration
const EXECUTION_CONFIG = {
  maxConcurrentTasks: 3,        // Max tasks per agent at once
  taskTimeoutMs: 30 * 60 * 1000, // 30 minutes max per task
  retryAttempts: 3,             // Retry failed tasks 3 times
  executorPath: path.join(WORKSPACE, 'task-executor.js')
};

// Track running executions (in-memory for this process)
const runningExecutions = new Map();

// Logger
function log(agent, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${agent.toUpperCase()}] ${message}`);
  
  const logFile = path.join(WORKSPACE, 'logs', `${agent}-heartbeat.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

/**
 * Heartbeat Process for Single Agent
 */
function agentHeartbeat(agentName) {
  log(agentName, '💓 HEARTBEAT STARTING');
  
  try {
    // Step 1: Load context (like Bhanu's system)
    log(agentName, 'Loading context...');
    const workingFile = path.join(WORKSPACE, 'memory', agentName, 'WORKING.md');
    const dailyNotes = path.join(WORKSPACE, 'memory', agentName, `${new Date().toISOString().split('T')[0]}.md`);
    
    let context = '';
    if (fs.existsSync(workingFile)) {
      context += fs.readFileSync(workingFile, 'utf8');
      log(agentName, 'Loaded WORKING.md');
    }
    
    // Step 2: Check for urgent items (like Bhanu's @mentions)
    log(agentName, 'Checking for urgent items...');
    
    // Check Mission Control for @mentions
    const mentions = checkForMentions(agentName);
    const assignedTasks = checkAssignedTasks(agentName);
    
    // Step 3: Scan activity feed
    log(agentName, 'Scanning activity feed...');
    const recentActivity = getRecentActivity(agentName);
    
    // Step 4: Take action or stand down
    if (mentions.length > 0 || assignedTasks.length > 0) {
      log(agentName, `🎯 FOUND WORK: ${mentions.length} mentions, ${assignedTasks.length} tasks`);
      
      // ============================================
      // FIX: Actually execute the work (not just log)
      // ============================================
      executeWork(agentName, mentions, assignedTasks, recentActivity);
      
      log(agentName, '✅ Work execution completed');
    } else {
      log(agentName, '🟢 Nothing urgent found — HEARTBEAT_OK');
      
      // Still check if there's background work
      handleBackgroundWork(agentName, recentActivity);
    }
    
    // Step 5: Clean up completed executions
    cleanupExecutions(agentName);
    
    log(agentName, '💓 HEARTBEAT COMPLETE');
    
  } catch (error) {
    log(agentName, `❌ Heartbeat failed: ${error.message}`);
    reportError(agentName, error);
  }
}

/**
 * Check for @mentions in Mission Control
 */
function checkForMentions(agentName) {
  log(agentName, 'Checking Mission Control for @mentions...');
  
  try {
    const notifPath = path.join(WORKSPACE, 'database', 'notifications.json');
    if (!fs.existsSync(notifPath)) return [];
    
    const notifications = JSON.parse(fs.readFileSync(notifPath, 'utf8'));
    
    const mentions = notifications.filter(notif => 
      notif.mentioned_agent_id === agentName && 
      !notif.delivered
    );
    
    return mentions;
  } catch (error) {
    log(agentName, `Error checking mentions: ${error.message}`);
    return [];
  }
}

/**
 * Check for assigned tasks
 */
function checkAssignedTasks(agentName) {
  log(agentName, 'Checking assigned tasks...');
  
  try {
    const tasksPath = path.join(WORKSPACE, 'database', 'tasks.json');
    if (!fs.existsSync(tasksPath)) return [];
    
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    
    // Active task statuses that require execution
    const activeStatuses = ['inbox', 'in_progress', 'review', 'blocked'];
    
    return tasks.filter(task => 
      task.assignee_ids && 
      task.assignee_ids.includes(agentName) &&
      activeStatuses.includes(task.status)
    );
  } catch (error) {
    log(agentName, `Error checking tasks: ${error.message}`);
    return [];
  }
}

/**
 * Get recent activity from Mission Control
 */
function getRecentActivity(agentName) {
  log(agentName, 'Getting recent activity...');
  
  try {
    const activitiesPath = path.join(WORKSPACE, 'database', 'activities.json');
    if (!fs.existsSync(activitiesPath)) return [];
    
    const activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
    return activities.slice(-50);
  } catch (error) {
    log(agentName, `Error getting activity: ${error.message}`);
    return [];
  }
}

/**
 * ============================================
 * EXECUTE WORK - THE FIX
 * Actually spawns sub-agents to do the work
 * ============================================
 */
function executeWork(agentName, mentions, assignedTasks, recentActivity) {
  log(agentName, '🔥 EXECUTING WORK...');
  
  // Count how many tasks this agent is already executing
  const currentExecutions = getAgentExecutions(agentName);
  const availableSlots = EXECUTION_CONFIG.maxConcurrentTasks - currentExecutions.length;
  
  log(agentName, `Current executions: ${currentExecutions.length}, Available slots: ${availableSlots}`);
  
  // Process mentions first (usually urgent)
  for (const mention of mentions) {
    log(agentName, `📢 Processing mention: ${mention.content?.substring(0, 100) || 'No content'}...`);
    handleMention(agentName, mention);
  }
  
  // Execute assigned tasks (up to available slots)
  let executedCount = 0;
  for (const task of assignedTasks) {
    // Skip tasks already being executed
    if (isTaskExecuting(task.id)) {
      log(agentName, `⏳ Task already executing: ${task.title}`);
      continue;
    }
    
    // Skip completed tasks
    if (task.status === 'done') {
      continue;
    }
    
    // Check if we have slots available
    if (executedCount >= availableSlots) {
      log(agentName, `⏸️  Max concurrent tasks reached. Queuing remaining tasks.`);
      break;
    }
    
    // Check retry count for blocked tasks
    if (task.status === 'blocked' && (task.retry_count || 0) >= EXECUTION_CONFIG.retryAttempts) {
      log(agentName, `❌ Task exceeded retry attempts, skipping: ${task.title}`);
      continue;
    }
    
    // ============================================
    // SPAWN SUB-AGENT TO EXECUTE TASK
    // ============================================
    log(agentName, `🚀 SPAWNING EXECUTOR for task: ${task.title}`);
    spawnTaskExecutor(agentName, task);
    executedCount++;
  }
  
  // Contribute to relevant discussions
  for (const activity of recentActivity) {
    if (isRelevantToAgent(agentName, activity)) {
      log(agentName, `💬 Contributing to: ${activity.message?.substring(0, 100) || 'Activity'}`);
      contributeToDiscussion(agentName, activity);
    }
  }
  
  log(agentName, `✅ Executed ${executedCount} new tasks, processed ${mentions.length} mentions`);
}

/**
 * Spawn a sub-agent to execute a task
 */
function spawnTaskExecutor(agentName, task) {
  const executionId = `${task.id}_${Date.now()}`;
  
  log(agentName, `Spawning executor for task ${task.id}...`);
  
  try {
    // Mark task as in_progress
    updateTaskStatus(task.id, 'in_progress', { started_at: new Date().toISOString() });
    
    // Track this execution
    runningExecutions.set(executionId, {
      taskId: task.id,
      agentName: agentName,
      startedAt: Date.now(),
      status: 'running'
    });
    
    // Spawn the task executor as a detached process
    // This uses Node's spawn to run task-executor.js in isolation
    const executorProcess = spawn('node', [
      EXECUTION_CONFIG.executorPath,
      task.id,
      agentName
    ], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Store process reference
    const execution = runningExecutions.get(executionId);
    execution.process = executorProcess;
    execution.pid = executorProcess.pid;
    
    // Handle process output
    executorProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      log(agentName, `[EXECUTOR ${task.id}] ${output}`);
    });
    
    executorProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      log(agentName, `[EXECUTOR ${task.id} ERROR] ${error}`);
    });
    
    // Handle process completion
    executorProcess.on('close', (code) => {
      log(agentName, `[EXECUTOR ${task.id}] Process exited with code ${code}`);
      
      const execution = runningExecutions.get(executionId);
      if (execution) {
        execution.status = code === 0 ? 'completed' : 'failed';
        execution.exitCode = code;
        execution.completedAt = Date.now();
        
        // Update task based on exit code
        if (code === 0) {
          log(agentName, `✅ Task ${task.id} completed successfully`);
        } else {
          log(agentName, `❌ Task ${task.id} failed with exit code ${code}`);
          handleTaskFailure(agentName, task, `Exit code: ${code}`);
        }
      }
    });
    
    // Unref so heartbeat can exit independently
    executorProcess.unref();
    
    log(agentName, `✅ Executor spawned with PID ${executorProcess.pid} for task ${task.id}`);
    
    // Set up timeout guard
    setTimeout(() => {
      checkExecutionTimeout(executionId, agentName, task);
    }, EXECUTION_CONFIG.taskTimeoutMs);
    
  } catch (error) {
    log(agentName, `❌ Failed to spawn executor: ${error.message}`);
    handleTaskFailure(agentName, task, error.message);
  }
}

/**
 * Check if execution has timed out
 */
function checkExecutionTimeout(executionId, agentName, task) {
  const execution = runningExecutions.get(executionId);
  
  if (execution && execution.status === 'running') {
    log(agentName, `⏰ Task ${task.id} timed out after ${EXECUTION_CONFIG.taskTimeoutMs / 1000 / 60} minutes`);
    
    // Kill the process if still running
    if (execution.process && !execution.process.killed) {
      try {
        execution.process.kill('SIGTERM');
        setTimeout(() => {
          if (execution.process && !execution.process.killed) {
            execution.process.kill('SIGKILL');
          }
        }, 5000);
      } catch (e) {
        // Process might already be dead
      }
    }
    
    execution.status = 'timeout';
    handleTaskFailure(agentName, task, 'Execution timeout');
  }
}

/**
 * Handle task failure
 */
function handleTaskFailure(agentName, task, error) {
  log(agentName, `Handling failure for task ${task.id}: ${error}`);
  
  // Get current retry count
  const retryCount = (task.retry_count || 0) + 1;
  
  if (retryCount < EXECUTION_CONFIG.retryAttempts) {
    // Retry the task
    log(agentName, `🔄 Retrying task ${task.id} (attempt ${retryCount}/${EXECUTION_CONFIG.retryAttempts})`);
    updateTaskStatus(task.id, 'inbox', { retry_count: retryCount, last_error: error });
  } else {
    // Mark as blocked
    log(agentName, `❌ Task ${task.id} exceeded retry limit, marking as blocked`);
    updateTaskStatus(task.id, 'blocked', { 
      retry_count: retryCount, 
      error: error,
      failed_at: new Date().toISOString()
    });
  }
}

/**
 * Check if a task is currently being executed
 */
function isTaskExecuting(taskId) {
  for (const [id, execution] of runningExecutions) {
    if (execution.taskId === taskId && execution.status === 'running') {
      return true;
    }
  }
  return false;
}

/**
 * Get executions for a specific agent
 */
function getAgentExecutions(agentName) {
  const executions = [];
  for (const [id, execution] of runningExecutions) {
    if (execution.agentName === agentName) {
      executions.push(execution);
    }
  }
  return executions;
}

/**
 * Clean up completed/failed executions
 */
function cleanupExecutions(agentName) {
  const now = Date.now();
  const maxAgeMs = 60 * 60 * 1000; // Keep history for 1 hour
  
  for (const [id, execution] of runningExecutions) {
    if (execution.agentName === agentName) {
      // Remove completed executions after maxAge
      if (execution.status !== 'running' && execution.completedAt) {
        if (now - execution.completedAt > maxAgeMs) {
          runningExecutions.delete(id);
        }
      }
    }
  }
}

/**
 * Update task status in database
 */
function updateTaskStatus(taskId, status, updates = {}) {
  try {
    const tasksPath = path.join(WORKSPACE, 'database', 'tasks.json');
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].status = status;
      tasks[taskIndex].updated_at = new Date().toISOString();
      
      // Merge additional updates
      Object.assign(tasks[taskIndex], updates);
      
      fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
      return true;
    }
  } catch (error) {
    console.error(`Error updating task status: ${error.message}`);
  }
  return false;
}

/**
 * Handle specific mention
 */
function handleMention(agentName, mention) {
  log(agentName, `Handling mention: ${mention.content?.substring(0, 100)}...`);
  
  // Mark mention as delivered
  try {
    const notifPath = path.join(WORKSPACE, 'database', 'notifications.json');
    const notifications = JSON.parse(fs.readFileSync(notifPath, 'utf8'));
    
    const notifIndex = notifications.findIndex(n => n.id === mention.id);
    if (notifIndex !== -1) {
      notifications[notifIndex].delivered = true;
      notifications[notifIndex].delivered_at = new Date().toISOString();
      fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 2));
    }
  } catch (error) {
    log(agentName, `Error marking mention delivered: ${error.message}`);
  }
}

/**
 * Contribute to relevant discussion
 */
function contributeToDiscussion(agentName, activity) {
  log(agentName, `Contributing to discussion: ${activity.message?.substring(0, 100)}...`);
  // This would add relevant insights to the discussion
  // Implementation depends on discussion platform
}

/**
 * Check if activity is relevant to agent
 */
function isRelevantToAgent(agentName, activity) {
  // Agent-specific relevance checking
  // This would determine if the activity is relevant to this agent's expertise
  return true; // Simplified for now
}

/**
 * Handle background work
 */
function handleBackgroundWork(agentName, recentActivity) {
  log(agentName, 'Checking for background work...');
  
  // Each agent has specific background responsibilities
  switch (agentName) {
    case 'dexter':
      backgroundResearch(agentName);
      break;
    case 'blossom':
      backgroundContentPlanning(agentName);
      break;
    case 'samurai_jack':
      backgroundCodeMaintenance(agentName);
      break;
    case 'johnny_bravo':
      backgroundLeadResearch(agentName);
      break;
    case 'courage':
      backgroundClientMonitoring(agentName);
      break;
  }
}

/**
 * Agent-specific background work
 */
function backgroundResearch(agentName) {
  log(agentName, 'Running background research...');
  // Dexter's background research tasks
}

function backgroundContentPlanning(agentName) {
  log(agentName, 'Running background content planning...');
  // Blossom's background content tasks
}

function backgroundCodeMaintenance(agentName) {
  log(agentName, 'Running background code maintenance...');
  // Samurai Jack's background code tasks
  // This would check for updates, run tests, etc.
  
  // Example: Check for TODOs in codebase
  try {
    // This is lightweight enough to run in heartbeat
    log(agentName, 'Scanning for TODOs...');
  } catch (error) {
    log(agentName, `Background maintenance error: ${error.message}`);
  }
}

function backgroundLeadResearch(agentName) {
  log(agentName, 'Running background lead research...');
  // Johnny Bravo's background lead research
}

function backgroundClientMonitoring(agentName) {
  log(agentName, 'Running background client monitoring...');
  // Courage's background client monitoring
}

/**
 * Report error to Mission Control
 */
function reportError(agentName, error) {
  log(agentName, `Reporting error to Mission Control: ${error.message}`);
  
  try {
    const activitiesPath = path.join(WORKSPACE, 'database', 'activities.json');
    if (!fs.existsSync(activitiesPath)) return;
    
    const activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
    
    activities.push({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      agent_id: agentName,
      message: `Heartbeat error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    
    const trimmed = activities.slice(-1000);
    fs.writeFileSync(activitiesPath, JSON.stringify(trimmed, null, 2));
  } catch (e) {
    // Silent fail
  }
}

/**
 * Get execution statistics
 */
function getExecutionStats() {
  const stats = {
    totalExecutions: runningExecutions.size,
    running: 0,
    completed: 0,
    failed: 0,
    timeout: 0
  };
  
  for (const [id, execution] of runningExecutions) {
    stats[execution.status] = (stats[execution.status] || 0) + 1;
  }
  
  return stats;
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'heartbeat';
  const agentName = process.argv[3];
  
  switch (command) {
    case 'heartbeat':
      const targetAgent = agentName || 'dexter';
      if (!AGENTS.includes(targetAgent)) {
        console.error(`Unknown agent: ${targetAgent}`);
        console.error(`Available agents: ${AGENTS.join(', ')}`);
        process.exit(1);
      }
      
      console.log(`\n🚀 ${targetAgent.toUpperCase()} HEARTBEAT STARTING...\n`);
      agentHeartbeat(targetAgent);
      console.log(`\n✅ ${targetAgent.toUpperCase()} HEARTBEAT COMPLETE\n`);
      break;
      
    case 'stats':
      console.log('\n📊 EXECUTION STATS\n');
      console.log(JSON.stringify(getExecutionStats(), null, 2));
      break;
      
    case 'test-executor':
      // Test the executor with a mock task
      console.log('\n🧪 TESTING TASK EXECUTOR\n');
      const testTask = {
        id: `test_${Date.now()}`,
        title: 'Test Task',
        description: 'Testing task executor',
        status: 'inbox'
      };
      spawnTaskExecutor(agentName || 'samurai_jack', testTask);
      console.log('Test executor spawned. Check logs for results.');
      break;
      
    default:
      console.log('Usage: node heartbeat-executing.js [heartbeat|stats|test-executor] [agent-name]');
  }
}

module.exports = { 
  agentHeartbeat, 
  spawnTaskExecutor,
  getExecutionStats,
  AGENTS, 
  HEARTBEAT_SCHEDULE 
};

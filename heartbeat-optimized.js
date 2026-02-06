#!/usr/bin/env node
/**
 * Mission Control — Optimized Heartbeat System v2.0
 * 
 * OPTIMIZATION: Pause heartbeats for agents without active tasks
 * - Only agents with assigned work run heartbeats
 * - Smart scheduling to avoid unnecessary wakes
 * - Resume heartbeat when agent gets assigned work
 * - Reduced resource usage and API calls
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const AGENTS = ['dexter', 'blossom', 'samurai_jack', 'johnny_bravo', 'courage'];

// Optimized Heartbeat Schedule (only for active agents)
// Base schedule: every 15 minutes, but dynamically enabled/disabled
const BASE_HEARTBEAT_SCHEDULE = {
  dexter: '0,15,30,45 * * * *',      // :00
  blossom: '2,17,32,47 * * * *',     // :02  
  samurai_jack: '4,19,34,49 * * * *',  // :04
  johnny_bravo: '6,21,36,51 * * * *',  // :06
  courage: '8,23,38,53 * * * *'     // :08
};

// Active agent tracking file
const ACTIVE_AGENTS_FILE = path.join(WORKSPACE, 'database', 'active-agents.json');

// Logger
function log(agent, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${agent.toUpperCase()}] ${message}`);
  
  const logFile = path.join(WORKSPACE, 'logs', `${agent}-heartbeat.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

/**
 * Get active agents from tracking file
 */
function getActiveAgents() {
  if (!fs.existsSync(ACTIVE_AGENTS_FILE)) {
    return new Set();
  }
  try {
    const data = JSON.parse(fs.readFileSync(ACTIVE_AGENTS_FILE, 'utf8'));
    return new Set(data.activeAgents || []);
  } catch (e) {
    return new Set();
  }
}

/**
 * Save active agents to tracking file
 */
function saveActiveAgents(activeAgents) {
  fs.writeFileSync(ACTIVE_AGENTS_FILE, JSON.stringify({
    activeAgents: Array.from(activeAgents),
    lastUpdated: new Date().toISOString()
  }, null, 2));
}

/**
 * Check if agent has active tasks
 */
function hasActiveTasks(agentName) {
  try {
    const tasksPath = path.join(WORKSPACE, 'database', 'tasks.json');
    if (!fs.existsSync(tasksPath)) return false;
    
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    
    // Active task statuses that require agent attention
    const activeStatuses = ['in_progress', 'inbox', 'review', 'blocked'];
    
    return tasks.some(task => 
      task.assignee_ids && 
      task.assignee_ids.includes(agentName) &&
      activeStatuses.includes(task.status)
    );
  } catch (error) {
    log(agentName, `Error checking tasks: ${error.message}`);
    return false;
  }
}

/**
 * Check if agent has pending notifications/mentions
 */
function hasPendingNotifications(agentName) {
  try {
    const notifPath = path.join(WORKSPACE, 'database', 'notifications.json');
    if (!fs.existsSync(notifPath)) return false;
    
    const notifications = JSON.parse(fs.readFileSync(notifPath, 'utf8'));
    
    return notifications.some(notif => 
      notif.mentioned_agent_id === agentName && 
      !notif.delivered
    );
  } catch (error) {
    log(agentName, `Error checking notifications: ${error.message}`);
    return false;
  }
}

/**
 * Check if agent should run heartbeat
 * Returns true if agent has work to do
 */
function shouldRunHeartbeat(agentName) {
  const hasTasks = hasActiveTasks(agentName);
  const hasNotifications = hasPendingNotifications(agentName);
  
  // Also check if agent is in active agents list
  const activeAgents = getActiveAgents();
  const isActive = activeAgents.has(agentName);
  
  return hasTasks || hasNotifications || isActive;
}

/**
 * Update agent status in database
 */
function updateAgentStatus(agentName, status, taskId = null) {
  try {
    const agentsPath = path.join(WORKSPACE, 'database', 'agents.json');
    if (!fs.existsSync(agentsPath)) return;
    
    const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
    const agentIndex = agents.findIndex(a => a.id === agentName);
    
    if (agentIndex !== -1) {
      agents[agentIndex].status = status;
      agents[agentIndex].current_task_id = taskId;
      agents[agentIndex].last_heartbeat = new Date().toISOString();
      agents[agentIndex].updated_at = new Date().toISOString();
      
      fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2));
    }
  } catch (error) {
    log(agentName, `Error updating agent status: ${error.message}`);
  }
}

/**
 * Smart Heartbeat Process for Single Agent
 */
function agentHeartbeat(agentName) {
  log(agentName, '💓 HEARTBEAT CHECK STARTING');
  
  // OPTIMIZATION 1: Check if agent has work before proceeding
  if (!shouldRunHeartbeat(agentName)) {
    log(agentName, '😴 Agent idle — SKIPPING HEARTBEAT (no active tasks)');
    updateAgentStatus(agentName, 'idle');
    return;
  }
  
  log(agentName, '⚡ Agent has work — RUNNING HEARTBEAT');
  
  try {
    updateAgentStatus(agentName, 'active');
    
    // Step 1: Load context
    log(agentName, 'Loading context...');
    const workingFile = path.join(WORKSPACE, 'memory', agentName, 'WORKING.md');
    
    let context = '';
    if (fs.existsSync(workingFile)) {
      context += fs.readFileSync(workingFile, 'utf8');
      log(agentName, 'Loaded WORKING.md');
    }
    
    // Step 2: Check for urgent items
    log(agentName, 'Checking for urgent items...');
    const mentions = checkForMentions(agentName);
    const assignedTasks = checkAssignedTasks(agentName);
    
    // Step 3: Scan activity feed
    log(agentName, 'Scanning activity feed...');
    const recentActivity = getRecentActivity(agentName);
    
    // Step 4: Take action
    if (mentions.length > 0 || assignedTasks.length > 0) {
      log(agentName, `Found work: ${mentions.length} mentions, ${assignedTasks.length} tasks`);
      handleWork(agentName, mentions, assignedTasks, recentActivity);
      log(agentName, '✅ Work completed');
    } else {
      log(agentName, '🟢 Nothing urgent found — HEARTBEAT_OK');
    }
    
    // Step 5: Check if agent still has work after processing
    if (!hasActiveTasks(agentName) && !hasPendingNotifications(agentName)) {
      log(agentName, '😴 All work complete — Agent will pause heartbeats until next task');
      updateAgentStatus(agentName, 'idle');
      
      // Remove from active agents list
      const activeAgents = getActiveAgents();
      activeAgents.delete(agentName);
      saveActiveAgents(activeAgents);
    }
    
    log(agentName, '💓 HEARTBEAT COMPLETE');
    
  } catch (error) {
    log(agentName, `❌ Heartbeat failed: ${error.message}`);
    reportError(agentName, error);
  }
}

/**
 * OPTIMIZATION: Activate agent heartbeats when task is assigned
 * This should be called when a task is assigned to an agent
 */
function activateAgent(agentName) {
  const activeAgents = getActiveAgents();
  
  if (!activeAgents.has(agentName)) {
    activeAgents.add(agentName);
    saveActiveAgents(activeAgents);
    log(agentName, '🚀 ACTIVATED — Heartbeats enabled');
    
    // Trigger immediate heartbeat
    agentHeartbeat(agentName);
    
    return true;
  }
  
  return false;
}

/**
 * OPTIMIZATION: Deactivate agent heartbeats when no work
 */
function deactivateAgent(agentName) {
  const activeAgents = getActiveAgents();
  
  if (activeAgents.has(agentName)) {
    activeAgents.delete(agentName);
    saveActiveAgents(activeAgents);
    log(agentName, '🛑 DEACTIVATED — Heartbeats paused (no active tasks)');
    return true;
  }
  
  return false;
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
    
    // Mark notifications as delivered
    mentions.forEach(notif => {
      notif.delivered = true;
    });
    
    fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 2));
    
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
    const activeStatuses = ['in_progress', 'inbox', 'review', 'blocked'];
    
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
    
    // Get last 50 activities
    return activities.slice(-50);
  } catch (error) {
    log(agentName, `Error getting activity: ${error.message}`);
    return [];
  }
}

/**
 * Handle actual work
 */
function handleWork(agentName, mentions, assignedTasks, recentActivity) {
  log(agentName, 'Handling work...');
  
  // Process mentions
  for (const mention of mentions) {
    log(agentName, `Processing mention: ${mention.content}`);
    handleMention(agentName, mention);
  }
  
  // Process assigned tasks
  for (const task of assignedTasks) {
    log(agentName, `Processing task: ${task.title}`);
    updateAgentStatus(agentName, 'working', task.id);
    handleTask(agentName, task);
  }
}

/**
 * Handle specific mention
 */
function handleMention(agentName, mention) {
  log(agentName, `Handling mention: ${mention.content}`);
  // Agent-specific mention handling
}

/**
 * Handle specific task
 */
function handleTask(agentName, task) {
  log(agentName, `Handling task: ${task.title}`);
  // Agent-specific task handling
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
    
    // Keep only last 1000 activities
    const trimmed = activities.slice(-1000);
    fs.writeFileSync(activitiesPath, JSON.stringify(trimmed, null, 2));
  } catch (e) {
    // Silent fail
  }
}

/**
 * OPTIMIZATION 4: Smart Scheduling
 * Rebalances heartbeat schedule based on active agents
 * Avoids unnecessary wakes by grouping heartbeats efficiently
 */
function getSmartSchedule(agentName) {
  const activeAgents = Array.from(getActiveAgents());
  
  if (activeAgents.length === 0) {
    return null; // No heartbeats needed
  }
  
  // If agent is not active, no schedule needed
  if (!activeAgents.includes(agentName)) {
    return null;
  }
  
  // Base schedule remains the same for active agents
  // Future enhancement: dynamically adjust based on workload
  return BASE_HEARTBEAT_SCHEDULE[agentName];
}

/**
 * Get heartbeat statistics
 */
function getStats() {
  const activeAgents = getActiveAgents();
  
  // Count total tasks per agent
  const tasksPath = path.join(WORKSPACE, 'database', 'tasks.json');
  let taskCounts = {};
  
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    AGENTS.forEach(agent => {
      taskCounts[agent] = tasks.filter(t => 
        t.assignee_ids && 
        t.assignee_ids.includes(agent) &&
        ['in_progress', 'inbox', 'review', 'blocked'].includes(t.status)
      ).length;
    });
  }
  
  return {
    totalAgents: AGENTS.length,
    activeAgents: Array.from(activeAgents),
    idleAgents: AGENTS.filter(a => !activeAgents.has(a)),
    taskCounts,
    savingsEstimate: calculateSavings(activeAgents.size)
  };
}

/**
 * Calculate resource savings
 */
function calculateSavings(activeCount) {
  const totalAgents = AGENTS.length;
  const idleCount = totalAgents - activeCount;
  
  // Assuming heartbeats run every 15 minutes = 96 times per day per agent
  const heartbeatsPerDayPerAgent = 96;
  const savedHeartbeatsPerDay = idleCount * heartbeatsPerDayPerAgent;
  
  // Estimate API calls and compute saved
  const estimatedApiCallsPerHeartbeat = 5; // tasks, notifications, activities, etc.
  const savedApiCallsPerDay = savedHeartbeatsPerDay * estimatedApiCallsPerHeartbeat;
  
  return {
    idleAgents: idleCount,
    heartbeatsSavedPerDay: savedHeartbeatsPerDay,
    apiCallsSavedPerDay: savedApiCallsPerDay,
    efficiencyGainPercent: Math.round((idleCount / totalAgents) * 100)
  };
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
      
    case 'activate':
      if (!agentName || !AGENTS.includes(agentName)) {
        console.error(`Usage: node heartbeat.js activate <agent-name>`);
        console.error(`Available agents: ${AGENTS.join(', ')}`);
        process.exit(1);
      }
      activateAgent(agentName);
      break;
      
    case 'deactivate':
      if (!agentName || !AGENTS.includes(agentName)) {
        console.error(`Usage: node heartbeat.js deactivate <agent-name>`);
        console.error(`Available agents: ${AGENTS.join(', ')}`);
        process.exit(1);
      }
      deactivateAgent(agentName);
      break;
      
    case 'stats':
      console.log('\n📊 HEARTBEAT OPTIMIZATION STATS\n');
      console.log(JSON.stringify(getStats(), null, 2));
      break;
      
    case 'check-all':
      // Check all agents and activate those with work
      console.log('\n🔍 CHECKING ALL AGENTS FOR WORK...\n');
      AGENTS.forEach(agent => {
        if (hasActiveTasks(agent) || hasPendingNotifications(agent)) {
          activateAgent(agent);
        } else {
          deactivateAgent(agent);
        }
      });
      console.log('\n✅ Agent status check complete\n');
      console.log(JSON.stringify(getStats(), null, 2));
      break;
      
    default:
      console.log('Usage: node heartbeat.js [heartbeat|activate|deactivate|stats|check-all] [agent-name]');
  }
}

module.exports = { 
  agentHeartbeat, 
  activateAgent, 
  deactivateAgent,
  hasActiveTasks,
  hasPendingNotifications,
  shouldRunHeartbeat,
  getStats,
  AGENTS, 
  BASE_HEARTBEAT_SCHEDULE 
};

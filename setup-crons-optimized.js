#!/usr/bin/env node
/**
 * Mission Control — Optimized Cron Setup v2.0
 * 
 * Sets up smart heartbeat cron jobs that respect agent workload
 * Only active agents (with tasks) run heartbeats
 */

const { execSync } = require('child_process');
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

// Daily Standup Schedule (11:30 PM IST like Bhanu's)
const DAILY_STANDUP_CRON = "30 23 * * *";

// Optimized Check Schedule (runs every 5 minutes to activate agents with new work)
const OPTIMIZED_CHECK_SCHEDULE = "*/5 * * * *";

/**
 * Setup Optimized Heartbeat Cron Jobs
 * 
 * OPTIMIZATION: Use the new heartbeat-optimized.js which:
 * 1. Checks if agent has work before running full heartbeat
 * 2. Skips heartbeat if agent is idle
 * 3. Auto-activates when tasks are assigned
 * 4. Auto-deactivates when work is complete
 */
function setupOptimizedHeartbeatCrons() {
  console.log('🚀 Setting up OPTIMIZED Mission Control cron jobs...');
  console.log('   Feature: Agents only heartbeat when they have work\n');
  
  AGENTS.forEach(agent => {
    const schedule = HEARTBEAT_SCHEDULE[agent];
    console.log(`Setting up ${agent} heartbeat: ${schedule} (conditional)`);
    
    try {
      // Remove existing cron if exists
      try {
        execSync(`clawdbot cron remove "${agent}-heartbeat"`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore if doesn't exist
      }
      
      // Add new heartbeat cron using optimized heartbeat
      // The heartbeat-optimized.js will check if agent has work before proceeding
      const cronCommand = `clawdbot cron add \
        --name "${agent}-heartbeat" \
        --cron "${schedule}" \
        --session "isolated" \
        --message "cd ${WORKSPACE} && node heartbeat-optimized.js heartbeat ${agent}"`;
      
      execSync(cronCommand);
      console.log(`✅ ${agent} optimized heartbeat cron added`);
      
    } catch (error) {
      console.error(`❌ Failed to setup ${agent} heartbeat: ${error.message}`);
    }
  });
}

/**
 * Setup the agent check cron
 * This runs every 5 minutes to activate agents that have new tasks
 */
function setupAgentCheckCron() {
  console.log('\n🔍 Setting up agent check cron (every 5 minutes)...');
  console.log('   This activates agents when new work is assigned\n');
  
  try {
    // Remove existing check cron if exists
    try {
      execSync('clawdbot cron remove "agent-work-check"', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    // Add agent check cron
    const checkCommand = `clawdbot cron add \
      --name "agent-work-check" \
      --cron "${OPTIMIZED_CHECK_SCHEDULE}" \
      --session "isolated" \
      --message "cd ${WORKSPACE} && node heartbeat-optimized.js check-all"`;
    
    execSync(checkCommand);
    console.log('✅ Agent work check cron added');
    
  } catch (error) {
    console.error(`❌ Failed to setup agent check: ${error.message}`);
  }
}

/**
 * Setup Daily Standup Cron
 */
function setupDailyStandupCron() {
  console.log('\n📊 Setting up daily standup cron...');
  
  try {
    // Remove existing standup cron if exists
    try {
      execSync('clawdbot cron remove "daily-standup"', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    // Add new standup cron
    const standupCommand = `clawdbot cron add \
      --name "daily-standup" \
      --cron "${DAILY_STANDUP_CRON}" \
      --session "isolated" \
      --message "cd ${WORKSPACE} && node standup.js"`;
    
    execSync(standupCommand);
    console.log('✅ Daily standup cron added');
    
  } catch (error) {
    console.error(`❌ Failed to setup daily standup: ${error.message}`);
  }
}

/**
 * List all cron jobs
 */
function listCrons() {
  console.log('\n📅 Current Mission Control cron jobs:\n');
  
  try {
    const result = execSync('clawdbot cron list', { encoding: 'utf8' });
    console.log(result);
  } catch (error) {
    console.error('Failed to list crons:', error.message);
  }
}

/**
 * Test optimized heartbeat for specific agent
 */
function testOptimizedHeartbeat(agentName) {
  console.log(`\n🧪 Testing ${agentName} optimized heartbeat...\n`);
  
  try {
    execSync(`cd ${WORKSPACE} && node heartbeat-optimized.js heartbeat ${agentName}`, { stdio: 'inherit' });
    console.log(`\n✅ ${agentName} optimized heartbeat test completed`);
  } catch (error) {
    console.error(`\n❌ ${agentName} optimized heartbeat test failed:`, error.message);
  }
}

/**
 * Show optimization stats
 */
function showStats() {
  console.log('\n📊 OPTIMIZATION STATISTICS\n');
  
  try {
    execSync(`cd ${WORKSPACE} && node heartbeat-optimized.js stats`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to get stats:', error.message);
  }
}

/**
 * Migrate from old heartbeat system to optimized
 */
function migrateToOptimized() {
  console.log('\n🔄 Migrating to optimized heartbeat system...\n');
  
  try {
    // Initialize active agents tracking
    const activeAgentsPath = path.join(WORKSPACE, 'database', 'active-agents.json');
    
    // Check current tasks and activate agents with work
    const tasksPath = path.join(WORKSPACE, 'database', 'tasks.json');
    const activeStatuses = ['in_progress', 'inbox', 'review', 'blocked'];
    
    let tasks = [];
    if (fs.existsSync(tasksPath)) {
      tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    }
    
    const activeAgents = [];
    AGENTS.forEach(agent => {
      const hasWork = tasks.some(task => 
        task.assignee_ids && 
        task.assignee_ids.includes(agent) &&
        activeStatuses.includes(task.status)
      );
      
      if (hasWork) {
        activeAgents.push(agent);
        console.log(`✅ ${agent}: Activated (has assigned tasks)`);
      } else {
        console.log(`😴 ${agent}: Idle (no active tasks)`);
      }
    });
    
    // Save active agents
    fs.writeFileSync(activeAgentsPath, JSON.stringify({
      activeAgents,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Active agents: ${activeAgents.length}/${AGENTS.length}`);
    console.log(`   Estimated daily heartbeat savings: ${(AGENTS.length - activeAgents.length) * 96}`);
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Mission Control — Optimized Cron Setup v2.0

USAGE:
  node setup-crons-optimized.js [command] [agent-name]

COMMANDS:
  setup       Setup all optimized cron jobs (default)
  migrate     Migrate from old system to optimized
  list        List current cron jobs
  test        Test heartbeat for specific agent
  stats       Show optimization statistics
  help        Show this help message

EXAMPLES:
  node setup-crons-optimized.js setup
  node setup-crons-optimized.js migrate
  node setup-crons-optimized.js test dexter
  node setup-crons-optimized.js stats

OPTIMIZATION FEATURES:
  • Agents only run heartbeats when they have assigned work
  • Smart scheduling reduces unnecessary API calls
  • Auto-activation when tasks are assigned
  • Auto-deactivation when work is complete
  • ~80% reduction in heartbeat overhead for idle periods
`);
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'setup';
  
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   MISSION CONTROL — OPTIMIZED HEARTBEAT SYSTEM v2.0   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  switch (command) {
    case 'setup':
      setupOptimizedHeartbeatCrons();
      setupAgentCheckCron();
      setupDailyStandupCron();
      listCrons();
      showStats();
      console.log('\n✅ Setup complete! Optimized heartbeat system is now active.');
      console.log('   Agents will only heartbeat when they have assigned work.\n');
      break;
      
    case 'migrate':
      migrateToOptimized();
      break;
      
    case 'list':
      listCrons();
      break;
      
    case 'test':
      const agent = process.argv[3] || 'dexter';
      testOptimizedHeartbeat(agent);
      break;
      
    case 'stats':
      showStats();
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
  }
}

module.exports = { 
  setupOptimizedHeartbeatCrons, 
  setupAgentCheckCron,
  setupDailyStandupCron, 
  listCrons,
  migrateToOptimized
};

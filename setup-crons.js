#!/usr/bin/env node
/**
 * Mission Control — Cron Setup
 * Based on pbteja1998's Mission Control cron implementation
 * 
 * Sets up staggered heartbeat cron jobs for all agents
 * Each agent wakes every 15 minutes, staggered to avoid overlap
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';

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

/**
 * Setup Heartbeat Cron Jobs
 */
function setupHeartbeatCrons() {
  console.log('🚀 Setting up Mission Control cron jobs...');
  
  Object.entries(HEARTBEAT_SCHEDULE).forEach(([agent, schedule]) => {
    console.log(`Setting up ${agent} heartbeat: ${schedule}`);
    
    try {
      // Remove existing cron if exists
      try {
        execSync(`clawdbot cron remove "${agent}-heartbeat"`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore if doesn't exist
      }
      
      // Add new heartbeat cron
      const cronCommand = `clawdbot cron add \
        --name "${agent}-heartbeat" \
        --cron "${schedule}" \
        --session "isolated" \
        --message "cd ${WORKSPACE} && node heartbeat.js ${agent}"`;
      
      execSync(cronCommand);
      console.log(`✅ ${agent} heartbeat cron added`);
      
    } catch (error) {
      console.error(`❌ Failed to setup ${agent} heartbeat: ${error.message}`);
    }
  });
}

/**
 * Setup Daily Standup Cron
 */
function setupDailyStandupCron() {
  console.log('📊 Setting up daily standup cron...');
  
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
  console.log('\n📅 Current Mission Control cron jobs:');
  
  try {
    const result = execSync('clawdbot cron list', { encoding: 'utf8' });
    console.log(result);
  } catch (error) {
    console.error('Failed to list crons:', error.message);
  }
}

/**
 * Test heartbeat for specific agent
 */
function testHeartbeat(agentName) {
  console.log(`\n🧪 Testing ${agentName} heartbeat...`);
  
  try {
    execSync(`cd ${WORKSPACE} && node heartbeat.js ${agentName}`, { stdio: 'inherit' });
    console.log(`✅ ${agentName} heartbeat test completed`);
  } catch (error) {
    console.error(`❌ ${agentName} heartbeat test failed:`, error.message);
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'setup';
  
  switch (command) {
    case 'setup':
      setupHeartbeatCrons();
      setupDailyStandupCron();
      listCrons();
      break;
      
    case 'list':
      listCrons();
      break;
      
    case 'test':
      const agent = process.argv[3] || 'dexter';
      testHeartbeat(agent);
      break;
      
    default:
      console.log('Usage: node setup-crons.js [setup|list|test [agent-name]]');
  }
}

module.exports = { setupHeartbeatCrons, setupDailyStandupCron, listCrons };
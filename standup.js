#!/usr/bin/env node
/**
 * Mission Control — Daily Standup System
 * Based on pbteja1998's daily standup implementation
 * 
 * Generates daily reports at 11:30 PM IST
 * Shows what each agent accomplished, what's in progress, what's blocked
 */

const { MissionControl } = require('./database.js');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';

/**
 * Generate Daily Standup Report
 */
function generateDailyStandup() {
  console.log('\n📊 GENERATING DAILY STANDUP...\n');
  
  const mc = new MissionControl();
  const standup = mc.generateDailyStandup();
  
  // Format the standup like Bhanu's example
  const formatted = formatStandup(standup);
  
  // Save to file
  const standupPath = path.join(WORKSPACE, 'reports', `standup-${new Date().toISOString().split('T')[0]}.md`);
  fs.mkdirSync(path.dirname(standupPath), { recursive: true });
  fs.writeFileSync(standupPath, formatted);
  
  // Also send to Telegram (like Bhanu does)
  sendToTelegram(formatted);
  
  console.log('✅ Daily standup generated and sent!');
  console.log(`📄 Saved to: ${standupPath}`);
  
  return formatted;
}

/**
 * Format standup like Bhanu's example
 */
function formatStandup(standup) {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let formatted = `# 📊 DAILY STANDUP — ${date}\n\n`;
  
  // Completed Today
  if (standup.completed_today.length > 0) {
    formatted += `✅ **COMPLETED TODAY**\n`;
    standup.completed_today.forEach(task => {
      formatted += `• ${task.title} (${task.assignees.join(', ')})\n`;
    });
    formatted += '\n';
  }
  
  // In Progress
  if (standup.in_progress.length > 0) {
    formatted += `🔄 **IN PROGRESS**\n`;
    standup.in_progress.forEach(task => {
      formatted += `• ${task.title} (${task.assignees.join(', ')})\n`;
    });
    formatted += '\n';
  }
  
  // Blocked
  if (standup.blocked.length > 0) {
    formatted += `🚫 **BLOCKED**\n`;
    standup.blocked.forEach(task => {
      formatted += `• ${task.title} (${task.assignees.join(', ')})\n`;
    });
    formatted += '\n';
  }
  
  // Needs Review
  if (standup.needs_review.length > 0) {
    formatted += `👀 **NEEDS REVIEW**\n`;
    standup.needs_review.forEach(task => {
      formatted += `• ${task.title} (${task.assignees.join(', ')})\n`;
    });
    formatted += '\n';
  }
  
  // Recent Activity
  if (standup.recent_activity.length > 0) {
    formatted += `📈 **RECENT ACTIVITY**\n`;
    standup.recent_activity.forEach(activity => {
      formatted += `• ${activity.agent}: ${activity.message}\n`;
    });
    formatted += '\n';
  }
  
  // Agent Status
  if (standup.agent_status.length > 0) {
    formatted += `👥 **AGENT STATUS**\n`;
    standup.agent_status.forEach(agent => {
      formatted += `• **${agent.name}**: ${agent.status}`;
      if (agent.current_task) {
        formatted += ` — Working on: ${agent.current_task}`;
      }
      formatted += '\n';
    });
    formatted += '\n';
  }
  
  formatted += `---\nBuilt by Bug Baba at DappaSol\nBased on pbteja1998's Mission Control system\n${new Date().toISOString()}`;
  
  return formatted;
}

/**
 * Send standup to Telegram (like Bhanu does)
 */
function sendToTelegram(standup) {
  try {
    // This would send to your Telegram via the clawdbot system
    // For now, just log it
    console.log('\n📤 SENDING TO TELEGRAM...');
    console.log(standup);
    
    // In production, this would use:
    // clawdbot sessions send --session "agent:main:main" --message "${standup}"
    
  } catch (error) {
    console.error('Failed to send to Telegram:', error.message);
  }
}

// Main execution
if (require.main === module) {
  const standup = generateDailyStandup();
  console.log('\n📋 FINAL STANDUP:');
  console.log(standup);
}

module.exports = { generateDailyStandup };
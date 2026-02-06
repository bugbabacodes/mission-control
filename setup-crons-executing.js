#!/usr/bin/env node
/**
 * Mission Control — Cron Setup WITH EXECUTION
 * Sets up staggered heartbeat schedules for all agents
 * Uses heartbeat-executing.js which actually executes tasks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';

// Same staggered schedule as before
const HEARTBEAT_SCHEDULE = {
  dexter: '0,15,30,45 * * * *',      // :00
  blossom: '2,17,32,47 * * * *',     // :02  
  samurai_jack: '4,19,34,49 * * * *',  // :04
  johnny_bravo: '6,21,36,51 * * * *',  // :06
  courage: '8,23,38,53 * * * *'     // :08
};

const AGENTS = Object.keys(HEARTBEAT_SCHEDULE);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Mission Control — Cron Setup (WITH EXECUTION)          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('This script sets up the executing heartbeat system.\n');
console.log('Key changes from original:');
console.log('  • Uses heartbeat-executing.js (spawns sub-agents)');
console.log('  • Tasks actually get executed (not just logged)');
console.log('  • Isolated sessions per task via task-executor.js');
console.log('  • Progress tracking and error handling\n');

// Check if crontab is available
try {
  execSync('which crontab', { stdio: 'ignore' });
} catch (e) {
  console.error('❌ crontab not found. Please install cron.');
  process.exit(1);
}

console.log('📋 Current crontab entries for Mission Control:');
try {
  const currentCrontab = execSync('crontab -l 2>/dev/null || echo "# No crontab"', { encoding: 'utf8' });
  const lines = currentCrontab.split('\n');
  const mcLines = lines.filter(line => line.includes('mission-control') || line.includes('heartbeat'));
  
  if (mcLines.length > 0) {
    mcLines.forEach(line => console.log(`  ${line}`));
  } else {
    console.log('  (none found)');
  }
} catch (e) {
  console.log('  (unable to read)');
}

console.log('\n' + '─'.repeat(60));
console.log('Setting up new heartbeat schedules...\n');

// Build crontab entries
const cronEntries = [];
const logDir = path.join(WORKSPACE, 'logs');

// Ensure log directory exists
fs.mkdirSync(logDir, { recursive: true });

AGENTS.forEach(agent => {
  const schedule = HEARTBEAT_SCHEDULE[agent];
  const logFile = path.join(logDir, `${agent}-cron.log`);
  
  // Use heartbeat-executing.js instead of heartbeat.js
  const entry = `${schedule} cd ${WORKSPACE} && node heartbeat-executing.js heartbeat ${agent} >> ${logFile} 2>&1`;
  cronEntries.push(entry);
  
  console.log(`  ✅ ${agent.padEnd(15)} ${schedule}`);
});

console.log('\n' + '─'.repeat(60));

// Create temporary crontab file
const tempCrontab = path.join(WORKSPACE, '.temp-crontab');

// Read existing crontab and filter out old Mission Control entries
try {
  const existingCrontab = execSync('crontab -l 2>/dev/null || echo ""', { encoding: 'utf8' });
  const lines = existingCrontab.split('\n');
  
  // Keep non-Mission-Control lines
  const preservedLines = lines.filter(line => {
    const isMCEntry = line.includes('mission-control') && line.includes('heartbeat');
    return !isMCEntry && line.trim() !== '';
  });
  
  // Build new crontab
  const newCrontab = [
    '# Mission Control — Agent Heartbeats (WITH EXECUTION)',
    '# This version actually spawns sub-agents to execute tasks',
    '# Generated: ' + new Date().toISOString(),
    ...cronEntries,
    '',
    '# --- Previous crontab entries ---',
    ...preservedLines
  ].join('\n');
  
  fs.writeFileSync(tempCrontab, newCrontab);
  
} catch (e) {
  // If we can't read crontab, just create new one
  const newCrontab = [
    '# Mission Control — Agent Heartbeats (WITH EXECUTION)',
    '# This version actually spawns sub-agents to execute tasks',
    '# Generated: ' + new Date().toISOString(),
    ...cronEntries,
    ''
  ].join('\n');
  
  fs.writeFileSync(tempCrontab, newCrontab);
}

console.log('\n📄 New crontab preview:');
console.log('─'.repeat(60));
console.log(fs.readFileSync(tempCrontab, 'utf8'));
console.log('─'.repeat(60));

console.log('\n⚠️  This will REPLACE existing Mission Control heartbeat entries.');
console.log('   Other crontab entries will be preserved.\n');

// Apply crontab
console.log('📝 Applying crontab...');
try {
  execSync(`crontab ${tempCrontab}`);
  console.log('✅ Crontab applied successfully!\n');
} catch (e) {
  console.error('❌ Failed to apply crontab:', e.message);
  process.exit(1);
} finally {
  // Clean up temp file
  try {
    fs.unlinkSync(tempCrontab);
  } catch (e) {
    // Ignore cleanup errors
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    Setup Complete!                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📊 Agent Schedule:');
AGENTS.forEach(agent => {
  const schedule = HEARTBEAT_SCHEDULE[agent];
  const minutes = schedule.split(' ')[0].split(',').map(m => m.padStart(2, '0')).join(', ');
  console.log(`   ${agent.padEnd(15)} → Every 15 min at :${minutes}`);
});

console.log('\n🔄 Execution Flow:');
console.log('   1. Cron triggers heartbeat-executing.js every 15 min');
console.log('   2. Heartbeat checks database for tasks');
console.log('   3. For each task found, spawns task-executor.js');
console.log('   4. Task runs in isolated session');
console.log('   5. Progress tracked in database');
console.log('   6. Task status updates (inbox → in_progress → done/blocked)');

console.log('\n📁 Log Files:');
console.log(`   ${logDir}`);
console.log(`   ${path.join(logDir, '<agent>-heartbeat.log')} — Heartbeat logs`);
console.log(`   ${path.join(logDir, '<agent>-executor.log')} — Task execution logs`);
console.log(`   ${path.join(logDir, '<agent>-cron.log')} — Cron output`);

console.log('\n🧪 Test the system:');
console.log('   node heartbeat-executing.js heartbeat dexter');
console.log('   node heartbeat-executing.js test-executor samurai_jack');
console.log('   node heartbeat-executing.js stats');

console.log('\n✨ Mission Control is now executing tasks!\n');

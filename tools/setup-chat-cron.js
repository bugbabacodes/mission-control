#!/usr/bin/env node
/**
 * Setup Chat System Cron Jobs
 * Configures the chat simulator to run every 20 minutes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const TOOLS_DIR = path.join(WORKSPACE, 'mission-control/tools');

console.log('\n🤖 Setting up Autonomous Agent Chat System...\n');

// Cron schedule: Every 20 minutes
// This gives us ~72 messages per day (3 per hour * 24 hours)
// With 5-10% actually triggering, we get realistic ~10-15 conversations per day
const CHAT_SCHEDULE = '*/20 * * * *';

// Build the cron command
const simulatorPath = path.join(TOOLS_DIR, 'chat-simulator.js');
const updaterPath = path.join(TOOLS_DIR, 'chat-live-updater.js');

// Combined command: run simulator, then updater
const cronCommand = `${CHAT_SCHEDULE} cd ${WORKSPACE} && node ${simulatorPath} >> ${path.join(WORKSPACE, 'mission-control/logs/chat-simulator.log')} 2>&1 && node ${updaterPath} >> ${path.join(WORKSPACE, 'mission-control/logs/chat-updater.log')} 2>&1`;

console.log('📋 Configuration:');
console.log(`   Schedule: Every 20 minutes`);
console.log(`   Simulator: ${simulatorPath}`);
console.log(`   Updater: ${updaterPath}`);
console.log(`   Expected messages: ~10-15 per day (natural variation)`);
console.log();

// Check if cron already exists
try {
    const existingCrons = execSync('crontab -l 2>/dev/null || echo ""', { encoding: 'utf8' });
    
    if (existingCrons.includes('chat-simulator.js')) {
        console.log('⚠️  Chat simulator cron already exists. Skipping...');
    } else {
        // Add new cron
        const newCrons = existingCrons.trim() + '\n# Mission Control - Agent Chat System\n' + cronCommand + '\n';
        
        // Write to temp file and install
        const tempFile = '/tmp/mc-chat-cron.tmp';
        fs.writeFileSync(tempFile, newCrons);
        
        execSync(`crontab ${tempFile}`);
        fs.unlinkSync(tempFile);
        
        console.log('✅ Cron job installed successfully!');
    }
    
    console.log('\n📊 Current cron jobs:');
    console.log(execSync('crontab -l | grep -E "(chat|mission)" || echo "   None found"', { encoding: 'utf8' }));
    
} catch (error) {
    console.error('❌ Error setting up cron:', error.message);
    console.log('\n📝 Manual setup:');
    console.log('Run: crontab -e');
    console.log('Add this line:');
    console.log(cronCommand);
}

// Ensure log directory exists
const logDir = path.join(WORKSPACE, 'mission-control/logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

console.log('\n🚀 Starting initial chat simulation...\n');

// Run initial simulation
try {
    execSync(`node ${simulatorPath}`, { stdio: 'inherit', cwd: WORKSPACE });
    execSync(`node ${updaterPath}`, { stdio: 'inherit', cwd: WORKSPACE });
    console.log('\n✅ Initial simulation complete!');
} catch (error) {
    console.error('❌ Error running initial simulation:', error.message);
}

console.log('\n📁 Output files:');
console.log(`   Chat log: mission-control/AGENT-CHAT.md`);
console.log(`   Chat UI: chat.html`);
console.log(`   Logs: mission-control/logs/chat-*.log`);
console.log('\n✨ Chat system is now live!');
console.log('   Agents will start talking to each other every 20 minutes.\n');

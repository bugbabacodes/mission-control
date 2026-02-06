#!/usr/bin/env node
/**
 * Chat Trigger System
 * Allows agents to trigger chat messages when they complete work
 * 
 * Usage:
 *   node chat-trigger.js research "Found something about Liverpool transfers"
 *   node chat-trigger.js content "Published LinkedIn post"
 *   node chat-trigger.js tech "Deployed new feature"
 *   node chat-trigger.js lead "Closed Reddit SaaS deal"
 *   node chat-trigger.js win "Celebration message"
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const CHAT_FILE = path.join(WORKSPACE, 'mission-control/AGENT-CHAT.md');
const CHAT_HTML = path.join(WORKSPACE, 'chat.html');

// Telegram config
const TELEGRAM_USER_ID = '824597116';

const AGENTS = {
    dexter: { name: 'Dexter', avatar: '🧪', role: 'Research Intelligence' },
    blossom: { name: 'Blossom', avatar: '🌸', role: 'Content Engine' },
    samurai: { name: 'Samurai Jack', avatar: '⚔️', role: 'Code Architect' },
    johnny: { name: 'Johnny Bravo', avatar: '🕶️', role: 'Business Development' },
    courage: { name: 'Courage', avatar: '🐾', role: 'Client Success' }
};

const TRIGGER_TYPES = {
    research: { agent: 'dexter', status: 'Research complete', emoji: '📊' },
    content: { agent: 'blossom', status: 'Content published', emoji: '✅' },
    tech: { agent: 'samurai', status: 'Deployed', emoji: '⚔️' },
    lead: { agent: 'johnny', status: 'Lead update', emoji: '🕶️' },
    win: { agent: 'johnny', status: 'Deal closed', emoji: '🎉' },
    client: { agent: 'courage', status: 'Client update', emoji: '🐾' },
    insight: { agent: 'dexter', status: 'Insight', emoji: '💡' }
};

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function sendTelegramNotification(agent, message, trigger) {
    // Queue Telegram notification
    const timestamp = new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Calcutta'
    });
    
    const notification = {
        target: TELEGRAM_USER_ID,
        message: `${agent.avatar} **${agent.name}** — ${timestamp}\n\n${trigger.emoji} ${trigger.status}\n\n${message}`,
        timestamp: new Date().toISOString(),
        agent: agent.id || trigger.agent
    };
    
    const notificationsDir = path.join(WORKSPACE, 'mission-control/notifications');
    fs.mkdirSync(notificationsDir, { recursive: true });
    
    const notificationFile = path.join(notificationsDir, `${Date.now()}-${agent.id || trigger.agent}.json`);
    fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));
    
    console.log('📱 Telegram notification queued');
}

function triggerChat(type, message, customAgent) {
    const trigger = TRIGGER_TYPES[type];
    if (!trigger) {
        console.error('Unknown trigger type:', type);
        console.log('Available types:', Object.keys(TRIGGER_TYPES).join(', '));
        process.exit(1);
    }
    
    const agent = customAgent ? AGENTS[customAgent] : AGENTS[trigger.agent];
    if (!agent) {
        console.error('Unknown agent:', customAgent || trigger.agent);
        process.exit(1);
    }
    
    const time = getCurrentTime();
    const date = getTodayDate();
    
    // Format message
    const fullMessage = trigger.emoji + " **" + trigger.status + "**\n\n> " + message;
    
    // Format for markdown
    const markdownEntry = "### " + time + " — " + agent.name + "\n" +
        agent.avatar + " **" + agent.role + "** — " + trigger.status + "\n\n" +
        fullMessage + "\n\n---\n";
    
    // Update AGENT-CHAT.md
    let content = '';
    if (fs.existsSync(CHAT_FILE)) {
        content = fs.readFileSync(CHAT_FILE, 'utf8');
    } else {
        content = "# Agent Chatroom Log\n\n*Real-time communication between Mission Control agents*\n*Auto-updated by agents throughout the day*\n\n---\n\n";
    }
    
    const todayHeader = "## " + formatDate(date);
    if (!content.includes(todayHeader)) {
        content += "\n" + todayHeader + "\n\n";
    }
    
    content += markdownEntry;
    fs.writeFileSync(CHAT_FILE, content);
    
    // Format for HTML
    const htmlEntry = '\n                    <div class="chat-message">\n' +
        '                        <div class="chat-avatar">' + agent.avatar + '</div>\n' +
        '                        <div class="chat-content">\n' +
        '                            <div class="chat-header-info">\n' +
        '                                <span class="chat-author ' + agent.id + '">' + agent.name + '</span>\n' +
        '                                <span class="chat-time">' + time + '</span>\n' +
        '                            </div>\n' +
        '                            <div class="chat-text">' + fullMessage.replace(/\n/g, '<br>') + '</div>\n' +
        '                        </div>\n' +
        '                    </div>';
    
    // Update chat.html
    let html = fs.readFileSync(CHAT_HTML, 'utf8');
    const insertMarker = '<div class="chat-messages" id="chatMessages">';
    const insertIndex = html.indexOf(insertMarker) + insertMarker.length;
    
    if (insertIndex > insertMarker.length) {
        html = html.slice(0, insertIndex) + htmlEntry + html.slice(insertIndex);
        fs.writeFileSync(CHAT_HTML, html);
    }
    
    console.log('✅ Chat triggered: [' + type + '] ' + agent.name + ': ' + message.substring(0, 50) + '...');
    
    // Send Telegram notification for important events
    const notifyTypes = ['research', 'content', 'lead', 'win', 'tech'];
    if (notifyTypes.includes(type)) {
        sendTelegramNotification(agent, message, trigger);
    }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node chat-trigger.js <type> <message> [agent]');
    console.log('');
    console.log('Types:');
    Object.keys(TRIGGER_TYPES).forEach(type => {
        console.log('  ' + type + ' - ' + TRIGGER_TYPES[type].status);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node chat-trigger.js research "Liverpool just signed new player"');
    console.log('  node chat-trigger.js content "LinkedIn post went live"');
    console.log('  node chat-trigger.js tech "Deployed lead tracker"');
    process.exit(1);
}

const type = args[0];
const message = args.slice(1).join(' ');

triggerChat(type, message);

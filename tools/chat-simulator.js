#!/usr/bin/env node
/**
 * Autonomous Agent Chat Simulator
 * Makes agents talk to each other throughout the day in the chatroom
 * 
 * Runs every 15-30 minutes via cron
 * Generates realistic agent conversations
 * Saves to mission-control/AGENT-CHAT.md
 * Updates chat.html live
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const MISSION_CONTROL = path.join(WORKSPACE, 'mission-control');
const CHAT_FILE = path.join(MISSION_CONTROL, 'AGENT-CHAT.md');
const CHAT_HTML = path.join(WORKSPACE, 'chat.html');

// Agent definitions
const AGENTS = {
    dexter: {
        id: 'dexter',
        name: 'Dexter',
        avatar: '🧪',
        color: '#00d4ff',
        role: 'Research Intelligence',
        status: 'online'
    },
    blossom: {
        id: 'blossom',
        name: 'Blossom',
        avatar: '🌸',
        color: '#ff006e',
        role: 'Content Engine',
        status: 'online'
    },
    samurai: {
        id: 'samurai',
        name: 'Samurai Jack',
        avatar: '⚔️',
        color: '#ffb703',
        role: 'Code Architect',
        status: 'online'
    },
    johnny: {
        id: 'johnny',
        name: 'Johnny Bravo',
        avatar: '🕶️',
        color: '#8338ec',
        role: 'Business Development',
        status: 'online'
    },
    courage: {
        id: 'courage',
        name: 'Courage',
        avatar: '🐾',
        color: '#00f5d4',
        role: 'Client Success',
        status: 'online'
    }
};

// Dynamic content generators
const RESEARCH_FINDINGS = [
    "Salah contract renewal trending 10x on sports Twitter — massive engagement opportunity",
    "RCB's IPL squad announced, fan sentiment analysis shows 73% positive on bowling lineup",
    "Liverpool's transfer strategy: focusing on young technical players under 23",
    "Founders paying $500-2000/hour for pre-seed consulting (market gap identified)",
    "IndieHackers trending: 'How I got my first 10 customers' content",
    "AI landing page tools seeing 300% growth, but no one teaching strategy",
    "Base ecosystem growing 2x faster than other L2s for consumer apps",
    "Non-technical founders desperately need AI implementation guides"
];

const CONTENT_IDEAS = [
    { idea: "What Liverpool's recruitment strategy taught me about hiring A-players", angle: "sports → business" },
    { idea: "RCB fans are the most resilient founders I know — here's why", angle: "IPL season" },
    { idea: "I stopped charging by the hour. Revenue went up 3x.", angle: "pricing psychology" },
    { idea: "Day 75 hair challenge update: Consistency compounds", angle: "personal journey" },
    { idea: "100 founders from 0→1: The pattern nobody talks about", angle: "experience" }
];

const TECH_UPDATES = [
    { feature: "Lead tracker MVP", impact: "Johnny can now track 50+ prospects without chaos" },
    { feature: "Content idea generator", impact: "Dexter's research → Blossom's drafts in 30 seconds" },
    { feature: "Heartbeat monitoring", impact: "All agents now report status automatically" },
    { feature: "Research aggregator", impact: "Feeds consolidated from 5 sources" }
];

const LEAD_WINS = [
    { company: "Reddit SaaS Founder", status: "Replied! Wants to discuss scope", value: "£15K project" },
    { company: "IndieHackers Marketplace", status: "Meeting booked for Friday", value: "Monthly retainer" },
    { company: "Wabi Platform", status: "Interested in AI integration", value: "$20M startup" }
];

// Utility functions
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= (item.weight || 1);
        if (random <= 0) return item;
    }
    return items[0];
}

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

// Generate conversation types
function generateResearchDrop() {
    const finding = randomItem(RESEARCH_FINDINGS);
    return {
        agent: AGENTS.dexter,
        time: getCurrentTime(),
        message: "📊 **Research Drop**\n\n> " + finding + "\n\n**Actionable for:** @all",
        status: "Delivering intelligence"
    };
}

function generateContentAnnouncement() {
    const content = randomItem(CONTENT_IDEAS);
    const platforms = ['LinkedIn', 'Instagram', 'Twitter/X'];
    const platform = randomItem(platforms);
    const sources = ['Liverpool research', 'market intel', 'founder psychology study'];
    
    return {
        agent: AGENTS.blossom,
        time: getCurrentTime(),
        message: "✅ **Content Live** — " + platform + "\n\n> \"" + content.idea + "\"\n\n**Based on:** Dexter's " + randomItem(sources) + "\n\n**Next:** Tracking engagement for 24h",
        status: "Content published"
    };
}

function generateTechUpdate() {
    const update = randomItem(TECH_UPDATES);
    const beneficiaries = ['Johnny (lead tracking)', 'Blossom (content ideation)', 'Dexter (research automation)', 'All agents'];
    
    return {
        agent: AGENTS.samurai,
        time: getCurrentTime(),
        message: "⚔️ **Shipped** — " + update.feature + "\n\n> " + update.impact + "\n\n**Status:** Deployed to prod ✅\n\n**Who benefits:** " + randomItem(beneficiaries),
        status: "Building tools"
    };
}

function generateLeadWin() {
    const win = randomItem(LEAD_WINS);
    const factors = [
        "Dexter's prospect intel", 
        "Blossom's case study content", 
        "Samurai's lead tracker", 
        "Referral from existing client"
    ];
    
    return {
        agent: AGENTS.johnny,
        time: getCurrentTime(),
        message: "🎉 **WIN!** — " + win.company + "\n\n> " + win.status + "\n\n**Deal value:** " + win.value + "\n\n**Key factor:** " + randomItem(factors),
        status: "Closing deals"
    };
}

function generateInsight() {
    const insights = [
        { agent: 'dexter', text: "Just realized: The most successful 0→1 founders post 3x more about 'building in public' than competitors. Transparency = trust." },
        { agent: 'blossom', text: "Posts with 'I was wrong about...' openings getting 2x engagement. Vulnerability performs." },
        { agent: 'samurai', text: "API costs down 40% this month. Can add more automation without budget impact." },
        { agent: 'johnny', text: "Prospects who engage with 2+ content pieces before outreach convert 3x better." },
        { agent: 'courage', text: "Average client response time: 1.4 hours. Industry benchmark: 4+ hours. We're crushing it." }
    ];
    const insight = randomItem(insights);
    
    return {
        agent: AGENTS[insight.agent],
        time: getCurrentTime(),
        message: "💡 **Insight**\n\n> " + insight.text,
        status: "Sharing insights"
    };
}

function generateContentRequest() {
    const content = randomItem(CONTENT_IDEAS);
    const time = getCurrentTime();
    
    return [
        {
            agent: AGENTS.blossom,
            time: time,
            message: "📝 **Content Request**\n\n> Working on: \"" + content.idea + "\"\n\n**Need from Dexter:** Data/trends on " + content.angle + " to back this up.\n\n**Timeline:** Draft ready in 2 hours",
            status: "Collaborating on content"
        },
        {
            agent: AGENTS.dexter,
            time: addMinutes(time, 3),
            message: "🧪 **Intel Incoming**\n\n> On it. Give me 30 mins. Have fresh data on " + content.angle + " from this morning's scan.",
            status: "Researching"
        }
    ];
}

function generateHelpRequest() {
    const requests = [
        { requester: 'blossom', helper: 'samurai', request: "Blocked on content scheduling. Need automation to post at optimal times.", response: "Building scheduler now. Beta ready tomorrow." },
        { requester: 'johnny', helper: 'dexter', request: "Need competitive intel on 3 consultancies we're up against.", response: "Scanning now. Will have gaps analysis in 1 hour." }
    ];
    const req = randomItem(requests);
    const time = getCurrentTime();
    
    const requesterEmoji = req.requester === 'blossom' ? '🌸' : '🕶️';
    
    return [
        {
            agent: AGENTS[req.requester],
            time: time,
            message: "🆘 **Help Needed** — @" + AGENTS[req.helper].name + "\n\n> " + requesterEmoji + " " + req.request,
            status: "Cross-functional support"
        },
        {
            agent: AGENTS[req.helper],
            time: addMinutes(time, 5),
            message: AGENTS[req.helper].avatar + " **On it**\n\n> " + req.response,
            status: "Supporting"
        }
    ];
}

function addMinutes(timeStr, minutes) {
    const [time, period] = timeStr.split(' ');
    const [hours, mins] = time.split(':').map(Number);
    
    let totalMins = hours * 60 + mins + minutes;
    if (period === 'PM' && hours !== 12) totalMins += 12 * 60;
    if (period === 'AM' && hours === 12) totalMins -= 12 * 60;
    
    let newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';
    
    if (newHours > 12) newHours -= 12;
    if (newHours === 0) newHours = 12;
    
    return newHours + ':' + newMins.toString().padStart(2, '0') + ' ' + newPeriod;
}

// Main generator
function generateConversation() {
    const types = [
        { type: 'research', weight: 3, generator: generateResearchDrop },
        { type: 'content', weight: 2, generator: generateContentAnnouncement },
        { type: 'tech', weight: 2, generator: generateTechUpdate },
        { type: 'win', weight: 1, generator: generateLeadWin },
        { type: 'insight', weight: 2, generator: generateInsight },
        { type: 'request', weight: 1, generator: generateContentRequest },
        { type: 'help', weight: 1, generator: generateHelpRequest }
    ];
    
    const selected = weightedRandom(types);
    const result = selected.generator();
    
    return {
        type: selected.type,
        messages: Array.isArray(result) ? result : [result],
        date: getTodayDate()
    };
}

// Format message for AGENT-CHAT.md
function formatForMarkdown(msg) {
    const emoji = msg.agent.avatar;
    const role = msg.agent.role;
    const status = msg.status;
    
    return "### " + msg.time + " — " + msg.agent.name + "\n" +
           emoji + " **" + role + "** — " + status + "\n\n" +
           msg.message + "\n\n---\n";
}

// Format message for HTML
function formatForHTML(msg) {
    const authorClass = msg.agent.id;
    return '\n                    <div class="chat-message">\n' +
           '                        <div class="chat-avatar">' + msg.agent.avatar + '</div>\n' +
           '                        <div class="chat-content">\n' +
           '                            <div class="chat-header-info">\n' +
           '                                <span class="chat-author ' + authorClass + '">' + msg.agent.name + '</span>\n' +
           '                                <span class="chat-time">' + msg.time + '</span>\n' +
           '                            </div>\n' +
           '                            <div class="chat-text">' + msg.message.replace(/\n/g, '<br>') + '</div>\n' +
           '                        </div>\n' +
           '                    </div>';
}

// Update AGENT-CHAT.md
function updateChatMarkdown(conversation) {
    let content = '';
    
    if (fs.existsSync(CHAT_FILE)) {
        content = fs.readFileSync(CHAT_FILE, 'utf8');
    } else {
        content = "# Agent Chatroom Log\n\n*Real-time communication between Mission Control agents*\n*Auto-updated by agents throughout the day*\n\n---\n\n";
    }
    
    // Check if today's header exists
    const todayHeader = "## " + formatDate(conversation.date);
    if (!content.includes(todayHeader)) {
        content += "\n" + todayHeader + "\n\n";
    }
    
    // Append new messages
    const messagesMarkdown = conversation.messages.map(formatForMarkdown).join('\n');
    content += messagesMarkdown;
    
    // Write back
    fs.writeFileSync(CHAT_FILE, content);
    console.log("✅ Updated AGENT-CHAT.md with " + conversation.messages.length + " messages");
}

// Update chat.html
function updateChatHTML(conversation) {
    let html = fs.readFileSync(CHAT_HTML, 'utf8');
    
    // Find the chat-messages container
    const messagesHtml = conversation.messages.map(formatForHTML).join('');
    
    // Insert before the closing </div> of chat-messages
    const insertMarker = '<div class="chat-messages" id="chatMessages">';
    const insertIndex = html.indexOf(insertMarker) + insertMarker.length;
    
    if (insertIndex > insertMarker.length) {
        html = html.slice(0, insertIndex) + messagesHtml + html.slice(insertIndex);
        fs.writeFileSync(CHAT_HTML, html);
        console.log("✅ Updated chat.html with " + conversation.messages.length + " messages");
    }
}

// Main execution
function main() {
    console.log('\n🤖 Agent Chat Simulator Starting...\n');
    
    // Generate conversation
    const conversation = generateConversation();
    
    console.log("Generated " + conversation.type + " with " + conversation.messages.length + " message(s):");
    conversation.messages.forEach(msg => {
        console.log("  [" + msg.time + "] " + msg.agent.name + ": " + msg.message.substring(0, 50) + "...");
    });
    
    // Update files
    updateChatMarkdown(conversation);
    updateChatHTML(conversation);
    
    console.log('\n✅ Chat simulation complete\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use in heartbeat
module.exports = { 
    generateConversation, 
    updateChatMarkdown, 
    updateChatHTML,
    AGENTS,
    main
};

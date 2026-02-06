#!/usr/bin/env node
/**
 * Chat Live Updater
 * Watches AGENT-CHAT.md and updates chat.html in real-time
 * Also updates agent status indicators
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const MISSION_CONTROL = path.join(WORKSPACE, 'mission-control');
const CHAT_FILE = path.join(MISSION_CONTROL, 'AGENT-CHAT.md');
const CHAT_HTML = path.join(WORKSPACE, 'chat.html');

const AGENTS = {
    dexter: { name: 'Dexter', avatar: '🧪', class: 'dexter' },
    blossom: { name: 'Blossom', avatar: '🌸', class: 'blossom' },
    samurai: { name: 'Samurai Jack', avatar: '⚔️', class: 'samurai' },
    johnny: { name: 'Johnny Bravo', avatar: '🕶️', class: 'johnny' },
    courage: { name: 'Courage', avatar: '🐾', class: 'courage' }
};

// Parse AGENT-CHAT.md and extract messages
function parseChatMarkdown() {
    if (!fs.existsSync(CHAT_FILE)) {
        return [];
    }
    
    const content = fs.readFileSync(CHAT_FILE, 'utf8');
    const messages = [];
    
    // Regex to match message blocks
    const messageRegex = /### (\d{1,2}:\d{2}\s*(?:AM|PM)) — ([^\n]+)\n([^\n]+)\n\n> ([\s\S]*?)(?:\n\n---|\n\n\*\*Status)/g;
    
    let match;
    while ((match = messageRegex.exec(content)) !== null) {
        const time = match[1].trim();
        const agentName = match[2].trim();
        const headerLine = match[3].trim();
        const messageText = match[4].trim();
        
        // Find agent by name
        const agent = Object.values(AGENTS).find(a => a.name === agentName) || AGENTS.dexter;
        
        messages.push({
            time,
            agent,
            message: messageText.replace(/\n/g, '<br>'),
            status: headerLine.includes('**') ? headerLine.match(/\*\*([^*]+)\*\*/)?.[1] : 'Online'
        });
    }
    
    // Return last 20 messages (most recent)
    return messages.slice(-20);
}

// Generate HTML for messages
function generateMessagesHTML(messages) {
    return messages.map(msg => `
                    <div class="chat-message">
                        <div class="chat-avatar">${msg.agent.avatar}</div>
                        <div class="chat-content">
                            <div class="chat-header-info">
                                <span class="chat-author ${msg.agent.class}">${msg.agent.name}</span>
                                <span class="chat-time">${msg.time}</span>
                            </div>
                            <div class="chat-text">${msg.message}</div>
                        </div>
                    </div>`).join('');
}

// Determine agent status based on recent activity
function getAgentStatus(messages) {
    const now = new Date();
    const statuses = {};
    
    Object.keys(AGENTS).forEach(agentId => {
        const agentMessages = messages.filter(m => m.agent.class === agentId);
        
        if (agentMessages.length === 0) {
            statuses[agentId] = { status: 'online', text: 'Online' };
            return;
        }
        
        const lastMessage = agentMessages[agentMessages.length - 1];
        const messageTime = parseTime(lastMessage.time);
        const minutesSince = (now - messageTime) / (1000 * 60);
        
        if (minutesSince < 5) {
            statuses[agentId] = { status: 'working', text: 'Active now' };
        } else if (minutesSince < 30) {
            statuses[agentId] = { status: 'online', text: 'Online' };
        } else {
            statuses[agentId] = { status: 'online', text: 'Standby' };
        }
    });
    
    return statuses;
}

function parseTime(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    date.setHours(hour24, mins, 0, 0);
    return date;
}

// Generate agent sidebar HTML
function generateAgentSidebar(statuses) {
    return Object.entries(AGENTS).map(([id, agent]) => {
        const status = statuses[id] || { status: 'online', text: 'Online' };
        const isActive = status.status === 'working' ? 'active' : '';
        
        return `
                    <div class="agent-item ${isActive}">
                        <div class="agent-avatar">${agent.avatar}</div>
                        <div class="agent-info">
                            <div class="agent-name">${agent.name}</div>
                            <div class="agent-status">${status.text}</div>
                        </div>
                        <div class="agent-indicator ${status.status}"></div>
                    </div>`;
    }).join('');
}

// Rebuild chat.html from scratch
function rebuildChatHTML() {
    const messages = parseChatMarkdown();
    const statuses = getAgentStatus(messages);
    
    const messagesHTML = generateMessagesHTML(messages);
    const agentSidebarHTML = generateAgentSidebar(statuses);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat | Mission Control</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-primary: #0f0f1a;
            --bg-secondary: #1a1a2e;
            --bg-card: rgba(255, 255, 255, 0.03);
            --sidebar-bg: rgba(26, 26, 46, 0.8);
            --border: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(255, 255, 255, 0.15);
            --text-primary: #ffffff;
            --text-secondary: #a0a0b0;
            --text-muted: #6b6b7b;
            --accent-cyan: #00d4ff;
            --accent-purple: #7b2cbf;
            --accent-pink: #ff006e;
            --accent-green: #00f5d4;
            --accent-yellow: #ffb703;
            --accent-orange: #fb5607;
            --gradient-1: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%);
            --gradient-2: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
            --gradient-3: linear-gradient(135deg, #00f5d4 0%, #00d4ff 100%);
            --shadow-glow: 0 0 40px rgba(0, 212, 255, 0.15);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            height: 100vh;
            overflow: hidden;
        }
        
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }
        
        .bg-animation::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                radial-gradient(circle at 20% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(123, 44, 191, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(255, 0, 110, 0.03) 0%, transparent 50%);
            animation: bgPulse 15s ease-in-out infinite;
        }
        
        @keyframes bgPulse {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
        }
        
        .app {
            display: flex;
            height: 100vh;
            position: relative;
            z-index: 1;
        }
        
        .sidebar {
            width: 280px;
            background: var(--sidebar-bg);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border);
            padding: 2rem 1.5rem;
            display: flex;
            flex-direction: column;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 3rem;
            padding: 0 0.5rem;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: var(--gradient-1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }
        
        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav-section {
            margin-bottom: 2rem;
        }
        
        .nav-title {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: var(--text-muted);
            margin-bottom: 1rem;
            padding: 0 0.75rem;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.875rem 1rem;
            margin-bottom: 0.375rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: var(--text-secondary);
            text-decoration: none;
        }
        
        .nav-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
            transform: translateX(4px);
        }
        
        .nav-item.active {
            background: rgba(0, 212, 255, 0.1);
            color: var(--accent-cyan);
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
        }
        
        .nav-item.active .nav-icon {
            filter: drop-shadow(0 0 8px var(--accent-cyan));
        }
        
        .nav-icon {
            font-size: 1.25rem;
            width: 24px;
            text-align: center;
        }
        
        .nav-badge {
            margin-left: auto;
            background: var(--gradient-2);
            color: white;
            font-size: 0.7rem;
            padding: 0.25rem 0.5rem;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .main {
            flex: 1;
            margin-left: 280px;
            display: flex;
            height: 100vh;
        }
        
        .agent-sidebar {
            width: 260px;
            background: var(--bg-card);
            border-right: 1px solid var(--border);
            padding: 1.5rem;
            overflow-y: auto;
            backdrop-filter: blur(10px);
        }
        
        .sidebar-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }
        
        .agent-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .agent-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            border: 1px solid transparent;
        }
        
        .agent-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--border);
        }
        
        .agent-item.active {
            background: rgba(0, 212, 255, 0.1);
            border-color: var(--accent-cyan);
            box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
        }
        
        .agent-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.125rem;
            background: var(--bg-secondary);
            border: 2px solid var(--border);
        }
        
        .agent-info {
            flex: 1;
        }
        
        .agent-name {
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .agent-status {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        
        .agent-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .agent-indicator.online {
            background: var(--accent-green);
            box-shadow: 0 0 8px var(--accent-green);
            animation: pulse 2s infinite;
        }
        
        .agent-indicator.working {
            background: var(--accent-yellow);
            box-shadow: 0 0 8px var(--accent-yellow);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--bg-primary);
        }
        
        .chat-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-card);
            backdrop-filter: blur(10px);
        }
        
        .chat-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .chat-title h2 {
            font-size: 1rem;
            font-weight: 600;
        }
        
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            color: var(--accent-green);
            background: rgba(0, 245, 212, 0.1);
            padding: 0.25rem 0.625rem;
            border-radius: 20px;
        }
        
        .live-indicator::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--accent-green);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .chat-message {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            animation: fadeIn 0.3s ease;
            max-width: 85%;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        
        .chat-message:hover {
            border-color: var(--border-hover);
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.05);
        }
        
        .chat-message.own {
            margin-left: auto;
            background: rgba(0, 212, 255, 0.05);
            border-color: rgba(0, 212, 255, 0.2);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .chat-avatar {
            font-size: 1.5rem;
            flex-shrink: 0;
        }
        
        .chat-content {
            flex: 1;
            min-width: 0;
        }
        
        .chat-header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.375rem;
        }
        
        .chat-author {
            font-weight: 600;
            font-size: 0.9375rem;
        }
        
        .chat-author.dexter { color: var(--accent-cyan); }
        .chat-author.blossom { color: var(--accent-pink); }
        .chat-author.johnny { color: var(--accent-purple); }
        .chat-author.samurai { color: var(--accent-yellow); }
        .chat-author.courage { color: var(--accent-green); }
        
        .chat-time {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        
        .chat-text {
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.6;
        }
        
        .chat-text strong {
            color: var(--text-primary);
        }
        
        .chat-input {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border);
            background: var(--bg-card);
            backdrop-filter: blur(10px);
        }
        
        .input-container {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        
        .chat-textarea {
            flex: 1;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.875rem 1rem;
            color: var(--text-primary);
            font-size: 0.875rem;
            resize: none;
            height: 48px;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        .chat-textarea:focus {
            outline: none;
            border-color: var(--accent-cyan);
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
        }
        
        .btn-send {
            padding: 0.875rem 1.5rem;
            background: var(--gradient-1);
            color: var(--bg-primary);
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-send:hover {
            box-shadow: 0 0 25px rgba(0, 212, 255, 0.3);
            transform: translateY(-2px);
        }
        
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--border-hover);
        }
    </style>
</head>
<body>
    <div class="bg-animation"></div>
    
    <div class="app">
        <aside class="sidebar">
            <div class="logo">
                <div class="logo-icon">🎯</div>
                <div class="logo-text">Mission Control</div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">Main</div>
                <a href="./index.html" class="nav-item">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </a>
                <a href="./agents.html" class="nav-item">
                    <span class="nav-icon">🤖</span>
                    <span>Agents</span>
                    <span class="nav-badge">5</span>
                </a>
                <a href="./tasks.html" class="nav-item">
                    <span class="nav-icon">📋</span>
                    <span>Tasks</span>
                </a>
                <a href="./content.html" class="nav-item">
                    <span class="nav-icon">📝</span>
                    <span>Content</span>
                </a>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">Operations</div>
                <a href="./leads.html" class="nav-item">
                    <span class="nav-icon">👥</span>
                    <span>Leads</span>
                    <span class="nav-badge">50</span>
                </a>
                <a href="./chat.html" class="nav-item active">
                    <span class="nav-icon">💬</span>
                    <span>Chat</span>
                </a>
            </div>
        </aside>
        
        <main class="main">
            <aside class="agent-sidebar">
                <div class="sidebar-title">Active Agents</div>
                <div class="agent-list">${agentSidebarHTML}
                </div>
            </aside>

            <div class="chat-container">
                <div class="chat-header">
                    <div class="chat-title">
                        <h2>💬 Agent Chatroom</h2>
                        <span class="live-indicator">Live</span>
                    </div>
                    <span style="font-size: 0.8125rem; color: var(--text-muted);">${Object.values(statuses).filter(s => s.status === 'working').length > 0 ? Object.values(statuses).filter(s => s.status === 'working').length + ' agent(s) active' : '5 agents online'}</span>
                </div>

                <div class="chat-messages" id="chatMessages">${messagesHTML}
                </div>

                <div class="chat-input">
                    <div class="input-container">
                        <textarea class="chat-textarea" placeholder="Type a message to your agents..." rows="1"></textarea>
                        <button class="btn-send">Send</button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Auto-scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Auto-refresh every 60 seconds
        setInterval(() => {
            location.reload();
        }, 60000);
    </script>
</body>
</html>`;
    
    fs.writeFileSync(CHAT_HTML, html);
    console.log(`✅ Rebuilt chat.html with ${messages.length} messages`);
}

// Main execution
function main() {
    console.log('\n🔄 Chat Live Updater Starting...\n');
    
    if (!fs.existsSync(CHAT_FILE)) {
        console.log('⚠️  AGENT-CHAT.md not found. Nothing to update.');
        return;
    }
    
    rebuildChatHTML();
    console.log('\n✅ Chat HTML updated\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { 
    parseChatMarkdown, 
    rebuildChatHTML,
    main
};

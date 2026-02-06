#!/usr/bin/env node
/**
 * Agent Wake System
 * Detects @mentions of agents and wakes them immediately
 * Makes agents truly autonomous and responsive
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const MISSION_CONTROL = path.join(WORKSPACE, 'mission-control');
const CHAT_FILE = path.join(MISSION_CONTROL, 'AGENT-CHAT.md');
const MEMORY_DIR = path.join(MISSION_CONTROL, 'memory');
const WAKE_LOG = path.join(MISSION_CONTROL, 'logs', 'agent-wakes.log');
const TAG_QUEUE_FILE = path.join(MISSION_CONTROL, 'database', 'tag-queue.json');

// Agent definitions with their wake triggers
const AGENTS = {
    dexter: {
        id: 'dexter',
        name: 'Dexter',
        aliases: ['dexter', '@dexter', '🧪 dexter', 'research'],
        triggers: ['research', 'analyze', 'competitor', 'intel', 'study', 'investigate', 'trends'],
        emoji: '🧪',
        role: 'Research Intelligence',
        color: '#00d4ff'
    },
    blossom: {
        id: 'blossom',
        name: 'Blossom',
        aliases: ['blossom', '@blossom', '🌸 blossom', 'content', 'writer'],
        triggers: ['write', 'content', 'draft', 'post', 'script', 'blog', 'article', 'copy', 'content calendar'],
        emoji: '🌸',
        role: 'Content Engine',
        color: '#ff006e'
    },
    samurai_jack: {
        id: 'samurai_jack',
        name: 'Samurai Jack',
        aliases: ['samurai', '@samurai', 'samurai jack', '@samurai_jack', '⚔️ samurai', 'code', 'build', 'dev'],
        triggers: ['build', 'code', 'tool', 'automation', 'script', 'feature', 'deploy', 'fix', 'ship'],
        emoji: '⚔️',
        role: 'Code Architect',
        color: '#ffb703'
    },
    johnny_bravo: {
        id: 'johnny_bravo',
        name: 'Johnny Bravo',
        aliases: ['johnny', '@johnny', 'johnny bravo', '@johnny_bravo', '🕶️ johnny', 'sales', 'outreach', 'bd'],
        triggers: ['outreach', 'lead', 'prospect', 'follow up', 'follow-up', 'email', 'linkedin', 'meeting', 'deal'],
        emoji: '🕶️',
        role: 'Business Development',
        color: '#8338ec'
    },
    courage: {
        id: 'courage',
        name: 'Courage',
        aliases: ['courage', '@courage', '🐾 courage', 'support', 'client'],
        triggers: ['client', 'email', 'inbox', 'support', 'meeting', 'schedule', 'follow up', 'follow-up'],
        emoji: '🐾',
        role: 'Client Success',
        color: '#00f5d4'
    }
};

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    console.log(logLine.trim());
    
    fs.mkdirSync(path.dirname(WAKE_LOG), { recursive: true });
    fs.appendFileSync(WAKE_LOG, logLine);
}

/**
 * Parse chat file and detect @mentions
 */
function detectTags() {
    if (!fs.existsSync(CHAT_FILE)) {
        return [];
    }
    
    const content = fs.readFileSync(CHAT_FILE, 'utf8');
    const lines = content.split('\n');
    
    const tags = [];
    let currentMessage = null;
    
    for (const line of lines) {
        // Detect message header (e.g., "### 08:35 AM — Dexter")
        const headerMatch = line.match(/^###\s+(\d{1,2}:\d{2}\s+(?:AM|PM))\s+—\s+(.+)$/i);
        if (headerMatch) {
            currentMessage = {
                time: headerMatch[1],
                author: headerMatch[2].trim(),
                content: ''
            };
            continue;
        }
        
        // Accumulate message content
        if (currentMessage && line.trim() && !line.startsWith('---')) {
            currentMessage.content += line + '\n';
        }
        
        // End of message
        if (currentMessage && line.startsWith('---')) {
            // Check for @mentions in the message
            for (const [agentId, agent] of Object.entries(AGENTS)) {
                // Check for @agentname
                const atMention = new RegExp(`@${agentId.replace('_', '[_-]?')}`, 'i');
                if (atMention.test(currentMessage.content)) {
                    tags.push({
                        agentId: agentId,
                        agent: agent,
                        message: currentMessage,
                        timestamp: Date.now(),
                        type: 'direct_mention'
                    });
                }
                
                // Check for trigger words from other agents
                for (const trigger of agent.triggers) {
                    const triggerRegex = new RegExp(`\\b${trigger}\\b`, 'i');
                    if (triggerRegex.test(currentMessage.content)) {
                        // Don't tag if the agent is the author of the message
                        if (!agent.aliases.some(a => currentMessage.author.toLowerCase().includes(a.toLowerCase()))) {
                            tags.push({
                                agentId: agentId,
                                agent: agent,
                                message: currentMessage,
                                timestamp: Date.now(),
                                type: 'trigger_word',
                                trigger: trigger
                            });
                        }
                        break;
                    }
                }
            }
            
            currentMessage = null;
        }
    }
    
    return tags;
}

/**
 * Check if agent has already acknowledged this message
 */
function hasAcknowledged(agentId, messageContent) {
    const todoFile = path.join(MEMORY_DIR, agentId, 'todo.json');
    if (!fs.existsSync(todoFile)) {
        return false;
    }
    
    const todos = JSON.parse(fs.readFileSync(todoFile, 'utf8'));
    const contentHash = hashContent(messageContent);
    
    return todos.some(todo => 
        todo.source === 'tag' && 
        todo.contentHash === contentHash &&
        todo.status === 'acknowledged'
    );
}

/**
 * Simple content hash for deduplication
 */
function hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Add task to agent's todo list
 */
function addToTodo(agentId, tag) {
    const todoFile = path.join(MEMORY_DIR, agentId, 'todo.json');
    fs.mkdirSync(path.dirname(todoFile), { recursive: true });
    
    let todos = [];
    if (fs.existsSync(todoFile)) {
        todos = JSON.parse(fs.readFileSync(todoFile, 'utf8'));
    }
    
    const contentHash = hashContent(tag.message.content);
    
    // Check if already exists
    if (todos.some(t => t.contentHash === contentHash)) {
        return false;
    }
    
    const todo = {
        id: `tag-${Date.now()}`,
        type: 'tag_response',
        source: 'tag',
        contentHash: contentHash,
        message: tag.message.content.substring(0, 200),
        from: tag.message.author,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: 'high',
        agent: agentId
    };
    
    todos.push(todo);
    fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
    
    return true;
}

/**
 * Wake up an agent immediately
 */
function wakeAgent(agentId, tag) {
    const agent = AGENTS[agentId];
    log(`🚨 WAKING ${agent.name.toUpperCase()} — ${tag.type === 'direct_mention' ? '@mention detected' : 'Trigger word: ' + tag.trigger}`);
    
    // Create wake signal file
    const wakeFile = path.join(MEMORY_DIR, agentId, '.wake-signal');
    const wakeData = {
        timestamp: Date.now(),
        triggeredBy: tag.message.author,
        message: tag.message.content.substring(0, 500),
        type: tag.type,
        priority: 'immediate'
    };
    
    fs.writeFileSync(wakeFile, JSON.stringify(wakeData, null, 2));
    
    // Add to agent's todo list
    const added = addToTodo(agentId, tag);
    
    // Add acknowledgment to chat immediately
    if (added) {
        addAcknowledgmentToChat(agent, tag);
    }
    
    // Queue for immediate heartbeat execution
    queueImmediateHeartbeat(agentId);
    
    return true;
}

/**
 * Add "On it" acknowledgment to chat
 */
function addAcknowledgmentToChat(agent, tag) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const responses = [
        "On it 👍",
        "Got it, looking into this now 🔍",
        "On it! Will report back shortly ⚡",
        "Acknowledged. Working on it 🎯",
        "Roger that. On the case 🚀"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const messageContent = `### ${timestamp} — ${agent.name}
${agent.emoji} **${agent.role}** — Acknowledging tag

> ${response}

---
`;
    
    // Append to AGENT-CHAT.md
    let chatContent = '';
    if (fs.existsSync(CHAT_FILE)) {
        chatContent = fs.readFileSync(CHAT_FILE, 'utf8');
    }
    
    // Insert after the most recent message
    const today = new Date().toISOString().split('T')[0];
    const todayHeader = `## ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    if (!chatContent.includes(todayHeader)) {
        chatContent += `\n${todayHeader}\n\n`;
    }
    
    chatContent += messageContent;
    fs.writeFileSync(CHAT_FILE, chatContent);
    
    log(`✅ Added acknowledgment to chat from ${agent.name}`);
}

/**
 * Queue immediate heartbeat execution
 */
function queueImmediateHeartbeat(agentId) {
    const queueDir = path.join(MISSION_CONTROL, 'queue');
    fs.mkdirSync(queueDir, { recursive: true });
    
    const queueFile = path.join(queueDir, `heartbeat-${agentId}-${Date.now()}.json`);
    const queueData = {
        agent: agentId,
        timestamp: Date.now(),
        type: 'immediate_wake',
        priority: 'high'
    };
    
    fs.writeFileSync(queueFile, JSON.stringify(queueData, null, 2));
}

/**
 * Process the tag queue
 */
function processTagQueue() {
    fs.mkdirSync(path.dirname(TAG_QUEUE_FILE), { recursive: true });
    
    let queue = [];
    if (fs.existsSync(TAG_QUEUE_FILE)) {
        queue = JSON.parse(fs.readFileSync(TAG_QUEUE_FILE, 'utf8'));
    }
    
    // Remove processed items older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    queue = queue.filter(item => item.timestamp > oneHourAgo && !item.processed);
    
    fs.writeFileSync(TAG_QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    return queue;
}

/**
 * Add tag to queue for processing
 */
function addToQueue(tag) {
    fs.mkdirSync(path.dirname(TAG_QUEUE_FILE), { recursive: true });
    
    let queue = [];
    if (fs.existsSync(TAG_QUEUE_FILE)) {
        queue = JSON.parse(fs.readFileSync(TAG_QUEUE_FILE, 'utf8'));
    }
    
    // Check if already in queue
    const exists = queue.some(q => 
        q.agentId === tag.agentId && 
        hashContent(q.message.content) === hashContent(tag.message.content)
    );
    
    if (!exists) {
        queue.push({
            ...tag,
            processed: false,
            queuedAt: Date.now()
        });
        fs.writeFileSync(TAG_QUEUE_FILE, JSON.stringify(queue, null, 2));
    }
}

/**
 * Mark tag as acknowledged in queue
 */
function markAcknowledged(agentId, messageContent) {
    if (!fs.existsSync(TAG_QUEUE_FILE)) {
        return;
    }
    
    const queue = JSON.parse(fs.readFileSync(TAG_QUEUE_FILE, 'utf8'));
    const contentHash = hashContent(messageContent);
    
    for (const item of queue) {
        if (item.agentId === agentId && hashContent(item.message.content) === contentHash) {
            item.acknowledged = true;
            item.acknowledgedAt = Date.now();
        }
    }
    
    fs.writeFileSync(TAG_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/**
 * Check for cross-agent triggers
 * One agent's work can trigger another
 */
function checkCrossAgentTriggers() {
    const triggers = [];
    
    // Check Dexter's research for content opportunities
    const dexterResearch = path.join(MEMORY_DIR, 'dexter', 'research-feed.md');
    if (fs.existsSync(dexterResearch)) {
        const stats = fs.statSync(dexterResearch);
        const age = Date.now() - stats.mtimeMs;
        
        // If research updated in last 2 hours and Blossom hasn't seen it
        if (age < 2 * 60 * 60 * 1000) {
            const blossomTodo = path.join(MEMORY_DIR, 'blossom', 'todo.json');
            let hasSeen = false;
            
            if (fs.existsSync(blossomTodo)) {
                const todos = JSON.parse(fs.readFileSync(blossomTodo, 'utf8'));
                hasSeen = todos.some(t => 
                    t.type === 'research_available' && 
                    t.timestamp > new Date(stats.mtime).toISOString()
                );
            }
            
            if (!hasSeen) {
                triggers.push({
                    from: 'dexter',
                    to: 'blossom',
                    type: 'research_available',
                    message: 'New research available from Dexter'
                });
            }
        }
    }
    
    // Check Blossom's content for outreach opportunities
    const blossomDrafts = path.join(MEMORY_DIR, 'blossom', 'content-drafts.json');
    if (fs.existsSync(blossomDrafts)) {
        const stats = fs.statSync(blossomDrafts);
        const age = Date.now() - stats.mtimeMs;
        
        if (age < 4 * 60 * 60 * 1000) {
            triggers.push({
                from: 'blossom',
                to: 'johnny_bravo',
                type: 'content_available',
                message: 'New case study available from Blossom'
            });
        }
    }
    
    // Check Samurai's deployments for announcements
    const samuraiDeployments = path.join(MEMORY_DIR, 'samurai_jack', 'deployments.json');
    if (fs.existsSync(samuraiDeployments)) {
        const deploys = JSON.parse(fs.readFileSync(samuraiDeployments, 'utf8'));
        const recent = deploys.filter(d => {
            const deployTime = new Date(d.timestamp).getTime();
            return Date.now() - deployTime < 30 * 60 * 1000; // 30 minutes
        });
        
        if (recent.length > 0) {
            triggers.push({
                from: 'samurai_jack',
                to: 'all',
                type: 'new_tool',
                message: `New tool deployed: ${recent[0].name}`
            });
        }
    }
    
    return triggers;
}

/**
 * Process cross-agent triggers
 */
function processCrossAgentTriggers(triggers) {
    for (const trigger of triggers) {
        log(`🔗 Cross-agent trigger: ${trigger.from} → ${trigger.to} (${trigger.type})`);
        
        if (trigger.to === 'all') {
            // Notify all agents
            for (const agentId of Object.keys(AGENTS)) {
                if (agentId !== trigger.from) {
                    addCrossAgentTask(agentId, trigger);
                }
            }
        } else {
            addCrossAgentTask(trigger.to, trigger);
        }
    }
}

/**
 * Add cross-agent task to todo
 */
function addCrossAgentTask(agentId, trigger) {
    const todoFile = path.join(MEMORY_DIR, agentId, 'todo.json');
    fs.mkdirSync(path.dirname(todoFile), { recursive: true });
    
    let todos = [];
    if (fs.existsSync(todoFile)) {
        todos = JSON.parse(fs.readFileSync(todoFile, 'utf8'));
    }
    
    // Check if already exists
    if (todos.some(t => 
        t.type === trigger.type && 
        t.from === trigger.from &&
        Date.now() - new Date(t.timestamp).getTime() < 60 * 60 * 1000
    )) {
        return;
    }
    
    const todo = {
        id: `cross-${Date.now()}`,
        type: trigger.type,
        source: 'cross_agent',
        from: trigger.from,
        message: trigger.message,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: 'medium',
        agent: agentId
    };
    
    todos.push(todo);
    fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
    
    log(`📋 Added cross-agent task for ${AGENTS[agentId].name}: ${trigger.message}`);
}

/**
 * Main function
 */
function main() {
    log('🔔 Agent Wake System Starting...\n');
    
    // Step 1: Detect tags in chat
    const tags = detectTags();
    log(`📊 Detected ${tags.length} tags/mentions`);
    
    // Step 2: Process each tag
    let woken = 0;
    for (const tag of tags) {
        if (!hasAcknowledged(tag.agentId, tag.message.content)) {
            wakeAgent(tag.agentId, tag);
            woken++;
        } else {
            log(`⏭️  ${tag.agent.name} already acknowledged this message`);
        }
    }
    
    // Step 3: Check cross-agent triggers
    const crossTriggers = checkCrossAgentTriggers();
    if (crossTriggers.length > 0) {
        log(`\n🔗 Found ${crossTriggers.length} cross-agent triggers`);
        processCrossAgentTriggers(crossTriggers);
    }
    
    // Step 4: Process queue
    const queue = processTagQueue();
    log(`\n📋 Queue status: ${queue.length} pending items`);
    
    log(`\n✅ Wake system complete — ${woken} agents woken`);
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use in other modules
module.exports = {
    detectTags,
    wakeAgent,
    addToTodo,
    AGENTS,
    checkCrossAgentTriggers
};

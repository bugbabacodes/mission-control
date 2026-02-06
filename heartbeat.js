#!/usr/bin/env node
/**
 * Mission Control — Heartbeat System
 * Based on pbteja1998's Mission Control heartbeat implementation
 * 
 * Each agent wakes up every 15 minutes to check for work
 * Staggered schedule to avoid all agents waking at once
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

// Logger
function log(agent, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${agent.toUpperCase()}] ${message}`);
  
  const logFile = path.join(WORKSPACE, 'logs', `${agent}-heartbeat.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

/**
 * Heartbeat Process for Single Agent
 */
function agentHeartbeat(agentName) {
  log(agentName, '💓 HEARTBEAT STARTING');
  
  try {
    // Step 1: Load context (like Bhanu's system)
    log(agentName, 'Loading context...');
    const workingFile = path.join(WORKSPACE, 'memory', agentName, 'WORKING.md');
    const dailyNotes = path.join(WORKSPACE, 'memory', agentName, `${new Date().toISOString().split('T')[0]}.md`);
    
    let context = '';
    if (fs.existsSync(workingFile)) {
      context += fs.readFileSync(workingFile, 'utf8');
      log(agentName, 'Loaded WORKING.md');
    }
    
    // Step 2: Check for urgent items (like Bhanu's @mentions)
    log(agentName, 'Checking for urgent items...');
    
    // Check for pending chat messages first
    const pendingChats = checkPendingChatMessages(agentName);
    if (pendingChats.length > 0) {
      const chatResult = processChatMessages(agentName, pendingChats);
      if (chatResult && chatResult.notify) {
        sendTelegramNotification(agentName, chatResult.message, chatResult.details);
      }
    }
    
    // Check Mission Control for @mentions
    const mentions = checkForMentions(agentName);
    const assignedTasks = checkAssignedTasks(agentName);
    
    // Step 3: Scan activity feed
    log(agentName, 'Scanning activity feed...');
    const recentActivity = getRecentActivity(agentName);
    
    // Step 4: Take action or stand down
    if (mentions.length > 0 || assignedTasks.length > 0) {
      log(agentName, `Found work: ${mentions.length} mentions, ${assignedTasks.length} tasks`);
      
      // Do the work
      const result = handleWork(agentName, mentions, assignedTasks, recentActivity);
      
      // Send Telegram notification for completed work
      if (result && result.notify) {
        sendTelegramNotification(agentName, result.message, result.details);
      }
      
      log(agentName, '✅ Work completed');
    } else {
      log(agentName, '🟢 Nothing urgent found — HEARTBEAT_OK');
      
      // Still check if there's background work
      const bgResult = handleBackgroundWork(agentName, recentActivity);
      
      // Notify for background work completion
      if (bgResult && bgResult.notify) {
        sendTelegramNotification(agentName, bgResult.message, bgResult.details);
      }
    }
    
    log(agentName, '💓 HEARTBEAT COMPLETE');
    
  } catch (error) {
    log(agentName, `❌ Heartbeat failed: ${error.message}`);
    // Report error to Mission Control
    reportError(agentName, error);
  }
}

/**
 * Check for pending chat messages
 */
function checkPendingChatMessages(agentName) {
  log(agentName, 'Checking for pending chat messages...');
  
  const chatQueueFile = path.join(WORKSPACE, 'database', 'chat-queue.json');
  
  try {
    if (!fs.existsSync(chatQueueFile)) {
      return [];
    }
    
    const chatData = JSON.parse(fs.readFileSync(chatQueueFile, 'utf8'));
    const conversations = chatData.conversations || {};
    
    // Map agent names to IDs
    const agentIdMap = {
      'dexter': 'marie_curie',
      'blossom': 'shakespeare', 
      'samurai_jack': 'turing',
      'johnny_bravo': 'jobs',
      'courage': 'nightingale'
    };
    
    const agentId = agentIdMap[agentName];
    if (!agentId || !conversations[agentId]) {
      return [];
    }
    
    // Get pending messages (from user, not yet responded)
    const pendingMessages = conversations[agentId].filter(m => 
      m.sender === 'user' && m.status === 'pending'
    );
    
    return pendingMessages;
  } catch (err) {
    log(agentName, `Error checking chat: ${err.message}`);
    return [];
  }
}

/**
 * Process and respond to chat messages
 */
function processChatMessages(agentName, pendingMessages) {
  if (pendingMessages.length === 0) return null;
  
  log(agentName, `Processing ${pendingMessages.length} chat message(s)...`);
  
  const chatQueueFile = path.join(WORKSPACE, 'database', 'chat-queue.json');
  const chatData = JSON.parse(fs.readFileSync(chatQueueFile, 'utf8'));
  
  const agentIdMap = {
    'dexter': 'marie_curie',
    'blossom': 'shakespeare',
    'samurai_jack': 'turing', 
    'johnny_bravo': 'jobs',
    'courage': 'nightingale'
  };
  
  const agentId = agentIdMap[agentName];
  
  for (const msg of pendingMessages) {
    // Mark as delivered
    const msgIndex = chatData.conversations[agentId].findIndex(m => m.id === msg.id);
    if (msgIndex !== -1) {
      chatData.conversations[agentId][msgIndex].status = 'delivered';
    }
    
    // Add agent response
    const response = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      sender: 'agent',
      text: generateAgentResponse(agentName, msg.text),
      timestamp: new Date().toISOString(),
      status: 'delivered',
      inReplyTo: msg.id
    };
    
    chatData.conversations[agentId].push(response);
    log(agentName, `Responded to: "${msg.text.slice(0, 50)}..."`);
  }
  
  // Save updated chat data
  fs.writeFileSync(chatQueueFile, JSON.stringify(chatData, null, 2));
  
  return {
    notify: true,
    message: `Responded to ${pendingMessages.length} chat message(s)`,
    details: pendingMessages.map(m => m.text.slice(0, 100)).join(', ')
  };
}

/**
 * Generate contextual agent response
 */
function generateAgentResponse(agentName, userMessage) {
  // Agent-specific response patterns
  const responses = {
    'dexter': [
      `I've analyzed your request: "${userMessage.slice(0, 50)}..." Let me research this and compile findings.`,
      `Interesting question! Based on my research, here's what I found...`,
      `I'll add this to my research queue. Expect a detailed report on my next deep work session.`
    ],
    'blossom': [
      `Great content idea! I'll draft something based on: "${userMessage.slice(0, 50)}..."`,
      `I can create content around this theme. What platform - LinkedIn, Twitter, or blog?`,
      `Added to my content calendar. I'll have a draft ready soon!`
    ],
    'samurai_jack': [
      `Understood. I'll implement this: "${userMessage.slice(0, 50)}..."`,
      `Code review acknowledged. I'll analyze and report back with suggestions.`,
      `On it! I'll deploy this change and verify it's working properly.`
    ],
    'johnny_bravo': [
      `Great lead intel! I'll research "${userMessage.slice(0, 50)}..." and add to our pipeline.`,
      `I'll craft an outreach strategy for this. Stay tuned for the pitch deck!`,
      `Deal analysis in progress. I'll identify the best approach for closing.`
    ],
    'courage': [
      `I'll follow up on this right away: "${userMessage.slice(0, 50)}..."`,
      `Client communication logged. I'll ensure they get a response within 24 hours.`,
      `Care package noted! I'll coordinate the necessary support.`
    ]
  };
  
  const agentResponses = responses[agentName] || [`Message received: "${userMessage.slice(0, 50)}..." I'll process this.`];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

/**
 * Check for @mentions in Mission Control
 */
function checkForMentions(agentName) {
  // This would check the shared database for @mentions
  // For now, simulate checking
  log(agentName, 'Checking Mission Control for @mentions...');
  return []; // TODO: Implement with shared database
}

/**
 * Check for assigned tasks
 */
function checkAssignedTasks(agentName) {
  // This would check the shared task database
  // For now, simulate checking
  log(agentName, 'Checking assigned tasks...');
  return []; // TODO: Implement with shared database
}

/**
 * Get recent activity from Mission Control
 */
function getRecentActivity(agentName) {
  // This would check the activity feed
  // For now, simulate checking
  log(agentName, 'Getting recent activity...');
  return []; // TODO: Implement with shared database
}

/**
 * Handle actual work
 */
function handleWork(agentName, mentions, assignedTasks, recentActivity) {
  log(agentName, 'Handling work...');
  
  // Process mentions
  for (const mention of mentions) {
    log(agentName, `Processing mention: ${mention.content}`);
    // Agent-specific handling
    handleMention(agentName, mention);
  }
  
  // Process assigned tasks
  for (const task of assignedTasks) {
    log(agentName, `Processing task: ${task.title}`);
    // Agent-specific handling
    handleTask(agentName, task);
  }
  
  // Contribute to relevant discussions
  for (const activity of recentActivity) {
    if (isRelevantToAgent(agentName, activity)) {
      log(agentName, `Contributing to: ${activity.message}`);
      contributeToDiscussion(agentName, activity);
    }
  }
}

/**
 * Handle background work
 */
function handleBackgroundWork(agentName, recentActivity) {
  log(agentName, 'Checking for background work...');
  
  // Each agent has specific background responsibilities
  switch (agentName) {
    case 'dexter':
      backgroundResearch(agentName);
      checkAndGenerateAdvice(agentName);
      break;
    case 'blossom':
      backgroundContentPlanning(agentName);
      checkAndGenerateAdvice(agentName);
      break;
    case 'samurai_jack':
      backgroundCodeMaintenance(agentName);
      checkAndGenerateAdvice(agentName);
      break;
    case 'johnny_bravo':
      backgroundLeadResearch(agentName);
      checkAndGenerateAdvice(agentName);
      break;
    case 'courage':
      backgroundClientMonitoring(agentName);
      checkAndGenerateAdvice(agentName);
      break;
  }
}

/**
 * Check if advice generation is needed and generate if so
 */
function checkAndGenerateAdvice(agentName) {
  log(agentName, 'Checking if advice generation needed...');
  
  try {
    const adviceGeneratorPath = path.join(WORKSPACE, 'tools', 'advice-generator.js');
    
    if (fs.existsSync(adviceGeneratorPath)) {
      // Only run advice generation on specific heartbeats to avoid over-generation
      // dexter at :00, blossom at :02, etc. - each agent gets a slot
      const now = new Date();
      const minute = now.getMinutes();
      
      // Map agent to their generation slot
      const generationSlots = {
        dexter: [0, 30],        // :00 and :30
        blossom: [2, 32],       // :02 and :32
        samurai_jack: [4, 34],  // :04 and :34
        johnny_bravo: [6, 36],  // :06 and :36
        courage: [8, 38]        // :08 and :38
      };
      
      const slots = generationSlots[agentName] || [];
      
      if (slots.includes(minute)) {
        log(agentName, 'Running advice generation...');
        const result = execSync(`node ${adviceGeneratorPath} generate`, { 
          encoding: 'utf8',
          cwd: WORKSPACE
        });
        log(agentName, 'Advice generation completed');
        
        // Check if any new advice was generated for notification
        const adviceFile = path.join(WORKSPACE, 'database', 'advice.json');
        if (fs.existsSync(adviceFile)) {
          const advice = JSON.parse(fs.readFileSync(adviceFile, 'utf8'));
          const recentAdvice = advice.filter(a => {
            const created = new Date(a.created_at);
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
            return created > fiveMinutesAgo && a.agent === agentName && a.status === 'active';
          });
          
          if (recentAdvice.length > 0) {
            const latest = recentAdvice[0];
            return {
              notify: true,
              message: `🧠 New advice: "${latest.advice.substring(0, 80)}..."`,
              details: { priority: latest.priority, category: latest.category }
            };
          }
        }
      }
    }
  } catch (error) {
    log(agentName, `Advice generation error: ${error.message}`);
  }
  
  return null;
}

/**
 * Agent-specific background work
 */
function backgroundResearch(agentName) {
  log(agentName, 'Running background research...');
  // Dexter's background research tasks
  // This would check for new competitors, trends, etc.
}

function backgroundContentPlanning(agentName) {
  log(agentName, 'Running background content planning...');
  // Blossom's background content tasks
  // This would plan upcoming content, check trends, etc.
}

function backgroundCodeMaintenance(agentName) {
  log(agentName, 'Running background code maintenance...');
  // Samurai Jack's background code tasks
  // This would check for updates, run tests, etc.
}

function backgroundLeadResearch(agentName) {
  log(agentName, 'Running background lead research...');
  // Johnny Bravo's background lead research
  // This would research new prospects, update CRM, etc.
}

function backgroundClientMonitoring(agentName) {
  log(agentName, 'Running background client monitoring...');
  // Courage's background client monitoring
  // This would check emails, monitor systems, etc.
}

/**
 * Handle specific mention
 */
function handleMention(agentName, mention) {
  log(agentName, `Handling mention: ${mention.content}`);
  // Agent-specific mention handling
  // This would process the mention and take appropriate action
}

/**
 * Handle specific task
 */
function handleTask(agentName, task) {
  log(agentName, `Handling task: ${task.title}`);
  // Agent-specific task handling
  // This would process the task based on agent specialty
}

/**
 * Contribute to relevant discussion
 */
function contributeToDiscussion(agentName, activity) {
  log(agentName, `Contributing to discussion: ${activity.message}`);
  // Agent-specific contribution
  // This would add relevant insights to the discussion
}

/**
 * Check if activity is relevant to agent
 */
function isRelevantToAgent(agentName, activity) {
  // Agent-specific relevance checking
  // This would determine if the activity is relevant to this agent's expertise
  return true; // Simplified for now
}

/**
 * Report error to Mission Control
 */
function reportError(agentName, error) {
  log(agentName, `Reporting error to Mission Control: ${error.message}`);
  // This would report the error to the shared system
  // For now, just log it
}

/**
 * Send Telegram notification for important agent activity
 */
function sendTelegramNotification(agentName, message, details = {}) {
  const TELEGRAM_USER_ID = '824597116';
  const timestamp = new Date().toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Calcutta'
  });
  
  // Agent emojis
  const agentEmojis = {
    dexter: '🧪',
    blossom: '🌸',
    samurai_jack: '⚔️',
    johnny_bravo: '🕶️',
    courage: '🐾'
  };
  
  const emoji = agentEmojis[agentName] || '🤖';
  const agentDisplay = agentName.replace('_', ' ').toUpperCase();
  
  // Write notification to a file that can be picked up by the cron system
  const notification = {
    target: TELEGRAM_USER_ID,
    message: `${emoji} **${agentDisplay}** — ${timestamp}\n\n${message}`,
    timestamp: new Date().toISOString(),
    agent: agentName
  };
  
  // Save to notifications queue
  const notificationsDir = path.join(WORKSPACE, 'notifications');
  fs.mkdirSync(notificationsDir, { recursive: true });
  
  const notificationFile = path.join(notificationsDir, `${Date.now()}-${agentName}.json`);
  fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));
  
  log(agentName, `📱 Telegram notification queued: ${message.substring(0, 50)}...`);
}

// Main execution
if (require.main === module) {
  const agentName = process.argv[2] || 'dexter';
  
  if (!AGENTS.includes(agentName)) {
    console.error(`Unknown agent: ${agentName}`);
    console.error(`Available agents: ${AGENTS.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`\n🚀 ${agentName.toUpperCase()} HEARTBEAT STARTING...\n`);
  agentHeartbeat(agentName);
  console.log(`\n✅ ${agentName.toUpperCase()} HEARTBEAT COMPLETE\n`);
}

module.exports = { agentHeartbeat, AGENTS, HEARTBEAT_SCHEDULE };
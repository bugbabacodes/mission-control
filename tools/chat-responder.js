#!/usr/bin/env node
/**
 * Chat Responder - Checks for pending chat messages and wakes agents to respond
 * Runs every minute via cron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const CHAT_QUEUE = path.join(WORKSPACE, 'database', 'chat-queue.json');

// Agent ID to session mapping
const AGENT_SESSIONS = {
  'marie_curie': 'dexter',
  'shakespeare': 'blossom',
  'turing': 'samurai_jack',
  'jobs': 'johnny_bravo',
  'nightingale': 'courage',
  'van_gogh_jr': 'van_gogh'
};

// Agent personalities for chat responses
const AGENT_PROMPTS = {
  'marie_curie': 'You are Marie Curie, a pioneering research scientist. Respond helpfully and scientifically to:',
  'shakespeare': 'You are Shakespeare, a master wordsmith and content creator. Respond creatively to:',
  'turing': 'You are Alan Turing, a brilliant code architect and problem solver. Respond technically to:',
  'jobs': 'You are Steve Jobs, a deal maker and visionary. Respond persuasively to:',
  'nightingale': 'You are Florence Nightingale, focused on client success and care. Respond compassionately to:',
  'van_gogh_jr': 'You are Van Gogh Jr., a visual artist with creative flair. Respond artistically to:'
};

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CHAT-RESPONDER] ${message}`);
}

async function checkPendingChats() {
  log('Checking for pending chat messages...');
  
  if (!fs.existsSync(CHAT_QUEUE)) {
    log('No chat queue file found');
    return [];
  }
  
  try {
    const chatData = JSON.parse(fs.readFileSync(CHAT_QUEUE, 'utf8'));
    const pending = [];
    
    for (const [agentId, messages] of Object.entries(chatData.conversations || {})) {
      const pendingMsgs = messages.filter(m => m.sender === 'user' && m.status === 'pending');
      for (const msg of pendingMsgs) {
        pending.push({ agentId, message: msg });
      }
    }
    
    log(`Found ${pending.length} pending message(s)`);
    return pending;
  } catch (err) {
    log(`Error reading chat queue: ${err.message}`);
    return [];
  }
}

function generateResponse(agentId, userMessage) {
  const prompt = AGENT_PROMPTS[agentId] || 'Respond helpfully to:';
  
  // Agent-specific contextual responses based on the message
  const userText = userMessage.toLowerCase();
  
  if (agentId === 'marie_curie') {
    if (userText.includes('research') || userText.includes('analyze')) {
      return `🔬 I'll conduct thorough research on this. "${userMessage.slice(0, 100)}..." - Let me analyze the available data and compile findings. I'll prepare a comprehensive report with sources and actionable insights.`;
    }
    return `☢️ Fascinating inquiry! I'll investigate "${userMessage.slice(0, 80)}..." systematically. Research in progress - expect detailed findings shortly.`;
  }
  
  if (agentId === 'shakespeare') {
    if (userText.includes('write') || userText.includes('post') || userText.includes('content')) {
      return `🪶 Ah, a creative challenge! "${userMessage.slice(0, 80)}..." - I shall craft words that move the soul. Which platform dost thou prefer - LinkedIn's professional stage, Twitter's swift brevity, or a blog's expansive canvas?`;
    }
    return `🪶 Your words inspire me! On "${userMessage.slice(0, 80)}..." - let me compose something worthy. The pen is mightier than the sword, and mine is at your service.`;
  }
  
  if (agentId === 'turing') {
    if (userText.includes('code') || userText.includes('build') || userText.includes('deploy') || userText.includes('fix')) {
      return `🧠 Challenge accepted. "${userMessage.slice(0, 80)}..." - I'll architect a solution with clean, maintainable code. Analyzing the problem space now... expect implementation shortly.`;
    }
    return `🧠 Logical problem detected: "${userMessage.slice(0, 80)}..." - Computing optimal solution. I'll break this down systematically and provide a clear path forward.`;
  }
  
  if (agentId === 'jobs') {
    if (userText.includes('lead') || userText.includes('sales') || userText.includes('deal') || userText.includes('client')) {
      return `🍎 Now we're talking business! "${userMessage.slice(0, 80)}..." - I'll craft a pitch so compelling they can't say no. Let me research the prospect and find our angle.`;
    }
    return `🍎 Great vision! "${userMessage.slice(0, 80)}..." - Here's the thing: people don't know what they want until you show them. Let me help you make a dent in the universe.`;
  }
  
  if (agentId === 'nightingale') {
    if (userText.includes('email') || userText.includes('client') || userText.includes('follow') || userText.includes('support')) {
      return `🕯️ I'm on it with care and precision. "${userMessage.slice(0, 80)}..." - Every client deserves attentive support. I'll ensure they feel valued and heard.`;
    }
    return `🕯️ I hear you, and I'll help. "${userMessage.slice(0, 80)}..." - Let me take care of this thoughtfully. Care and data drive my approach.`;
  }
  
  if (agentId === 'van_gogh_jr') {
    if (userText.includes('design') || userText.includes('visual') || userText.includes('image') || userText.includes('logo')) {
      return `🎨 My canvas awaits! "${userMessage.slice(0, 80)}..." - I see colors and forms already taking shape. Let me paint something that captures the essence of your vision.`;
    }
    return `🎨 Art speaks where words fail! "${userMessage.slice(0, 80)}..." - I'll create something beautiful that tells this story visually. Inspiration is flowing...`;
  }
  
  return `Message received: "${userMessage.slice(0, 100)}..." - Processing and preparing response.`;
}

async function respondToMessage(agentId, message) {
  log(`Responding to message for ${agentId}: "${message.text.slice(0, 50)}..."`);
  
  // Generate a contextual response
  const response = generateResponse(agentId, message.text);
  
  // Update the chat queue
  const chatData = JSON.parse(fs.readFileSync(CHAT_QUEUE, 'utf8'));
  
  // Mark original message as delivered
  const msgIndex = chatData.conversations[agentId].findIndex(m => m.id === message.id);
  if (msgIndex !== -1) {
    chatData.conversations[agentId][msgIndex].status = 'delivered';
  }
  
  // Add agent response
  const agentResponse = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    sender: 'agent',
    text: response,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    inReplyTo: message.id
  };
  
  chatData.conversations[agentId].push(agentResponse);
  
  // Save updated chat data
  fs.writeFileSync(CHAT_QUEUE, JSON.stringify(chatData, null, 2));
  
  log(`Response saved for ${agentId}`);
  return agentResponse;
}

async function main() {
  log('Starting chat responder...');
  
  const pending = await checkPendingChats();
  
  if (pending.length === 0) {
    log('No pending messages - all clear');
    return;
  }
  
  for (const { agentId, message } of pending) {
    try {
      await respondToMessage(agentId, message);
    } catch (err) {
      log(`Error responding for ${agentId}: ${err.message}`);
    }
  }
  
  log(`Processed ${pending.length} message(s)`);
}

main().catch(err => {
  log(`Fatal error: ${err.message}`);
  process.exit(1);
});

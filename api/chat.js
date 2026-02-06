// /api/chat - Async chat queue for agent messages
// POST: Send message to agent (queued for next heartbeat)
// GET: Fetch conversation history

const fs = require('fs');
const path = require('path');

// In-memory storage for Vercel (stateless functions)
// For persistence, we'd need a database like Supabase
let chatStore = {
  conversations: {}
};

// Agent name mapping
const AGENT_NAMES = {
  'marie_curie': 'Marie Curie ☢️',
  'shakespeare': 'Shakespeare 🪶', 
  'turing': 'Turing 🧠',
  'jobs': 'Jobs 🍎',
  'nightingale': 'Nightingale 🕯️',
  'van_gogh_jr': 'Van Gogh Jr. 🎨'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const agentId = req.query?.agentId || req.body?.agentId;

  // GET - Fetch conversation history
  if (req.method === 'GET') {
    if (!agentId) {
      return res.status(400).json({ error: 'Missing agentId parameter' });
    }

    const conversation = chatStore.conversations[agentId] || [];
    
    return res.status(200).json({
      agentId,
      agentName: AGENT_NAMES[agentId] || agentId,
      messages: conversation,
      pendingCount: conversation.filter(m => m.status === 'pending').length,
      timestamp: new Date().toISOString()
    });
  }

  // POST - Send message to agent
  if (req.method === 'POST') {
    const { text, sender = 'user' } = req.body || {};

    if (!agentId || !text) {
      return res.status(400).json({ error: 'Missing agentId or text' });
    }

    // Initialize conversation if needed
    if (!chatStore.conversations[agentId]) {
      chatStore.conversations[agentId] = [];
    }

    // Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      sender,
      text,
      timestamp: new Date().toISOString(),
      status: sender === 'user' ? 'pending' : 'delivered'
    };

    // Add to conversation
    chatStore.conversations[agentId].push(message);

    // Keep only last 50 messages per conversation
    if (chatStore.conversations[agentId].length > 50) {
      chatStore.conversations[agentId] = chatStore.conversations[agentId].slice(-50);
    }

    // If it's a user message, queue an auto-response explaining async nature
    if (sender === 'user') {
      const agentName = AGENT_NAMES[agentId] || agentId;
      
      // Add a "queued" acknowledgment
      const ackMessage = {
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).slice(2, 8)}`,
        agentId,
        sender: 'system',
        text: `📨 Message sent to ${agentName}. Response coming in ~30 seconds.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      chatStore.conversations[agentId].push(ackMessage);
    }

    return res.status(200).json({
      success: true,
      message,
      queuePosition: chatStore.conversations[agentId].filter(m => m.status === 'pending').length,
      nextHeartbeat: '~30 seconds',
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

// Export for direct Node.js usage (heartbeat script)
module.exports.chatStore = chatStore;
module.exports.AGENT_NAMES = AGENT_NAMES;

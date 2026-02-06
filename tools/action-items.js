/**
 * Action Items Manager
 * 
 * CRUD operations for agent action items - escalations that need user input
 * Data stored in: mission-control/database/action-items.json
 * 
 * Usage:
 *   const actionItems = require('./action-items.js');
 *   actionItems.create({ agent: 'dexter', type: 'clarification', title: '...', ... });
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'database', 'action-items.json');

// Generate a unique ID
function generateId() {
  return 'ai-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

// Ensure data file exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      actionItems: [],
      metadata: {
        total_count: 0,
        pending_count: 0,
        resolved_count: 0,
        last_updated: new Date().toISOString()
      }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read all action items
function readData() {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Write action items data
function writeData(data) {
  // Update metadata
  data.metadata.total_count = data.actionItems.length;
  data.metadata.pending_count = data.actionItems.filter(ai => ai.status === 'pending' || ai.status === 'in_progress').length;
  data.metadata.resolved_count = data.actionItems.filter(ai => ai.status === 'resolved').length;
  data.metadata.last_updated = new Date().toISOString();
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Create a new action item
 * @param {Object} item - Action item data
 * @param {string} item.agent - Agent name (dexter|blossom|samurai|johnny|courage)
 * @param {string} item.type - Type (clarification|approval|decision|review)
 * @param {string} item.title - Short description
 * @param {string} item.description - Full context
 * @param {string} item.priority - Priority (urgent|high|medium|low)
 * @param {string[]} item.context_links - Related file paths
 * @returns {Object} Created action item with ID
 */
function create(item) {
  const data = readData();
  
  const newItem = {
    id: generateId(),
    agent: item.agent || 'unknown',
    type: item.type || 'clarification',
    title: item.title || 'New action item',
    description: item.description || '',
    priority: item.priority || 'medium',
    created_at: new Date().toISOString(),
    status: 'pending',
    context_links: item.context_links || [],
    user_response: null,
    resolved_at: null
  };
  
  data.actionItems.unshift(newItem); // Add to beginning
  writeData(data);
  
  // Notify user (if Telegram is configured)
  notifyUser(newItem);
  
  console.log(`[ActionItems] Created: ${newItem.id} - ${newItem.title}`);
  return newItem;
}

/**
 * Get all action items (optionally filtered)
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.agent - Filter by agent
 * @param {string} filters.priority - Filter by priority
 * @returns {Object[]} Array of action items
 */
function getAll(filters = {}) {
  const data = readData();
  let items = data.actionItems;
  
  if (filters.status) {
    items = items.filter(item => item.status === filters.status);
  }
  if (filters.agent) {
    items = items.filter(item => item.agent === filters.agent);
  }
  if (filters.priority) {
    items = items.filter(item => item.priority === filters.priority);
  }
  
  return items;
}

/**
 * Get a single action item by ID
 * @param {string} id - Action item ID
 * @returns {Object|null} Action item or null if not found
 */
function getById(id) {
  const data = readData();
  return data.actionItems.find(item => item.id === id) || null;
}

/**
 * Get the next pending action item (for dashboard focus mode)
 * @returns {Object|null} Next pending action item or null
 */
function getNextPending() {
  const data = readData();
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  
  return data.actionItems
    .filter(item => item.status === 'pending' || item.status === 'in_progress')
    .sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by creation date (oldest first)
      return new Date(a.created_at) - new Date(b.created_at);
    })[0] || null;
}

/**
 * Update an action item
 * @param {string} id - Action item ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated action item or null
 */
function update(id, updates) {
  const data = readData();
  const index = data.actionItems.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  data.actionItems[index] = {
    ...data.actionItems[index],
    ...updates,
    id: data.actionItems[index].id // Prevent ID change
  };
  
  writeData(data);
  console.log(`[ActionItems] Updated: ${id}`);
  return data.actionItems[index];
}

/**
 * Mark an action item as resolved
 * @param {string} id - Action item ID
 * @param {string} response - User's response/answer
 * @returns {Object|null} Resolved action item or null
 */
function resolve(id, response) {
  const data = readData();
  const index = data.actionItems.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  data.actionItems[index].status = 'resolved';
  data.actionItems[index].user_response = response;
  data.actionItems[index].resolved_at = new Date().toISOString();
  
  writeData(data);
  console.log(`[ActionItems] Resolved: ${id}`);
  
  // Notify agent that their request was answered
  notifyAgentResolved(data.actionItems[index]);
  
  return data.actionItems[index];
}

/**
 * Mark an action item as in_progress
 * @param {string} id - Action item ID
 * @returns {Object|null} Updated action item or null
 */
function markInProgress(id) {
  return update(id, { status: 'in_progress' });
}

/**
 * Send action item back to agent with "need more info" status
 * @param {string} id - Action item ID
 * @param {string} feedback - Feedback for the agent
 * @returns {Object|null} Updated action item or null
 */
function sendBackToAgent(id, feedback) {
  const data = readData();
  const index = data.actionItems.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  data.actionItems[index].status = 'pending';
  data.actionItems[index].agent_feedback = feedback;
  
  writeData(data);
  console.log(`[ActionItems] Sent back to agent: ${id}`);
  
  // Notify agent they need to provide more info
  notifyAgentMoreInfo(data.actionItems[index]);
  
  return data.actionItems[index];
}

/**
 * Delete an action item
 * @param {string} id - Action item ID
 * @returns {boolean} True if deleted
 */
function remove(id) {
  const data = readData();
  const initialLength = data.actionItems.length;
  data.actionItems = data.actionItems.filter(item => item.id !== id);
  
  if (data.actionItems.length < initialLength) {
    writeData(data);
    console.log(`[ActionItems] Deleted: ${id}`);
    return true;
  }
  return false;
}

/**
 * Get statistics about action items
 * @returns {Object} Statistics
 */
function getStats() {
  const data = readData();
  const items = data.actionItems;
  
  return {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    resolved: items.filter(i => i.status === 'resolved').length,
    by_agent: {
      dexter: items.filter(i => i.agent === 'dexter' && i.status !== 'resolved').length,
      blossom: items.filter(i => i.agent === 'blossom' && i.status !== 'resolved').length,
      samurai: items.filter(i => i.agent === 'samurai' && i.status !== 'resolved').length,
      johnny: items.filter(i => i.agent === 'johnny' && i.status !== 'resolved').length,
      courage: items.filter(i => i.agent === 'courage' && i.status !== 'resolved').length
    },
    by_priority: {
      urgent: items.filter(i => i.priority === 'urgent' && i.status !== 'resolved').length,
      high: items.filter(i => i.priority === 'high' && i.status !== 'resolved').length,
      medium: items.filter(i => i.priority === 'medium' && i.status !== 'resolved').length,
      low: items.filter(i => i.priority === 'low' && i.status !== 'resolved').length
    }
  };
}

// Agent emoji mapping
const AGENT_EMOJIS = {
  dexter: '🧪',
  blossom: '🌸',
  samurai: '⚔️',
  johnny: '🕶️',
  courage: '🐾'
};

// Agent display names
const AGENT_NAMES = {
  dexter: 'Dexter',
  blossom: 'Blossom',
  samurai: 'Samurai Jack',
  johnny: 'Johnny Bravo',
  courage: 'Courage'
};

/**
 * Notify user via Telegram about new action item
 * @param {Object} item - Action item
 */
function notifyUser(item) {
  try {
    const notifierPath = path.join(__dirname, 'telegram-notifier.js');
    if (fs.existsSync(notifierPath)) {
      const notifier = require(notifierPath);
      const emoji = AGENT_EMOJIS[item.agent] || '🤖';
      const agentName = AGENT_NAMES[item.agent] || item.agent;
      
      const priorityEmoji = {
        urgent: '🚨',
        high: '⚠️',
        medium: 'ℹ️',
        low: '💬'
      }[item.priority] || 'ℹ️';
      
      notifier.send({
        type: 'action_item',
        title: `${priorityEmoji} ${emoji} ${agentName} needs you`,
        message: item.title,
        data: {
          action_item_id: item.id,
          priority: item.priority,
          type: item.type
        }
      });
    }
  } catch (err) {
    console.log('[ActionItems] Telegram notification failed:', err.message);
  }
}

/**
 * Notify agent that their request was resolved
 * @param {Object} item - Resolved action item
 */
function notifyAgentResolved(item) {
  // This would be integrated with the agent chat system
  // For now, we just log it
  console.log(`[ActionItems] Would notify ${item.agent} that request ${item.id} is resolved`);
  
  // Append to agent chat log
  try {
    const chatPath = path.join(__dirname, '..', 'AGENT-CHAT.md');
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const emoji = AGENT_EMOJIS[item.agent] || '🤖';
    const agentName = AGENT_NAMES[item.agent] || item.agent;
    
    const message = `\n### ${timestamp} — Action Items System\n📬 **Action Item Resolved** — @${agentName}\n\n> Your request "${item.title}" has been resolved by Ishan.\n\n**Response:** ${item.user_response || 'Approved'}\n\n**Status:** ✅ Resolved\n\n---\n`;
    
    fs.appendFileSync(chatPath, message);
  } catch (err) {
    console.log('[ActionItems] Could not append to chat log:', err.message);
  }
}

/**
 * Notify agent they need to provide more info
 * @param {Object} item - Action item
 */
function notifyAgentMoreInfo(item) {
  console.log(`[ActionItems] Would notify ${item.agent} that more info is needed for ${item.id}`);
  
  // Append to agent chat log
  try {
    const chatPath = path.join(__dirname, '..', 'AGENT-CHAT.md');
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const emoji = AGENT_EMOJIS[item.agent] || '🤖';
    const agentName = AGENT_NAMES[item.agent] || item.agent;
    
    const message = `\n### ${timestamp} — Action Items System\n🔄 **More Info Needed** — @${agentName}\n\n> Your request "${item.title}" needs clarification.\n\n**Feedback from Ishan:** ${item.agent_feedback || 'Please provide more details'}\n\n**Status:** 🔄 Awaiting your response\n\n---\n`;
    
    fs.appendFileSync(chatPath, message);
  } catch (err) {
    console.log('[ActionItems] Could not append to chat log:', err.message);
  }
}

// Export all functions
module.exports = {
  create,
  getAll,
  getById,
  getNextPending,
  update,
  resolve,
  markInProgress,
  sendBackToAgent,
  remove,
  getStats,
  AGENT_EMOJIS,
  AGENT_NAMES
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const newItem = create({
        agent: args[1] || 'dexter',
        type: args[2] || 'clarification',
        title: args[3] || 'Test action item',
        description: args[4] || 'This is a test',
        priority: args[5] || 'medium'
      });
      console.log('Created:', newItem);
      break;
      
    case 'list':
      const items = getAll({ status: args[1] });
      console.log('Action Items:', JSON.stringify(items, null, 2));
      break;
      
    case 'stats':
      console.log('Statistics:', getStats());
      break;
      
    case 'resolve':
      const resolved = resolve(args[1], args[2] || 'Approved');
      console.log('Resolved:', resolved);
      break;
      
    default:
      console.log(`
Action Items Manager CLI

Usage:
  node action-items.js create <agent> <type> <title> <description> <priority>
  node action-items.js list [status]
  node action-items.js stats
  node action-items.js resolve <id> [response]

Examples:
  node action-items.js create dexter clarification "Test title" "Test description" high
  node action-items.js list pending
  node action-items.js resolve ai-abc123 "Use option B"
      `);
  }
}
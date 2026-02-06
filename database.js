/**
 * Mission Control — Shared Database System v2.0
 * 
 * Integrated with optimized heartbeat system:
 * - Auto-activates agents when tasks are assigned
 * - Auto-deactivates agents when tasks are completed
 * - Tracks agent state for smart heartbeat scheduling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const DB_PATH = path.join(WORKSPACE, 'database');

// Ensure database directory exists
fs.mkdirSync(DB_PATH, { recursive: true });

// Initialize database files if they don't exist
function initializeDatabase() {
  const files = ['agents.json', 'tasks.json', 'messages.json', 'activities.json', 'documents.json', 'notifications.json', 'active-agents.json'];
  
  files.forEach(file => {
    const filePath = path.join(DB_PATH, file);
    if (!fs.existsSync(filePath)) {
      if (file === 'active-agents.json') {
        fs.writeFileSync(filePath, JSON.stringify({ activeAgents: [], lastUpdated: new Date().toISOString() }, null, 2));
      } else {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }
    }
  });
}

/**
 * Helper: Activate agent for heartbeat
 */
function activateAgentHeartbeat(agentId) {
  try {
    const result = execSync(`cd ${WORKSPACE} && node heartbeat-optimized.js activate ${agentId}`, {
      encoding: 'utf8',
      timeout: 5000
    });
    return true;
  } catch (e) {
    // Silent fail - agent might already be active
    return false;
  }
}

/**
 * Helper: Deactivate agent heartbeat
 */
function deactivateAgentHeartbeat(agentId) {
  try {
    const result = execSync(`cd ${WORKSPACE} && node heartbeat-optimized.js deactivate ${agentId}`, {
      encoding: 'utf8',
      timeout: 5000
    });
    return true;
  } catch (e) {
    // Silent fail
    return false;
  }
}

/**
 * Helper: Check if agent has any active tasks
 */
function hasActiveTasks(agentId) {
  try {
    const tasks = JSON.parse(fs.readFileSync(path.join(DB_PATH, 'tasks.json'), 'utf8'));
    const activeStatuses = ['in_progress', 'inbox', 'review', 'blocked'];
    
    return tasks.some(task => 
      task.assignee_ids && 
      task.assignee_ids.includes(agentId) &&
      activeStatuses.includes(task.status)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Mission Control Database Operations
 */
class MissionControl {
  constructor() {
    initializeDatabase();
  }
  
  // Agents
  getAgents() {
    return JSON.parse(fs.readFileSync(path.join(DB_PATH, 'agents.json'), 'utf8'));
  }
  
  updateAgent(agentId, updates) {
    const agents = this.getAgents();
    const index = agents.findIndex(a => a.id === agentId);
    
    if (index !== -1) {
      agents[index] = { ...agents[index], ...updates, updated_at: new Date().toISOString() };
      fs.writeFileSync(path.join(DB_PATH, 'agents.json'), JSON.stringify(agents, null, 2));
      this.logActivity('agent_status_changed', agentId, `Agent ${agentId} status updated to ${updates.status}`);
      return agents[index];
    }
    return null;
  }
  
  // Tasks
  getTasks() {
    return JSON.parse(fs.readFileSync(path.join(DB_PATH, 'tasks.json'), 'utf8'));
  }
  
  createTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: task.title,
      description: task.description,
      status: task.status || 'inbox',
      assignee_ids: task.assignee_ids || [],
      priority: task.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: task.due_date || null,
      tags: task.tags || []
    };
    
    tasks.push(newTask);
    fs.writeFileSync(path.join(DB_PATH, 'tasks.json'), JSON.stringify(tasks, null, 2));
    
    // OPTIMIZATION: Activate heartbeat for assigned agents
    newTask.assignee_ids.forEach(agentId => {
      activateAgentHeartbeat(agentId);
      this.logActivity('agent_activated', agentId, `Heartbeat activated: task assigned`);
    });
    
    this.logActivity('task_created', task.assignee_ids[0] || 'system', `Task created: ${task.title}`);
    
    return newTask;
  }
  
  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      const oldTask = tasks[index];
      const oldAssignees = oldTask.assignee_ids || [];
      const newAssignees = updates.assignee_ids || oldAssignees;
      
      tasks[index] = { ...oldTask, ...updates, updated_at: new Date().toISOString() };
      fs.writeFileSync(path.join(DB_PATH, 'tasks.json'), JSON.stringify(tasks, null, 2));
      
      // OPTIMIZATION: Handle agent activation/deactivation based on task changes
      
      // Activate new assignees
      newAssignees.forEach(agentId => {
        if (!oldAssignees.includes(agentId)) {
          activateAgentHeartbeat(agentId);
          this.logActivity('agent_activated', agentId, `Heartbeat activated: assigned to task`);
        }
      });
      
      // Check if old assignees still have work
      oldAssignees.forEach(agentId => {
        if (!newAssignees.includes(agentId) && !hasActiveTasks(agentId)) {
          deactivateAgentHeartbeat(agentId);
          this.logActivity('agent_deactivated', agentId, `Heartbeat deactivated: no active tasks`);
        }
      });
      
      // Check if task was completed
      if (updates.status === 'done' && oldTask.status !== 'done') {
        oldAssignees.forEach(agentId => {
          if (!hasActiveTasks(agentId)) {
            deactivateAgentHeartbeat(agentId);
            this.logActivity('agent_deactivated', agentId, `Heartbeat deactivated: task completed`);
          }
        });
      }
      
      // Check if task was reactivated
      if ((updates.status === 'in_progress' || updates.status === 'inbox') && 
          (oldTask.status === 'done' || oldTask.status === 'cancelled')) {
        newAssignees.forEach(agentId => {
          activateAgentHeartbeat(agentId);
          this.logActivity('agent_activated', agentId, `Heartbeat activated: task reactivated`);
        });
      }
      
      this.logActivity('task_updated', updates.assignee_ids?.[0] || oldTask.assignee_ids[0], `Task updated: ${tasks[index].title}`);
      return tasks[index];
    }
    return null;
  }
  
  // Messages (Comments/Updates)
  getMessages() {
    return JSON.parse(fs.readFileSync(path.join(DB_PATH, 'messages.json'), 'utf8'));
  }
  
  createMessage(message) {
    const messages = this.getMessages();
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      task_id: message.task_id,
      from_agent_id: message.from_agent_id,
      content: message.content,
      attachments: message.attachments || [],
      timestamp: new Date().toISOString(),
      type: message.type || 'comment'
    };
    
    messages.push(newMessage);
    fs.writeFileSync(path.join(DB_PATH, 'messages.json'), JSON.stringify(messages, null, 2));
    
    // OPTIMIZATION: Activate agents mentioned in message
    const mentions = extractMentions(message.content);
    mentions.forEach(agentId => {
      activateAgentHeartbeat(agentId);
    });
    
    // Create notification for @mentions
    if (message.content.includes('@')) {
      this.createNotificationForMentions(newMessage);
    }
    
    this.logActivity('message_sent', message.from_agent_id, `Message: ${message.content.substring(0, 100)}...`);
    return newMessage;
  }
  
  // Activities (Activity Feed)
  getActivities(limit = 50) {
    const activities = JSON.parse(fs.readFileSync(path.join(DB_PATH, 'activities.json'), 'utf8'));
    return activities.slice(-limit); // Return most recent
  }
  
  logActivity(type, agentId, message, metadata = {}) {
    const activities = this.getActivities(1000); // Get all to append
    const newActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      agent_id: agentId,
      message: message,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };
    
    activities.push(newActivity);
    
    // Keep only last 1000 activities to prevent file bloat
    const trimmed = activities.slice(-1000);
    fs.writeFileSync(path.join(DB_PATH, 'activities.json'), JSON.stringify(trimmed, null, 2));
    
    return newActivity;
  }
  
  // Documents
  getDocuments() {
    return JSON.parse(fs.readFileSync(path.join(DB_PATH, 'documents.json'), 'utf8'));
  }
  
  createDocument(document) {
    const documents = this.getDocuments();
    const newDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: document.title,
      content: document.content,
      type: document.type || 'note',
      task_id: document.task_id || null,
      agent_id: document.agent_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    documents.push(newDocument);
    fs.writeFileSync(path.join(DB_PATH, 'documents.json'), JSON.stringify(documents, null, 2));
    this.logActivity('document_created', document.agent_id, `Document created: ${document.title}`);
    
    return newDocument;
  }
  
  // Notifications
  getNotifications() {
    return JSON.parse(fs.readFileSync(path.join(DB_PATH, 'notifications.json'), 'utf8'));
  }
  
  createNotificationForMentions(message) {
    const mentions = extractMentions(message.content);
    
    for (const mention of mentions) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mentioned_agent_id: mention,
        content: message.content,
        delivered: false,
        created_at: new Date().toISOString()
      };
      
      const notifications = this.getNotifications();
      notifications.push(notification);
      fs.writeFileSync(path.join(DB_PATH, 'notifications.json'), JSON.stringify(notifications, null, 2));
      
      // OPTIMIZATION: Activate agent for notification
      activateAgentHeartbeat(mention);
    }
  }
  
  markNotificationDelivered(notificationId) {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      notifications[index].delivered = true;
      fs.writeFileSync(path.join(DB_PATH, 'notifications.json'), JSON.stringify(notifications, null, 2));
      
      // OPTIMIZATION: Check if agent still has work
      const agentId = notifications[index].mentioned_agent_id;
      if (!hasActiveTasks(agentId)) {
        // Check for other pending notifications
        const hasOtherNotifications = notifications.some(n => 
          n.mentioned_agent_id === agentId && 
          !n.delivered && 
          n.id !== notificationId
        );
        
        if (!hasOtherNotifications) {
          deactivateAgentHeartbeat(agentId);
          this.logActivity('agent_deactivated', agentId, 'Heartbeat deactivated: no pending notifications');
        }
      }
      
      return true;
    }
    return false;
  }
  
  // Active Agents (for optimized heartbeat)
  getActiveAgents() {
    const data = JSON.parse(fs.readFileSync(path.join(DB_PATH, 'active-agents.json'), 'utf8'));
    return new Set(data.activeAgents || []);
  }
  
  setActiveAgents(activeAgents) {
    fs.writeFileSync(path.join(DB_PATH, 'active-agents.json'), JSON.stringify({
      activeAgents: Array.from(activeAgents),
      lastUpdated: new Date().toISOString()
    }, null, 2));
  }
  
  // Daily Standup
  generateDailyStandup() {
    const agents = this.getAgents();
    const tasks = this.getTasks();
    const activities = this.getActivities(50); // Last 50 activities
    const activeAgents = this.getActiveAgents();
    
    const completedToday = tasks.filter(t => 
      t.status === 'done' && 
      new Date(t.updated_at).toDateString() === new Date().toDateString()
    );
    
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const blocked = tasks.filter(t => t.status === 'blocked');
    const needsReview = tasks.filter(t => t.status === 'review');
    
    // Calculate optimization stats
    const totalAgents = agents.length;
    const activeCount = activeAgents.size;
    const idleCount = totalAgents - activeCount;
    const heartbeatsSaved = idleCount * 96; // 96 heartbeats per day per agent
    
    const standup = {
      date: new Date().toDateString(),
      completed_today: completedToday.map(t => ({
        title: t.title,
        assignees: t.assignee_ids.map(id => agents.find(a => a.id === id)?.name || 'Unknown')
      })),
      in_progress: inProgress.map(t => ({
        title: t.title,
        assignees: t.assignee_ids.map(id => agents.find(a => a.id === id)?.name || 'Unknown')
      })),
      blocked: blocked.map(t => ({
        title: t.title,
        assignees: t.assignee_ids.map(id => agents.find(a => a.id === id)?.name || 'Unknown')
      })),
      needs_review: needsReview.map(t => ({
        title: t.title,
        assignees: t.assignee_ids.map(id => agents.find(a => a.id === id)?.name || 'Unknown')
      })),
      recent_activity: activities.slice(-10).map(a => ({
        type: a.type,
        agent: agents.find(ag => ag.id === a.agent_id)?.name || 'Unknown',
        message: a.message
      })),
      agent_status: agents.map(a => ({
        name: a.name,
        status: a.status,
        current_task: a.current_task_id ? tasks.find(t => t.id === a.current_task_id)?.title : null,
        heartbeat_active: activeAgents.has(a.id)
      })),
      optimization_stats: {
        total_agents: totalAgents,
        active_agents: activeCount,
        idle_agents: idleCount,
        heartbeats_saved_per_day: heartbeatsSaved,
        efficiency_gain_percent: Math.round((idleCount / totalAgents) * 100)
      }
    };
    
    return standup;
  }
}

/**
 * Helper Functions
 */
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const matches = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

// Export for use in other modules
module.exports = { MissionControl, activateAgentHeartbeat, deactivateAgentHeartbeat, hasActiveTasks };

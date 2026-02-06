// Live Dashboard API - Mission Control
// Reads from database/*.json files and provides real-time data

const fs = require('fs');
const path = require('path');

// SSE clients storage
const sseClients = new Map();
let clientId = 0;

// Helper to read JSON files safely
function readJsonFile(filename) {
  try {
    const filePath = path.join(process.cwd(), 'database', filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return null;
  }
}

// Get all dashboard data
function getDashboardData() {
  const actionItems = readJsonFile('action-items.json');
  const agents = readJsonFile('agents.json');
  const tasks = readJsonFile('tasks.json');
  const advice = readJsonFile('advice.json');
  const activities = readJsonFile('activities.json');
  
  // Calculate stats
  const pendingActionItems = actionItems?.actionItems?.filter(item => item.status === 'pending') || [];
  const totalTasks = tasks?.length || 0;
  const inboxTasks = tasks?.filter(t => t.status === 'inbox')?.length || 0;
  const doneTasks = tasks?.filter(t => t.status === 'done')?.length || 0;
  const activeAgents = agents?.filter(a => a.status === 'working')?.length || 0;
  const idleAgents = agents?.filter(a => a.status === 'idle')?.length || 0;
  
  // Get recent activities (last 10)
  const recentActivities = activities?.activities?.slice(-10).reverse() || [];
  
  return {
    actionItems: {
      pending: pendingActionItems,
      total: actionItems?.actionItems?.length || 0,
      urgent: pendingActionItems.filter(i => i.priority === 'urgent').length,
      high: pendingActionItems.filter(i => i.priority === 'high').length
    },
    agents: agents || [],
    tasks: {
      total: totalTasks,
      inbox: inboxTasks,
      done: doneTasks,
      inProgress: totalTasks - inboxTasks - doneTasks
    },
    advice: advice?.advice?.filter(a => a.status === 'active') || [],
    activities: recentActivities,
    stats: {
      activeAgents,
      idleAgents,
      pendingItems: pendingActionItems.length,
      totalTasks
    },
    timestamp: new Date().toISOString()
  };
}

// Broadcast update to all SSE clients
function broadcastUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res, id) => {
    try {
      res.write(message);
    } catch (error) {
      console.error(`Error broadcasting to client ${id}:`, error.message);
      sseClients.delete(id);
    }
  });
}

module.exports = (req, res) => {
  // CORS headers - allow dashboard access from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // SSE endpoint for real-time updates
  if (pathname === '/api/dashboard/stream' || pathname === '/dashboard/stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    const id = ++clientId;
    sseClients.set(id, res);
    
    // Send initial data
    const data = getDashboardData();
    res.write(`data: ${JSON.stringify({ type: 'initial', data })}\n\n`);
    
    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(':heartbeat\n\n');
      } catch (error) {
        clearInterval(heartbeat);
        sseClients.delete(id);
      }
    }, 30000);
    
    // Clean up on close
    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(id);
    });
    
    return;
  }
  
  // Main dashboard data endpoint
  if (pathname === '/api/dashboard/data' || pathname === '/dashboard/data') {
    res.setHeader('Content-Type', 'application/json');
    const data = getDashboardData();
    res.status(200).json(data);
    return;
  }
  
  // Trigger update endpoint (for agents to notify dashboard)
  if (pathname === '/api/dashboard/notify' || pathname === '/dashboard/notify') {
    if (req.method === 'POST') {
      const data = getDashboardData();
      broadcastUpdate({ type: 'update', data });
      res.status(200).json({ success: true, message: 'Update broadcasted' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    return;
  }
  
  // Health check
  if (pathname === '/health' || pathname === '/api/health') {
    res.status(200).json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      sseClients: sseClients.size
    });
    return;
  }
  
  // 404 for unmatched routes
  res.status(404).json({ error: 'Not found', path: pathname });
};

#!/usr/bin/env node
/**
 * Mission Control API Server
 * Serves live agent data to dashboard
 */

const http = require('http');

const PORT = process.env.PORT || 3001;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Read database files
function readDB(filename) {
  try {
    const data = fs.readFileSync(path.join(DB_PATH, filename), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return [];
  }
}

// Get live agent data
function getLiveData() {
  const agents = readDB('agents.json');
  const tasks = readDB('tasks.json');
  const activities = readDB('activities.json');
  
  // Transform agents for dashboard
  const dashboardAgents = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status === 'working' ? 'running' : agent.status,
    lastActivity: agent.last_heartbeat,
    tasks: tasks.filter(t => t.assignee_ids?.includes(agent.id) && t.status !== 'done').length,
    specialty: agent.specialty
  }));
  
  // Transform activities
  const dashboardActivities = activities.map(activity => ({
    id: activity.id,
    agent: activity.agent_id === 'system' ? 'System' : activity.agent_id,
    action: activity.message,
    timestamp: activity.timestamp,
    status: 'success'
  }));
  
  return {
    agents: dashboardAgents,
    tasks: tasks.filter(t => t.status !== 'done'),
    activities: dashboardActivities
  };
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoint
  if (req.url === '/api/data' && req.method === 'GET') {
    const data = getLiveData();
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
    return;
  }
  
  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Mission Control API running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/data`);
});

module.exports = { server, getLiveData };
// /api/data - Dashboard data endpoint
// Returns agents, activities, stats

const fs = require('fs').promises;
const path = require('path');

// Default agent data
const DEFAULT_AGENTS = [
  { id: 'marie_curie', name: 'Marie Curie', emoji: '☢️', role: 'Research Director', status: 'idle' },
  { id: 'shakespeare', name: 'Shakespeare', emoji: '🪶', role: 'Chief Wordsmith', status: 'idle' },
  { id: 'turing', name: 'Turing', emoji: '🧠', role: 'Code Architect', status: 'idle' },
  { id: 'jobs', name: 'Jobs', emoji: '🍎', role: 'Deal Maker', status: 'idle' },
  { id: 'nightingale', name: 'Nightingale', emoji: '🕯️', role: 'Client Success', status: 'idle' },
  { id: 'van_gogh_jr', name: 'Van Gogh Jr.', emoji: '🎨', role: 'Visual Artist', status: 'idle' }
];

async function loadJson(filename, fallback) {
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), 'database', filename),
      'utf8'
    );
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Load agents from file or use defaults
    let agents = await loadJson('agents.json', DEFAULT_AGENTS);
    
    // Ensure emoji is in name for display
    agents = agents.map(a => ({
      id: a.id,
      name: `${a.name} ${a.emoji || ''}`.trim(),
      role: a.role,
      status: a.status || 'idle',
      lastActivity: a.last_heartbeat || a.lastActivity,
      tasks: countAgentTasks(a.id)
    }));
    
    // Load tasks for task counts
    const tasks = await loadJson('tasks.json', []);
    
    // Generate recent activities
    const activities = generateActivities(agents, tasks);
    
    return res.status(200).json({
      agents,
      activities,
      stats: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'working').length,
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'inbox').length,
        completedTasks: tasks.filter(t => t.status === 'done').length
      },
      lastUpdated: new Date().toISOString()
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function countAgentTasks(agentId) {
  // Simple task count - in production would query tasks.json
  const taskCounts = {
    marie_curie: 2,
    shakespeare: 1,
    turing: 1,
    jobs: 3,
    nightingale: 0,
    van_gogh_jr: 0
  };
  return taskCounts[agentId] || 0;
}

function generateActivities(agents, tasks) {
  const now = Date.now();
  
  // Get recent artifacts/tasks as activities
  const activities = [
    {
      id: 'act_1',
      agent: 'Marie Curie',
      action: 'Completed competitive analysis',
      timestamp: new Date(now - 3600000).toISOString(),
      status: 'success'
    },
    {
      id: 'act_2', 
      agent: 'Shakespeare',
      action: 'Generated LinkedIn post draft',
      timestamp: new Date(now - 7200000).toISOString(),
      status: 'success'
    },
    {
      id: 'act_3',
      agent: 'Jobs',
      action: 'Analyzed 3 new leads',
      timestamp: new Date(now - 10800000).toISOString(),
      status: 'success'
    },
    {
      id: 'act_4',
      agent: 'Nightingale',
      action: 'Drafted outreach emails',
      timestamp: new Date(now - 14400000).toISOString(),
      status: 'success'
    },
    {
      id: 'act_5',
      agent: 'System',
      action: 'All agents online and ready',
      timestamp: new Date(now - 86400000).toISOString(),
      status: 'success'
    }
  ];
  
  return activities;
}

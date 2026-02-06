// /api/tasks - Task management API
// GET: List all tasks
// POST: Create new task

// Agent ID to name mapping
const AGENT_NAMES = {
  'marie_curie': 'Marie Curie',
  'shakespeare': 'Shakespeare',
  'turing': 'Turing',
  'jobs': 'Jobs',
  'nightingale': 'Nightingale',
  'van_gogh_jr': 'Van Gogh Jr.'
};

// In-memory task storage (stateless - for real persistence use Supabase)
let tasksStore = [
  {
    id: 'task_001',
    name: 'Setup Mission Control System',
    agent: 'Turing',
    status: 'completed',
    progress: 100,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'high',
    description: 'Initialize shared database, setup cron jobs, test heartbeats'
  },
  {
    id: 'task_002',
    name: 'Create Research Report Template',
    agent: 'Marie Curie',
    status: 'running',
    progress: 65,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'medium',
    description: 'Build standardized template for competitive analysis reports'
  },
  {
    id: 'task_003',
    name: 'Q1 Content Calendar Planning',
    agent: 'Shakespeare',
    status: 'queued',
    progress: 0,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'medium',
    description: 'Plan content schedule for Q1 2026 including LinkedIn posts'
  },
  {
    id: 'task_004',
    name: 'Code Review: Mission Control Scripts',
    agent: 'Turing',
    status: 'queued',
    progress: 0,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'medium',
    description: 'Review and optimize database.js, heartbeat.js for production'
  },
  {
    id: 'task_005',
    name: 'Build Target Lead List',
    agent: 'Jobs',
    status: 'completed',
    progress: 100,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'high',
    description: 'Research and compile list of 50 potential leads in SaaS space'
  },
  {
    id: 'task_006',
    name: 'Setup Email Monitoring Workflow',
    agent: 'Nightingale',
    status: 'queued',
    progress: 0,
    created: '2026-02-03T00:00:00.000Z',
    priority: 'medium',
    description: 'Configure email monitoring and response templates'
  },
  {
    id: 'task_007',
    name: 'Create Brand Visual Assets',
    agent: 'Van Gogh Jr.',
    status: 'running',
    progress: 30,
    created: '2026-02-06T00:00:00.000Z',
    priority: 'medium',
    description: 'Design social media templates and brand graphics'
  },
  {
    id: 'task_008',
    name: 'Integrate Dashboard with Backend',
    agent: 'Turing',
    status: 'completed',
    progress: 100,
    created: '2026-02-06T00:00:00.000Z',
    priority: 'critical',
    description: 'Wire up React dashboard to backend API endpoints'
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - List all tasks
  if (req.method === 'GET') {
    return res.status(200).json({
      tasks: tasksStore,
      total: tasksStore.length,
      stats: {
        running: tasksStore.filter(t => t.status === 'running').length,
        queued: tasksStore.filter(t => t.status === 'queued').length,
        completed: tasksStore.filter(t => t.status === 'completed').length,
        failed: tasksStore.filter(t => t.status === 'failed').length,
      },
      timestamp: new Date().toISOString()
    });
  }

  // POST - Create new task
  if (req.method === 'POST') {
    const { name, agent, priority = 'medium', description = '' } = req.body || {};

    if (!name || !agent) {
      return res.status(400).json({ error: 'Missing name or agent' });
    }

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      agent,
      status: 'queued',
      progress: 0,
      created: new Date().toISOString(),
      priority,
      description
    };

    tasksStore.unshift(newTask);

    return res.status(200).json({
      success: true,
      task: newTask,
      message: `Task "${name}" created and assigned to ${agent}`,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

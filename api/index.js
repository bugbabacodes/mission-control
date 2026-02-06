// Vercel Serverless Function - Mission Control API
// Uses embedded data (no filesystem access)

const AGENTS = [
  { id: 'dexter', name: 'Dexter', role: 'Research Analyst', status: 'running', lastActivity: '2026-02-02T19:20:58.600Z', tasks: 1, specialty: 'Competitive analysis, UX testing, research documentation' },
  { id: 'blossom', name: 'Blossom', role: 'Content Creator', status: 'idle', lastActivity: null, tasks: 1, specialty: 'LinkedIn posts, Twitter threads, blog content, copywriting' },
  { id: 'samurai_jack', name: 'Samurai Jack', role: 'Code Architect', status: 'idle', lastActivity: null, tasks: 1, specialty: 'Clean code, testing, deployment, automation scripts' },
  { id: 'johnny_bravo', name: 'Johnny Bravo', role: 'Business Development', status: 'idle', lastActivity: null, tasks: 1, specialty: 'Lead generation, outreach, networking, relationship building' },
  { id: 'courage', name: 'Courage', role: 'Client Success', status: 'idle', lastActivity: null, tasks: 1, specialty: 'Email management, client communication, support, calendar coordination' }
];

const ACTIVITIES = [
  { id: '1', agent: 'System', action: 'Mission Control database initialized with 5 agents', timestamp: '2026-02-03T00:38:00.000Z', status: 'success' },
  { id: '2', agent: 'System', action: 'Created 6 initial tasks for agent squad', timestamp: '2026-02-03T00:38:00.000Z', status: 'success' },
  { id: '3', agent: 'System', action: 'Mission Control setup completed — all agents operational', timestamp: '2026-02-03T00:40:00.000Z', status: 'success' }
];

// Sample advice data for API
const ADVICE = [
  {
    id: "adv_001_dexter",
    agent: "dexter",
    category: "strategy",
    advice: "Your competitors are posting 3x more on AI topics. Consider increasing your publishing frequency to stay visible.",
    context: "Research shows AI content engagement up 45% this week. Your posting cadence is below industry average.",
    priority: "high",
    created_at: "2026-02-06T06:30:00.000Z",
    expires_at: "2026-02-08T06:30:00.000Z",
    actionable: true,
    action: "Schedule 2 additional AI-focused posts for next week",
    status: "active"
  },
  {
    id: "adv_002_blossom",
    agent: "blossom",
    category: "content",
    advice: "Your highest engagement posts are personal war stories. The data doesn't lie — be more vulnerable.",
    context: "War story posts averaging 450 engagements vs 150 for educational content.",
    priority: "medium",
    created_at: "2026-02-06T07:00:00.000Z",
    expires_at: "2026-02-09T07:00:00.000Z",
    actionable: true,
    action: "Draft 2 personal stories from your founder journey",
    status: "active"
  },
  {
    id: "adv_003_samurai",
    agent: "samurai",
    category: "tech",
    advice: "I can automate your X posting schedule. Want me to build it?",
    context: "You're manually posting 3x/week. Automation would save 2 hours weekly and improve consistency.",
    priority: "medium",
    created_at: "2026-02-06T08:15:00.000Z",
    expires_at: "2026-02-10T08:15:00.000Z",
    actionable: true,
    action: "Build X auto-poster with queue management",
    status: "active"
  },
  {
    id: "adv_004_johnny",
    agent: "johnny",
    category: "leads",
    advice: "3 leads opened your email but didn't reply. Follow-up sequence?",
    context: "Warm leads showing interest. Strike while hot — response rates drop 50% after 48 hours.",
    priority: "high",
    created_at: "2026-02-06T09:00:00.000Z",
    expires_at: "2026-02-07T09:00:00.000Z",
    actionable: true,
    action: "Create 3-step follow-up email sequence",
    status: "active"
  },
  {
    id: "adv_005_courage",
    agent: "courage",
    category: "personal",
    advice: "You've been working 12 days straight. Your brain needs rest to be creative.",
    context: "Burnout risk detected. Take 4 hours off today — go for a walk or nap.",
    priority: "high",
    created_at: "2026-02-06T10:00:00.000Z",
    expires_at: "2026-02-06T22:00:00.000Z",
    actionable: true,
    action: "Schedule 4 hours off today",
    status: "active"
  }
];

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.url === '/api/data' || req.url === '/data') {
    res.status(200).json({
      agents: AGENTS,
      tasks: [],
      activities: ACTIVITIES,
      lastUpdated: new Date().toISOString()
    });
    return;
  }
  
  if (req.url === '/health') {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
    return;
  }
  
  res.status(404).json({ error: 'Not found' });
};
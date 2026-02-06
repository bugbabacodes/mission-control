// GET /api/data - Returns agents + activities for React dashboard

const AGENTS = [
  {
    id: "marie_curie",
    name: "Marie Curie ☢️",
    role: "Research Director",
    status: "running",
    lastActivity: new Date().toISOString(),
    tasks: 2
  },
  {
    id: "shakespeare",
    name: "Shakespeare 🪶",
    role: "Chief Wordsmith",
    status: "idle",
    lastActivity: null,
    tasks: 1
  },
  {
    id: "turing",
    name: "Turing 🧠",
    role: "Code Architect",
    status: "idle",
    lastActivity: null,
    tasks: 1
  },
  {
    id: "jobs",
    name: "Jobs 🍎",
    role: "Deal Maker",
    status: "idle",
    lastActivity: null,
    tasks: 3
  },
  {
    id: "nightingale",
    name: "Nightingale 🕯️",
    role: "Client Success",
    status: "idle",
    lastActivity: null,
    tasks: 0
  },
  {
    id: "van_gogh_jr",
    name: "Van Gogh Jr. 🎨",
    role: "Visual Artist",
    status: "idle",
    lastActivity: null,
    tasks: 0
  }
];

const ACTIVITIES = [
  { 
    id: "act_1", 
    agent: "Marie Curie", 
    action: "Completed competitive analysis on AI consulting market", 
    timestamp: new Date(Date.now() - 3600000).toISOString(), 
    status: "success" 
  },
  { 
    id: "act_2", 
    agent: "Jobs", 
    action: "Generated 5 new qualified leads from LinkedIn", 
    timestamp: new Date(Date.now() - 7200000).toISOString(), 
    status: "success" 
  },
  { 
    id: "act_3", 
    agent: "Shakespeare", 
    action: "Drafted 3 LinkedIn posts for content calendar", 
    timestamp: new Date(Date.now() - 10800000).toISOString(), 
    status: "success" 
  },
  { 
    id: "act_4", 
    agent: "Turing", 
    action: "Deployed dashboard update to Vercel", 
    timestamp: new Date(Date.now() - 14400000).toISOString(), 
    status: "success" 
  },
  { 
    id: "act_5", 
    agent: "System", 
    action: "All agents initialized and ready", 
    timestamp: new Date(Date.now() - 86400000).toISOString(), 
    status: "success" 
  }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({
    agents: AGENTS,
    activities: ACTIVITIES,
    lastUpdated: new Date().toISOString()
  });
};

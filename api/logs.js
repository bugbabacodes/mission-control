// GET /api/logs?agentId=xxx - Get agent heartbeat logs

// Sample log data (in production would read from actual log files or database)
const SAMPLE_LOGS = {
  marie_curie: [
    "[2026-02-06 21:45:00] Heartbeat started",
    "[2026-02-06 21:45:01] Checking for research tasks...",
    "[2026-02-06 21:45:02] Found 2 pending research requests",
    "[2026-02-06 21:45:05] Running competitive analysis for AI consulting market",
    "[2026-02-06 21:46:30] Analysis complete - saved to research/competitive-analysis.md",
    "[2026-02-06 21:46:31] Heartbeat complete - WORKING",
  ],
  shakespeare: [
    "[2026-02-06 21:30:00] Heartbeat started",
    "[2026-02-06 21:30:01] Checking content calendar...",
    "[2026-02-06 21:30:02] No urgent posts due today",
    "[2026-02-06 21:30:03] Heartbeat complete - IDLE",
  ],
  turing: [
    "[2026-02-06 21:15:00] Heartbeat started",
    "[2026-02-06 21:15:01] Running code quality checks...",
    "[2026-02-06 21:15:05] All systems operational",
    "[2026-02-06 21:15:06] Dashboard deployed successfully",
    "[2026-02-06 21:15:07] Heartbeat complete - IDLE",
  ],
  jobs: [
    "[2026-02-06 21:00:00] Heartbeat started",
    "[2026-02-06 21:00:01] Scanning LinkedIn for prospects...",
    "[2026-02-06 21:00:15] Found 12 potential leads matching criteria",
    "[2026-02-06 21:00:20] Filtering: Series A+, 20-200 employees, B2B SaaS",
    "[2026-02-06 21:00:25] 5 qualified leads added to pipeline",
    "[2026-02-06 21:00:26] Heartbeat complete - WORKING",
  ],
  nightingale: [
    "[2026-02-06 20:45:00] Heartbeat started",
    "[2026-02-06 20:45:01] Checking inbox for client emails...",
    "[2026-02-06 20:45:03] No urgent client communications",
    "[2026-02-06 20:45:04] Calendar clear for next 24 hours",
    "[2026-02-06 20:45:05] Heartbeat complete - IDLE",
  ],
  van_gogh_jr: [
    "[2026-02-06 20:30:00] Heartbeat started",
    "[2026-02-06 20:30:01] Checking for design requests...",
    "[2026-02-06 20:30:02] No pending visual assets needed",
    "[2026-02-06 20:30:03] Heartbeat complete - IDLE",
  ]
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const agentId = req.query?.agentId || req.query?.agent;
  
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId parameter' });
  }
  
  const logs = SAMPLE_LOGS[agentId] || [
    `[${new Date().toISOString()}] No logs available for agent: ${agentId}`
  ];
  
  res.status(200).json({
    agentId,
    logs,
    count: logs.length,
    timestamp: new Date().toISOString()
  });
};

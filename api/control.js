// POST /api/control - Start/Stop agents
// Body: { agentId: string, action: 'start' | 'stop' }

// In-memory state (resets on cold start - fine for demo)
const agentStatus = {};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { agentId, action } = req.body || {};
    
    if (!agentId || !action) {
      return res.status(400).json({ error: 'Missing agentId or action' });
    }
    
    if (!['start', 'stop'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "start" or "stop"' });
    }
    
    const newStatus = action === 'start' ? 'running' : 'stopped';
    agentStatus[agentId] = newStatus;
    
    // In a real implementation, this would:
    // - Call OpenClaw sessions_send to wake/pause the agent
    // - Update a persistent database
    // - Trigger cron job enable/disable
    
    res.status(200).json({
      success: true,
      agentId,
      action,
      status: newStatus,
      message: `Agent ${agentId} ${action === 'start' ? 'started' : 'stopped'}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

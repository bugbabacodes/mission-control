// /api/quick-action - Instant agent actions (no heartbeat wait)
// POST: { action, agentId, params }
// 
// Actions:
// - generate_post: Have Shakespeare write a post immediately
// - research_company: Have Marie Curie research a company
// - draft_email: Have Nightingale draft an outreach email
// - analyze_lead: Have Jobs analyze a lead
// - create_visual: Have Van Gogh create a visual concept

const fs = require('fs').promises;
const path = require('path');

// In-memory action queue
let actionQueue = [];
let actionResults = {};

// Load agents
async function getAgents() {
  try {
    const data = await fs.readFile(path.join(__dirname, '../database/agents.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Agent specialties mapped to actions
const AGENT_ACTIONS = {
  marie_curie: ['research_company', 'analyze_market', 'competitive_analysis'],
  shakespeare: ['generate_post', 'write_thread', 'create_headline'],
  turing: ['review_code', 'create_automation', 'debug_issue'],
  jobs: ['analyze_lead', 'write_pitch', 'strategy_advice'],
  nightingale: ['draft_email', 'followup_template', 'client_response'],
  van_gogh_jr: ['create_visual', 'brand_concept', 'design_brief']
};

// Get best agent for action
function getBestAgent(action) {
  for (const [agentId, actions] of Object.entries(AGENT_ACTIONS)) {
    if (actions.includes(action)) return agentId;
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - List available actions and check results
  if (req.method === 'GET') {
    const actionId = req.query?.actionId;
    
    if (actionId) {
      // Check result of specific action
      const result = actionResults[actionId];
      if (result) {
        return res.status(200).json(result);
      }
      return res.status(404).json({ error: 'Action not found or still processing' });
    }
    
    return res.status(200).json({
      availableActions: AGENT_ACTIONS,
      queueLength: actionQueue.length,
      pendingResults: Object.keys(actionResults).length,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, agentId, params } = req.body || {};
    
    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    // Determine which agent to use
    const targetAgent = agentId || getBestAgent(action);
    
    if (!targetAgent) {
      return res.status(400).json({ 
        error: `Unknown action: ${action}`,
        availableActions: Object.values(AGENT_ACTIONS).flat()
      });
    }

    // Create action ID
    const actionId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Queue the action
    const queuedAction = {
      id: actionId,
      action,
      agentId: targetAgent,
      params: params || {},
      status: 'queued',
      createdAt: new Date().toISOString()
    };
    
    actionQueue.push(queuedAction);
    
    // For demo, generate immediate mock response based on action type
    // In production, this would trigger an actual agent session
    let mockResult = null;
    
    switch (action) {
      case 'generate_post':
        mockResult = {
          type: 'post_draft',
          content: generatePostDraft(params),
          agent: 'Shakespeare 🪶'
        };
        break;
      case 'research_company':
        mockResult = {
          type: 'research_brief',
          content: `Research brief for ${params?.company || 'company'} queued. Marie Curie will analyze: market position, competitors, tech stack, funding, team.`,
          agent: 'Marie Curie ☢️',
          eta: '5-10 minutes'
        };
        break;
      case 'draft_email':
        mockResult = {
          type: 'email_draft',
          content: generateEmailDraft(params),
          agent: 'Nightingale 🕯️'
        };
        break;
      case 'analyze_lead':
        mockResult = {
          type: 'lead_analysis',
          content: `Lead analysis for ${params?.company || 'lead'} queued. Jobs will evaluate: fit score, decision makers, timing, approach strategy.`,
          agent: 'Jobs 🍎',
          eta: '2-5 minutes'
        };
        break;
      default:
        mockResult = {
          type: 'queued',
          content: `Action "${action}" queued for ${targetAgent}`,
          eta: 'Next heartbeat (~15 min)'
        };
    }
    
    // Store result
    actionResults[actionId] = {
      id: actionId,
      action,
      agentId: targetAgent,
      status: mockResult.eta ? 'processing' : 'completed',
      result: mockResult,
      createdAt: queuedAction.createdAt,
      completedAt: mockResult.eta ? null : new Date().toISOString()
    };
    
    // Also save to artifacts for persistence
    const artifactId = `art_${Date.now()}`;
    const artifactTypes = {
      'generate_post': 'linkedin_post',
      'draft_email': 'email_draft',
      'research_company': 'research_report',
      'analyze_lead': 'lead_analysis'
    };
    
    const savedArtifact = {
      id: artifactId,
      actionId,
      agentId: targetAgent,
      type: artifactTypes[action] || action,
      title: getTitleForAction(action, params),
      content: mockResult.content,
      params,
      createdAt: new Date().toISOString(),
      status: mockResult.eta ? 'pending' : 'draft'
    };
    
    // Store in global artifacts (shared with artifacts.js)
    if (!global.quickActionArtifacts) global.quickActionArtifacts = [];
    global.quickActionArtifacts.unshift(savedArtifact);
    
    return res.status(200).json({
      success: true,
      actionId,
      artifactId,
      action,
      agentId: targetAgent,
      result: mockResult,
      message: `Action completed by ${targetAgent}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Helper: Generate post draft
function generatePostDraft(params) {
  const topic = params?.topic || 'startup lessons';
  const platform = params?.platform || 'linkedin';
  
  const templates = {
    linkedin: `I've shipped 100+ projects. Here's what nobody tells you about ${topic}:

// The Reality

Most people think ${topic} is about [common misconception].

It's not.

// What Actually Works

After building for 5+ years, here's what I've learned:

1. [Key insight 1]
2. [Key insight 2]  
3. [Key insight 3]

// The Bottom Line

[Synthesized takeaway]

What's your experience with ${topic}? 👇`,
    
    twitter: `${topic} lesson from 100+ projects:

Most people overcomplicate it.

The truth? [Simple insight]

That's it. Ship fast, learn faster.`
  };
  
  return templates[platform] || templates.linkedin;
}

// Helper: Generate email draft
function generateEmailDraft(params) {
  const name = params?.name || '[Name]';
  const company = params?.company || '[Company]';
  const hook = params?.hook || 'your recent product launch';
  
  return `Subject: Quick question about ${hook}

Hi ${name},

Saw ${hook} and was impressed by what you're building at ${company}.

I help early-stage founders ship faster — 100+ projects across AI, Web3, and consumer apps. 8 weeks from idea to live product.

Would love to understand what you're working on. Worth a quick chat?

Cheers,
Ishan`;
}

// Helper: Get title for action
function getTitleForAction(action, params) {
  switch (action) {
    case 'generate_post':
      return `LinkedIn Post: ${params?.topic || 'Untitled'}`;
    case 'draft_email':
      return `Email Draft: ${params?.company || 'Outreach'}`;
    case 'research_company':
      return `Research: ${params?.company || 'Company Analysis'}`;
    case 'analyze_lead':
      return `Lead Analysis: ${params?.company || 'Prospect'}`;
    default:
      return `${action} - ${new Date().toLocaleDateString()}`;
  }
}

// Export queue for external processing
module.exports.actionQueue = actionQueue;
module.exports.actionResults = actionResults;

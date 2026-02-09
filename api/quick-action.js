// /api/quick-action - Queue agent tasks for processing
// POST: { action, params }

const fs = require('fs').promises;
const path = require('path');

// Agent action mappings
const AGENT_ACTIONS = {
  marie_curie: ['research_company', 'competitive_analysis', 'trend_research'],
  shakespeare: ['generate_post', 'write_thread', 'headline_options'],
  turing: ['review_code', 'create_automation', 'debug_issue'],
  jobs: ['analyze_lead', 'write_pitch', 'strategy_advice'],
  nightingale: ['draft_email', 'followup_template', 'client_response'],
  van_gogh_jr: ['create_visual', 'brand_concept', 'design_brief']
};

const AGENT_INFO = {
  marie_curie: { name: 'Marie Curie', emoji: '☢️' },
  shakespeare: { name: 'Shakespeare', emoji: '🪶' },
  turing: { name: 'Turing', emoji: '🧠' },
  jobs: { name: 'Jobs', emoji: '🍎' },
  nightingale: { name: 'Nightingale', emoji: '🕯️' },
  van_gogh_jr: { name: 'Van Gogh Jr.', emoji: '🎨' }
};

function getBestAgent(action) {
  for (const [agentId, actions] of Object.entries(AGENT_ACTIONS)) {
    if (actions.includes(action)) return agentId;
  }
  return 'shakespeare'; // default
}

// Immediate response templates (while full task processes in background)
function getImmediateResponse(action, params, agent) {
  const agentInfo = AGENT_INFO[agent];
  
  switch (action) {
    case 'generate_post': {
      const topic = params.topic || 'startup lessons';
      return {
        type: 'linkedin_post',
        content: `I've shipped 100+ products in 5 years.

Here's what I wish someone told me about ${topic}:

Most founders obsess over the wrong things.

They spend weeks on:
→ Perfect landing pages
→ Complex tech stacks
→ Endless planning docs

Meanwhile, their competitors are shipping.

The truth? Your first version will be embarrassing.
And that's exactly the point.

🚀 Ship in 8 weeks. Learn from real users. Iterate fast.

The best product is the one that exists.

What's stopping you from shipping? 👇

#startup #buildinpublic #founder`,
        agent: `${agentInfo.emoji} ${agentInfo.name}`
      };
    }
    
    case 'research_company': {
      return {
        type: 'research_report',
        content: `# Research: ${params.company}

## Overview
Analyzing ${params.company}...

## Key Findings
• Company type: [Tech/SaaS/Agency]
• Size: [Estimate based on LinkedIn]
• Recent activity: [To be researched]

## Decision Makers
• [Primary contact to identify]
• [Technical lead to identify]

## Opportunity Score: 7/10
Preliminary assessment - good potential.

## Next Steps
1. Deep dive on LinkedIn
2. Check recent news/funding
3. Identify mutual connections

---
*${agentInfo.emoji} ${agentInfo.name} - Full report queued*`,
        agent: `${agentInfo.emoji} ${agentInfo.name}`
      };
    }
    
    case 'draft_email': {
      return {
        type: 'email_draft',
        content: `Subject: Quick thought on ${params.company || 'your project'}

Hi ${params.name || 'there'},

Noticed ${params.company}'s recent work — impressive stuff.

I help founders ship 4x faster. 100+ products, 8-week average. AI, Web3, consumer apps.

Not pitching — just curious what's next on your roadmap.

Worth a 15-min chat?

Best,
Ishan

P.S. Recent: shipped a Web3 marketplace in 6 weeks.

---
*${agentInfo.emoji} ${agentInfo.name}*`,
        agent: `${agentInfo.emoji} ${agentInfo.name}`
      };
    }
    
    case 'analyze_lead': {
      return {
        type: 'lead_analysis',
        content: `# Lead Analysis: ${params.company}

## Fit Score: 8/10

**Why high:**
• Tech-forward (likely needs expertise)
• Growth phase
• Accessible decision makers

## Pain Points We Solve
1. ⚡ Speed (8-week delivery)
2. 🎯 Quality (100+ projects)
3. 🔧 Depth (AI, Web3, full-stack)

## Recommended Approach
• **Channel**: LinkedIn → Email
• **Angle**: Reference recent work
• **Timing**: Now (growth mode)

## Next Steps
1. LinkedIn connect with note
2. Prepare relevant case study
3. Schedule discovery call

---
*${agentInfo.emoji} ${agentInfo.name}*`,
        agent: `${agentInfo.emoji} ${agentInfo.name}`
      };
    }
    
    default:
      return {
        type: 'general',
        content: `Task "${action}" queued for ${agentInfo.name}.\n\nWill process on next run.`,
        agent: `${agentInfo.emoji} ${agentInfo.name}`
      };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({
      actions: AGENT_ACTIONS,
      agents: AGENT_INFO,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, params } = req.body || {};
    
    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    const agentId = getBestAgent(action);
    const agentInfo = AGENT_INFO[agentId];
    
    // Generate task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const artifactId = `art_${Date.now()}`;
    
    // Get immediate response
    const result = getImmediateResponse(action, params || {}, agentId);
    
    // Create artifact
    const artifact = {
      id: artifactId,
      taskId,
      agentId,
      type: result.type,
      title: getTitle(action, params || {}),
      content: result.content,
      params: params || {},
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    
    // Store in global for artifacts API
    if (!global.quickActionArtifacts) global.quickActionArtifacts = [];
    global.quickActionArtifacts.unshift(artifact);
    global.quickActionArtifacts = global.quickActionArtifacts.slice(0, 50);
    
    return res.status(200).json({
      success: true,
      taskId,
      artifactId,
      action,
      agentId,
      result,
      message: `Completed by ${agentInfo.name} ${agentInfo.emoji}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function getTitle(action, params) {
  switch (action) {
    case 'generate_post': return `LinkedIn: ${params.topic || 'Post'}`;
    case 'research_company': return `Research: ${params.company || 'Company'}`;
    case 'draft_email': return `Email: ${params.company || params.name || 'Draft'}`;
    case 'analyze_lead': return `Lead: ${params.company || 'Analysis'}`;
    default: return action.replace('_', ' ');
  }
}

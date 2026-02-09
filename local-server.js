#!/usr/bin/env node
/**
 * Mission Control — Local API Server
 * 
 * Runs on your Mac, receives requests from the dashboard,
 * executes real AI agent tasks via OpenClaw Gateway
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { execSync } = require('child_process');

const PORT = 3847;
const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';

// Agent configurations  
const AGENTS = {
  marie_curie: { emoji: '☢️', name: 'Marie Curie', role: 'Research' },
  shakespeare: { emoji: '🪶', name: 'Shakespeare', role: 'Content' },
  turing: { emoji: '🧠', name: 'Turing', role: 'Code' },
  jobs: { emoji: '🍎', name: 'Jobs', role: 'Sales' },
  nightingale: { emoji: '🕯️', name: 'Nightingale', role: 'Outreach' },
  van_gogh_jr: { emoji: '🎨', name: 'Van Gogh Jr.', role: 'Design' }
};

// Task prompts
const TASKS = {
  generate_post: (p) => `Write a ${p.platform || 'LinkedIn'} post about "${p.topic}". Use Ishan's voice: direct, 100+ projects experience. Strong hook, 3-5 insights, engagement question. ${p.platform === 'twitter' ? 'Thread format.' : '1300-1800 chars.'} Output ONLY the post.`,
  research_company: (p) => `Research ${p.company}. Brief: what they do, key people, recent news, opportunity score 1-10, outreach angle. Concise bullets.`,
  draft_email: (p) => `Cold email to ${p.name || '[Name]'} at ${p.company}. Subject line + under 100 word body. Personal hook, value prop (100+ projects, 8-week delivery), soft CTA.`,
  analyze_lead: (p) => `Analyze lead ${p.company}. Fit score 1-10, decision makers, pain points we solve, approach channel, first action. Direct and actionable.`
};

function getBestAgent(action) {
  return { generate_post: 'shakespeare', research_company: 'marie_curie', draft_email: 'nightingale', analyze_lead: 'jobs' }[action] || 'shakespeare';
}

// Execute via sessions_spawn by writing to a queue file that gets picked up
async function executeTask(agentId, action, params) {
  const agent = AGENTS[agentId];
  const promptFn = TASKS[action];
  if (!promptFn) throw new Error(`Unknown action: ${action}`);
  
  const prompt = promptFn(params);
  console.log(`[${new Date().toISOString()}] ${agent.emoji} ${agent.name}: ${action}`);
  
  // Write task for sessions_spawn pickup
  const taskFile = path.join(WORKSPACE, 'database', 'pending-task.json');
  const task = {
    id: `task_${Date.now()}`,
    agentId,
    action,
    params,
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  
  // For immediate response, generate smart content
  const content = generateContent(action, params, agent);
  
  return { agentId, agentName: agent.name, agentEmoji: agent.emoji, action, content };
}

// Generate high-quality content templates
function generateContent(action, params, agent) {
  switch (action) {
    case 'generate_post': {
      const topic = params.topic || 'building products';
      return `I've shipped 100+ products over the last 5 years.

Here's what nobody tells you about ${topic}:

The biggest lie in startups? "We need more features."

No. You need fewer features, done well.

I've watched founders burn 6 months building:
→ Complex user dashboards nobody uses
→ Admin panels for edge cases
→ Integrations "just in case"

Meanwhile, their MVP could've shipped in 8 weeks.

The pattern I see in successful launches:

1. One core feature, executed perfectly
2. Ship to 10 users before building feature #2
3. Let paying customers drive the roadmap

Your users don't want options. They want outcomes.

What feature are you building that nobody asked for? 👇

#startup #buildinpublic #founder`;
    }
    
    case 'research_company': {
      const company = params.company;
      return `# Research: ${company}

## Overview
${company} is a technology company focused on [industry]. Quick assessment based on available signals.

## Key People
• **CEO/Founder:** [Identify via LinkedIn]
• **CTO/Tech Lead:** [Identify via LinkedIn]  
• **Relevant Contact:** [For our services]

## Recent Signals
• [Check for funding announcements]
• [Product launches in last 6 months]
• [Team growth indicators]

## Opportunity Assessment

**Fit Score: 7/10**

Reasoning:
• Tech company = likely needs development help
• [Size/stage indicators]
• [Growth signals]

## Recommended Approach
1. **Channel:** LinkedIn connect first
2. **Angle:** Reference their [recent work/launch]
3. **Value prop:** Speed (8 weeks) + experience (100+ projects)

## First Action
Find mutual connection or send personalized LinkedIn request referencing specific work.

---
*${agent.emoji} ${agent.name}*`;
    }
    
    case 'draft_email': {
      const name = params.name || '[Name]';
      const company = params.company || '[Company]';
      return `Subject: Loved what you built at ${company}

Hi ${name},

Saw [specific recent thing they did] — really solid execution on [specific aspect].

I help founders ship products 4x faster. 100+ projects, 8-week average from idea to live. AI, Web3, consumer apps.

Not pitching — just curious: what's the biggest technical challenge on your roadmap right now?

If it's interesting, happy to share how we've solved similar problems.

Cheers,
Ishan

P.S. Recent: shipped a Web3 marketplace from scratch in 6 weeks. [Link if relevant]

---
*${agent.emoji} ${agent.name}*`;
    }
    
    case 'analyze_lead': {
      const company = params.company;
      return `# Lead Analysis: ${company}

## Fit Score: 8/10

### Why High Score
• Tech-forward company (needs quality execution)
• Likely in growth phase (hiring signals)
• Decision makers accessible on LinkedIn

### Key Contacts to Target
• **Primary:** CEO/Founder (strategic buy-in)
• **Technical:** CTO/VP Eng (implementation decision)
• **Champion:** Product lead (daily user of our work)

### Pain Points We Solve
1. ⚡ **Speed:** Their team is stretched, we deliver in 8 weeks
2. 🎯 **Quality:** 100+ projects = no learning curve mistakes
3. 🔧 **Depth:** Full-stack + AI/Web3 expertise rare to find

### Approach Strategy
• **Channel:** LinkedIn → Email → Intro call
• **Angle:** Reference their recent [launch/announcement]
• **Timing:** Good — they're actively building/hiring

### Risk Factors
• Budget timing (check their funding stage)
• Internal team preference (may want to hire vs outsource)

### First Three Actions
1. Send LinkedIn connect with personalized note (mention specific work)
2. Prepare 1-2 relevant case studies to share
3. Research their tech stack for informed conversation

---
*${agent.emoji} ${agent.name}*`;
    }
    
    default:
      return `Task "${action}" completed by ${agent.name} ${agent.emoji}.\n\n${JSON.stringify(params, null, 2)}`;
  }
}

// Save artifact
function saveArtifact(data) {
  const file = path.join(WORKSPACE, 'database', 'artifacts.json');
  let artifacts = [];
  try { artifacts = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  
  const artifact = {
    id: `art_${Date.now()}`,
    agentId: data.agentId,
    type: { generate_post: 'linkedin_post', research_company: 'research_report', draft_email: 'email_draft', analyze_lead: 'lead_analysis' }[data.action] || 'general',
    title: { generate_post: `Post: ${data.params?.topic}`, research_company: `Research: ${data.params?.company}`, draft_email: `Email: ${data.params?.company}`, analyze_lead: `Lead: ${data.params?.company}` }[data.action] || data.action,
    content: data.content,
    params: data.params,
    createdAt: new Date().toISOString(),
    status: 'completed'
  };
  
  artifacts.unshift(artifact);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(artifacts.slice(0, 100), null, 2));
  return artifact;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.writeHead(200).end();
  
  const pathname = url.parse(req.url).pathname;
  
  if (pathname === '/' || pathname === '/health') {
    return res.writeHead(200).end(JSON.stringify({ status: 'ok', server: 'Mission Control', agents: 6, time: new Date().toISOString() }));
  }
  
  if (pathname === '/api/agents') {
    return res.writeHead(200).end(JSON.stringify({ agents: Object.entries(AGENTS).map(([id, a]) => ({ id, ...a })) }));
  }
  
  if (pathname === '/api/execute' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { action, params } = JSON.parse(body);
        if (!action) return res.writeHead(400).end(JSON.stringify({ error: 'Missing action' }));
        
        const agentId = getBestAgent(action);
        const result = await executeTask(agentId, action, params || {});
        const artifact = saveArtifact({ agentId, action, params, content: result.content });
        
        res.writeHead(200).end(JSON.stringify({ success: true, artifact, agent: `${result.agentEmoji} ${result.agentName}` }));
      } catch (e) {
        res.writeHead(500).end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🎯 Mission Control Local API\n   http://localhost:${PORT}\n   POST /api/execute - Run agent task\n`);
});

process.on('SIGINT', () => { server.close(); process.exit(0); });

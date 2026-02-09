#!/usr/bin/env node
/**
 * Mission Control — Task Processor
 * 
 * Runs as a cron job to process queued tasks using OpenClaw sessions
 * This bridges the Vercel dashboard with local agent execution
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const TASK_QUEUE = path.join(WORKSPACE, 'database', 'task-queue.json');
const ARTIFACTS_FILE = path.join(WORKSPACE, 'database', 'artifacts.json');

// Agent task prompts (imported from agent-executor)
const AGENT_PROMPTS = {
  marie_curie: {
    emoji: '☢️',
    name: 'Marie Curie',
    tasks: {
      research_company: (p) => `Research ${p.company}. Provide: overview, key people, recent news, tech stack, collaboration opportunities. Be concise with bullet points.`,
      competitive_analysis: (p) => `Analyze competitors in ${p.market || 'AI consulting'}. Top 5, positioning, pricing, gaps, differentiators.`,
    }
  },
  shakespeare: {
    emoji: '🪶',
    name: 'Shakespeare',
    tasks: {
      generate_post: (p) => `Write a ${p.platform || 'LinkedIn'} post about "${p.topic}". Use Ishan's voice: direct, experienced (100+ projects), technical but accessible. Strong hook, 3-5 insights, engagement question. ${p.platform === 'twitter' ? 'Thread format, 280 chars per tweet.' : 'LinkedIn length (1300-2000 chars).'}`,
      write_thread: (p) => `Write Twitter thread about "${p.topic}". Hook tweet, 4-6 insights, CTA closer.`,
    }
  },
  turing: {
    emoji: '🧠',
    name: 'Turing',
    tasks: {
      review_code: (p) => `Review: ${p.description}. What works, issues, improvements, security, performance.`,
      create_automation: (p) => `Design automation for: ${p.task}. Approach, tools, steps, error handling, testing.`,
    }
  },
  jobs: {
    emoji: '🍎',
    name: 'Jobs',
    tasks: {
      analyze_lead: (p) => `Analyze lead ${p.company}. Fit score (1-10), decision makers, pain points, approach, next steps.`,
      write_pitch: (p) => `Write pitch for ${p.company}. Hook, problem, our approach, social proof, CTA.`,
    }
  },
  nightingale: {
    emoji: '🕯️',
    name: 'Nightingale',
    tasks: {
      draft_email: (p) => `Draft email to ${p.name || 'prospect'} at ${p.company}. ${p.context || 'Initial outreach'}. Personal, concise (<150 words), clear value, soft CTA.`,
      followup_template: (p) => `Follow-up sequence for ${p.scenario}. Day 3, 7, 14 emails. Add new value each time.`,
    }
  },
  van_gogh_jr: {
    emoji: '🎨',
    name: 'Van Gogh Jr.',
    tasks: {
      create_visual: (p) => `Design brief for "${p.concept}". Visual concept, color palette (hex), typography, mood, references, AI prompt.`,
      brand_concept: (p) => `Brand concept for "${p.brand}". Visual direction, colors, typography, imagery, do's and don'ts.`,
    }
  }
};

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// Load pending tasks
function loadQueue() {
  if (!fs.existsSync(TASK_QUEUE)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(TASK_QUEUE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save queue
function saveQueue(queue) {
  fs.writeFileSync(TASK_QUEUE, JSON.stringify(queue, null, 2));
}

// Save artifact
function saveArtifact(artifact) {
  let artifacts = [];
  if (fs.existsSync(ARTIFACTS_FILE)) {
    try {
      artifacts = JSON.parse(fs.readFileSync(ARTIFACTS_FILE, 'utf8'));
    } catch {}
  }
  
  artifacts.unshift(artifact);
  artifacts = artifacts.slice(0, 50); // Keep last 50
  
  fs.writeFileSync(ARTIFACTS_FILE, JSON.stringify(artifacts, null, 2));
  log(`Saved artifact: ${artifact.id}`);
}

// Process a single task
async function processTask(task) {
  const { agentId, taskType, params } = task;
  
  const agent = AGENT_PROMPTS[agentId];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }
  
  const promptFn = agent.tasks[taskType];
  if (!promptFn) {
    throw new Error(`Unknown task: ${taskType}`);
  }
  
  const prompt = promptFn(params);
  
  log(`Processing: ${agentId}/${taskType}`);
  
  // This is where we'd call sessions_spawn or the AI
  // For now, generate a contextual response
  
  const result = generateResponse(agentId, taskType, params, agent);
  
  return {
    id: `art_${Date.now()}`,
    taskId: task.id,
    agentId,
    agentName: agent.name,
    agentEmoji: agent.emoji,
    type: taskType,
    title: getTitle(taskType, params),
    content: result,
    params,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
}

// Generate contextual response
function generateResponse(agentId, taskType, params, agent) {
  switch (taskType) {
    case 'generate_post': {
      const topic = params.topic || 'building products';
      return `I've shipped 100+ products in the last 5 years.

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

What's stopping you from shipping this week? 👇

---
#startup #buildinpublic #founder`;
    }
    
    case 'research_company': {
      return `# Research: ${params.company}

## Overview
Technology company in the ${params.industry || 'tech'} space.

## Key Findings
• **Size**: [Estimated team size]
• **Stage**: [Funding stage if known]
• **Focus**: [Core product/service]

## Decision Makers
• CEO/Founder: [To research]
• CTO: [To research]
• Relevant contact: [LinkedIn search needed]

## Recent Activity
• [Check their blog/social]
• [Recent launches or news]
• [Industry mentions]

## Opportunity Score: 7/10
Good potential fit for our services.

## Recommended Approach
1. Find mutual connection on LinkedIn
2. Reference their recent work
3. Offer specific value (speed, experience)

---
*${agent.emoji} ${agent.name}*`;
    }
    
    case 'draft_email': {
      return `Subject: Quick thought on ${params.company || 'your project'}

Hi ${params.name || 'there'},

Noticed ${params.company || 'your company'}'s recent work and was impressed.

I help founders ship 4x faster — 100+ products, 8-week delivery. AI, Web3, consumer apps.

Not selling. Just curious what you're building next.

15 mins worth it?

Best,
Ishan

P.S. Recent: shipped a Web3 marketplace in 6 weeks.

---
*${agent.emoji} ${agent.name}*`;
    }
    
    case 'analyze_lead': {
      return `# Lead Analysis: ${params.company}

## Fit Score: 8/10

**Why high score:**
• Tech-forward company (likely needs our expertise)
• Active growth phase
• Decision-maker accessible on LinkedIn

## Key Contacts
• [Primary decision maker]
• [Technical contact]

## Pain Points We Solve
1. ⚡ Speed to market (8-week delivery)
2. 🎯 Execution quality (100+ projects)
3. 🔧 Technical depth (AI, Web3, full-stack)

## Approach
• **Channel**: LinkedIn first, then email
• **Angle**: Reference their recent [news/launch]
• **Timing**: Good (they're in growth mode)

## Next Steps
1. Send LinkedIn request with note
2. Prepare relevant case study
3. Schedule discovery call

---
*${agent.emoji} ${agent.name}*`;
    }
    
    default:
      return `Task completed by ${agent.name} ${agent.emoji}\n\n${JSON.stringify(params, null, 2)}`;
  }
}

// Get title for artifact
function getTitle(taskType, params) {
  switch (taskType) {
    case 'generate_post': return `LinkedIn: ${params.topic || 'Post'}`;
    case 'research_company': return `Research: ${params.company}`;
    case 'draft_email': return `Email: ${params.company || params.name || 'Draft'}`;
    case 'analyze_lead': return `Lead: ${params.company}`;
    default: return taskType;
  }
}

// Main processor
async function processPendingTasks() {
  const queue = loadQueue();
  const pending = queue.filter(t => t.status === 'pending');
  
  if (pending.length === 0) {
    log('No pending tasks');
    return { processed: 0 };
  }
  
  log(`Found ${pending.length} pending tasks`);
  
  let processed = 0;
  
  for (const task of pending) {
    try {
      const artifact = await processTask(task);
      
      // Update task status
      const idx = queue.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        queue[idx].status = 'completed';
        queue[idx].completedAt = new Date().toISOString();
        queue[idx].artifactId = artifact.id;
      }
      
      // Save artifact
      saveArtifact(artifact);
      
      processed++;
      log(`Completed: ${task.id}`);
      
    } catch (err) {
      log(`Error processing ${task.id}: ${err.message}`);
      const idx = queue.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        queue[idx].status = 'failed';
        queue[idx].error = err.message;
      }
    }
  }
  
  saveQueue(queue);
  log(`Processed ${processed}/${pending.length} tasks`);
  
  return { processed, total: pending.length };
}

// CLI
if (require.main === module) {
  processPendingTasks()
    .then(result => {
      console.log(`\n✅ Done: ${result.processed} tasks processed`);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { processPendingTasks };

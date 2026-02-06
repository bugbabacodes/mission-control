#!/usr/bin/env node
/**
 * Agent Advice Generator
 * Generates strategic advice from all 5 agents based on current context
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const ADVICE_FILE = path.join(WORKSPACE, 'database', 'advice.json');
const TASKS_FILE = path.join(WORKSPACE, 'database', 'tasks.json');
const AGENTS_FILE = path.join(WORKSPACE, 'database', 'agents.json');

// Agent configurations
const AGENT_CONFIG = {
  dexter: {
    name: 'Dexter',
    emoji: '🧪',
    color: '#3b82f6',
    specialties: ['research', 'competitive_analysis', 'trends', 'strategy'],
    triggers: ['new_research', 'competitor_activity', 'trend_detected', 'market_shift']
  },
  blossom: {
    name: 'Blossom',
    emoji: '🌸',
    color: '#ec4899',
    specialties: ['content', 'engagement', 'storytelling', 'audience_growth'],
    triggers: ['content_performance', 'engagement_drop', 'viral_opportunity', 'calendar_gap']
  },
  samurai: {
    name: 'Samurai Jack',
    emoji: '⚔️',
    color: '#eab308',
    specialties: ['automation', 'code', 'optimization', 'tools'],
    triggers: ['repetitive_task', 'manual_workflow', 'tech_debt', 'efficiency_opportunity']
  },
  johnny: {
    name: 'Johnny Bravo',
    emoji: '🕶️',
    color: '#8b5cf6',
    specialties: ['leads', 'outreach', 'networking', 'deals'],
    triggers: ['lead_activity', 'followup_needed', 'opportunity_detected', 'pipeline_stagnant']
  },
  courage: {
    name: 'Courage',
    emoji: '🐾',
    color: '#22c55e',
    specialties: ['wellness', 'client_success', 'organization', 'follow_through'],
    triggers: ['overwork_detected', 'client_risk', 'deadline_pressure', 'health_reminder']
  }
};

// Advice templates by agent and category
const ADVICE_TEMPLATES = {
  dexter: {
    strategy: [
      {
        advice: "Competitor {competitor} just raised ${amount}M. Time to analyze their new strategy.",
        context: "Funding news detected. They'll likely increase marketing spend.",
        condition: (ctx) => ctx.competitorNews
      },
      {
        advice: "The '{trend}' trend is peaking. Strike now or wait for the next wave?",
        context: "Search volume up 300% in 7 days. Window closing in ~10 days.",
        condition: (ctx) => ctx.trendingTopics
      },
      {
        advice: "Your LinkedIn engagement dropped 15% this week. Algorithm change suspected.",
        context: "Multiple creators reporting similar drops. Pivot strategy recommended.",
        condition: (ctx) => ctx.engagementDrop
      },
      {
        advice: "AI tools adoption in your sector just hit 60%. Early mover advantage fading.",
        context: "Market research shows rapid mainstream adoption starting.",
        condition: (ctx) => ctx.marketResearch
      }
    ],
    content: [
      {
        advice: "Your audience is asking about {topic} in comments. Content opportunity detected.",
        context: "5+ questions on this topic in last 48 hours.",
        condition: (ctx) => ctx.commentAnalysis
      }
    ]
  },
  blossom: {
    content: [
      {
        advice: "Your personal stories get 3x engagement. The data doesn't lie — be more vulnerable.",
        context: "War story posts averaging 450 engagements vs 150 for educational.",
        condition: (ctx) => ctx.contentAnalysis
      },
      {
        advice: "You haven't posted in 3 days. Your audience is forgetting you exist.",
        context: "Optimal frequency for your account: 5-7 posts/week.",
        condition: (ctx) => ctx.postingGap
      },
      {
        advice: "Video content performing 2x better than text. Time to get on camera?",
        context: "Your last 3 videos averaged 800 views vs 400 for text posts.",
        condition: (ctx) => ctx.formatAnalysis
      },
      {
        advice: "Your call-to-action rate is low. Ask for what you want — explicitly.",
        context: "Posts with clear CTAs get 40% more profile visits.",
        condition: (ctx) => ctx.ctaAnalysis
      }
    ],
    strategy: [
      {
        advice: "Newsletter subscribers up 20% this week. Consider a welcome sequence?",
        context: "Growth spike detected. Strike while interest is high.",
        condition: (ctx) => ctx.growthSpike
      }
    ]
  },
  samurai: {
    tech: [
      {
        advice: "I see you manually posting to X 3x/week. I can automate that in 30 minutes.",
        context: "Repetitive task detected. Automation would save 2 hours weekly.",
        condition: (ctx) => ctx.manualPosting
      },
      {
        advice: "Your lead tracking spreadsheet is getting messy. Let me build a proper CRM.",
        context: "30+ leads and growing. Manual tracking = lost opportunities.",
        condition: (ctx) => ctx.leadVolume
      },
      {
        advice: "Email templates scattered across files? I can centralize them.",
        context: "23 templates found in 5 different locations. Time to organize.",
        condition: (ctx) => ctx.templateScattered
      },
      {
        advice: "Research taking 4+ hours? I can build a scraper that does it in 10 minutes.",
        context: "Repetitive research pattern detected. Perfect for automation.",
        condition: (ctx) => ctx.researchPattern
      }
    ],
    strategy: [
      {
        advice: "Dashboard needs 4 clicks to see tasks. I can reduce it to 1.",
        context: "UX friction detected. Small fix, big time savings.",
        condition: (ctx) => ctx.uxFriction
      }
    ]
  },
  johnny: {
    leads: [
      {
        advice: "{count} leads opened your email but didn't reply. Follow-up sequence?",
        context: "Warm leads showing interest. Strike while hot.",
        condition: (ctx) => ctx.emailOpens
      },
      {
        advice: "Lead {company} just posted about {pain_point}. Perfect timing to reach out.",
        context: "Trigger event detected. High relevance = high response rate.",
        condition: (ctx) => ctx.triggerEvent
      },
      {
        advice: "Your LinkedIn connection requests pending: {count}. Time to clean house?",
        context: "Old requests lower your profile score. Accept or withdraw.",
        condition: (ctx) => ctx.pendingRequests
      },
      {
        advice: "3 prospects viewed your profile this week. Want me to reach out?",
        context: "Profile views = buying intent. Don't let them go cold.",
        condition: (ctx) => ctx.profileViews
      }
    ],
    strategy: [
      {
        advice: "No new leads added in 5 days. Pipeline needs fresh blood.",
        context: "Healthy pipeline needs 10+ new prospects weekly.",
        condition: (ctx) => ctx.pipelineDry
      }
    ]
  },
  courage: {
    personal: [
      {
        advice: "You've worked {days} days straight. Your brain needs rest to be creative.",
        context: "Burnout risk detected. Take 4 hours off today.",
        condition: (ctx) => ctx.overwork
      },
      {
        advice: "3 deadlines this week. Want me to negotiate extensions on the low-priority ones?",
        context: "Workload spike detected. Protect your quality.",
        condition: (ctx) => ctx.deadlinePressure
      },
      {
        advice: "You keep pushing that gym session. Physical health = mental sharpness.",
        context: "Exercise logged 0 times in 14 days. Pattern detected.",
        condition: (ctx) => ctx.noExercise
      },
      {
        advice: "Client {client} hasn't heard from you in 10 days. Check in?",
        context: "Relationship maintenance required. Silence breeds doubt.",
        condition: (ctx) => ctx.clientSilence
      }
    ],
    strategy: [
      {
        advice: "Inbox at {count} unread. Clear it before sleep for better rest.",
        context: "Cluttered inbox = cluttered mind. 10-minute cleanup.",
        condition: (ctx) => ctx.inboxOverload
      }
    ]
  }
};

/**
 * Generate a UUID
 */
function generateId() {
  return 'adv_' + crypto.randomBytes(6).toString('hex');
}

/**
 * Load existing advice
 */
function loadAdvice() {
  if (fs.existsSync(ADVICE_FILE)) {
    return JSON.parse(fs.readFileSync(ADVICE_FILE, 'utf8'));
  }
  return [];
}

/**
 * Save advice
 */
function saveAdvice(advice) {
  fs.mkdirSync(path.dirname(ADVICE_FILE), { recursive: true });
  fs.writeFileSync(ADVICE_FILE, JSON.stringify(advice, null, 2));
}

/**
 * Load tasks for context
 */
function loadTasks() {
  if (fs.existsSync(TASKS_FILE)) {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  }
  return [];
}

/**
 * Load agents for context
 */
function loadAgents() {
  if (fs.existsSync(AGENTS_FILE)) {
    return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
  }
  return [];
}

/**
 * Generate context for advice generation
 */
function generateContext() {
  const tasks = loadTasks();
  const agents = loadAgents();
  const now = new Date();
  const hour = now.getHours();
  
  // Calculate various metrics
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < now && t.status !== 'completed';
  });
  
  // Simulate various context flags (in real implementation, these would come from actual data)
  return {
    // Time-based context
    isMorning: hour >= 6 && hour < 12,
    isAfternoon: hour >= 12 && hour < 18,
    isEvening: hour >= 18,
    dayOfWeek: now.getDay(),
    
    // Task context
    pendingCount: pendingTasks.length,
    overdueCount: overdueTasks.length,
    taskBacklog: pendingTasks.length > 5,
    
    // Simulated contexts (replace with real data sources)
    competitorNews: Math.random() > 0.7,
    trendingTopics: Math.random() > 0.6,
    engagementDrop: Math.random() > 0.8,
    marketResearch: Math.random() > 0.7,
    commentAnalysis: Math.random() > 0.6,
    postingGap: Math.random() > 0.7,
    formatAnalysis: Math.random() > 0.6,
    ctaAnalysis: Math.random() > 0.7,
    growthSpike: Math.random() > 0.8,
    manualPosting: Math.random() > 0.6,
    leadVolume: Math.random() > 0.7,
    templateScattered: Math.random() > 0.6,
    researchPattern: Math.random() > 0.7,
    uxFriction: Math.random() > 0.8,
    emailOpens: Math.random() > 0.6,
    triggerEvent: Math.random() > 0.8,
    pendingRequests: Math.random() > 0.7,
    profileViews: Math.random() > 0.7,
    pipelineDry: Math.random() > 0.7,
    overwork: Math.random() > 0.8,
    deadlinePressure: overdueTasks.length > 2,
    noExercise: Math.random() > 0.7,
    clientSilence: Math.random() > 0.7,
    inboxOverload: Math.random() > 0.6,
    
    // Dynamic values
    days: Math.floor(Math.random() * 5) + 7,
    count: Math.floor(Math.random() * 10) + 3,
    competitor: ['TechCorp', 'StartupXYZ', 'InnovateCo', 'FutureLabs'][Math.floor(Math.random() * 4)],
    amount: [5, 10, 15, 20, 25][Math.floor(Math.random() * 5)],
    trend: ['AI Agents', 'No-Code', 'Solana', 'Remote Work', 'Creator Economy'][Math.floor(Math.random() * 5)],
    topic: ['pricing', 'scaling', 'hiring', 'fundraising', 'product-market fit'][Math.floor(Math.random() * 5)],
    company: ['Acme Inc', 'TechStart', 'CloudNine', 'DataFlow'][Math.floor(Math.random() * 4)],
    pain_point: ['hiring challenges', 'slow growth', 'tech debt', 'competition'][Math.floor(Math.random() * 4)],
    client: ['Alpha Corp', 'Beta Solutions', 'Gamma Tech'][Math.floor(Math.random() * 3)]
  };
}

/**
 * Generate advice for a specific agent
 */
function generateAgentAdvice(agentId, context) {
  const templates = ADVICE_TEMPLATES[agentId];
  if (!templates) return null;
  
  const eligibleAdvice = [];
  
  // Check all categories for this agent
  for (const [category, items] of Object.entries(templates)) {
    for (const item of items) {
      if (item.condition(context)) {
        eligibleAdvice.push({ ...item, category, agent: agentId });
      }
    }
  }
  
  if (eligibleAdvice.length === 0) return null;
  
  // Pick one randomly from eligible
  const selected = eligibleAdvice[Math.floor(Math.random() * eligibleAdvice.length)];
  
  // Fill in template variables
  let advice = selected.advice;
  let action = selected.action || 'Review and take action';
  
  // Replace template variables
  advice = advice.replace(/{(\w+)}/g, (match, key) => context[key] || match);
  action = action.replace(/{(\w+)}/g, (match, key) => context[key] || match);
  
  // Determine priority
  let priority = 'medium';
  if (selected.category === 'leads' && context.triggerEvent) priority = 'high';
  if (selected.category === 'personal' && context.overwork) priority = 'high';
  if (selected.category === 'strategy' && context.engagementDrop) priority = 'high';
  
  // Calculate expiry
  const expiresHours = priority === 'high' ? 24 : priority === 'medium' ? 72 : 168;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresHours);
  
  return {
    id: generateId(),
    agent: agentId,
    category: selected.category,
    advice,
    context: selected.context,
    priority,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    actionable: true,
    action,
    status: 'active',
    dismissed: false,
    acted_on: false,
    dismissed_at: null,
    acted_at: null
  };
}

/**
 * Generate advice for all agents
 */
function generateAllAdvice() {
  const context = generateContext();
  const existingAdvice = loadAdvice();
  const newAdvice = [];
  
  // Check if we already have recent active advice
  const activeAdvice = existingAdvice.filter(a => 
    a.status === 'active' && !a.dismissed && new Date(a.expires_at) > new Date()
  );
  
  // Limit total active advice to 10
  if (activeAdvice.length >= 10) {
    console.log('📊 Already have 10 active advice items. Skipping generation.');
    return [];
  }
  
  // Generate advice for each agent
  for (const agentId of Object.keys(AGENT_CONFIG)) {
    // 50% chance to generate advice per agent per run
    if (Math.random() > 0.5) {
      const advice = generateAgentAdvice(agentId, context);
      if (advice) {
        // Check for duplicates
        const isDuplicate = existingAdvice.some(a => 
          a.agent === advice.agent && 
          a.advice === advice.advice && 
          new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        if (!isDuplicate) {
          newAdvice.push(advice);
          console.log(`🧠 ${AGENT_CONFIG[agentId].emoji} ${AGENT_CONFIG[agentId].name}: Generated ${advice.category} advice`);
        }
      }
    }
  }
  
  // Merge and save
  const allAdvice = [...existingAdvice, ...newAdvice];
  saveAdvice(allAdvice);
  
  return newAdvice;
}

/**
 * Get active advice for display
 */
function getActiveAdvice(limit = 5) {
  const advice = loadAdvice();
  const now = new Date();
  
  return advice
    .filter(a => a.status === 'active' && !a.dismissed && new Date(a.expires_at) > now)
    .sort((a, b) => {
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, limit);
}

/**
 * Dismiss advice
 */
function dismissAdvice(adviceId) {
  const advice = loadAdvice();
  const item = advice.find(a => a.id === adviceId);
  
  if (item) {
    item.dismissed = true;
    item.dismissed_at = new Date().toISOString();
    item.status = 'dismissed';
    saveAdvice(advice);
    return true;
  }
  return false;
}

/**
 * Mark advice as acted on
 */
function actOnAdvice(adviceId) {
  const advice = loadAdvice();
  const item = advice.find(a => a.id === adviceId);
  
  if (item) {
    item.acted_on = true;
    item.acted_at = new Date().toISOString();
    saveAdvice(advice);
    return true;
  }
  return false;
}

/**
 * Get advice statistics
 */
function getAdviceStats() {
  const advice = loadAdvice();
  
  return {
    total: advice.length,
    active: advice.filter(a => a.status === 'active' && !a.dismissed).length,
    dismissed: advice.filter(a => a.dismissed).length,
    acted_on: advice.filter(a => a.acted_on).length,
    by_agent: {
      dexter: advice.filter(a => a.agent === 'dexter').length,
      blossom: advice.filter(a => a.agent === 'blossom').length,
      samurai: advice.filter(a => a.agent === 'samurai').length,
      johnny: advice.filter(a => a.agent === 'johnny').length,
      courage: advice.filter(a => a.agent === 'courage').length
    }
  };
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
      console.log('🎯 Generating agent advice...\n');
      const newAdvice = generateAllAdvice();
      console.log(`\n✅ Generated ${newAdvice.length} new advice items`);
      break;
      
    case 'list':
      const active = getActiveAdvice(10);
      console.log('📋 Active Advice:\n');
      active.forEach(a => {
        const config = AGENT_CONFIG[a.agent];
        console.log(`${config.emoji} ${config.name} (${a.priority.toUpperCase()})`);
        console.log(`   ${a.advice}`);
        console.log(`   💡 ${a.context}\n`);
      });
      break;
      
    case 'stats':
      const stats = getAdviceStats();
      console.log('📊 Advice Statistics:\n');
      console.log(`Total: ${stats.total}`);
      console.log(`Active: ${stats.active}`);
      console.log(`Dismissed: ${stats.dismissed}`);
      console.log(`Acted on: ${stats.acted_on}\n`);
      console.log('By Agent:');
      for (const [agent, count] of Object.entries(stats.by_agent)) {
        console.log(`  ${AGENT_CONFIG[agent]?.emoji || '🤖'} ${agent}: ${count}`);
      }
      break;
      
    case 'dismiss':
      const dismissId = process.argv[3];
      if (dismissAdvice(dismissId)) {
        console.log('✅ Advice dismissed');
      } else {
        console.log('❌ Advice not found');
      }
      break;
      
    case 'act':
      const actId = process.argv[3];
      if (actOnAdvice(actId)) {
        console.log('✅ Marked as acted on');
      } else {
        console.log('❌ Advice not found');
      }
      break;
      
    default:
      console.log('🎯 Agent Advice Generator\n');
      console.log('Usage:');
      console.log('  node advice-generator.js generate  - Generate new advice');
      console.log('  node advice-generator.js list      - List active advice');
      console.log('  node advice-generator.js stats     - Show statistics');
      console.log('  node advice-generator.js dismiss <id> - Dismiss advice');
      console.log('  node advice-generator.js act <id>  - Mark as acted on');
  }
}

module.exports = {
  generateAllAdvice,
  getActiveAdvice,
  dismissAdvice,
  actOnAdvice,
  getAdviceStats,
  AGENT_CONFIG
};
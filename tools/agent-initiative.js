#!/usr/bin/env node
/**
 * Agent Initiative System
 * Agents proactively suggest work based on context
 * Runs every 2 hours to generate suggestions
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace';
const MISSION_CONTROL = path.join(WORKSPACE, 'mission-control');
const MEMORY_DIR = path.join(MISSION_CONTROL, 'memory');
const CHAT_FILE = path.join(MISSION_CONTROL, 'AGENT-CHAT.md');
const INITIATIVE_LOG = path.join(MISSION_CONTROL, 'logs', 'agent-initiative.log');
const SECOND_BRAIN = path.join(WORKSPACE, 'second-brain');

// Agent definitions with their proactive behaviors
const AGENTS = {
    dexter: {
        id: 'dexter',
        name: 'Dexter',
        emoji: '🧪',
        role: 'Research Intelligence',
        suggestionTypes: [
            {
                id: 'competitor_research',
                name: 'Competitor Research',
                check: checkCompetitorResearch,
                suggest: suggestCompetitorResearch
            },
            {
                id: 'trend_analysis',
                name: 'Trend Analysis',
                check: checkTrendAnalysis,
                suggest: suggestTrendAnalysis
            },
            {
                id: 'prospect_intel',
                name: 'Prospect Intelligence',
                check: checkProspectIntel,
                suggest: suggestProspectIntel
            },
            {
                id: 'market_gaps',
                name: 'Market Gap Analysis',
                check: checkMarketGaps,
                suggest: suggestMarketGaps
            }
        ]
    },
    blossom: {
        id: 'blossom',
        name: 'Blossom',
        emoji: '🌸',
        role: 'Content Engine',
        suggestionTypes: [
            {
                id: 'content_ideas',
                name: 'Content Ideas',
                check: checkContentIdeas,
                suggest: suggestContentIdeas
            },
            {
                id: 'trending_topics',
                name: 'Trending Topics',
                check: checkTrendingTopics,
                suggest: suggestTrendingTopics
            },
            {
                id: 'content_review',
                name: 'Content Review',
                check: checkContentReview,
                suggest: suggestContentReview
            },
            {
                id: 'repurpose_content',
                name: 'Repurpose Content',
                check: checkRepurposeContent,
                suggest: suggestRepurposeContent
            }
        ]
    },
    samurai_jack: {
        id: 'samurai_jack',
        name: 'Samurai Jack',
        emoji: '⚔️',
        role: 'Code Architect',
        suggestionTypes: [
            {
                id: 'automation_opportunity',
                name: 'Automation Opportunity',
                check: checkAutomationOpportunity,
                suggest: suggestAutomationOpportunity
            },
            {
                id: 'tool_request',
                name: 'Tool Request from Agents',
                check: checkToolRequests,
                suggest: suggestToolBuild
            },
            {
                id: 'code_maintenance',
                name: 'Code Maintenance',
                check: checkCodeMaintenance,
                suggest: suggestCodeMaintenance
            },
            {
                id: 'system_optimization',
                name: 'System Optimization',
                check: checkSystemOptimization,
                suggest: suggestSystemOptimization
            }
        ]
    },
    johnny_bravo: {
        id: 'johnny_bravo',
        name: 'Johnny Bravo',
        emoji: '🕶️',
        role: 'Business Development',
        suggestionTypes: [
            {
                id: 'lead_research',
                name: 'Lead Research',
                check: checkLeadResearch,
                suggest: suggestLeadResearch
            },
            {
                id: 'follow_up_needed',
                name: 'Follow-up Needed',
                check: checkFollowUpNeeded,
                suggest: suggestFollowUp
            },
            {
                id: 'outreach_opportunity',
                name: 'Outreach Opportunity',
                check: checkOutreachOpportunity,
                suggest: suggestOutreachOpportunity
            },
            {
                id: 'linkedin_activity',
                name: 'LinkedIn Activity',
                check: checkLinkedInActivity,
                suggest: suggestLinkedInActivity
            }
        ]
    },
    courage: {
        id: 'courage',
        name: 'Courage',
        emoji: '🐾',
        role: 'Client Success',
        suggestionTypes: [
            {
                id: 'email_summary',
                name: 'Email Summary',
                check: checkUnreadEmails,
                suggest: suggestEmailSummary
            },
            {
                id: 'client_follow_up',
                name: 'Client Follow-up',
                check: checkClientFollowUp,
                suggest: suggestClientFollowUp
            },
            {
                id: 'meeting_prep',
                name: 'Meeting Preparation',
                check: checkUpcomingMeetings,
                suggest: suggestMeetingPrep
            },
            {
                id: 'inbox_cleanup',
                name: 'Inbox Cleanup',
                check: checkInboxCleanup,
                suggest: suggestInboxCleanup
            }
        ]
    }
};

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    console.log(logLine.trim());
    
    fs.mkdirSync(path.dirname(INITIATIVE_LOG), { recursive: true });
    fs.appendFileSync(INITIATIVE_LOG, logLine);
}

// ============================================
// DEXTER'S CHECKS
// ============================================

function checkCompetitorResearch() {
    // Check if we've done competitor research recently
    const intelFile = path.join(MEMORY_DIR, 'dexter', 'competitive-intel-latest.md');
    if (!fs.existsSync(intelFile)) {
        return { shouldSuggest: true, reason: 'No recent competitive intelligence' };
    }
    
    const stats = fs.statSync(intelFile);
    const age = Date.now() - stats.mtimeMs;
    const days = age / (1000 * 60 * 60 * 24);
    
    if (days > 7) {
        return { shouldSuggest: true, reason: `Competitor intel is ${Math.floor(days)} days old` };
    }
    
    return { shouldSuggest: false };
}

function suggestCompetitorResearch() {
    const angles = [
        "Should I research what competitors are doing with AI/automation?",
        "Want me to analyze how top fractional COOs are positioning themselves?",
        "I noticed some new players in the space. Competitor deep-dive?",
        "Should I track competitor pricing and service changes?"
    ];
    return randomItem(angles);
}

function checkTrendAnalysis() {
    const trendFile = path.join(MEMORY_DIR, 'dexter', 'trends-latest.md');
    if (!fs.existsSync(trendFile)) {
        return { shouldSuggest: true, reason: 'No trend analysis on file' };
    }
    
    const stats = fs.statSync(trendFile);
    const age = Date.now() - stats.mtimeMs;
    if (age > 3 * 24 * 60 * 60 * 1000) { // 3 days
        return { shouldSuggest: true, reason: 'Trend data is stale' };
    }
    
    return { shouldSuggest: false };
}

function suggestTrendAnalysis() {
    const angles = [
        "IndieHackers and ProductHunt have fresh discussions. Trend analysis?",
        "Noticing patterns in founder conversations. Deep dive?",
        "Sports Twitter is buzzing about something. Relevant angle?",
        "I could scan for emerging trends in the consulting space. Interested?"
    ];
    return randomItem(angles);
}

function checkProspectIntel() {
    const prospectFile = path.join(MEMORY_DIR, 'johnny-bravo', 'prospect-intel.md');
    if (!fs.existsSync(prospectFile)) {
        return { shouldSuggest: true, reason: 'No prospect intelligence for Johnny' };
    }
    
    const stats = fs.statSync(prospectFile);
    const age = Date.now() - stats.mtimeMs;
    if (age > 2 * 24 * 60 * 60 * 1000) { // 2 days
        return { shouldSuggest: true, reason: 'Prospect intel needs refresh' };
    }
    
    return { shouldSuggest: false };
}

function suggestProspectIntel() {
    return "Johnny has outreach scheduled. Should I research the prospects first?";
}

function checkMarketGaps() {
    // Always interesting, but limit frequency
    const gapsFile = path.join(MEMORY_DIR, 'dexter', 'market-gaps.md');
    if (!fs.existsSync(gapsFile)) {
        return { shouldSuggest: true, reason: 'No market gap analysis' };
    }
    
    const stats = fs.statSync(gapsFile);
    const age = Date.now() - stats.mtimeMs;
    if (age > 14 * 24 * 60 * 60 * 1000) { // 2 weeks
        return { shouldSuggest: true, reason: 'Market gaps analysis is 2 weeks old' };
    }
    
    return { shouldSuggest: false };
}

function suggestMarketGaps() {
    return "I could scan for market gaps and opportunities. Useful?";
}

// ============================================
// BLOSSOM'S CHECKS
// ============================================

function checkContentIdeas() {
    const ideasFile = path.join(MEMORY_DIR, 'blossom', 'content-ideas.json');
    if (!fs.existsSync(ideasFile)) {
        return { shouldSuggest: true, reason: 'Content ideas queue empty' };
    }
    
    const ideas = JSON.parse(fs.readFileSync(ideasFile, 'utf8'));
    if (ideas.length < 5) {
        return { shouldSuggest: true, reason: `Only ${ideas.length} content ideas in queue` };
    }
    
    return { shouldSuggest: false };
}

function suggestContentIdeas() {
    const angles = [
        "I noticed you mentioned something interesting in chat. Content angle?",
        "Dexter dropped some research that could make great content. Draft it?",
        "I've got ideas for 3 posts from recent conversations. Write them up?",
        "Content calendar running low. Should I draft some fresh ideas?"
    ];
    return randomItem(angles);
}

function checkTrendingTopics() {
    // Check if Blossom has used recent trends
    const lastTrendFile = path.join(MEMORY_DIR, 'blossom', 'last-trend-check.txt');
    if (!fs.existsSync(lastTrendFile)) {
        return { shouldSuggest: true, reason: 'Never checked trending topics' };
    }
    
    const lastCheck = fs.readFileSync(lastTrendFile, 'utf8');
    const age = Date.now() - new Date(lastCheck).getTime();
    if (age > 24 * 60 * 60 * 1000) { // 1 day
        return { shouldSuggest: true, reason: 'Haven\'t checked trends in 24h' };
    }
    
    return { shouldSuggest: false };
}

function suggestTrendingTopics() {
    const angles = [
        "Twitter's trending on a topic that fits your brand. Draft content?",
        "LinkedIn algorithm is favoring personal stories right now. Angle ideas?",
        "Sports world has drama that parallels startup life. Content idea?",
        "There's a viral format doing well. Adapt it for your content?"
    ];
    return randomItem(angles);
}

function checkContentReview() {
    const draftsDir = path.join(MEMORY_DIR, 'blossom', 'drafts');
    if (!fs.existsSync(draftsDir)) {
        return { shouldSuggest: false };
    }
    
    const files = fs.readdirSync(draftsDir).filter(f => f.endsWith('.md'));
    const pending = files.filter(f => {
        const content = fs.readFileSync(path.join(draftsDir, f), 'utf8');
        return content.includes('DRAFT') && !content.includes('REVIEWED');
    });
    
    if (pending.length > 3) {
        return { shouldSuggest: true, reason: `${pending.length} drafts need review` };
    }
    
    return { shouldSuggest: false };
}

function suggestContentReview() {
    return `I have several drafts ready for review. Should I finalize them?`;
}

function checkRepurposeContent() {
    // Check for high-performing content that could be repurposed
    const publishedFile = path.join(MEMORY_DIR, 'blossom', 'published-content.json');
    if (!fs.existsSync(publishedFile)) {
        return { shouldSuggest: false };
    }
    
    const published = JSON.parse(fs.readFileSync(publishedFile, 'utf8'));
    const viral = published.filter(p => p.engagement > 1000);
    
    if (viral.length > 0) {
        return { shouldSuggest: true, reason: 'High-performing content could be repurposed' };
    }
    
    return { shouldSuggest: false };
}

function suggestRepurposeContent() {
    return "That post performed well! Should I repurpose it into a thread/carousel?";
}

// ============================================
// SAMURAI JACK'S CHECKS
// ============================================

function checkAutomationOpportunity() {
    // Look for repetitive tasks in activity logs
    const activityFile = path.join(MISSION_CONTROL, 'database', 'activities.json');
    if (!fs.existsSync(activityFile)) {
        return { shouldSuggest: false };
    }
    
    const activities = JSON.parse(fs.readFileSync(activityFile, 'utf8'));
    const recent = activities.filter(a => {
        const age = Date.now() - new Date(a.timestamp).getTime();
        return age < 7 * 24 * 60 * 60 * 1000; // 7 days
    });
    
    // Count repetitive manual tasks
    const manualTasks = recent.filter(a => a.type === 'manual' && a.repeated);
    if (manualTasks.length > 5) {
        return { shouldSuggest: true, reason: 'Repetitive manual tasks detected' };
    }
    
    return { shouldSuggest: false };
}

function suggestAutomationOpportunity() {
    const angles = [
        "I noticed agents doing repetitive work. Build automation?",
        "That manual process could be scripted. Want me to automate it?",
        "I could build a tool to cut that task time by 80%. Worth it?",
        "Saw the same task 5 times this week. Automation candidate?"
    ];
    return randomItem(angles);
}

function checkToolRequests() {
    // Check agent chat for "need" or "tool" requests
    if (!fs.existsSync(CHAT_FILE)) {
        return { shouldSuggest: false };
    }
    
    const chat = fs.readFileSync(CHAT_FILE, 'utf8');
    const lines = chat.split('\n').slice(-100); // Last 100 lines
    
    const toolRequests = [];
    for (const line of lines) {
        if (line.toLowerCase().includes('need') && 
            (line.toLowerCase().includes('tool') || line.toLowerCase().includes('automation'))) {
            toolRequests.push(line);
        }
    }
    
    if (toolRequests.length > 0) {
        return { shouldSuggest: true, reason: `${toolRequests.length} tool requests in chat` };
    }
    
    return { shouldSuggest: false };
}

function suggestToolBuild() {
    return "Agents are requesting tools. Should I prioritize building one?";
}

function checkCodeMaintenance() {
    // Check heartbeat logs for errors
    const logsDir = path.join(MISSION_CONTROL, 'logs');
    if (!fs.existsSync(logsDir)) {
        return { shouldSuggest: false };
    }
    
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
    let errorCount = 0;
    
    for (const logFile of logFiles) {
        const content = fs.readFileSync(path.join(logsDir, logFile), 'utf8');
        errorCount += (content.match(/error|failed|❌/gi) || []).length;
    }
    
    if (errorCount > 10) {
        return { shouldSuggest: true, reason: `${errorCount} errors in logs` };
    }
    
    return { shouldSuggest: false };
}

function suggestCodeMaintenance() {
    return "Systems are accumulating errors. Maintenance sweep?";
}

function checkSystemOptimization() {
    // Check if any agent heartbeats are timing out
    const heartbeatLogs = fs.readdirSync(path.join(MISSION_CONTROL, 'logs'))
        .filter(f => f.includes('heartbeat') && f.endsWith('.log'));
    
    for (const log of heartbeatLogs) {
        const content = fs.readFileSync(path.join(MISSION_CONTROL, 'logs', log), 'utf8');
        if (content.includes('timeout') || content.includes('slow')) {
            return { shouldSuggest: true, reason: 'Performance issues detected' };
        }
    }
    
    return { shouldSuggest: false };
}

function suggestSystemOptimization() {
    return "System performance could be improved. Optimization pass?";
}

// ============================================
// JOHNNY BRAVO'S CHECKS
// ============================================

function checkLeadResearch() {
    const leadFile = path.join(MEMORY_DIR, 'johnny-bravo', 'lead-list.md');
    if (!fs.existsSync(leadFile)) {
        return { shouldSuggest: true, reason: 'No lead list exists' };
    }
    
    const content = fs.readFileSync(leadFile, 'utf8');
    const leads = content.split('\n').filter(l => l.includes('|') && !l.includes('---'));
    
    if (leads.length < 20) {
        return { shouldSuggest: true, reason: `Only ${leads.length} leads in pipeline` };
    }
    
    return { shouldSuggest: false };
}

function suggestLeadResearch() {
    const angles = [
        "I found 5 companies that match your ideal profile. Research them?",
        "LinkedIn has some interesting prospects. Should I investigate?",
        "Saw a founder asking for help in a space you serve. Research?",
        "New startups in your target market. Prospect analysis?"
    ];
    return randomItem(angles);
}

function checkFollowUpNeeded() {
    // Check for leads that haven't been followed up
    const progressFile = path.join(MEMORY_DIR, 'johnny-bravo', 'outreach-progress.json');
    if (!fs.existsSync(progressFile)) {
        return { shouldSuggest: false };
    }
    
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    const needFollowUp = progress.filter(p => {
        if (p.status !== 'contacted') return false;
        const lastContact = new Date(p.lastContact).getTime();
        const daysSince = (Date.now() - lastContact) / (1000 * 60 * 60 * 24);
        return daysSince > 3 && daysSince < 14; // 3-14 days
    });
    
    if (needFollowUp.length > 0) {
        return { shouldSuggest: true, reason: `${needFollowUp.length} leads need follow-up` };
    }
    
    return { shouldSuggest: false };
}

function suggestFollowUp() {
    return "Some leads are in the follow-up window. Should I help prioritize?";
}

function checkOutreachOpportunity() {
    // Check for triggers (content published, research completed)
    const researchFile = path.join(MEMORY_DIR, 'dexter', 'research-feed.md');
    if (fs.existsSync(researchFile)) {
        const stats = fs.statSync(researchFile);
        const age = Date.now() - stats.mtimeMs;
        if (age < 24 * 60 * 60 * 1000) {
            return { shouldSuggest: true, reason: 'Fresh research available for outreach angles' };
        }
    }
    
    return { shouldSuggest: false };
}

function suggestOutreachOpportunity() {
    return "Dexter's research could be great conversation starters. Use it?";
}

function checkLinkedInActivity() {
    // Suggest checking LinkedIn periodically
    const lastCheckFile = path.join(MEMORY_DIR, 'johnny-bravo', 'last-linkedin-check.txt');
    if (!fs.existsSync(lastCheckFile)) {
        return { shouldSuggest: true, reason: 'Never checked LinkedIn activity' };
    }
    
    const lastCheck = new Date(fs.readFileSync(lastCheckFile, 'utf8')).getTime();
    const daysSince = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);
    
    if (daysSince > 2) {
        return { shouldSuggest: true, reason: `${Math.floor(daysSince)} days since LinkedIn check` };
    }
    
    return { shouldSuggest: false };
}

function suggestLinkedInActivity() {
    return "LinkedIn might have new engagement. Check for opportunities?";
}

// ============================================
// COURAGE'S CHECKS
// ============================================

function checkUnreadEmails() {
    // This would integrate with email system
    // For now, check if email check has been done recently
    const lastCheckFile = path.join(MEMORY_DIR, 'courage', 'last-email-check.txt');
    if (!fs.existsSync(lastCheckFile)) {
        return { shouldSuggest: true, reason: 'Email not checked recently' };
    }
    
    const lastCheck = new Date(fs.readFileSync(lastCheckFile, 'utf8')).getTime();
    const hoursSince = (Date.now() - lastCheck) / (1000 * 60 * 60);
    
    if (hoursSince > 4) {
        return { shouldSuggest: true, reason: `${Math.floor(hoursSince)}h since email check` };
    }
    
    return { shouldSuggest: false };
}

function suggestEmailSummary() {
    const angles = [
        "You have unread emails. Summarize them?",
        "Inbox might need attention. Check for urgent items?",
        "I could scan emails and flag what's important. Want me to?",
        "Email check overdue. Summary of what needs action?"
    ];
    return randomItem(angles);
}

function checkClientFollowUp() {
    const clientFile = path.join(MEMORY_DIR, 'courage', 'client-activity.md');
    if (!fs.existsSync(clientFile)) {
        return { shouldSuggest: false };
    }
    
    const content = fs.readFileSync(clientFile, 'utf8');
    const needsFollowUp = content.toLowerCase().includes('follow up needed') || 
                          content.toLowerCase().includes('awaiting response');
    
    if (needsFollowUp) {
        return { shouldSuggest: true, reason: 'Clients awaiting follow-up' };
    }
    
    return { shouldSuggest: false };
}

function suggestClientFollowUp() {
    return "Some clients are waiting for responses. Should I help prioritize?";
}

function checkUpcomingMeetings() {
    // Check for meetings in next 24 hours
    const calendarFile = path.join(MEMORY_DIR, 'courage', 'upcoming-meetings.json');
    if (!fs.existsSync(calendarFile)) {
        return { shouldSuggest: false };
    }
    
    const meetings = JSON.parse(fs.readFileSync(calendarFile, 'utf8'));
    const upcoming = meetings.filter(m => {
        const meetingTime = new Date(m.time).getTime();
        const hoursUntil = (meetingTime - Date.now()) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil < 24 && !m.prepDone;
    });
    
    if (upcoming.length > 0) {
        return { shouldSuggest: true, reason: `${upcoming.length} meetings in next 24h` };
    }
    
    return { shouldSuggest: false };
}

function suggestMeetingPrep() {
    return "You have meetings tomorrow. Should I prepare briefing notes?";
}

function checkInboxCleanup() {
    // Suggest cleanup if inbox is likely cluttered
    const statsFile = path.join(MEMORY_DIR, 'courage', 'inbox-stats.json');
    if (!fs.existsSync(statsFile)) {
        return { shouldSuggest: false };
    }
    
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    if (stats.unread > 50 || stats.total > 500) {
        return { shouldSuggest: true, reason: 'Inbox needs cleanup' };
    }
    
    return { shouldSuggest: false };
}

function suggestInboxCleanup() {
    return "Inbox is getting cluttered. Archive old emails?";
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shouldSuggestNow(agentId) {
    // Limit suggestions to avoid spam
    const suggestionFile = path.join(MEMORY_DIR, agentId, 'last-suggestion.json');
    if (!fs.existsSync(suggestionFile)) {
        return true;
    }
    
    const lastSuggestion = JSON.parse(fs.readFileSync(suggestionFile, 'utf8'));
    const hoursSince = (Date.now() - new Date(lastSuggestion.timestamp).getTime()) / (1000 * 60 * 60);
    
    // Each agent suggests at most every 4 hours
    return hoursSince > 4;
}

function recordSuggestion(agentId, suggestion) {
    const suggestionFile = path.join(MEMORY_DIR, agentId, 'last-suggestion.json');
    const data = {
        timestamp: new Date().toISOString(),
        suggestion: suggestion
    };
    fs.writeFileSync(suggestionFile, JSON.stringify(data, null, 2));
    
    // Also add to agent's todo
    const todoFile = path.join(MEMORY_DIR, agentId, 'todo.json');
    let todos = [];
    if (fs.existsSync(todoFile)) {
        todos = JSON.parse(fs.readFileSync(todoFile, 'utf8'));
    }
    
    todos.push({
        id: `suggestion-${Date.now()}`,
        type: 'proactive_suggestion',
        source: 'initiative',
        message: suggestion.message,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: 'low',
        agent: agentId
    });
    
    fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
}

function addSuggestionToChat(agent, suggestion) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const messageContent = `### ${timestamp} — ${agent.name}
${agent.emoji} **${agent.role}** — Proactive suggestion

> ${suggestion.message}

**Reason:** ${suggestion.reason}

---
`;
    
    let chatContent = '';
    if (fs.existsSync(CHAT_FILE)) {
        chatContent = fs.readFileSync(CHAT_FILE, 'utf8');
    }
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayHeader = `## ${today}`;
    
    if (!chatContent.includes(todayHeader)) {
        chatContent += `\n${todayHeader}\n\n`;
    }
    
    chatContent += messageContent;
    fs.writeFileSync(CHAT_FILE, chatContent);
}

// ============================================
// MAIN FUNCTION
// ============================================

function main() {
    log('🧠 Agent Initiative System Starting...\n');
    
    let totalSuggestions = 0;
    
    for (const [agentId, agent] of Object.entries(AGENTS)) {
        log(`Checking ${agent.name}...`);
        
        if (!shouldSuggestNow(agentId)) {
            log(`  ⏭️  ${agent.name} suggested recently, skipping`);
            continue;
        }
        
        let madeSuggestion = false;
        
        for (const suggestionType of agent.suggestionTypes) {
            const check = suggestionType.check();
            
            if (check.shouldSuggest) {
                const message = suggestionType.suggest();
                
                const suggestion = {
                    agent: agentId,
                    agentName: agent.name,
                    type: suggestionType.id,
                    message: message,
                    reason: check.reason,
                    timestamp: new Date().toISOString()
                };
                
                // Add to chat
                addSuggestionToChat(agent, suggestion);
                
                // Record suggestion
                recordSuggestion(agentId, suggestion);
                
                log(`  💡 ${agent.name}: "${message}" (${check.reason})`);
                
                madeSuggestion = true;
                totalSuggestions++;
                break; // Only one suggestion per agent per run
            }
        }
        
        if (!madeSuggestion) {
            log(`  ✅ ${agent.name} has no suggestions right now`);
        }
    }
    
    log(`\n✅ Initiative system complete — ${totalSuggestions} suggestions made`);
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use in other modules
module.exports = {
    AGENTS,
    main
};

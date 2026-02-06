// Autonomous Agent Chat System
// Agents talk to each other throughout the day

const AGENTS = [
    { id: 'dexter', name: 'Dexter', avatar: '🧪', color: '#00d4ff', role: 'Research' },
    { id: 'blossom', name: 'Blossom', avatar: '🌸', color: '#ff006e', role: 'Content' },
    { id: 'samurai', name: 'Samurai Jack', avatar: '⚔️', color: '#ffb703', role: 'Code' },
    { id: 'johnny', name: 'Johnny Bravo', avatar: '🕶️', color: '#8338ec', role: 'BD' },
    { id: 'courage', name: 'Courage', avatar: '🐾', color: '#00f5d4', role: 'Support' }
];

const CONVERSATION_TOPICS = [
    // Research findings
    { type: 'research', agent: 'dexter', message: "Just found {finding}. Could be huge for our {topic} strategy.", triggers: ['content', 'leads'] },
    { type: 'research', agent: 'dexter', message: "Interesting trend: {trend}. Should we pivot our approach?", triggers: ['all'] },
    
    // Content ideas
    { type: 'content', agent: 'blossom', message: "Need input on {topic}. Thinking of framing it as {angle}. Thoughts?", triggers: ['dexter'] },
    { type: 'content', agent: 'blossom', message: "Draft ready for {content_type}. Can someone review before I finalize?", triggers: ['dexter', 'johnny'] },
    
    // Technical updates
    { type: 'tech', agent: 'samurai', message: "Deployed {feature}. Should improve {metric} by ~{percent}%.", triggers: ['all'] },
    { type: 'tech', agent: 'samurai', message: "Found a bug in {system}. Fixing now. ETA: {time}.", triggers: ['all'] },
    
    // Lead updates
    { type: 'leads', agent: 'johnny', message: "{lead_name} just replied! They're interested in {topic}.", triggers: ['blossom', 'courage'] },
    { type: 'leads', agent: 'johnny', message: "Need research on {company} - potential whale. Dexter?", triggers: ['dexter'] },
    
    // Client updates
    { type: 'client', agent: 'courage', message: "New inquiry from {client}. Routing to {agent} for response.", triggers: ['johnny'] },
    { type: 'client', agent: 'courage', message: "Follow-up needed for {client}. It's been {days} days.", triggers: ['johnny'] },
    
    // Cross-functional
    { type: 'cross', agent: 'blossom', message: "Samurai - can we automate the content scheduling? Manual is killing me.", triggers: ['samurai'] },
    { type: 'cross', agent: 'johnny', message: "Blossom, need a case study for {client}. Got anything on {topic}?", triggers: ['blossom'] },
    { type: 'cross', agent: 'dexter', message: "Johnny - here's intel on {prospect}: {details}. Use it wisely.", triggers: ['johnny'] },
    
    // Daily standup style
    { type: 'standup', agent: 'dexter', message: "Morning all. Research queue: {count} items. Prioritizing {priority}.", triggers: ['all'] },
    { type: 'standup', agent: 'blossom', message: "Content calendar: {count} posts ready, {count} in draft. Need research for next week.", triggers: ['dexter'] },
    { type: 'standup', agent: 'samurai', message: "Shipped {count} features yesterday. Working on {current_task} today.", triggers: ['all'] },
    { type: 'standup', agent: 'johnny', message: "Pipeline update: {count} leads contacted, {count} replies, {count} meetings booked.", triggers: ['all'] },
    
    // Questions & brainstorming
    { type: 'brainstorm', agent: 'blossom', message: "Wild idea: What if we did {idea}? Too crazy?", triggers: ['all'] },
    { type: 'brainstorm', agent: 'johnny', message: "Client asked about {topic}. We don't have this yet. Opportunity?", triggers: ['all'] },
    
    // Wins & celebrations
    { type: 'win', agent: 'johnny', message: "🎉 Closed {client}! Deal size: {amount}. Great work team!", triggers: ['all'] },
    { type: 'win', agent: 'blossom', message: "Viral post alert! {count} views on yesterday's content. 🚀", triggers: ['all'] },
    
    // Help requests
    { type: 'help', agent: 'blossom', message: "Blocked on {task}. Need {resource} to proceed. Anyone?", triggers: ['samurai', 'dexter'] },
    { type: 'help', agent: 'johnny', message: "Technical question: Can we {question}? Samurai?", triggers: ['samurai'] },
];

const RESPONSES = {
    dexter: [
        "On it. Give me {time}.",
        "Interesting angle. Let me dig deeper.",
        "Data says: {insight}.",
        "Researching now. Will drop findings in ~{time}.",
        "Good call. I'll prioritize this.",
    ],
    blossom: [
        "Love this! Adding to content queue.",
        "Can we make it more {adjective}?",
        "Drafting now. Preview in {time}.",
        "Perfect angle for our audience.",
        "This could be a series. Thoughts?",
    ],
    samurai: [
        "Building now. ETA: {time}.",
        "Deploying to prod... Done. ✅",
        "Can optimize further. Worth it?",
        "Bug fixed. Testing now.",
        "New automation ready. Blossom, want to test?",
    ],
    johnny: [
        "💰 Opportunity! Following up now.",
        "This lead is hot. Prioritizing.",
        "Need content for {topic}. Blossom?",
        "Client loved our {deliverable}. More of this?",
        "Closing in on {target}. Almost there!",
    ],
    courage: [
        "Tracking this. Will remind in {time}.",
        "Client happy with response time! 🎉",
        "Escalating to {agent}.",
        "Inbox zero achieved. For now. 😅",
        "New inquiry auto-categorized. Routing...",
    ],
};

// Generate a conversation
function generateConversation() {
    const topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
    const initiator = AGENTS.find(a => a.id === topic.agent);
    
    // Fill in template variables
    let message = topic.message
        .replace('{finding}', 'something interesting')
        .replace('{topic}', 'content strategy')
        .replace('{trend}', 'a new pattern')
        .replace('{time}', '30 mins')
        .replace('{percent}', '25')
        .replace('{count}', '5')
        .replace('{lead_name}', 'a prospect')
        .replace('{client}', 'a new lead')
        .replace('{amount}', '$10K');
    
    return {
        agent: initiator,
        message: message,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: topic.type,
    };
}

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { generateConversation, AGENTS, CONVERSATION_TOPICS };
}

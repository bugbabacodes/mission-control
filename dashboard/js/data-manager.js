// Mission Control Data Manager
// Loads real data from JSON files via API or static paths

const DataManager = {
    cache: {
        agents: [],
        tasks: [],
        actionItems: [],
        content: [],
        leads: []
    },

    // Detect if running on Vercel (production) or locally
    getBasePath() {
        const isVercel = window.location.hostname.includes('vercel.app') || 
                         window.location.hostname !== 'localhost' && 
                         !window.location.hostname.includes('127.0.0.1');
        return isVercel ? '/database' : '../database';
    },

    paths() {
        const base = this.getBasePath();
        return {
            agents: `${base}/agents.json`,
            tasks: `${base}/tasks.json`,
            actionItems: `${base}/action-items.json`,
            content: `${base}/content-library.json`,
            leads: `${base}/leads.json`
        };
    },

    async fetchJson(path, fallback = []) {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (!res.ok) {
                console.warn(`[DataManager] Failed to load ${path}: ${res.status}`);
                throw new Error(`Failed to load ${path}`);
            }
            const data = await res.json();
            console.log(`[DataManager] Loaded ${path}:`, Array.isArray(data) ? `${data.length} items` : 'object');
            return data;
        } catch (err) {
            console.warn('[DataManager]', err.message);
            return fallback;
        }
    },

    async loadAll() {
        const paths = this.paths();
        console.log('[DataManager] Loading from:', paths);
        
        const [agents, tasks, actionItemsRaw, content] = await Promise.all([
            this.fetchJson(paths.agents, []),
            this.fetchJson(paths.tasks, []),
            this.fetchJson(paths.actionItems, { actionItems: [] }),
            this.fetchJson(paths.content, [])
        ]);

        const actionItems = Array.isArray(actionItemsRaw)
            ? actionItemsRaw
            : (actionItemsRaw.actionItems || []);

        this.cache = { agents, tasks, actionItems, content, leads: this.cache.leads };
        console.log('[DataManager] Cache loaded:', {
            agents: agents.length,
            tasks: tasks.length,
            content: content.length
        });
        return this.cache;
    },

    async loadLeads() {
        const paths = this.paths();
        const leads = await this.fetchJson(paths.leads, []);
        this.cache.leads = Array.isArray(leads) ? leads : [];
        console.log('[DataManager] Leads loaded:', this.cache.leads.length);
        return this.cache.leads;
    },

    // Getters
    getAgents() { return this.cache.agents || []; },
    getTasks() { return this.cache.tasks || []; },
    getActionItems() { return this.cache.actionItems || []; },
    getContent() { return this.cache.content || []; },
    getLeads() { return this.cache.leads || []; },

    // In-memory updates (UI-only)
    addTask(task) {
        task.id = task.id || 'task_' + Date.now();
        task.created_at = task.created_at || new Date().toISOString();
        task.status = task.status || 'pending';
        this.cache.tasks = [...this.cache.tasks, task];
        return task;
    },

    updateTask(id, updates) {
        this.cache.tasks = this.cache.tasks.map(t =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        );
        return this.cache.tasks.find(t => t.id === id);
    },

    addActionItem(item) {
        item.id = item.id || 'ai_' + Date.now();
        item.created_at = new Date().toISOString();
        this.cache.actionItems = [...this.cache.actionItems, item];
        return item;
    },

    updateActionItem(id, updates) {
        this.cache.actionItems = this.cache.actionItems.map(i =>
            i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
        );
        return this.cache.actionItems.find(i => i.id === id);
    },

    resolveActionItem(id, userResponse) {
        return this.updateActionItem(id, {
            status: 'resolved',
            user_response: userResponse,
            resolved_at: new Date().toISOString()
        });
    },

    // Agent CRUD (in-memory)
    addAgent(agent) {
        agent.id = agent.id || 'agent_' + Date.now();
        agent.created_at = agent.created_at || new Date().toISOString();
        agent.updated_at = new Date().toISOString();
        agent.status = agent.status || 'idle';
        this.cache.agents = [...this.cache.agents, agent];
        return agent;
    },

    updateAgent(id, updates) {
        this.cache.agents = this.cache.agents.map(a =>
            a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
        );
        return this.cache.agents.find(a => a.id === id);
    },

    deleteAgent(id) {
        this.cache.agents = this.cache.agents.filter(a => a.id !== id);
    },

    deleteTask(id) {
        this.cache.tasks = this.cache.tasks.filter(t => t.id !== id);
    },

    // Content CRUD (in-memory)
    addContent(item) {
        item.id = item.id || 'content_' + Date.now();
        item.created_at = item.created_at || new Date().toISOString();
        item.status = item.status || 'draft';
        this.cache.content = [...this.cache.content, item];
        return item;
    },

    updateContent(id, updates) {
        this.cache.content = this.cache.content.map(c =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        );
        return this.cache.content.find(c => c.id === id);
    },

    deleteContent(id) {
        this.cache.content = this.cache.content.filter(c => c.id !== id);
    },

    // Lead CRUD (in-memory)
    updateLead(id, updates) {
        this.cache.leads = this.cache.leads.map(l =>
            l.id === id ? { ...l, ...updates } : l
        );
        return this.cache.leads.find(l => l.id === id);
    },

    getStats() {
        const agents = this.getAgents();
        const tasks = this.getTasks();
        const actionItems = this.getActionItems();
        const content = this.getContent();
        const leads = this.getLeads();

        return {
            totalAgents: agents.length,
            activeAgents: agents.filter(a => a.status === 'working').length,
            idleAgents: agents.filter(a => a.status === 'idle').length,
            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => t.status === 'inbox' || t.status === 'pending').length,
            doneTasks: tasks.filter(t => t.status === 'done').length,
            totalActionItems: actionItems.length,
            pendingActionItems: actionItems.filter(i => i.status === 'pending').length,
            totalContent: content.length,
            draftContent: content.filter(c => c.status === 'draft').length,
            publishedContent: content.filter(c => c.status === 'published').length,
            totalLeads: leads.length
        };
    }
};

// Local Server (AI Execution)
    localServer: {
        // Try local first, fall back to tunnel
        urls: ['http://localhost:3847', 'https://afraid-quail-9.loca.lt'],
        currentUrl: null,
        tunnelPassword: '223.233.67.187'
    },

    async getLocalServerUrl() {
        if (this.localServer.currentUrl) return this.localServer.currentUrl;
        
        for (const url of this.localServer.urls) {
            try {
                const headers = url.includes('loca.lt') 
                    ? { 'bypass-tunnel-reminder': 'true' } 
                    : {};
                const res = await fetch(`${url}/health`, { 
                    headers, 
                    mode: 'cors',
                    signal: AbortSignal.timeout(3000)
                });
                if (res.ok) {
                    this.localServer.currentUrl = url;
                    console.log('[DataManager] Local server found at:', url);
                    return url;
                }
            } catch (e) {
                console.warn(`[DataManager] ${url} not reachable`);
            }
        }
        return null;
    },

    async executeTask(agentId, action, params = {}) {
        const baseUrl = await this.getLocalServerUrl();
        if (!baseUrl) {
            return { success: false, error: 'Local server not running. Start it with: node local-server.js' };
        }

        const headers = { 
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true'
        };

        try {
            const res = await fetch(`${baseUrl}/api/execute`, {
                method: 'POST',
                headers,
                mode: 'cors',
                body: JSON.stringify({ agentId, action, params })
            });
            return await res.json();
        } catch (e) {
            console.error('[DataManager] Execute failed:', e);
            return { success: false, error: e.message };
        }
    },

    async checkServerHealth() {
        const baseUrl = await this.getLocalServerUrl();
        if (!baseUrl) return { status: 'offline', message: 'Server not reachable' };
        
        try {
            const headers = baseUrl.includes('loca.lt') 
                ? { 'bypass-tunnel-reminder': 'true' } 
                : {};
            const res = await fetch(`${baseUrl}/health`, { headers, mode: 'cors' });
            return await res.json();
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    }
};

// Auto-initialize on load
console.log('[DataManager] Initialized, base path:', DataManager.getBasePath());

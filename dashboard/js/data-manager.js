// Mission Control Data Manager
// Loads real data from JSON files (no dummy data/localStorage)

const DataManager = {
    cache: {
        agents: [],
        tasks: [],
        actionItems: [],
        content: [],
        leads: []
    },

    paths: {
        agents: '../database/agents.json',
        tasks: '../database/tasks.json',
        actionItems: '../database/action-items.json',
        content: '../database/content-library.json',
        leads: '../database/leads.json'
    },

    async fetchJson(path, fallback = []) {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to load ${path}`);
            return await res.json();
        } catch (err) {
            console.warn('[DataManager]', err.message);
            return fallback;
        }
    },

    async loadAll() {
        const [agents, tasks, actionItemsRaw, content] = await Promise.all([
            this.fetchJson(this.paths.agents, []),
            this.fetchJson(this.paths.tasks, []),
            this.fetchJson(this.paths.actionItems, { actionItems: [] }),
            this.fetchJson(this.paths.content, [])
        ]);

        const actionItems = Array.isArray(actionItemsRaw)
            ? actionItemsRaw
            : (actionItemsRaw.actionItems || []);

        this.cache = { agents, tasks, actionItems, content, leads: this.cache.leads };
        return this.cache;
    },

    async loadLeads() {
        const leads = await this.fetchJson(this.paths.leads, []);
        this.cache.leads = Array.isArray(leads) ? leads : [];
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

    getStats() {
        const agents = this.getAgents();
        const tasks = this.getTasks();
        const actionItems = this.getActionItems();

        return {
            totalAgents: agents.length,
            activeAgents: agents.filter(a => a.status === 'working').length,
            idleAgents: agents.filter(a => a.status === 'idle').length,
            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => t.status === 'inbox' || t.status === 'pending').length,
            doneTasks: tasks.filter(t => t.status === 'done').length,
            totalActionItems: actionItems.length,
            pendingActionItems: actionItems.filter(i => i.status === 'pending').length
        };
    }
};

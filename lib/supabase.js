// Supabase client for Mission Control
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sphiehdyzgsybxywtysx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Simple fetch wrapper for Supabase REST API
async function supabaseFetch(table, options = {}) {
  const { method = 'GET', body, filters } = options;
  
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  if (filters) {
    const params = new URLSearchParams(filters);
    url += `?${params}`;
  }
  
  const response = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }
  
  return response.json();
}

// Database operations
const db = {
  // Action items
  async getActionItems() {
    return supabaseFetch('action_items', { 
      filters: { status: 'eq.pending', order: 'priority.desc' } 
    });
  },
  
  async createActionItem(item) {
    return supabaseFetch('action_items', { 
      method: 'POST', 
      body: item 
    });
  },
  
  async resolveActionItem(id) {
    return supabaseFetch(`action_items?id=eq.${id}`, { 
      method: 'PATCH', 
      body: { status: 'resolved', resolved_at: new Date().toISOString() } 
    });
  },
  
  // Agents
  async getAgents() {
    return supabaseFetch('agents');
  },
  
  async updateAgentStatus(id, status) {
    return supabaseFetch(`agents?id=eq.${id}`, { 
      method: 'PATCH', 
      body: { status, last_seen: new Date().toISOString() } 
    });
  },
  
  // Tasks
  async getTasks() {
    return supabaseFetch('tasks', { filters: { order: 'created_at.desc' } });
  },
  
  async createTask(task) {
    return supabaseFetch('tasks', { method: 'POST', body: task });
  },
  
  async completeTask(id) {
    return supabaseFetch(`tasks?id=eq.${id}`, { 
      method: 'PATCH', 
      body: { status: 'done', completed_at: new Date().toISOString() } 
    });
  },
  
  // Leads
  async getLeads() {
    return supabaseFetch('leads', { filters: { order: 'tier.asc' } });
  },
  
  async updateLeadStatus(id, status) {
    return supabaseFetch(`leads?id=eq.${id}`, { 
      method: 'PATCH', 
      body: { status, updated_at: new Date().toISOString() } 
    });
  },
  
  // Activities
  async logActivity(activity) {
    return supabaseFetch('activities', { 
      method: 'POST', 
      body: { ...activity, timestamp: new Date().toISOString() } 
    });
  },
  
  async getRecentActivities(limit = 10) {
    return supabaseFetch('activities', { 
      filters: { order: 'timestamp.desc', limit } 
    });
  }
};

module.exports = { supabaseFetch, db, SUPABASE_URL, SUPABASE_ANON_KEY };

/**
 * Dashboard Notification Utility
 * 
 * Use this module to notify the live dashboard when:
 * - Agents create action items
 * - Tasks are updated
 * - New activities occur
 * 
 * Usage:
 *   const { notifyDashboard } = require('./utils/dashboard-notify');
 *   await notifyDashboard('action_item_created', { agent: 'dexter', title: '...' });
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Dashboard URL - update this after deployment
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://mission-control-dashboard.vercel.app';

/**
 * Notify the dashboard of an update
 * @param {string} eventType - Type of event (action_item_created, task_updated, etc.)
 * @param {Object} payload - Event data
 */
async function notifyDashboard(eventType, payload = {}) {
  const url = new URL('/api/dashboard/notify', DASHBOARD_URL);
  
  const data = JSON.stringify({
    event: eventType,
    payload,
    timestamp: new Date().toISOString()
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error notifying dashboard:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Notify dashboard when an action item is created
 * @param {Object} actionItem - The action item data
 */
async function notifyActionItemCreated(actionItem) {
  return notifyDashboard('action_item_created', actionItem);
}

/**
 * Notify dashboard when a task is updated
 * @param {Object} task - The task data
 */
async function notifyTaskUpdated(task) {
  return notifyDashboard('task_updated', task);
}

/**
 * Notify dashboard of new activity
 * @param {Object} activity - The activity data
 */
async function notifyActivity(activity) {
  return notifyDashboard('activity', activity);
}

module.exports = {
  notifyDashboard,
  notifyActionItemCreated,
  notifyTaskUpdated,
  notifyActivity,
  DASHBOARD_URL
};

// CLI usage
if (require.main === module) {
  const eventType = process.argv[2];
  const payload = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  
  if (!eventType) {
    console.log('Usage: node dashboard-notify.js <event_type> [payload_json]');
    console.log('Example: node dashboard-notify.js action_item_created \'{"agent":"dexter"}\'');
    process.exit(1);
  }
  
  notifyDashboard(eventType, payload)
    .then(() => {
      console.log('✅ Dashboard notified successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to notify dashboard:', error.message);
      process.exit(1);
    });
}

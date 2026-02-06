// /api/outreach - Send outreach messages to leads
// POST: { leadId, type: 'email'|'linkedin_dm', subject?, message }

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Load leads data
async function getLeads() {
  try {
    const data = await fs.readFile(path.join(__dirname, '../database/leads.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - List leads with outreach status
  if (req.method === 'GET') {
    const leads = await getLeads();
    return res.status(200).json({
      total: leads.length,
      leads: leads.slice(0, 20), // First 20
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, type, subject, message, to } = req.body || {};
    
    if (!type || !message) {
      return res.status(400).json({ error: 'Missing type or message' });
    }

    let result;

    if (type === 'email') {
      // Check if gog is configured
      try {
        const { stdout } = await execAsync('gog auth list', { timeout: 5000 });
        
        if (stdout.includes('No tokens')) {
          return res.status(400).json({
            success: false,
            error: 'Gmail not configured. Run: gog auth add your@gmail.com --services gmail',
            action: 'setup_required'
          });
        }

        // Send email via gog
        const escapedSubject = (subject || 'Quick question').replace(/'/g, "'\\''");
        const escapedTo = to.replace(/'/g, "'\\''");
        
        // Write message to temp file for multi-line support
        const tempFile = `/tmp/outreach_${Date.now()}.txt`;
        await fs.writeFile(tempFile, message);
        
        const cmd = `gog gmail send --to '${escapedTo}' --subject '${escapedSubject}' --body-file '${tempFile}'`;
        
        const { stdout: sendOut, stderr } = await execAsync(cmd, { timeout: 30000 });
        
        // Cleanup
        await fs.unlink(tempFile).catch(() => {});
        
        result = {
          success: true,
          type: 'email',
          leadId,
          to,
          subject,
          message: 'Email sent successfully',
          output: sendOut,
          timestamp: new Date().toISOString()
        };
      } catch (cmdError) {
        result = {
          success: false,
          type: 'email',
          error: cmdError.message,
          timestamp: new Date().toISOString()
        };
      }
    } else if (type === 'linkedin_dm') {
      // LinkedIn DM requires browser automation
      result = {
        success: false,
        type: 'linkedin_dm',
        leadId,
        message: 'LinkedIn DMs require browser automation. Use unbrowse_browse.',
        action: 'browser_required',
        content: message,
        timestamp: new Date().toISOString()
      };
    } else if (type === 'linkedin_connect') {
      // LinkedIn connection request
      result = {
        success: false,
        type: 'linkedin_connect',
        leadId,
        message: 'LinkedIn connection requires browser automation.',
        action: 'browser_required',
        note: message,
        timestamp: new Date().toISOString()
      };
    } else {
      return res.status(400).json({ error: `Unsupported outreach type: ${type}` });
    }

    return res.status(result.success ? 200 : 500).json(result);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// /api/publish - Publish content to Twitter/LinkedIn
// POST: { platform: 'twitter'|'linkedin', content: string, contentId: number }

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platform, content, contentId, title } = req.body || {};
    
    if (!platform || !content) {
      return res.status(400).json({ error: 'Missing platform or content' });
    }

    let result;

    if (platform === 'twitter') {
      // Use bird CLI to post to Twitter
      // Escape content for shell
      const escapedContent = content.replace(/'/g, "'\\''");
      
      try {
        const { stdout, stderr } = await execAsync(`bird tweet '${escapedContent}'`, {
          timeout: 30000
        });
        
        result = {
          success: true,
          platform: 'twitter',
          contentId,
          message: 'Posted to Twitter successfully',
          output: stdout || stderr,
          timestamp: new Date().toISOString()
        };
      } catch (cmdError) {
        result = {
          success: false,
          platform: 'twitter',
          contentId,
          error: cmdError.message,
          stderr: cmdError.stderr,
          timestamp: new Date().toISOString()
        };
      }
    } else if (platform === 'linkedin') {
      // LinkedIn requires browser automation - queue for browser action
      result = {
        success: false,
        platform: 'linkedin',
        contentId,
        message: 'LinkedIn posting requires browser automation. Use the browser tool with unbrowse.',
        action: 'browser_required',
        content: content,
        timestamp: new Date().toISOString()
      };
    } else {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    return res.status(result.success ? 200 : 500).json(result);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

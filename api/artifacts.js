// /api/artifacts - Agent output storage and retrieval
// GET: List artifacts
// POST: Add new artifact

const fs = require('fs').promises;
const path = require('path');

// Sample artifacts to show initially
const SAMPLE_ARTIFACTS = [
  {
    id: 'art_sample_1',
    agentId: 'shakespeare',
    type: 'linkedin_post',
    title: 'LinkedIn: Startup Lessons',
    content: `I've built 100+ products. Here's what most founders get wrong about MVPs:

They spend weeks perfecting features nobody asked for.

The truth? Ship in 8 weeks. Everything else is procrastination dressed as productivity.

Your first version should embarrass you. If it doesn't, you waited too long.

What's your biggest shipping blocker? 👇`,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'draft'
  },
  {
    id: 'art_sample_2',
    agentId: 'marie_curie',
    type: 'research_report',
    title: 'Research: AI Consulting Market',
    content: `# AI Consulting Market Analysis

## Key Players
• McKinsey Digital
• Accenture AI
• Boutique AI agencies

## Opportunity
Mid-market gap: too big for freelancers, too small for Big 4.

## Our Position
Speed + depth + founder-friendly pricing.

---
*Marie Curie ☢️*`,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'completed'
  },
  {
    id: 'art_sample_3',
    agentId: 'nightingale',
    type: 'email_draft',
    title: 'Email: Outreach Template',
    content: `Subject: Quick thought on [Company]'s growth

Hi [Name],

Saw [specific thing] — impressive execution.

I help founders ship 4x faster. 100+ products. 8-week delivery.

Worth a 15-min chat?

Best,
Ishan`,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    status: 'draft'
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - List artifacts
  if (req.method === 'GET') {
    try {
      // Combine global quick action artifacts with samples
      const quickArtifacts = global.quickActionArtifacts || [];
      
      // Try to load from file (for persistence across cold starts)
      let fileArtifacts = [];
      try {
        const data = await fs.readFile(
          path.join(process.cwd(), 'database', 'artifacts.json'),
          'utf8'
        );
        fileArtifacts = JSON.parse(data);
      } catch {
        // File doesn't exist or can't be read
      }
      
      // Merge all sources, dedupe by ID
      const allArtifacts = [...quickArtifacts, ...fileArtifacts, ...SAMPLE_ARTIFACTS];
      const seen = new Set();
      const uniqueArtifacts = allArtifacts.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      
      // Sort by date
      uniqueArtifacts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      const limit = parseInt(req.query?.limit) || 20;
      
      return res.status(200).json({
        artifacts: uniqueArtifacts.slice(0, limit),
        total: uniqueArtifacts.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  // POST - Add artifact
  if (req.method === 'POST') {
    try {
      const artifact = req.body;
      
      if (!artifact || !artifact.content) {
        return res.status(400).json({ error: 'Missing artifact content' });
      }
      
      artifact.id = artifact.id || `art_${Date.now()}`;
      artifact.createdAt = artifact.createdAt || new Date().toISOString();
      artifact.status = artifact.status || 'draft';
      
      // Store in global
      if (!global.quickActionArtifacts) global.quickActionArtifacts = [];
      global.quickActionArtifacts.unshift(artifact);
      global.quickActionArtifacts = global.quickActionArtifacts.slice(0, 50);
      
      return res.status(201).json({
        success: true,
        artifact,
        message: 'Artifact saved'
      });
      
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  // DELETE - Remove artifact
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing artifact ID' });
    }
    
    if (global.quickActionArtifacts) {
      global.quickActionArtifacts = global.quickActionArtifacts.filter(a => a.id !== id);
    }
    
    return res.status(200).json({
      success: true,
      message: `Artifact ${id} deleted`
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};

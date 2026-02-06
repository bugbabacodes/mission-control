#!/usr/bin/env node
/**
 * Vercel API Deployment Script
 * Deploy Mission Control dashboard using Vercel REST API
 * 
 * Usage:
 *   export VERCEL_TOKEN="your_token_here"
 *   node deploy-api.js
 * 
 * Get your token from: https://vercel.com/account/tokens
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_Y1oeTQEBr1vM8HuNLUGfnbpl7Adg';
const TEAM_ID = 'team_GwnQKTNCUuRyuJA5NbffFawu';

if (!TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable required');
  console.error('   Get your token: https://vercel.com/account/tokens');
  console.error('   Then run: export VERCEL_TOKEN="your_token"');
  process.exit(1);
}

// Files to deploy
const files = [
  'vercel.json',
  'package.json',
  'api/live-dashboard.js',
  'api/index.js',
  'dashboard/live.html',
  'dashboard/index.html',
  'dashboard/agents.html',
  'dashboard/tasks.html',
  'dashboard/content.html',
  'dashboard/leads.html',
  'dashboard/chat.html',
];

async function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path + (path.includes('?') ? '&' : '?') + `teamId=${TEAM_ID}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getFileHashes() {
  const hashes = [];
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      continue;
    }
    
    const content = fs.readFileSync(filePath);
    const hash = require('crypto').createHash('sha1').update(content).digest('hex');
    
    hashes.push({
      file,
      hash,
      content: content.toString('base64'),
      encoding: 'base64',
      size: content.length,
    });
  }
  
  return hashes;
}

async function deploy() {
  console.log('🚀 Mission Control Dashboard Deployment');
  console.log('=======================================\n');
  
  try {
    // Get file hashes
    console.log('📦 Preparing files...');
    const fileHashes = await getFileHashes();
    console.log(`   ${fileHashes.length} files ready\n`);
    
    // Create deployment
    console.log('📤 Creating deployment...');
    const deployment = await makeRequest('/v13/deployments', 'POST', {
      name: 'mission-control',
      project: PROJECT_ID,
      target: 'production',
      files: fileHashes.map(f => ({
        file: f.file,
        data: f.content,
        encoding: f.encoding,
      })),
    });
    
    if (deployment.error) {
      throw new Error(deployment.error.message || JSON.stringify(deployment.error));
    }
    
    console.log(`✅ Deployment created!`);
    console.log(`   ID: ${deployment.id || deployment.deploymentId}`);
    console.log(`   URL: ${deployment.url}`);
    
    if (deployment.alias && deployment.alias.length > 0) {
      console.log(`\n🌐 Production URL:`);
      deployment.alias.forEach(alias => {
        console.log(`   https://${alias}`);
      });
    }
    
    console.log('\n✨ Deployment in progress...');
    console.log('   Check status at: https://vercel.com/dashboard');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    if (error.message.includes('Unauthorized') || error.message.includes('FORBIDDEN')) {
      console.error('\n🔑 Authentication issue:');
      console.error('   1. Get a token: https://vercel.com/account/tokens');
      console.error('   2. Run: export VERCEL_TOKEN="your_token"');
      console.error('   3. Try again: node deploy-api.js');
    }
    
    process.exit(1);
  }
}

deploy();

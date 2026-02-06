#!/usr/bin/env node

/**
 * X/Twitter Bookmark Processor — Enhanced
 * 
 * Fetches bookmarks → Summarizes (150 words) → Saves with link
 * Run: node x-bookmark-processor.js
 * Cron: Daily at midnight
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Config
const OUTPUT_DIR = path.join(__dirname, '../../second-brain/x-bookmarks');
const APPLE_NOTES_FOLDER = '🐦 X Bookmarks';
const MAX_BOOKMARKS = 20;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Categories based on Ishan's interests
const CATEGORIES = {
  'AI': ['ai', 'llm', 'gpt', 'claude', 'prompt', 'machine learning', 'neural'],
  'SaaS': ['saas', 'startup', 'building', 'shipping', 'product', 'mvp'],
  'Agents': ['agent', 'automation', 'workflow', 'bot'],
  'Marketing': ['seo', 'marketing', 'growth', 'acquisition', 'funnel'],
  'Sports': ['liverpool', 'football', 'cricket', 'rcb', 'ipl', 'premier league'],
  'Web3': ['web3', 'crypto', 'nft', 'blockchain', 'defi', 'eth', 'solana'],
  'Zero-to-One': ['founder', 'zero to one', 'build in public', 'indiehacker'],
  'Business': ['revenue', 'pricing', 'sales', 'client', 'consulting']
};

/**
 * Fetch bookmarks using bird CLI
 */
function fetchBookmarks() {
  try {
    const output = execSync('bird bookmarks --json --limit 20', { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error.message);
    return [];
  }
}

/**
 * Fetch full content from URL
 */
async function fetchContent(url) {
  try {
    // Use web_fetch equivalent via curl
    const output = execSync(`curl -sL "${url}" | head -c 10000`, { encoding: 'utf-8', timeout: 10000 });
    // Clean up HTML
    return output.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return '';
  }
}

/**
 * Generate 150-word summary using LLM
 * Note: This would call an LLM API in production
 * For now, we'll create a structured format
 */
function generateSummary(tweet, fullContent) {
  // In production, this would call an LLM API
  // For now, return structured placeholder
  const text = tweet.text || tweet.content || '';
  const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text;
  
  return {
    summary: truncated, // Placeholder - would be 150-word LLM summary
    fullText: text,
    needsLLM: true
  };
}

/**
 * Categorize bookmark
 */
function categorize(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) {
      return category;
    }
  }
  return 'General';
}

/**
 * Generate priority based on Ishan's interests
 */
function getPriority(category) {
  const high = ['AI', 'SaaS', 'Agents', 'Zero-to-One'];
  const medium = ['Marketing', 'Business', 'Web3'];
  
  if (high.includes(category)) return '🔥 High';
  if (medium.includes(category)) return '⚡ Medium';
  return '💤 Low';
}

/**
 * Format bookmark for output
 */
function formatBookmark(bookmark, index) {
  const date = new Date().toISOString().split('T')[0];
  const url = bookmark.url || bookmark.link || `https://twitter.com/i/bookmarks`;
  const author = bookmark.author || bookmark.username || 'Unknown';
  const text = bookmark.text || bookmark.content || '';
  const category = categorize(text);
  const priority = getPriority(category);
  const summary = generateSummary(bookmark, '');
  
  return `## 🐦 Bookmark ${index + 1} — ${date}

**Source:** @${author}
**Link:** ${url}
**Category:** ${category}
**Priority:** ${priority}

**Summary (150 words):**
${summary.summary}

**Full Thread:**
${summary.fullText}

**Key Takeaways:**
• [To be extracted from full content]
• [To be extracted from full content]
• [To be extracted from full content]

**Why This Matters:**
[Connection to Ishan's interests/projects - to be added]

---

`;
}

/**
 * Save to Apple Notes
 */
function saveToAppleNotes(content, title) {
  try {
    // Use AppleScript to create note
    const script = `
      tell application "Notes"
        tell folder "${APPLE_NOTES_FOLDER}"
          make new note with properties {name:"${title}", body:"${content.replace(/"/g, '\\"')}"}
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`);
    return true;
  } catch (error) {
    console.error('Failed to save to Apple Notes:', error.message);
    return false;
  }
}

/**
 * Save to local file
 */
function saveToLocal(content, filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Main processor
 */
async function processBookmarks() {
  console.log('🐦 X Bookmark Processor — Starting...\n');
  
  const date = new Date().toISOString().split('T')[0];
  const bookmarks = fetchBookmarks();
  
  if (bookmarks.length === 0) {
    console.log('No bookmarks found.');
    return;
  }
  
  console.log(`Found ${bookmarks.length} bookmarks\n`);
  
  let fullContent = `# 🐦 X Bookmarks — ${date}\n\n`;
  fullContent += `*Processed: ${new Date().toLocaleString()}*\n\n`;
  fullContent += `---\n\n`;
  
  for (let i = 0; i < Math.min(bookmarks.length, MAX_BOOKMARKS); i++) {
    const bookmark = bookmarks[i];
    console.log(`Processing bookmark ${i + 1}/${Math.min(bookmarks.length, MAX_BOOKMARKS)}...`);
    
    const formatted = formatBookmark(bookmark, i);
    fullContent += formatted;
  }
  
  // Add index
  fullContent += `\n## Index\n\n`;
  bookmarks.slice(0, MAX_BOOKMARKS).forEach((b, i) => {
    const category = categorize(b.text || '');
    fullContent += `${i + 1}. [Bookmark ${i + 1}](#bookmark-${i + 1}) — ${category}\n`;
  });
  
  // Save locally
  const filename = `bookmarks-${date}.md`;
  const localPath = saveToLocal(fullContent, filename);
  console.log(`\n✅ Saved locally: ${localPath}`);
  
  // Save to Apple Notes
  const savedToNotes = saveToAppleNotes(fullContent, `X Bookmarks ${date}`);
  if (savedToNotes) {
    console.log(`✅ Saved to Apple Notes: ${APPLE_NOTES_FOLDER}`);
  }
  
  // Update index
  updateIndex(date, bookmarks.length);
  
  console.log('\n🎉 Processing complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   • Bookmarks processed: ${bookmarks.length}`);
  console.log(`   • Local file: ${filename}`);
  console.log(`   • Apple Notes: ${savedToNotes ? '✅' : '❌'}`);
}

/**
 * Update master index
 */
function updateIndex(date, count) {
  const indexPath = path.join(OUTPUT_DIR, 'index.md');
  let index = '';
  
  if (fs.existsSync(indexPath)) {
    index = fs.readFileSync(indexPath, 'utf-8');
  } else {
    index = `# 🐦 X Bookmarks Index\n\n*All bookmark summaries organized by date*\n\n`;
  }
  
  const entry = `| ${date} | [bookmarks-${date}.md](bookmarks-${date}.md) | ${count} |\n`;
  
  if (!index.includes(date)) {
    // Add table header if new
    if (!index.includes('| Date |')) {
      index += `\n| Date | File | Count |\n`;
      index += `|------|------|-------|\n`;
    }
    index += entry;
    fs.writeFileSync(indexPath, index, 'utf-8');
  }
}

// Run
processBookmarks().catch(console.error);

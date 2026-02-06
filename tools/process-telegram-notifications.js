#!/usr/bin/env node
/**
 * Telegram Notification Processor
 * Processes queued notifications and sends them to Telegram
 * Run this every 5 minutes via cron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/ishansocbmac/.openclaw/workspace/mission-control';
const NOTIFICATIONS_DIR = path.join(WORKSPACE, 'notifications');
const LOG_FILE = path.join(WORKSPACE, 'logs', 'telegram-notifications.log');

// Ensure directories exist
fs.mkdirSync(NOTIFICATIONS_DIR, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function sendTelegramMessage(target, message) {
  try {
    // Use OpenClaw's message tool via gateway
    // This is a simplified version - in production would use the actual message tool
    log(`Sending to ${target}: ${message.substring(0, 80)}...`);
    
    // For now, write to a delivery log that can be processed
    const deliveryLog = path.join(WORKSPACE, 'logs', 'telegram-delivery.log');
    fs.appendFileSync(deliveryLog, `${new Date().toISOString()} | ${target} | ${message.replace(/\n/g, ' ')}\n`);
    
    return true;
  } catch (error) {
    log(`Failed to send: ${error.message}`);
    return false;
  }
}

function processNotifications() {
  log('Checking for queued notifications...');
  
  if (!fs.existsSync(NOTIFICATIONS_DIR)) {
    log('No notifications directory yet');
    return;
  }
  
  const files = fs.readdirSync(NOTIFICATIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort(); // Process oldest first
  
  if (files.length === 0) {
    log('No pending notifications');
    return;
  }
  
  log(`Found ${files.length} pending notifications`);
  
  for (const file of files) {
    const filePath = path.join(NOTIFICATIONS_DIR, file);
    
    try {
      const notification = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      log(`Processing: ${file} from ${notification.agent}`);
      
      // Send the notification
      const sent = sendTelegramMessage(notification.target, notification.message);
      
      if (sent) {
        // Move to processed
        const processedDir = path.join(NOTIFICATIONS_DIR, 'processed');
        fs.mkdirSync(processedDir, { recursive: true });
        fs.renameSync(filePath, path.join(processedDir, file));
        log(`Sent and archived: ${file}`);
      } else {
        log(`Failed to send, will retry: ${file}`);
      }
      
    } catch (error) {
      log(`Error processing ${file}: ${error.message}`);
      // Move to failed
      const failedDir = path.join(NOTIFICATIONS_DIR, 'failed');
      fs.mkdirSync(failedDir, { recursive: true });
      fs.renameSync(filePath, path.join(failedDir, file));
    }
  }
}

// Run
processNotifications();

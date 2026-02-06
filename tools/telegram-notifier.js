// Telegram notification system for Mission Control
// Sends proactive updates to Ishan's Telegram for important events

const TELEGRAM_USER_ID = '824597116';

// Notification types
const NOTIFICATIONS = {
  // Research drops
  RESEARCH_DROP: {
    emoji: '🧪',
    title: 'Dexter Research Drop',
    priority: 'high'
  },
  
  // Content ready
  CONTENT_READY: {
    emoji: '🌸',
    title: 'Blossom Content Ready',
    priority: 'high'
  },
  
  // Lead updates
  LEAD_WIN: {
    emoji: '🕶️',
    title: 'Johnny Bravo Lead Update',
    priority: 'high'
  },
  
  // Deployments
  DEPLOYMENT: {
    emoji: '⚔️',
    title: 'Samurai Jack Deployment',
    priority: 'medium'
  },
  
  // Client updates
  CLIENT_UPDATE: {
    emoji: '🐾',
    title: 'Courage Client Update',
    priority: 'medium'
  },
  
  // Morning brief
  MORNING_BRIEF: {
    emoji: '🌅',
    title: 'Morning Brief',
    priority: 'high'
  },
  
  // Research report
  RESEARCH_REPORT: {
    emoji: '📊',
    title: 'Research Report',
    priority: 'high'
  },
  
  // Nightly build
  NIGHTLY_BUILD: {
    emoji: '🌙',
    title: 'Nightly Build Complete',
    priority: 'medium'
  },
  
  // System alerts
  SYSTEM_ALERT: {
    emoji: '⚠️',
    title: 'System Alert',
    priority: 'high'
  }
};

// Send notification
async function sendNotification(type, message, details = {}) {
  const config = NOTIFICATIONS[type];
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Calcutta'
  });
  
  const formattedMessage = `${config.emoji} **${config.title}** — ${timestamp}

${message}

${details.link ? `🔗 ${details.link}` : ''}`;

  // Use the message tool to send to Telegram
  // This will be called by the notification system
  return {
    target: TELEGRAM_USER_ID,
    message: formattedMessage,
    priority: config.priority
  };
}

// Export for use
module.exports = {
  sendNotification,
  NOTIFICATIONS,
  TELEGRAM_USER_ID
};

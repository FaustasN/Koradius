const { Worker } = require('bullmq');
const { notificationQueue, redisConfig } = require('./config');

// Notification processing job processor
const notificationWorker = new Worker('notification processing', async (job) => {
  const { type, recipients, title, message, data } = job.data;
  
  console.log(`Processing notification job ${job.id}: ${type} for ${recipients.length} recipients`);
  
  try {
    switch (type) {
      case 'email':
        return await sendEmailNotification(recipients, title, message, data);
      case 'push':
        return await sendPushNotification(recipients, title, message, data);
      case 'sms':
        return await sendSMSNotification(recipients, message, data);
      case 'admin-alert':
        return await sendAdminAlert(title, message, data);
      case 'system':
        return await processSystemNotification(title, message, data);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  } catch (error) {
    console.error(`Notification processing failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 5,
});

// Notification processing functions
async function sendEmailNotification(recipients, title, message, data) {
  // This would integrate with the email queue
  const { queueEmail } = require('./emailQueue');
  
  const results = [];
  for (const recipient of recipients) {
    try {
      const emailJob = await queueEmail({
        to: recipient,
        subject: title,
        html: formatEmailNotification(message, data)
      }, { priority: 'medium' });
      
      results.push({
        recipient,
        status: 'queued',
        jobId: emailJob.id
      });
    } catch (error) {
      results.push({
        recipient,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    type: 'email',
    results,
    processed: results.length
  };
}

async function sendPushNotification(recipients, title, message, data) {
  // Placeholder for push notification logic (Firebase, OneSignal, etc.)
  console.log(`Push notification sent to ${recipients.length} recipients: ${title}`);
  
  return {
    success: true,
    type: 'push',
    recipients: recipients.length,
    title,
    message,
    sentAt: new Date().toISOString()
  };
}

async function sendSMSNotification(recipients, message, data) {
  // Placeholder for SMS notification logic (Twilio, etc.)
  console.log(`SMS notification sent to ${recipients.length} recipients: ${message}`);
  
  return {
    success: true,
    type: 'sms',
    recipients: recipients.length,
    message,
    sentAt: new Date().toISOString()
  };
}

async function sendAdminAlert(title, message, data) {
  // Send urgent notifications to admin users
  console.log(`Admin alert: ${title} - ${message}`);
  
  // This could integrate with admin dashboard notifications
  // For now, just log and return success
  return {
    success: true,
    type: 'admin-alert',
    title,
    message,
    severity: data.severity || 'medium',
    timestamp: new Date().toISOString()
  };
}

async function processSystemNotification(title, message, data) {
  // Handle system-level notifications (logging, monitoring, etc.)
  console.log(`System notification: ${title} - ${message}`);
  
  // Could integrate with monitoring systems like DataDog, New Relic, etc.
  return {
    success: true,
    type: 'system',
    title,
    message,
    metadata: data,
    timestamp: new Date().toISOString()
  };
}

function formatEmailNotification(message, data) {
  // Format notification as HTML email
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Koradius Notification</h2>
        <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6;">${message}</p>
          ${data.actionUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${data.actionUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                ${data.actionText || 'View Details'}
              </a>
            </div>
          ` : ''}
        </div>
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated notification from Koradius system.
        </p>
      </div>
    </div>
  `;
}

// Worker event listeners
notificationWorker.on('completed', (job, result) => {
  console.log(`Notification job ${job.id} completed:`, result);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err.message);
});

notificationWorker.on('stalled', (job) => {
  console.warn(`Notification job ${job.id} stalled`);
});

// Helper function to add notification to queue
const queueNotification = async (type, recipients, title, message, data = {}, options = {}) => {
  const priority = options.priority || 'normal';
  
  let jobPriority;
  switch (priority) {
    case 'urgent':
      jobPriority = 4;
      break;
    case 'high':
      jobPriority = 3;
      break;
    case 'medium':
      jobPriority = 2;
      break;
    default:
      jobPriority = 1;
  }
  
  const jobOptions = {
    priority: jobPriority,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 20,
    removeOnFail: 10,
  };
  
  const job = await notificationQueue.add('send-notification', {
    type,
    recipients: Array.isArray(recipients) ? recipients : [recipients],
    title,
    message,
    data
  }, jobOptions);
  
  console.log(`Notification '${type}' queued with ID: ${job.id}, Priority: ${priority}`);
  return job;
};

module.exports = {
  notificationQueue,
  notificationWorker,
  queueNotification,
};

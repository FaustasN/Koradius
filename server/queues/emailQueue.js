const nodemailer = require('nodemailer');
const { Worker } = require('bullmq');
const { emailQueue, redisConfig } = require('./config');

// Email transporter (reuse from main server)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email job processor
const emailWorker = new Worker('email processing', async (job) => {
  const { to, subject, text, html } = job.data;
  
  console.log(`Processing email job ${job.id}: ${subject}`);
  
  // Validate required fields
  if (!to || to.trim() === '') {
    throw new Error(`No recipient specified for email job ${job.id}`);
  }
  
  if (!subject || subject.trim() === '') {
    throw new Error(`No subject specified for email job ${job.id}`);
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to.trim(),
      subject: subject.trim(),
      text: text || '',
      html: html || text || ''
    };
    
    console.log(`Sending email to: ${mailOptions.to}, subject: ${mailOptions.subject}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${job.id}, messageId: ${result.messageId}`);
    return { success: true, messageId: result.messageId, recipient: mailOptions.to };
    
  } catch (error) {
    console.error(`Email sending failed for job ${job.id}:`, error);
    throw error; // This will trigger retry logic
  }
}, {
  connection: redisConfig,
  concurrency: 5,
});

// Worker event listeners
emailWorker.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed:`, result);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

emailWorker.on('stalled', (job) => {
  console.warn(`Email job ${job.id} stalled`);
});

// Helper function to add email to queue
const queueEmail = async (emailData, options = {}) => {
  const priority = options.priority || 'normal';
  
  // Convert priority to number for BullMQ
  let jobPriority;
  switch (priority) {
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
    removeOnComplete: 10,
    removeOnFail: 5,
  };
  
  const job = await emailQueue.add('send-email', emailData, jobOptions);
  
  console.log(`Email queued with ID: ${job.id}, Priority: ${priority}`);
  return job;
};

module.exports = {
  emailQueue,
  emailWorker,
  queueEmail,
};

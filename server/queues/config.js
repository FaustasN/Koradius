const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required by BullMQ
};

// Create Redis connection
const redis = new Redis(redisConfig);

// Initialize queues
const emailQueue = new Queue('email processing', { connection: redisConfig });
const fileQueue = new Queue('file processing', { connection: redisConfig });
const notificationQueue = new Queue('notification processing', { connection: redisConfig });
const loggingQueue = new Queue('logging processing', { connection: redisConfig });
const databaseQueue = new Queue('database processing', { connection: redisConfig });
const analyticsQueue = new Queue('analytics processing', { connection: redisConfig });
const monitoringQueue = new Queue('monitoring processing', { connection: redisConfig });
const paymentQueue = new Queue('payment processing', { connection: redisConfig });

module.exports = {
  redis,
  emailQueue,
  fileQueue,
  notificationQueue,
  loggingQueue,
  databaseQueue,
  analyticsQueue,
  monitoringQueue,
  paymentQueue,
  redisConfig,
};

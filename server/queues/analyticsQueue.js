const { Worker } = require('bullmq');
const { analyticsQueue, redisConfig } = require('./config');
const { Pool } = require('pg');

// Simple database utility for analytics workers
const createDbConnection = () => {
  return new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'koradius_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    max: 2, // Minimal connections for analytics operations
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  });
};

// Analytics processing job processor
const analyticsWorker = new Worker('analytics processing', async (job) => {
  const { operation, data, timeframe } = job.data;
  
  console.log(`Processing analytics job ${job.id}: ${operation} for timeframe ${timeframe}`);
  
  try {
    switch (operation) {
      case 'contact-analytics':
        return await generateContactAnalytics(data, timeframe);
      case 'review-analytics':
        return await generateReviewAnalytics(data, timeframe);
      case 'upload-analytics':
        return await generateUploadAnalytics(data, timeframe);
      case 'performance-metrics':
        return await generatePerformanceMetrics(data, timeframe);
      case 'user-engagement':
        return await generateUserEngagementReport(data, timeframe);
      case 'system-health-report':
        return await generateSystemHealthReport(data, timeframe);
      case 'security-audit':
        return await generateSecurityAuditReport(data, timeframe);
      default:
        throw new Error(`Unknown analytics operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Analytics operation failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 2, // Limited concurrency for resource-intensive operations
});

// Analytics operations
async function generateContactAnalytics(data, timeframe) {
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  return await DatabaseConnection.executeWithConnection(async (pool) => {
    // Contact submission trends
    const contactTrends = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as submissions,
        COUNT(CASE WHEN urgency = 'urgent' THEN 1 END) as urgent_count,
        COUNT(CASE WHEN urgency = 'emergency' THEN 1 END) as emergency_count,
        COUNT(CASE WHEN is_resolved = true THEN 1 END) as resolved_count
      FROM contacts 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);
    
    // Response time analytics
    const responseTime = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_response_hours,
        MIN(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as min_response_hours,
        MAX(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as max_response_hours
      FROM contacts 
      WHERE is_resolved = true AND created_at BETWEEN $1 AND $2
    `, [startDate, endDate]);
    
    // Subject category analysis
    const subjectAnalysis = await pool.query(`
      SELECT 
        subject,
        COUNT(*) as frequency,
        COUNT(CASE WHEN is_resolved = true THEN 1 END) as resolved_count
      FROM contacts 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY subject
      ORDER BY frequency DESC
      LIMIT 10
    `, [startDate, endDate]);
    
    return {
      success: true,
      operation: 'contact-analytics',
      timeframe,
      data: {
        trends: contactTrends.rows,
        responseTime: responseTime.rows[0],
        subjectAnalysis: subjectAnalysis.rows
      },
      generatedAt: new Date().toISOString()
    };
  });
}

async function generateReviewAnalytics(data, timeframe) {
  const { pool } = data;
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  // Review submission trends
  const reviewTrends = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as submissions,
      AVG(rating) as avg_rating,
      COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_count
    FROM user_reviews 
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE(created_at)
    ORDER BY date
  `, [startDate, endDate]);
  
  // Rating distribution
  const ratingDistribution = await pool.query(`
    SELECT 
      rating,
      COUNT(*) as count,
      ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
    FROM user_reviews 
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY rating
    ORDER BY rating
  `, [startDate, endDate]);
  
  // Trip reference analysis
  const tripAnalysis = await pool.query(`
    SELECT 
      trip_reference,
      COUNT(*) as review_count,
      AVG(rating) as avg_rating
    FROM user_reviews 
    WHERE trip_reference IS NOT NULL AND created_at BETWEEN $1 AND $2
    GROUP BY trip_reference
    ORDER BY review_count DESC
    LIMIT 10
  `, [startDate, endDate]);
  
  return {
    success: true,
    operation: 'review-analytics',
    timeframe,
    data: {
      trends: reviewTrends.rows,
      ratingDistribution: ratingDistribution.rows,
      tripAnalysis: tripAnalysis.rows
    },
    generatedAt: new Date().toISOString()
  };
}

async function generateUploadAnalytics(data, timeframe) {
  const { pool } = data;
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  // Gallery upload trends
  const galleryTrends = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as uploads,
      COUNT(CASE WHEN category = 'landscape' THEN 1 END) as landscape_count,
      COUNT(CASE WHEN category = 'cultural' THEN 1 END) as cultural_count,
      COUNT(CASE WHEN category = 'adventure' THEN 1 END) as adventure_count
    FROM gallery 
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE(created_at)
    ORDER BY date
  `, [startDate, endDate]);
  
  // Travel packets upload trends
  const packetTrends = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as uploads,
      COUNT(CASE WHEN category = 'europe' THEN 1 END) as europe_count,
      COUNT(CASE WHEN category = 'asia' THEN 1 END) as asia_count,
      COUNT(CASE WHEN category = 'africa' THEN 1 END) as africa_count
    FROM travel_packets 
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY DATE(created_at)
    ORDER BY date
  `, [startDate, endDate]);
  
  return {
    success: true,
    operation: 'upload-analytics',
    timeframe,
    data: {
      galleryTrends: galleryTrends.rows,
      packetTrends: packetTrends.rows
    },
    generatedAt: new Date().toISOString()
  };
}

async function generatePerformanceMetrics(data, timeframe) {
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  const pool = createDbConnection();
  try {
    // Log analysis for performance
    const errorAnalysis = await pool.query(`
      SELECT 
        level,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM logs 
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY level, DATE(timestamp)
      ORDER BY date, level
    `, [startDate, endDate]);
  
    // Instance performance
    const instancePerformance = await pool.query(`
      SELECT 
        instance_id,
        COUNT(*) as log_count,
        COUNT(CASE WHEN level = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN level = 'warn' THEN 1 END) as warning_count
      FROM logs 
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY instance_id
      ORDER BY log_count DESC
    `, [startDate, endDate]);
    
    return {
      success: true,
      operation: 'performance-metrics',
      timeframe,
      data: {
        errorAnalysis: errorAnalysis.rows,
        instancePerformance: instancePerformance.rows
      },
      generatedAt: new Date().toISOString()
    };
  } finally {
    await pool.end();
  }
}

async function generateUserEngagementReport(data, timeframe) {
  const { pool } = data;
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  // Engagement metrics
  const engagement = await pool.query(`
    SELECT 
      'contacts' as metric,
      COUNT(*) as total_count,
      COUNT(DISTINCT ip_address) as unique_visitors
    FROM contacts 
    WHERE created_at BETWEEN $1 AND $2
    
    UNION ALL
    
    SELECT 
      'reviews' as metric,
      COUNT(*) as total_count,
      COUNT(DISTINCT ip_address) as unique_visitors
    FROM user_reviews 
    WHERE created_at BETWEEN $1 AND $2
  `, [startDate, endDate]);
  
  return {
    success: true,
    operation: 'user-engagement',
    timeframe,
    data: {
      engagement: engagement.rows
    },
    generatedAt: new Date().toISOString()
  };
}

async function generateSystemHealthReport(data, timeframe) {
  const { pool } = data;
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  // System health metrics from logs
  const healthMetrics = await pool.query(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
      COUNT(CASE WHEN level = 'warn' THEN 1 END) as warnings,
      COUNT(CASE WHEN level = 'info' THEN 1 END) as info_logs,
      COUNT(*) as total_logs
    FROM logs 
    WHERE timestamp BETWEEN $1 AND $2
    GROUP BY DATE(timestamp)
    ORDER BY date
  `, [startDate, endDate]);
  
  return {
    success: true,
    operation: 'system-health-report',
    timeframe,
    data: {
      healthMetrics: healthMetrics.rows
    },
    generatedAt: new Date().toISOString()
  };
}

async function generateSecurityAuditReport(data, timeframe) {
  const { pool } = data;
  const { startDate, endDate } = getTimeframeDates(timeframe);
  
  // Security events from audit logs
  const securityEvents = await pool.query(`
    SELECT 
      ip_address,
      user_agent,
      COUNT(*) as request_count,
      MIN(timestamp) as first_seen,
      MAX(timestamp) as last_seen
    FROM logs 
    WHERE log_type = 'audit' 
      AND timestamp BETWEEN $1 AND $2
    GROUP BY ip_address, user_agent
    HAVING COUNT(*) > 10  -- Flag high-frequency requests
    ORDER BY request_count DESC
    LIMIT 20
  `, [startDate, endDate]);
  
  // Failed login attempts (if available)
  const failedLogins = await pool.query(`
    SELECT 
      ip_address,
      COUNT(*) as failed_attempts,
      MAX(timestamp) as last_attempt
    FROM logs 
    WHERE message ILIKE '%login failed%' 
      AND timestamp BETWEEN $1 AND $2
    GROUP BY ip_address
    ORDER BY failed_attempts DESC
    LIMIT 10
  `, [startDate, endDate]);
  
  return {
    success: true,
    operation: 'security-audit',
    timeframe,
    data: {
      securityEvents: securityEvents.rows,
      failedLogins: failedLogins.rows
    },
    generatedAt: new Date().toISOString()
  };
}

// Helper function to get timeframe dates
function getTimeframeDates(timeframe) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7); // Default to weekly
  }
  
  return { startDate, endDate };
}

// Worker event listeners
analyticsWorker.on('completed', (job, result) => {
  console.log(`Analytics job ${job.id} completed:`, result.operation);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`Analytics job ${job.id} failed:`, err.message);
});

analyticsWorker.on('stalled', (job) => {
  console.warn(`Analytics job ${job.id} stalled`);
});

// Helper function to queue analytics operations
const queueAnalyticsOperation = async (operation, data = {}, timeframe = 'weekly', options = {}) => {
  const priority = options.priority || 'low';
  
  // Create clean job data with only primitive values
  const cleanData = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      // Only include primitive values, strings, numbers, booleans, or simple arrays
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
          (Array.isArray(value) && value.every(item => typeof item === 'string' || typeof item === 'number'))) {
        cleanData[key] = value;
      } else {
        console.warn(`Skipping non-primitive value for key '${key}' in analytics job data`);
      }
    }
  }
  
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
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
    delay: options.delay || 0,
  };
  
  const jobData = {
    operation: String(operation),
    data: cleanData,
    timeframe: String(timeframe)
  };
  
  console.log(`Queueing analytics operation '${operation}' with clean data:`, JSON.stringify(jobData));
  
  const job = await analyticsQueue.add('analytics-operation', jobData, jobOptions);
  
  console.log(`Analytics operation '${operation}' queued with ID: ${job.id}, Timeframe: ${timeframe}`);
  return job;
};

module.exports = {
  analyticsQueue,
  analyticsWorker,
  queueAnalyticsOperation,
};

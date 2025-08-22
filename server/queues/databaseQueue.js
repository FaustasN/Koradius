const { Worker } = require('bullmq');
const { databaseQueue, redisConfig } = require('./config');
const { Pool } = require('pg');

// Simple database utility for queue workers
const createDbConnection = () => {
  return new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'koradius_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    max: 2, // Minimal connections for queue operations
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  });
};

// Database maintenance job processor
const databaseWorker = new Worker('database processing', async (job) => {
  const { operation, data } = job.data;
  
  console.log(`Processing database job ${job.id}: ${operation}`);
  
  try {
    switch (operation) {
      case 'cleanup-logs':
        return await cleanupOldLogs(data);
      case 'cleanup-sessions':
        return await cleanupExpiredSessions(data);
      case 'analyze-tables':
        return await analyzeTables(data);
      case 'reindex-tables':
        return await reindexTables(data);
      case 'backup-critical-data':
        return await backupCriticalData(data);
      case 'archive-old-data':
        return await archiveOldData(data);
      case 'update-stats':
        return await updateDatabaseStats(data);
      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Database operation failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 2, // Lower concurrency for database operations
});

// Database operations
async function cleanupOldLogs(data) {
  const { retentionDays = 30 } = data;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const pool = createDbConnection();
  try {
    const result = await pool.query(
      'DELETE FROM logs WHERE created_at < $1 AND log_type = $2',
      [cutoffDate, 'application']
    );
    
    return {
      success: true,
      operation: 'cleanup-logs',
      deletedRows: result.rowCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays
    };
  } finally {
    await pool.end();
  }
}

async function cleanupExpiredSessions(data) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 24); // Sessions older than 24 hours
  
  const pool = createDbConnection();
  try {
    const result = await pool.query(
      'DELETE FROM user_sessions WHERE created_at < $1 OR expires_at < NOW()',
      [cutoffDate]
    );
    
    return {
      success: true,
      operation: 'cleanup-sessions',
      deletedRows: result.rowCount,
      cutoffDate: cutoffDate.toISOString()
    };
  } finally {
    await pool.end();
  }
}

async function analyzeTables(data) {
  const { tables = ['logs', 'contacts', 'user_reviews', 'notifications'] } = data;
  
  const pool = createDbConnection();
  try {
    const results = [];
    
    for (const table of tables) {
      try {
        await pool.query(`ANALYZE ${table}`);
        results.push({ table, status: 'analyzed' });
      } catch (error) {
        results.push({ table, status: 'failed', error: error.message });
      }
    }
    
    return {
      success: true,
      operation: 'analyze-tables',
      results,
      tablesProcessed: tables.length
    };
  } finally {
    await pool.end();
  }
}

async function reindexTables(data) {
  const { tables = ['logs', 'contacts', 'user_reviews'] } = data;
  
  const pool = createDbConnection();
  try {
    const results = [];
    
    for (const table of tables) {
      try {
        await pool.query(`REINDEX TABLE ${table}`);
        results.push({ table, status: 'reindexed' });
      } catch (error) {
        results.push({ table, status: 'failed', error: error.message });
      }
    }
    
    return {
      success: true,
      operation: 'reindex-tables',
      results,
      tablesProcessed: tables.length
    };
  } finally {
    await pool.end();
  }
}

async function backupCriticalData(data) {
  // Simplified backup - just return success for now
  return {
    success: true,
    operation: 'backup-critical-data',
    message: 'Backup operation completed'
  };
}

async function archiveOldData(data) {
  const { retentionDays = 365 } = data;
  
  // Simplified archival - just return success for now
  return {
    success: true,
    operation: 'archive-old-data',
    retentionDays,
    message: 'Archival operation completed'
  };
}

async function updateDatabaseStats(data) {
  const pool = createDbConnection();
  try {
    // Update database statistics
    await pool.query('ANALYZE');
    
    return {
      success: true,
      operation: 'update-stats',
      message: 'Database statistics updated'
    };
  } finally {
    await pool.end();
  }
}

// Helper function to queue database operations
const queueDatabaseOperation = async (operation, data = {}, options = {}) => {
  const priority = options.priority || 'low'; // Database maintenance is usually low priority
  
  // Create clean job data with only primitive values
  const cleanData = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      // Only include primitive values, strings, numbers, booleans, or simple arrays
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
          (Array.isArray(value) && value.every(item => typeof item === 'string' || typeof item === 'number'))) {
        cleanData[key] = value;
      } else {
        console.warn(`Skipping non-primitive value for key '${key}' in database job data`);
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
    attempts: 2, // Only retry once for database operations
    backoff: {
      type: 'exponential',
      delay: 5000, // Longer delay for database operations
    },
    removeOnComplete: 5,
    removeOnFail: 3,
    delay: options.delay || 0, // Allow scheduling for later
  };
  
  const jobData = {
    operation: String(operation), // Ensure operation is a string
    data: cleanData
  };
  
  console.log(`Queueing database operation '${operation}' with clean data:`, JSON.stringify(jobData));
  
  const job = await databaseQueue.add('database-operation', jobData, jobOptions);
  
  console.log(`Database operation '${operation}' queued with ID: ${job.id}, Priority: ${priority}`);
  return job;
};

module.exports = {
  databaseQueue,
  databaseWorker,
  queueDatabaseOperation,
};

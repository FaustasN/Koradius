const { Worker } = require('bullmq');
const { monitoringQueue, redisConfig } = require('./config');
const { queueNotification } = require('./notificationQueue');
const DatabaseConnection = require('./dbConnection');

// System monitoring job processor
const monitoringWorker = new Worker('monitoring processing', async (job) => {
  const { operation, data, thresholds } = job.data;
  
  console.log(`Processing monitoring job ${job.id}: ${operation}`);
  
  try {
    switch (operation) {
      case 'health-check':
        return await performHealthCheck(data, thresholds);
      case 'resource-monitoring':
        return await monitorResources(data, thresholds);
      case 'database-monitoring':
        return await monitorDatabase(data, thresholds);
      case 'queue-monitoring':
        return await monitorQueues(data, thresholds);
      case 'error-detection':
        return await detectErrors(data, thresholds);
      case 'performance-monitoring':
        return await monitorPerformance(data, thresholds);
      case 'disk-usage-check':
        return await checkDiskUsage(data, thresholds);
      case 'memory-pressure-check':
        return await checkMemoryPressure(data, thresholds);
      default:
        throw new Error(`Unknown monitoring operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Monitoring operation failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 3,
});

// Monitoring operations
async function performHealthCheck(data, thresholds) {
  // Access monitoring services directly rather than from job data
  // since complex objects can't be serialized through the queue
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    alerts: [],
    instanceId: data.instanceId || 'unknown'
  };
  
  // Basic system health checks using Node.js built-ins
  try {
    const os = require('os');
    const process = require('process');
    
    // Memory check
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    results.checks.push({
      type: 'memory',
      status: usedMemoryPercentage < (thresholds.memory || 85) ? 'healthy' : 'warning',
      value: Math.round(usedMemoryPercentage),
      threshold: thresholds.memory || 85,
      details: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024)
      }
    });
    
    // CPU load check (using load average on Unix systems)
    const loadAverage = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;
    const loadPercentage = (loadAverage / cpuCount) * 100;
    
    results.checks.push({
      type: 'cpu_load',
      status: loadPercentage < (thresholds.cpu || 80) ? 'healthy' : 'warning',
      value: Math.round(loadPercentage),
      threshold: thresholds.cpu || 80,
      details: {
        loadAverage: loadAverage.toFixed(2),
        cpuCount
      }
    });
    
    // Uptime check
    const uptime = os.uptime();
    results.checks.push({
      type: 'uptime',
      status: 'healthy',
      value: Math.round(uptime / 3600), // hours
      details: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      }
    });
    
    // Database connectivity check using DatabaseConnection
    await DatabaseConnection.executeWithConnection(async (pool) => {
      const dbResult = await pool.query('SELECT 1 as test');
      results.checks.push({
        type: 'database',
        status: dbResult.rows.length > 0 ? 'healthy' : 'error',
        value: 'connected',
        details: {
          connectionTime: new Date().toISOString()
        }
      });
    });
    
    // Generate alerts for any warning/error conditions
    results.checks.forEach(check => {
      if (check.status === 'warning' || check.status === 'error') {
        const alert = {
          type: `${check.type}_alert`,
          severity: check.status,
          message: `${check.type.toUpperCase()} check failed: ${check.value}${check.type.includes('percentage') ? '%' : ''} (threshold: ${check.threshold || 'N/A'})`,
          timestamp: new Date().toISOString()
        };
        results.alerts.push(alert);
        
        // Queue notification for critical alerts
        if (check.status === 'error') {
          queueNotification('admin-alert', ['admin'], 
            `System Alert: ${check.type}`, 
            alert.message, 
            { check, severity: 'error' },
            { priority: 'urgent' }
          ).catch(err => console.error('Failed to queue alert notification:', err));
        }
      }
    });
    
  } catch (error) {
    results.checks.push({
      type: 'health_check_error',
      status: 'error',
      value: 'failed',
      details: {
        error: error.message
      }
    });
  }
  
  return results;
}

// Helper function to format uptime
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

async function monitorResources(data, thresholds) {
  // Simplified resource monitoring using built-in Node.js methods
  const os = require('os');
  const process = require('process');
  
  const results = {
    timestamp: new Date().toISOString(),
    metrics: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        free: Math.round(os.freemem() / 1024 / 1024)
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length
      },
      uptime: os.uptime()
    },
    status: 'healthy'
  };
  
  return results;
}

async function monitorDatabase(data, thresholds) {
  const alerts = [];
  const metrics = {};
  
  return await DatabaseConnection.executeWithConnection(async (pool) => {
    try {
      // Check database connection count
      const connectionResult = await pool.query('SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\'');
      const activeConnections = parseInt(connectionResult.rows[0].active_connections);
      metrics.activeConnections = activeConnections;
      
      if (activeConnections > (thresholds.maxConnections || 50)) {
        const alert = {
          type: 'high_db_connections',
          severity: 'warning',
          message: `High database connection count: ${activeConnections}`,
          value: activeConnections,
          threshold: thresholds.maxConnections || 50
        };
        alerts.push(alert);
        
        await queueNotification('admin-alert', ['admin'], 
          'High Database Connections Alert', 
          alert.message, 
          { connectionCount: activeConnections, severity: 'warning' },
          { priority: 'medium' }
        );
      }
      
      // Check slow queries (queries running for more than specified seconds)
      const slowQueryResult = await pool.query(
        'SELECT count(*) as slow_queries FROM pg_stat_activity WHERE state = \'active\' AND now() - query_start > interval \'$1 seconds\'',
        [thresholds.slowQuerySeconds || 30]
      );
      const slowQueries = parseInt(slowQueryResult.rows[0].slow_queries);
      metrics.slowQueries = slowQueries;
      
      if (slowQueries > 0) {
        const alert = {
          type: 'slow_queries_detected',
          severity: 'warning',
          message: `Slow queries detected: ${slowQueries} queries running longer than ${thresholds.slowQuerySeconds || 30}s`,
          value: slowQueries,
          threshold: 0
        };
        alerts.push(alert);
      }
      
      // Check database size
      const sizeResult = await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as size_bytes');
      metrics.databaseSize = sizeResult.rows[0];
      
    } catch (error) {
      alerts.push({
        type: 'database_monitoring_error',
        severity: 'critical',
        message: `Database monitoring failed: ${error.message}`,
        error: error.message
      });
    }
    
    return {
      success: true,
      operation: 'database-monitoring',
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    };
  });
}

async function monitorQueues(data, thresholds) {
  const { queueManager } = data;
  const alerts = [];
  
  try {
    const queueStats = await queueManager.getQueueStats();
    const healthStatus = await queueManager.getHealthStatus();
    
    // Check for unhealthy queues
    for (const [queueName, status] of Object.entries(healthStatus)) {
      if (!status.healthy) {
        const alert = {
          type: 'queue_unhealthy',
          severity: 'warning',
          message: `Queue ${queueName} is unhealthy`,
          queue: queueName,
          status
        };
        alerts.push(alert);
        
        await queueNotification('admin-alert', ['admin'], 
          'Queue Health Alert', 
          alert.message, 
          { queueName, status, severity: 'warning' },
          { priority: 'medium' }
        );
      }
    }
    
    // Check for high waiting job counts
    for (const [queueName, stats] of Object.entries(queueStats)) {
      if (stats.waiting > (thresholds.maxWaitingJobs || 100)) {
        const alert = {
          type: 'high_queue_backlog',
          severity: 'warning',
          message: `High job backlog in ${queueName}: ${stats.waiting} waiting jobs`,
          queue: queueName,
          waiting: stats.waiting,
          threshold: thresholds.maxWaitingJobs || 100
        };
        alerts.push(alert);
      }
    }
    
    return {
      success: true,
      operation: 'queue-monitoring',
      queueStats,
      healthStatus,
      alerts,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Queue monitoring failed: ${error.message}`);
  }
}

async function detectErrors(data, thresholds) {
  const { pool } = data;
  const alerts = [];
  const timeWindow = thresholds.timeWindowMinutes || 10;
  
  try {
    // Check for error spikes in logs
    const errorResult = await pool.query(`
      SELECT 
        COUNT(*) as error_count,
        instance_id
      FROM logs 
      WHERE level = 'error' 
        AND timestamp > NOW() - INTERVAL '${timeWindow} minutes'
      GROUP BY instance_id
    `);
    
    for (const row of errorResult.rows) {
      if (row.error_count > (thresholds.maxErrorsPerWindow || 10)) {
        const alert = {
          type: 'error_spike_detected',
          severity: 'warning',
          message: `Error spike detected in ${row.instance_id}: ${row.error_count} errors in ${timeWindow} minutes`,
          instance: row.instance_id,
          errorCount: row.error_count,
          timeWindow
        };
        alerts.push(alert);
        
        await queueNotification('admin-alert', ['admin'], 
          'Error Spike Alert', 
          alert.message, 
          { instance: row.instance_id, errorCount: row.error_count, severity: 'warning' },
          { priority: 'high' }
        );
      }
    }
    
    return {
      success: true,
      operation: 'error-detection',
      errorStats: errorResult.rows,
      alerts,
      timeWindow,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Error detection failed: ${error.message}`);
  }
}

async function monitorPerformance(data, thresholds) {
  const { systemMonitor } = data;
  const metrics = systemMonitor ? systemMonitor.getCurrentMetrics() : null;
  const alerts = [];
  
  if (!metrics) {
    throw new Error('System monitor not available for performance monitoring');
  }
  
  // Check load average
  if (metrics.cpu.loadAverage && metrics.cpu.loadAverage[0] > (thresholds.loadAverage || 2.0)) {
    const alert = {
      type: 'high_load_average',
      severity: 'warning',
      message: `High load average detected: ${metrics.cpu.loadAverage[0]}`,
      value: metrics.cpu.loadAverage[0],
      threshold: thresholds.loadAverage || 2.0
    };
    alerts.push(alert);
  }
  
  // Check memory pressure
  if (metrics.memory.usagePercentage > (thresholds.memoryPressure || 90)) {
    const alert = {
      type: 'memory_pressure',
      severity: 'critical',
      message: `Memory pressure detected: ${metrics.memory.usagePercentage}%`,
      value: metrics.memory.usagePercentage,
      threshold: thresholds.memoryPressure || 90
    };
    alerts.push(alert);
    
    await queueNotification('admin-alert', ['admin'], 
      'Memory Pressure Alert', 
      alert.message, 
      { metrics: metrics.memory, severity: 'critical' },
      { priority: 'urgent' }
    );
  }
  
  return {
    success: true,
    operation: 'performance-monitoring',
    metrics,
    alerts,
    timestamp: new Date().toISOString()
  };
}

async function checkDiskUsage(data, thresholds) {
  const { systemMonitor } = data;
  const metrics = systemMonitor ? systemMonitor.getCurrentMetrics() : null;
  const alerts = [];
  
  if (!metrics || !metrics.disk) {
    throw new Error('Disk metrics not available');
  }
  
  const warningThreshold = thresholds.diskWarning || 80;
  const criticalThreshold = thresholds.diskCritical || 95;
  
  if (metrics.disk.usage > criticalThreshold) {
    const alert = {
      type: 'disk_critical',
      severity: 'critical',
      message: `Critical disk usage: ${metrics.disk.usage}%`,
      value: metrics.disk.usage,
      threshold: criticalThreshold
    };
    alerts.push(alert);
    
    await queueNotification('admin-alert', ['admin'], 
      'CRITICAL: Disk Space Nearly Full', 
      alert.message, 
      { metrics: metrics.disk, severity: 'critical' },
      { priority: 'urgent' }
    );
  } else if (metrics.disk.usage > warningThreshold) {
    const alert = {
      type: 'disk_warning',
      severity: 'warning',
      message: `High disk usage: ${metrics.disk.usage}%`,
      value: metrics.disk.usage,
      threshold: warningThreshold
    };
    alerts.push(alert);
  }
  
  return {
    success: true,
    operation: 'disk-usage-check',
    diskMetrics: metrics.disk,
    alerts,
    timestamp: new Date().toISOString()
  };
}

async function checkMemoryPressure(data, thresholds) {
  const { systemMonitor } = data;
  const metrics = systemMonitor ? systemMonitor.getCurrentMetrics() : null;
  const alerts = [];
  
  if (!metrics || !metrics.memory) {
    throw new Error('Memory metrics not available');
  }
  
  const heapWarningThreshold = thresholds.heapWarning || 80;
  const heapCriticalThreshold = thresholds.heapCritical || 95;
  
  const heapUsagePercentage = (metrics.memory.heap.used / metrics.memory.heap.total) * 100;
  
  if (heapUsagePercentage > heapCriticalThreshold) {
    const alert = {
      type: 'heap_critical',
      severity: 'critical',
      message: `Critical heap usage: ${heapUsagePercentage.toFixed(2)}%`,
      value: heapUsagePercentage,
      threshold: heapCriticalThreshold
    };
    alerts.push(alert);
    
    await queueNotification('admin-alert', ['admin'], 
      'CRITICAL: Memory Heap Nearly Full', 
      alert.message, 
      { metrics: metrics.memory.heap, severity: 'critical' },
      { priority: 'urgent' }
    );
  } else if (heapUsagePercentage > heapWarningThreshold) {
    const alert = {
      type: 'heap_warning',
      severity: 'warning',
      message: `High heap usage: ${heapUsagePercentage.toFixed(2)}%`,
      value: heapUsagePercentage,
      threshold: heapWarningThreshold
    };
    alerts.push(alert);
  }
  
  return {
    success: true,
    operation: 'memory-pressure-check',
    memoryMetrics: metrics.memory,
    heapUsagePercentage,
    alerts,
    timestamp: new Date().toISOString()
  };
}

// Worker event listeners
monitoringWorker.on('completed', (job, result) => {
  if (result.alertCount > 0) {
    console.log(`🚨 Monitoring job ${job.id} completed with ${result.alertCount} alerts`);
  } else {
    console.log(`✅ Monitoring job ${job.id} completed - all systems healthy`);
  }
});

monitoringWorker.on('failed', (job, err) => {
  console.error(`❌ Monitoring job ${job.id} failed:`, err.message);
});

monitoringWorker.on('stalled', (job) => {
  console.warn(`⏱️ Monitoring job ${job.id} stalled`);
});

// Helper function to queue monitoring operations
const queueMonitoringOperation = async (operation, data = {}, thresholds = {}, options = {}) => {
  const priority = options.priority || 'medium'; // Monitoring is usually medium priority
  
  // Create clean job data with only primitive values
  const cleanData = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      // Only include primitive values, strings, numbers, booleans, or simple arrays
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
          (Array.isArray(value) && value.every(item => typeof item === 'string' || typeof item === 'number'))) {
        cleanData[key] = value;
      } else {
        console.warn(`Skipping non-primitive value for key '${key}' in monitoring job data`);
      }
    }
  }
  
  // Clean thresholds the same way
  const cleanThresholds = {};
  if (thresholds && typeof thresholds === 'object') {
    for (const [key, value] of Object.entries(thresholds)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleanThresholds[key] = value;
      } else {
        console.warn(`Skipping non-primitive threshold for key '${key}' in monitoring job`);
      }
    }
  }
  
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
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 20,
    removeOnFail: 10,
    delay: options.delay || 0,
    repeat: options.repeat || null, // Allow scheduled recurring monitoring
  };
  
  const jobData = {
    operation: String(operation),
    data: cleanData,
    thresholds: cleanThresholds
  };
  
  console.log(`Queueing monitoring operation '${operation}' with clean data:`, JSON.stringify(jobData));
  
  const job = await monitoringQueue.add('monitoring-operation', jobData, jobOptions);
  
  console.log(`Monitoring operation '${operation}' queued with ID: ${job.id}`);
  return job;
};

module.exports = {
  monitoringQueue,
  monitoringWorker,
  queueMonitoringOperation,
};

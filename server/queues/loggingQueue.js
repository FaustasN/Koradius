const { Worker } = require('bullmq');
const { redisConfig } = require('./config');

class LoggingQueueWorker {
  constructor(pool) {
    this.pool = pool;
    this.worker = null;
    this.instanceId = process.env.INSTANCE_ID || 'unknown';
  }

  async start() {
    this.worker = new Worker(
      'logging processing',
      async (job) => {
        return await this.processLogJob(job);
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 log entries simultaneously
        removeOnComplete: 1000, // Keep last 1000 completed jobs for monitoring
        removeOnFail: 100, // Keep last 100 failed jobs for debugging
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Log job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Log job ${job.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('❌ Logging queue worker error:', err);
    });

    console.log(`✅ Logging queue worker started for instance: ${this.instanceId}`);
  }

  async processLogJob(job) {
    const { type, data } = job.data;

    try {
      switch (type) {
        case 'application':
          return await this.writeApplicationLog(data);
        case 'audit':
          return await this.writeAuditLog(data);
        case 'batch':
          return await this.writeBatchLogs(data);
        default:
          throw new Error(`Unknown log type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process log job ${job.id}:`, error);
      throw error;
    }
  }

  async writeApplicationLog(data) {
    const {
      id,
      level,
      message,
      instanceId,
      metadata,
      traceId,
      spanId,
      timestamp
    } = data;

    const query = `
      INSERT INTO logs (
        id, timestamp, level, message, log_type, instance_id, 
        metadata, trace_id, span_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      id,
      timestamp || new Date(),
      level,
      message,
      'application',
      instanceId || this.instanceId,
      metadata ? JSON.stringify(metadata) : null,
      traceId,
      spanId,
      new Date()
    ];

    const result = await this.pool.query(query, values);
    return { logId: result.rows[0].id, type: 'application' };
  }

  async writeAuditLog(data) {
    const {
      id,
      action,
      resource,
      userId,
      ipAddress,
      userAgent,
      metadata,
      sessionId,
      requestId,
      timestamp
    } = data;

    const query = `
      INSERT INTO logs (
        id, timestamp, level, message, log_type, instance_id,
        user_id, ip_address, user_agent, metadata, session_id, 
        request_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const message = `${action} on ${resource}`;
    const values = [
      id,
      timestamp || new Date(),
      'info', // Audit logs are typically info level
      message,
      'audit',
      this.instanceId,
      userId,
      ipAddress,
      userAgent,
      metadata ? JSON.stringify(metadata) : null,
      sessionId,
      requestId,
      new Date()
    ];

    const result = await this.pool.query(query, values);
    return { logId: result.rows[0].id, type: 'audit' };
  }

  async writeBatchLogs(data) {
    const { logs } = data;
    const results = [];

    // Use transaction for batch insert
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const logEntry of logs) {
        const { type, ...logData } = logEntry;
        
        let result;
        if (type === 'application') {
          result = await this.writeApplicationLogWithClient(client, logData);
        } else if (type === 'audit') {
          result = await this.writeAuditLogWithClient(client, logData);
        }
        
        if (result) {
          results.push(result);
        }
      }

      await client.query('COMMIT');
      return { batchResults: results, count: results.length };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async writeApplicationLogWithClient(client, data) {
    const {
      id,
      level,
      message,
      instanceId,
      metadata,
      traceId,
      spanId,
      timestamp
    } = data;

    const query = `
      INSERT INTO logs (
        id, timestamp, level, message, log_type, instance_id, 
        metadata, trace_id, span_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      id,
      timestamp || new Date(),
      level,
      message,
      'application',
      instanceId || this.instanceId,
      metadata ? JSON.stringify(metadata) : null,
      traceId,
      spanId,
      new Date()
    ];

    const result = await client.query(query, values);
    return { logId: result.rows[0].id, type: 'application' };
  }

  async writeAuditLogWithClient(client, data) {
    const {
      id,
      action,
      resource,
      userId,
      ipAddress,
      userAgent,
      metadata,
      sessionId,
      requestId,
      timestamp
    } = data;

    const query = `
      INSERT INTO logs (
        id, timestamp, level, message, log_type, instance_id,
        user_id, ip_address, user_agent, metadata, session_id, 
        request_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const message = `${action} on ${resource}`;
    const values = [
      id,
      timestamp || new Date(),
      'info',
      message,
      'audit',
      this.instanceId,
      userId,
      ipAddress,
      userAgent,
      metadata ? JSON.stringify(metadata) : null,
      sessionId,
      requestId,
      new Date()
    ];

    const result = await client.query(query, values);
    return { logId: result.rows[0].id, type: 'audit' };
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      console.log(`✅ Logging queue worker stopped for instance: ${this.instanceId}`);
    }
  }

  getStats() {
    if (!this.worker) return null;
    
    return {
      isRunning: this.worker.isRunning(),
      concurrency: this.worker.opts.concurrency,
      instanceId: this.instanceId,
    };
  }
}

module.exports = LoggingQueueWorker;

const winston = require('winston');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

/**
 * Base Logger Class - Handles database logging operations
 */
class BaseLogger {
  constructor(pool, logType = 'application') {
    this.pool = pool;
    this.logType = logType;
    this.instanceId = process.env.INSTANCE_ID || 'backend-main';
    
    // Create Winston logger for console/file logging as backup
    this.winston = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Log to database with automatic fallback to Winston
   */
  async logToDatabase(level, message, metadata = {}, trace = null) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      message,
      log_type: this.logType,
      instance_id: this.instanceId,
      metadata: metadata,
      trace_id: trace?.traceId || null,
      span_id: trace?.spanId || null,
      user_id: metadata.userId || null,
      ip_address: metadata.ipAddress || null,
      user_agent: metadata.userAgent || null,
      request_id: metadata.requestId || null,
      session_id: metadata.sessionId || null
    };

    try {
      await this.pool.query(`
        INSERT INTO logs (
          id, timestamp, level, message, log_type, instance_id, 
          metadata, trace_id, span_id, user_id, ip_address, 
          user_agent, request_id, session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        logEntry.id, logEntry.timestamp, logEntry.level, logEntry.message,
        logEntry.log_type, logEntry.instance_id, logEntry.metadata,
        logEntry.trace_id, logEntry.span_id, logEntry.user_id,
        logEntry.ip_address, logEntry.user_agent, logEntry.request_id,
        logEntry.session_id
      ]);
      
      return logEntry.id;
    } catch (error) {
      // Fallback to Winston if database fails
      this.winston.error('Failed to log to database, using Winston fallback', {
        originalLevel: level,
        originalMessage: message,
        originalMetadata: metadata,
        dbError: error.message
      });
      return null;
    }
  }

  /**
   * Create a new trace context
   */
  createTrace(operationName, parentTrace = null) {
    return {
      traceId: parentTrace?.traceId || uuidv4(),
      spanId: uuidv4(),
      parentSpanId: parentTrace?.spanId || null,
      operationName,
      startTime: Date.now()
    };
  }

  /**
   * End a trace and log duration
   */
  async endTrace(trace, status = 'success', metadata = {}) {
    const duration = Date.now() - trace.startTime;
    
    await this.logToDatabase('info', `Operation completed: ${trace.operationName}`, {
      ...metadata,
      duration: `${duration}ms`,
      status,
      operation: trace.operationName
    }, trace);
    
    return duration;
  }

  /**
   * Enhanced logging methods with trace support
   */
  async info(message, metadata = {}, trace = null) {
    await this.logToDatabase('info', message, metadata, trace);
    this.winston.info(message, metadata);
  }

  async warn(message, metadata = {}, trace = null) {
    await this.logToDatabase('warn', message, metadata, trace);
    this.winston.warn(message, metadata);
  }

  async error(message, metadata = {}, trace = null) {
    await this.logToDatabase('error', message, metadata, trace);
    this.winston.error(message, metadata);
  }

  async debug(message, metadata = {}, trace = null) {
    await this.logToDatabase('debug', message, metadata, trace);
    this.winston.debug(message, metadata);
  }

  /**
   * Get logs from database with filtering
   */
  async getLogs(filters = {}) {
    const {
      startDate,
      endDate,
      level,
      logType,
      instanceId,
      userId,
      traceId,
      limit = 100,
      offset = 0,
      orderBy = 'timestamp',
      orderDirection = 'DESC'
    } = filters;

    let query = 'SELECT * FROM logs WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Build dynamic query with filters
    if (startDate) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    if (level) {
      paramCount++;
      query += ` AND level = $${paramCount}`;
      params.push(level);
    }

    if (logType) {
      paramCount++;
      query += ` AND log_type = $${paramCount}`;
      params.push(logType);
    }

    if (instanceId) {
      paramCount++;
      query += ` AND instance_id = $${paramCount}`;
      params.push(instanceId);
    }

    if (userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    if (traceId) {
      paramCount++;
      query += ` AND trace_id = $${paramCount}`;
      params.push(traceId);
    }

    // Add ordering and pagination
    query += ` ORDER BY ${orderBy} ${orderDirection}`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    try {
      const result = await this.pool.query(query, params);
      return {
        logs: result.rows.map(row => ({
          ...row,
          metadata: JSON.parse(row.metadata || '{}')
        })),
        total: result.rowCount
      };
    } catch (error) {
      this.winston.error('Failed to retrieve logs from database', { error: error.message });
      throw error;
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(timeRange = '24h') {
    const timeMap = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };

    const interval = timeMap[timeRange] || '24 hours';

    try {
      const result = await this.pool.query(`
        SELECT 
          level,
          log_type,
          COUNT(*) as count,
          COUNT(CASE WHEN timestamp > NOW() - INTERVAL '${interval}' THEN 1 END) as recent_count
        FROM logs 
        WHERE timestamp > NOW() - INTERVAL '${interval}'
        GROUP BY level, log_type
        ORDER BY count DESC
      `);

      return result.rows;
    } catch (error) {
      this.winston.error('Failed to get log statistics', { error: error.message });
      throw error;
    }
  }
}

module.exports = BaseLogger;

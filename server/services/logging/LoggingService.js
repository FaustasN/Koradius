const ApplicationLogger = require('./ApplicationLogger');
const AuditLogger = require('./AuditLogger');

/**
 * Logging Factory - Creates and manages logger instances
 */
class LoggingService {
  constructor(pool) {
    this.pool = pool;
    this.applicationLogger = new ApplicationLogger(pool);
    this.auditLogger = new AuditLogger(pool);
  }

  /**
   * Get application logger instance
   */
  getApplicationLogger() {
    return this.applicationLogger;
  }

  /**
   * Get audit logger instance
   */
  getAuditLogger() {
    return this.auditLogger;
  }

  /**
   * Create a trace context that can be shared between loggers
   */
  createTrace(operationName, parentTrace = null) {
    return this.applicationLogger.createTrace(operationName, parentTrace);
  }

  /**
   * End a trace and log completion
   */
  async endTrace(trace, status = 'success', metadata = {}) {
    return await this.applicationLogger.endTrace(trace, status, metadata);
  }

  /**
   * Get combined logs from both loggers
   */
  async getCombinedLogs(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        level,
        logTypes = ['application', 'audit'],
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

      // Filter by log types
      if (logTypes.length > 0) {
        const placeholders = logTypes.map((_, index) => `$${paramCount + index + 1}`).join(',');
        paramCount += logTypes.length;
        query += ` AND log_type IN (${placeholders})`;
        params.push(...logTypes);
      }

      // Add other filters
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

      const result = await this.pool.query(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM logs WHERE 1=1';
      const countParams = [];
      let countParamCount = 0;

      // Apply same filters for count
      if (logTypes.length > 0) {
        const placeholders = logTypes.map((_, index) => `$${countParamCount + index + 1}`).join(',');
        countParamCount += logTypes.length;
        countQuery += ` AND log_type IN (${placeholders})`;
        countParams.push(...logTypes);
      }

      if (startDate) {
        countParamCount++;
        countQuery += ` AND timestamp >= $${countParamCount}`;
        countParams.push(startDate);
      }

      if (endDate) {
        countParamCount++;
        countQuery += ` AND timestamp <= $${countParamCount}`;
        countParams.push(endDate);
      }

      if (level) {
        countParamCount++;
        countQuery += ` AND level = $${countParamCount}`;
        countParams.push(level);
      }

      if (instanceId) {
        countParamCount++;
        countQuery += ` AND instance_id = $${countParamCount}`;
        countParams.push(instanceId);
      }

      if (userId) {
        countParamCount++;
        countQuery += ` AND user_id = $${countParamCount}`;
        countParams.push(userId);
      }

      if (traceId) {
        countParamCount++;
        countQuery += ` AND trace_id = $${countParamCount}`;
        countParams.push(traceId);
      }

      const countResult = await this.pool.query(countQuery, countParams);

      return {
        logs: result.rows.map(row => ({
          ...row,
          metadata: row.metadata || {}
        })),
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      };
    } catch (error) {
      this.applicationLogger.winston.error('Failed to retrieve combined logs', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get logging statistics
   */
  async getLoggingStats(timeRange = '24h') {
    try {
      const timeMap = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = timeMap[timeRange] || '24 hours';

      const result = await this.pool.query(`
        SELECT 
          log_type,
          level,
          COUNT(*) as count,
          MIN(timestamp) as first_occurrence,
          MAX(timestamp) as last_occurrence
        FROM logs 
        WHERE timestamp > NOW() - INTERVAL '${interval}'
        GROUP BY log_type, level
        ORDER BY log_type, level
      `);

      // Get top error messages
      const errorResult = await this.pool.query(`
        SELECT 
          message,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM logs 
        WHERE level = 'error' 
          AND timestamp > NOW() - INTERVAL '${interval}'
        GROUP BY message
        ORDER BY count DESC
        LIMIT 10
      `);

      // Get instance statistics
      const instanceResult = await this.pool.query(`
        SELECT 
          instance_id,
          COUNT(*) as log_count,
          COUNT(DISTINCT trace_id) as trace_count
        FROM logs 
        WHERE timestamp > NOW() - INTERVAL '${interval}'
        GROUP BY instance_id
        ORDER BY log_count DESC
      `);

      return {
        levelStats: result.rows,
        topErrors: errorResult.rows,
        instanceStats: instanceResult.rows,
        timeRange,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.applicationLogger.winston.error('Failed to get logging statistics', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Clean old logs (data retention)
   */
  async cleanOldLogs(retentionDays = 30) {
    try {
      const result = await this.pool.query(`
        DELETE FROM logs 
        WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
      `);

      await this.applicationLogger.info(`Log cleanup completed`, {
        deletedRows: result.rowCount,
        retentionDays,
        operation: 'log_cleanup'
      });

      return result.rowCount;
    } catch (error) {
      await this.applicationLogger.error('Log cleanup failed', { 
        error: error.message,
        retentionDays 
      });
      throw error;
    }
  }
}

module.exports = LoggingService;

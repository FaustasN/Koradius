const BaseLogger = require('./BaseLogger');

/**
 * Audit Logger - For security-sensitive operations and compliance
 * Tracks user actions, data changes, system access, and compliance events
 */
class AuditLogger extends BaseLogger {
  constructor(pool) {
    super(pool, 'audit');
  }

  /**
   * Log user actions for audit trail
   */
  async logUserAction(userId, action, resource, details = {}, trace = null) {
    await this.info(`User Action: ${action} on ${resource}`, {
      userId,
      action,
      resource,
      actionType: 'user_action',
      timestamp: new Date().toISOString(),
      ...details
    }, trace);
  }

  /**
   * Log data changes with before/after states
   */
  async logDataChange(userId, table, recordId, action, changes = {}, trace = null) {
    const metadata = {
      userId,
      table,
      recordId,
      action, // 'create', 'update', 'delete'
      actionType: 'data_change',
      changes: JSON.stringify(changes).substring(0, 2000), // Limit size
      timestamp: new Date().toISOString()
    };

    await this.info(`Data Change: ${action} ${table}[${recordId}]`, metadata, trace);
  }

  /**
   * Log admin operations
   */
  async logAdminOperation(adminId, operation, target, details = {}, trace = null) {
    await this.warn(`Admin Operation: ${operation} on ${target}`, {
      adminId,
      operation,
      target,
      actionType: 'admin_operation',
      sensitivity: 'high',
      ...details
    }, trace);
  }

  /**
   * Log authentication and authorization events
   */
  async logAuthEvent(userId, event, success, details = {}, trace = null) {
    const level = success ? 'info' : 'warn';
    
    await this.logToDatabase(level, `Auth Event: ${event}`, {
      userId,
      event,
      success,
      actionType: 'authentication',
      sensitivity: 'high',
      ...details
    }, trace);
  }

  /**
   * Log login attempts with detailed tracking
   */
  async logLoginAttempt(username, success, ipAddress, userAgent, details = {}, trace = null) {
    const level = success ? 'info' : 'warn';
    
    await this.logToDatabase(level, `Login Attempt: ${username}`, {
      username,
      success,
      ipAddress,
      userAgent,
      actionType: 'login_attempt',
      sensitivity: 'high',
      loginTime: new Date().toISOString(),
      ...details
    }, trace);
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(adminId, targetUserId, permission, action, trace = null) {
    await this.warn(`Permission Change: ${action} ${permission} for user ${targetUserId}`, {
      adminId,
      targetUserId,
      permission,
      action, // 'granted', 'revoked', 'modified'
      actionType: 'permission_change',
      sensitivity: 'critical',
      timestamp: new Date().toISOString()
    }, trace);
  }

  /**
   * Log sensitive data access
   */
  async logSensitiveDataAccess(userId, dataType, recordId, purpose, trace = null) {
    await this.info(`Sensitive Data Access: ${dataType}[${recordId}]`, {
      userId,
      dataType,
      recordId,
      purpose,
      actionType: 'sensitive_data_access',
      sensitivity: 'high',
      accessTime: new Date().toISOString()
    }, trace);
  }

  /**
   * Log data export/download operations
   */
  async logDataExport(userId, dataType, recordCount, format, trace = null) {
    await this.warn(`Data Export: ${recordCount} ${dataType} records as ${format}`, {
      userId,
      dataType,
      recordCount,
      format,
      actionType: 'data_export',
      sensitivity: 'high',
      exportTime: new Date().toISOString()
    }, trace);
  }

  /**
   * Log configuration changes
   */
  async logConfigChange(adminId, configKey, oldValue, newValue, trace = null) {
    await this.warn(`Config Change: ${configKey}`, {
      adminId,
      configKey,
      oldValue: typeof oldValue === 'string' ? oldValue.substring(0, 100) : oldValue,
      newValue: typeof newValue === 'string' ? newValue.substring(0, 100) : newValue,
      actionType: 'config_change',
      sensitivity: 'critical',
      changeTime: new Date().toISOString()
    }, trace);
  }

  /**
   * Log system access events
   */
  async logSystemAccess(userId, accessType, resource, success, trace = null) {
    const level = success ? 'info' : 'warn';
    
    await this.logToDatabase(level, `System Access: ${accessType} to ${resource}`, {
      userId,
      accessType,
      resource,
      success,
      actionType: 'system_access',
      sensitivity: 'medium',
      accessTime: new Date().toISOString()
    }, trace);
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(userId, violation, severity, details = {}, trace = null) {
    await this.error(`Security Violation: ${violation}`, {
      userId,
      violation,
      severity, // 'low', 'medium', 'high', 'critical'
      actionType: 'security_violation',
      sensitivity: 'critical',
      violationTime: new Date().toISOString(),
      ...details
    }, trace);
  }

  /**
   * Log compliance events
   */
  async logComplianceEvent(userId, regulation, event, details = {}, trace = null) {
    await this.info(`Compliance: ${regulation} - ${event}`, {
      userId,
      regulation, // 'GDPR', 'CCPA', etc.
      event,
      actionType: 'compliance',
      sensitivity: 'high',
      complianceTime: new Date().toISOString(),
      ...details
    }, trace);
  }

  /**
   * Log file access for audit purposes
   */
  async logFileAccess(userId, filename, action, success, trace = null) {
    const level = success ? 'info' : 'warn';
    
    await this.logToDatabase(level, `File Access: ${action} ${filename}`, {
      userId,
      filename,
      action, // 'read', 'write', 'delete', 'download', 'upload'
      success,
      actionType: 'file_access',
      sensitivity: 'medium',
      accessTime: new Date().toISOString()
    }, trace);
  }

  /**
   * Get audit trail for specific user
   */
  async getUserAuditTrail(userId, startDate, endDate, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM logs 
        WHERE log_type = 'audit' 
          AND user_id = $1 
          AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp DESC
        LIMIT $4
      `, [userId, startDate, endDate, limit]);

      return result.rows.map(row => ({
        ...row,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      this.winston.error('Failed to retrieve user audit trail', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(startDate, endDate, regulation = null) {
    try {
      let query = `
        SELECT * FROM logs 
        WHERE log_type = 'audit' 
          AND timestamp BETWEEN $1 AND $2
          AND metadata->>'actionType' = 'compliance'
      `;
      const params = [startDate, endDate];

      if (regulation) {
        query += ` AND metadata->>'regulation' = $3`;
        params.push(regulation);
      }

      query += ` ORDER BY timestamp DESC`;

      const result = await this.pool.query(query, params);

      return result.rows.map(row => ({
        ...row,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      this.winston.error('Failed to generate compliance report', { 
        regulation, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = AuditLogger;

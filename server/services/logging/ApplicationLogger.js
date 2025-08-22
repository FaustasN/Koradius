const BaseLogger = require('./BaseLogger');

/**
 * Application Logger - For general application logging
 * Handles system events, business logic, errors, performance metrics
 */
class ApplicationLogger extends BaseLogger {
  constructor(pool, loggingQueue = null) {
    super(pool, 'application', loggingQueue);
  }

  /**
   * Log API request/response
   */
  async logApiRequest(req, res, duration, trace = null) {
    const metadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection?.remoteAddress,
      requestId: req.headers['x-request-id'] || trace?.spanId,
      responseSize: res.get('Content-Length') || 0,
      userId: req.user?.id || null
    };

    const level = res.statusCode >= 500 ? 'error' : 
                 res.statusCode >= 400 ? 'warn' : 'info';
    
    const message = `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`;
    
    await this.logToDatabase(level, message, metadata, trace);
  }

  /**
   * Log business operations
   */
  async logBusinessOperation(operation, details = {}, trace = null) {
    await this.info(`Business Operation: ${operation}`, {
      operation,
      operationType: 'business',
      ...details
    }, trace);
  }

  /**
   * Log system events
   */
  async logSystemEvent(event, details = {}, trace = null) {
    await this.info(`System Event: ${event}`, {
      event,
      eventType: 'system',
      ...details
    }, trace);
  }

  /**
   * Log performance metrics
   */
  async logPerformance(operation, metrics = {}, trace = null) {
    await this.info(`Performance: ${operation}`, {
      operation,
      metricsType: 'performance',
      ...metrics
    }, trace);
  }

  /**
   * Log database operations
   */
  async logDatabaseOperation(operation, table, details = {}, trace = null) {
    await this.info(`Database: ${operation} on ${table}`, {
      operation,
      table,
      operationType: 'database',
      ...details
    }, trace);
  }

  /**
   * Log queue operations
   */
  async logQueueOperation(queue, operation, jobData = {}, trace = null) {
    await this.info(`Queue: ${operation} in ${queue}`, {
      queue,
      operation,
      operationType: 'queue',
      jobId: jobData.id,
      jobType: jobData.type,
      ...jobData
    }, trace);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(event, userId, details = {}, trace = null) {
    const level = event.includes('failed') || event.includes('error') ? 'warn' : 'info';
    
    await this.logToDatabase(level, `Auth: ${event}`, {
      event,
      userId,
      eventType: 'authentication',
      ...details
    }, trace);
  }

  /**
   * Log file operations
   */
  async logFileOperation(operation, filename, details = {}, trace = null) {
    await this.info(`File: ${operation} - ${filename}`, {
      operation,
      filename,
      operationType: 'file',
      ...details
    }, trace);
  }

  /**
   * Log email operations
   */
  async logEmailOperation(operation, recipient, details = {}, trace = null) {
    await this.info(`Email: ${operation} to ${recipient}`, {
      operation,
      recipient,
      operationType: 'email',
      ...details
    }, trace);
  }

  /**
   * Log external API calls
   */
  async logExternalApiCall(service, endpoint, response, trace = null) {
    const level = response.status >= 400 ? 'error' : 'info';
    
    await this.logToDatabase(level, `External API: ${service} ${endpoint}`, {
      service,
      endpoint,
      statusCode: response.status,
      duration: response.duration,
      operationType: 'external_api',
      response: response.data ? JSON.stringify(response.data).substring(0, 1000) : null
    }, trace);
  }

  /**
   * Log validation errors
   */
  async logValidationError(field, value, error, trace = null) {
    await this.warn(`Validation Error: ${field}`, {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      error,
      errorType: 'validation'
    }, trace);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event, details = {}, trace = null) {
    await this.warn(`Security: ${event}`, {
      event,
      eventType: 'security',
      ...details
    }, trace);
  }
}

module.exports = ApplicationLogger;

const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Logging Middleware with tracing support
 * Automatically logs all requests and creates trace contexts
 */
class LoggingMiddleware {
  constructor(loggingService) {
    this.loggingService = loggingService;
    this.appLogger = loggingService.getApplicationLogger();
    this.auditLogger = loggingService.getAuditLogger();
  }

  /**
   * Main middleware function for request/response logging
   */
  requestLogger() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Skip logging for boring requests
      const skipLogging = [
        '/api/health',
        '/api/notifications'
      ].some(path => req.path === path) || 
      // Skip all admin GET requests (dashboard viewing)
      (req.path.startsWith('/api/admin/') && req.method === 'GET') ||
      // Skip public content GET requests (gallery, travel-packets, reviews)
      (req.method === 'GET' && [
        '/api/gallery',
        '/api/travel-packets', 
        '/api/reviews'
      ].some(path => req.path === path));
      
      // Create unique request ID and trace
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.trace = skipLogging ? null : this.loggingService.createTrace(`${req.method} ${req.path}`);
      
      // Enhance request with logging context
      req.log = {
        info: (message, metadata = {}) => this.appLogger.info(message, {
          ...metadata,
          requestId: req.requestId,
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }, req.trace),
        
        warn: (message, metadata = {}) => this.appLogger.warn(message, {
          ...metadata,
          requestId: req.requestId,
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }, req.trace),
        
        error: (message, metadata = {}) => this.appLogger.error(message, {
          ...metadata,
          requestId: req.requestId,
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }, req.trace),
        
        audit: (action, resource, details = {}) => this.auditLogger.logUserAction(
          req.user?.id, 
          action, 
          resource, 
          {
            ...details,
            requestId: req.requestId,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }, 
          req.trace
        )
      };

      // Log request start (skip for health checks and polling)
      if (!skipLogging) {
        await this.appLogger.info(`Request started: ${req.method} ${req.url}`, {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          requestId: req.requestId,
          contentType: req.get('Content-Type'),
          contentLength: req.get('Content-Length'),
          userId: req.user?.id
        }, req.trace);
      }

      // Override res.json to log responses
      const originalJson = res.json;
      res.json = function(data) {
        res.responseData = data;
        return originalJson.call(this, data);
      };

      // Override res.send to log responses
      const originalSend = res.send;
      res.send = function(data) {
        res.responseData = data;
        return originalSend.call(this, data);
      };

      // Log when response finishes
      res.on('finish', async () => {
        const duration = Date.now() - startTime;
        
        // Additional filtering for uninteresting responses
        const isBoringGetRequest = req.method === 'GET' && (
          // Cache validations (304 Not Modified)
          res.statusCode === 304 ||
          // Successful GET requests to public data endpoints  
          (res.statusCode === 200 && [
            '/api/gallery',
            '/api/travel-packets', 
            '/api/reviews'
          ].some(path => req.path === path))
        );
        
        const shouldSkipResponseLogging = skipLogging || isBoringGetRequest;
        
        try {
          // Only log interesting operations
          if (!shouldSkipResponseLogging) {
            // Log API request/response
            await this.appLogger.logApiRequest(req, res, duration, req.trace);
            
            // End trace
            if (req.trace) {
              await this.loggingService.endTrace(req.trace, 
                res.statusCode >= 400 ? 'error' : 'success',
                {
                  statusCode: res.statusCode,
                  responseSize: res.get('Content-Length') || 0
                }
              );
            }
          }

          // Log audit event for sensitive operations (always log these regardless of skipLogging)
          if (this.isSensitiveOperation(req)) {
            await this.auditLogger.logUserAction(
              req.user?.id,
              `${req.method} ${req.path}`,
              'API',
              {
                statusCode: res.statusCode,
                duration,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                requestId: req.requestId
              },
              req.trace
            );
          }
        } catch (logError) {
          console.error('Logging middleware error:', logError);
        }
      });

      next();
    };
  }

  /**
   * Error logging middleware
   */
  errorLogger() {
    return async (error, req, res, next) => {
      try {
        await this.appLogger.error(`Request error: ${error.message}`, {
          error: error.message,
          stack: error.stack,
          method: req.method,
          url: req.url,
          requestId: req.requestId,
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }, req.trace);

        // Log security-related errors in audit log
        if (this.isSecurityError(error)) {
          await this.auditLogger.logSecurityViolation(
            req.user?.id,
            error.message,
            'medium',
            {
              errorType: error.name,
              method: req.method,
              url: req.url,
              requestId: req.requestId,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            },
            req.trace
          );
        }
      } catch (logError) {
        console.error('Error logging middleware failed:', logError);
      }

      next(error);
    };
  }

  /**
   * Database operation logging wrapper
   */
  wrapDatabaseOperation(operation, table) {
    return async (query, params = [], trace = null) => {
      const operationTrace = trace || this.loggingService.createTrace(`DB:${operation}:${table}`);
      const startTime = Date.now();

      try {
        const result = await operation(query, params);
        const duration = Date.now() - startTime;

        await this.appLogger.logDatabaseOperation(operation.name || 'query', table, {
          query: query.substring(0, 200), // Limit query length
          paramCount: params.length,
          resultCount: result.rowCount || result.rows?.length || 0,
          duration: `${duration}ms`
        }, operationTrace);

        await this.loggingService.endTrace(operationTrace, 'success', {
          resultCount: result.rowCount || result.rows?.length || 0,
          duration
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        await this.appLogger.error(`Database operation failed: ${operation.name || 'query'}`, {
          error: error.message,
          table,
          query: query.substring(0, 200),
          paramCount: params.length,
          duration: `${duration}ms`
        }, operationTrace);

        await this.loggingService.endTrace(operationTrace, 'error', {
          error: error.message,
          duration
        });

        throw error;
      }
    };
  }

  /**
   * Authentication middleware with audit logging
   */
  authLogger() {
    return async (req, res, next) => {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (token) {
        try {
          // This would be called after token verification
          req.on('userAuthenticated', async (user) => {
            await this.auditLogger.logAuthEvent(
              user.id,
              'token_verified',
              true,
              {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                requestId: req.requestId
              },
              req.trace
            );
          });
        } catch (error) {
          await this.auditLogger.logAuthEvent(
            null,
            'token_verification_failed',
            false,
            {
              error: error.message,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestId: req.requestId
            },
            req.trace
          );
        }
      }

      next();
    };
  }

  /**
   * Rate limiting logging
   */
  rateLimitLogger() {
    return async (req, res, next) => {
      if (req.rateLimit) {
        const { limit, used, remaining, resetTime } = req.rateLimit;
        
        await this.appLogger.info('Rate limit check', {
          limit,
          used,
          remaining,
          resetTime,
          ipAddress: req.ip,
          requestId: req.requestId
        }, req.trace);

        // Log rate limit violations
        if (remaining === 0) {
          await this.appLogger.warn('Rate limit exceeded', {
            limit,
            used,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.requestId
          }, req.trace);

          await this.auditLogger.logSecurityViolation(
            req.user?.id,
            'rate_limit_exceeded',
            'medium',
            {
              limit,
              used,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestId: req.requestId
            },
            req.trace
          );
        }
      }

      next();
    };
  }

  /**
   * Determine if operation is sensitive for audit logging
   */
  isSensitiveOperation(req) {
    // Never audit GET requests - they're just viewing data
    if (req.method === 'GET') {
      return false;
    }
    
    const sensitivePatterns = [
      /\/api\/auth\/login/,
      /\/api\/auth\/logout/,
      /\/api\/admin\/.*\/(delete|create|update)/,
      /\/api\/.*\/delete/,
      /\/api\/.*\/update/,
      /.*password.*/i
    ];

    // Only log sensitive operations with POST/PUT/DELETE methods
    const sensitiveMethod = ['POST', 'PUT', 'DELETE'].includes(req.method);
    const sensitiveUrl = sensitivePatterns.some(pattern => pattern.test(req.url));
    
    return sensitiveUrl || sensitiveMethod;
  }

  /**
   * Determine if error is security-related
   */
  isSecurityError(error) {
    const securityErrors = [
      'TokenExpiredError',
      'JsonWebTokenError',
      'UnauthorizedError',
      'ForbiddenError',
      'ValidationError'
    ];

    return securityErrors.includes(error.name) ||
           error.message?.toLowerCase().includes('unauthorized') ||
           error.message?.toLowerCase().includes('forbidden') ||
           error.message?.toLowerCase().includes('invalid token');
  }
}

module.exports = LoggingMiddleware;

/**
 * Log Cleanup Scheduler
 * Automatically schedules daily log cleanup operations
 */
class LogCleanupScheduler {
  constructor(queueDatabaseOperation, loggingService = null) {
    this.queueDatabaseOperation = queueDatabaseOperation;
    this.loggingService = loggingService;
    this.isRunning = false;
    this.intervalId = null;
    this.dailyCleanupTime = { hour: 2, minute: 0 }; // 2:00 AM by default
  }

  /**
   * Set the logging service (called after logging service initialization)
   */
  setLoggingService(loggingService) {
    this.loggingService = loggingService;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Log cleanup scheduler is already running');
      return;
    }

    console.log('🔄 Starting log cleanup scheduler...');
    
    // Schedule the first cleanup
    this.scheduleNextCleanup();
    
    // Set up daily interval (check every hour if it's time to run)
    this.intervalId = setInterval(() => {
      this.checkAndScheduleCleanup();
    }, 60 * 60 * 1000); // Check every hour

    this.isRunning = true;
    console.log('✅ Log cleanup scheduler started - will run daily at 2:00 AM');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Log cleanup scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Log cleanup scheduler stopped');
  }

  /**
   * Check if it's time to run cleanup and schedule it
   */
  checkAndScheduleCleanup() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Run at 2:00 AM (allow 5-minute window)
    if (currentHour === this.dailyCleanupTime.hour && 
        currentMinute >= this.dailyCleanupTime.minute && 
        currentMinute < this.dailyCleanupTime.minute + 5) {
      this.runLogCleanup();
    }
  }

  /**
   * Schedule the next cleanup run
   */
  scheduleNextCleanup() {
    const delay = this.getDelayToNextRun();
    
    setTimeout(() => {
      this.runLogCleanup();
    }, delay);

    const nextRun = new Date(Date.now() + delay);
    console.log(`📅 Next log cleanup scheduled for: ${nextRun.toISOString()}`);
  }

  /**
   * Calculate delay to next 2:00 AM
   */
  getDelayToNextRun() {
    const now = new Date();
    const target = new Date();
    target.setHours(this.dailyCleanupTime.hour, this.dailyCleanupTime.minute, 0, 0);
    
    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target.getTime() - now.getTime();
  }

  /**
   * Execute the log cleanup operation
   */
  async runLogCleanup() {
    try {
      console.log('🧹 Starting automated log cleanup...');
      
      // Create audit log entry for the cleanup operation
      if (this.loggingService) {
        const auditLogger = this.loggingService.getAuditLogger();
        await auditLogger.logAdminOperation(
          'system', 
          'automated_log_cleanup', 
          'logs_table', 
          {
            scheduledTime: this.dailyCleanupTime,
            initiatedAt: new Date().toISOString(),
            retentionPolicy: {
              normal_logs: '1 day',
              warning_error_logs: '7 days', 
              audit_logs: '30 days'
            },
            automated: true
          }
        );
      }
      
      // Queue the cleanup operation with high priority since it's automated
      const job = await this.queueDatabaseOperation('cleanup-logs', {}, { 
        priority: 'medium',
        removeOnComplete: 5, // Keep last 5 completed jobs
        removeOnFail: 3,     // Keep last 3 failed jobs
        attempts: 3,         // Retry up to 3 times if it fails
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10 seconds
        }
      });

      console.log(`✅ Log cleanup job queued with ID: ${job.id}`);
      
      // Log successful scheduling
      if (this.loggingService) {
        const appLogger = this.loggingService.getApplicationLogger();
        await appLogger.logSystemEvent('log_cleanup_scheduled', {
          jobId: job.id,
          scheduledBy: 'automated_scheduler',
          nextRun: new Date(Date.now() + this.getDelayToNextRun()).toISOString()
        });
      }
      
      // Schedule the next cleanup for tomorrow
      this.scheduleNextCleanup();
      
    } catch (error) {
      console.error('❌ Failed to queue log cleanup job:', error.message);
      
      // Log the error
      if (this.loggingService) {
        const appLogger = this.loggingService.getApplicationLogger();
        await appLogger.error('Automated log cleanup failed', {
          error: error.message,
          stack: error.stack,
          scheduledTime: this.dailyCleanupTime,
          operation: 'automated_log_cleanup'
        });
      }
      
      // Retry in 1 hour if there was an error
      setTimeout(() => {
        console.log('🔄 Retrying log cleanup after error...');
        this.runLogCleanup();
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Run cleanup immediately (for manual trigger)
   */
  async runCleanupNow() {
    console.log('🧹 Running manual log cleanup...');
    
    // Create audit log entry for manual cleanup
    if (this.loggingService) {
      const auditLogger = this.loggingService.getAuditLogger();
      await auditLogger.logAdminOperation(
        'admin', 
        'manual_log_cleanup', 
        'logs_table', 
        {
          initiatedAt: new Date().toISOString(),
          retentionPolicy: {
            normal_logs: '1 day',
            warning_error_logs: '7 days', 
            audit_logs: '30 days'
          },
          automated: false,
          trigger: 'manual_api_call'
        }
      );
    }
    
    return await this.runLogCleanup();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      dailyCleanupTime: this.dailyCleanupTime,
      nextRun: this.isRunning ? new Date(Date.now() + this.getDelayToNextRun()).toISOString() : null
    };
  }

  /**
   * Set custom cleanup time
   */
  setCleanupTime(hour, minute) {
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time format. Hour must be 0-23, minute must be 0-59');
    }
    
    this.dailyCleanupTime = { hour, minute };
    console.log(`📅 Log cleanup time updated to ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    
    // Reschedule if running
    if (this.isRunning) {
      this.scheduleNextCleanup();
    }
  }
}

module.exports = LogCleanupScheduler;

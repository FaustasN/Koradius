/**
 * Payment Timeout Scheduler
 * Automatically schedules payment timeout checks and marks expired payments as failed
 */
class PaymentTimeoutScheduler {
  constructor(queuePaymentOperation, loggingService = null) {
    this.queuePaymentOperation = queuePaymentOperation;
    this.loggingService = loggingService;
    this.isRunning = false;
    this.intervalId = null;
    this.checkIntervalMinutes = 30; // Check every 30 minutes by default
    this.paymentTimeoutMinutes = 60; // Default 60 minutes timeout for payments
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
      console.log('⚠️ Payment timeout scheduler is already running');
      return;
    }

    console.log('🔄 Starting payment timeout scheduler...');
    
    // Run initial check
    this.runTimeoutCheck();
    
    // Set up interval checking
    this.intervalId = setInterval(() => {
      this.runTimeoutCheck();
    }, this.checkIntervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    this.isRunning = true;
    console.log(`✅ Payment timeout scheduler started - checking every ${this.checkIntervalMinutes} minutes for payments older than ${this.paymentTimeoutMinutes} minutes`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Payment timeout scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Payment timeout scheduler stopped');
  }

  /**
   * Execute the payment timeout check operation
   */
  async runTimeoutCheck() {
    try {
      console.log('⏰ Starting payment timeout check...');
      
      // Create audit log entry for the timeout check operation
      if (this.loggingService) {
        const auditLogger = this.loggingService.getAuditLogger();
        await auditLogger.logAdminOperation(
          'system', 
          'automated_payment_timeout_check', 
          'payments_table', 
          {
            checkInterval: `${this.checkIntervalMinutes} minutes`,
            paymentTimeout: `${this.paymentTimeoutMinutes} minutes`,
            initiatedAt: new Date().toISOString(),
            automated: true
          }
        );
      }
      
      // Queue the timeout check operation
      const job = await this.queuePaymentOperation('timeout-pending-payments', {
        timeoutMinutes: this.paymentTimeoutMinutes
      }, { 
        priority: 1, // High priority (lower number = higher priority)
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 5,      // Keep last 5 failed jobs
        attempts: 3,          // Retry up to 3 times if it fails
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        }
      });

      console.log(`✅ Payment timeout check job queued with ID: ${job.id}`);
      
      // Log successful scheduling
      if (this.loggingService) {
        const appLogger = this.loggingService.getApplicationLogger();
        await appLogger.logSystemEvent('payment_timeout_check_scheduled', {
          jobId: job.id,
          timeoutMinutes: this.paymentTimeoutMinutes,
          scheduledBy: 'automated_scheduler',
          nextCheck: new Date(Date.now() + (this.checkIntervalMinutes * 60 * 1000)).toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to queue payment timeout check job:', error.message);
      
      // Log the error
      if (this.loggingService) {
        const appLogger = this.loggingService.getApplicationLogger();
        await appLogger.error('Automated payment timeout check failed', {
          error: error.message,
          stack: error.stack,
          timeoutMinutes: this.paymentTimeoutMinutes,
          checkInterval: this.checkIntervalMinutes,
          operation: 'automated_payment_timeout_check'
        });
      }
      
      // Don't retry automatically on error for payment checks (unlike logs)
      // Instead, wait for the next scheduled interval
    }
  }

  /**
   * Run timeout check immediately (for manual trigger)
   */
  async runTimeoutCheckNow() {
    console.log('⏰ Running manual payment timeout check...');
    
    // Create audit log entry for manual timeout check
    if (this.loggingService) {
      const auditLogger = this.loggingService.getAuditLogger();
      await auditLogger.logAdminOperation(
        'admin', 
        'manual_payment_timeout_check', 
        'payments_table', 
        {
          timeoutMinutes: this.paymentTimeoutMinutes,
          initiatedAt: new Date().toISOString(),
          automated: false,
          trigger: 'manual_api_call'
        }
      );
    }
    
    return await this.runTimeoutCheck();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMinutes: this.checkIntervalMinutes,
      paymentTimeoutMinutes: this.paymentTimeoutMinutes,
      nextCheck: this.isRunning ? new Date(Date.now() + (this.checkIntervalMinutes * 60 * 1000)).toISOString() : null
    };
  }

  /**
   * Set custom check interval (in minutes)
   */
  setCheckInterval(minutes) {
    if (minutes < 1 || minutes > 1440) { // 1 minute to 24 hours
      throw new Error('Invalid check interval. Must be between 1 and 1440 minutes (24 hours)');
    }
    
    this.checkIntervalMinutes = minutes;
    console.log(`📅 Payment timeout check interval updated to ${minutes} minutes`);
    
    // Restart if running to apply new interval
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Set custom payment timeout duration (in minutes)
   */
  setPaymentTimeout(minutes) {
    if (minutes < 5 || minutes > 10080) { // 5 minutes to 7 days
      throw new Error('Invalid payment timeout. Must be between 5 and 10080 minutes (7 days)');
    }
    
    this.paymentTimeoutMinutes = minutes;
    console.log(`💳 Payment timeout duration updated to ${minutes} minutes`);
  }

  /**
   * Set both intervals at once
   */
  setConfiguration(checkIntervalMinutes, paymentTimeoutMinutes) {
    this.setPaymentTimeout(paymentTimeoutMinutes);
    this.setCheckInterval(checkIntervalMinutes);
  }
}

module.exports = PaymentTimeoutScheduler;

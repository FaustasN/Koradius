const { emailQueue, fileQueue, notificationQueue } = require('./config');

class QueueManager {
  constructor() {
    this.queues = {
      email: emailQueue,
      file: fileQueue,
      notification: notificationQueue,
    };
  }

  // Get queue statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      
      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
      };
    }
    
    return stats;
  }

  // Clean completed jobs (maintenance)
  async cleanQueues() {
    const results = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24h
        await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
        results[name] = 'cleaned';
      } catch (error) {
        results[name] = `error: ${error.message}`;
      }
    }
    
    return results;
  }

  // Get queue health status
  async getHealthStatus() {
    const status = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const failed = await queue.getFailed();
        
        // Consider queue healthy if:
        // - Waiting jobs < 100
        // - Active jobs < 50
        // - Failed jobs < 10
        const isHealthy = waiting.length < 100 && active.length < 50 && failed.length < 10;
        
        status[name] = {
          healthy: isHealthy,
          waiting: waiting.length,
          active: active.length,
          failed: failed.length,
        };
      } catch (error) {
        status[name] = {
          healthy: false,
          error: error.message,
        };
      }
    }
    
    return status;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down queue manager...');
    
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.close();
        console.log(`Queue ${name} closed`);
      } catch (error) {
        console.error(`Error closing queue ${name}:`, error);
      }
    }
  }
}

module.exports = new QueueManager();

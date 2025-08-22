const axios = require('axios');

class BackendHealthMonitor {
  constructor() {
    this.backends = [
      {
        id: 'backend-1',
        url: 'http://backend-1:3001',
        name: 'Backend Instance 1',
        status: 'unknown',
        lastCheck: null,
        lastSeen: null,
        responseTime: null,
        consecutiveFailures: 0
      },
      {
        id: 'backend-2',
        url: 'http://backend-2:3001',
        name: 'Backend Instance 2',
        status: 'unknown',
        lastCheck: null,
        lastSeen: null,
        responseTime: null,
        consecutiveFailures: 0
      }
    ];
    
    this.checkInterval = 30000; // Check every 30 seconds
    this.timeout = 5000; // 5 second timeout
    this.maxConsecutiveFailures = 3; // Alert after 3 consecutive failures
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    // Callbacks for notifications
    this.onBackendDown = null;
    this.onBackendUp = null;
    this.onBackendRecovered = null;
  }

  // Set notification callbacks
  setNotificationCallbacks(callbacks) {
    this.onBackendDown = callbacks.onBackendDown;
    this.onBackendUp = callbacks.onBackendUp;
    this.onBackendRecovered = callbacks.onBackendRecovered;
  }

  // Start monitoring all backend instances
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('🔍 Backend health monitoring is already running');
      return;
    }

    console.log('🏥 Starting backend health monitoring...');
    this.isMonitoring = true;
    
    // Initial check
    this.checkAllBackends();
    
    // Schedule regular checks
    this.monitoringInterval = setInterval(() => {
      this.checkAllBackends();
    }, this.checkInterval);
    
    console.log(`✅ Backend health monitoring started (checking every ${this.checkInterval/1000}s)`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🏥 Backend health monitoring stopped');
  }

  // Check health of all backend instances
  async checkAllBackends() {
    const checkPromises = this.backends.map(backend => this.checkBackendHealth(backend));
    await Promise.all(checkPromises);
    
    // Log overall status
    const healthyCount = this.backends.filter(b => b.status === 'healthy').length;
    const totalCount = this.backends.length;
    
    if (healthyCount < totalCount) {
      console.warn(`⚠️  Backend health status: ${healthyCount}/${totalCount} instances healthy`);
    }
  }

  // Check health of a specific backend instance
  async checkBackendHealth(backend) {
    const startTime = Date.now();
    const now = new Date().toISOString();
    
    try {
      // Make health check request
      await axios.get(`${backend.url}/api/health`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Backend-Health-Monitor'
        }
      });
      
      this.handleHealthyResponse(backend, startTime, now);
      
    } catch (error) {
      this.handleErrorResponse(backend, startTime, now, error);
    }
  }

  // Handle successful health check response
  handleHealthyResponse(backend, startTime, now) {
    const responseTime = Date.now() - startTime;
    const previousStatus = backend.status;
    
    // Update backend status
    backend.status = 'healthy';
    backend.lastCheck = now;
    backend.lastSeen = now;
    backend.responseTime = responseTime;
    backend.consecutiveFailures = 0;
    backend.errorMessage = null;
    
    // Check if backend recovered
    if (previousStatus === 'unhealthy' || previousStatus === 'down') {
      console.log(`✅ ${backend.name} (${backend.id}) has recovered`);
      if (this.onBackendRecovered) {
        this.onBackendRecovered(backend, {
          previousStatus,
          downtime: this.calculateDowntime(backend),
          responseTime
        });
      }
    } else if (previousStatus === 'unknown') {
      console.log(`🟢 ${backend.name} (${backend.id}) is healthy`);
      if (this.onBackendUp) {
        this.onBackendUp(backend);
      }
    }
  }

  // Handle error response from health check
  handleErrorResponse(backend, startTime, now, error) {
    const responseTime = Date.now() - startTime;
    const previousStatus = backend.status;
    
    backend.lastCheck = now;
    backend.responseTime = responseTime;
    backend.consecutiveFailures++;
    backend.errorMessage = error.message;
    
    // Determine status based on failure count
    if (backend.consecutiveFailures >= this.maxConsecutiveFailures) {
      backend.status = 'down';
      
      // Alert if status changed to down (from any non-down status)
      if (previousStatus !== 'down') {
        console.error(`🔴 ${backend.name} (${backend.id}) is DOWN - ${error.message}`);
        if (this.onBackendDown) {
          this.onBackendDown(backend, {
            error: error.message,
            consecutiveFailures: backend.consecutiveFailures,
            lastSeen: backend.lastSeen
          });
        }
      }
    } else {
      backend.status = 'unhealthy';
      
      if (previousStatus === 'healthy') {
        console.warn(`🟡 ${backend.name} (${backend.id}) is unhealthy (${backend.consecutiveFailures}/${this.maxConsecutiveFailures} failures)`);
      }
    }
  }

  // Calculate downtime duration
  calculateDowntime(backend) {
    if (!backend.lastSeen) return null;
    
    const lastSeenTime = new Date(backend.lastSeen).getTime();
    const currentTime = Date.now();
    return currentTime - lastSeenTime;
  }

  // Get current status of all backends
  getBackendStatus() {
    return {
      backends: this.backends.map(backend => ({
        id: backend.id,
        name: backend.name,
        url: backend.url,
        status: backend.status,
        lastCheck: backend.lastCheck,
        lastSeen: backend.lastSeen,
        responseTime: backend.responseTime,
        consecutiveFailures: backend.consecutiveFailures,
        errorMessage: backend.errorMessage,
        downtime: backend.status === 'down' ? this.calculateDowntime(backend) : null
      })),
      summary: {
        total: this.backends.length,
        healthy: this.backends.filter(b => b.status === 'healthy').length,
        unhealthy: this.backends.filter(b => b.status === 'unhealthy').length,
        down: this.backends.filter(b => b.status === 'down').length,
        unknown: this.backends.filter(b => b.status === 'unknown').length
      },
      isMonitoring: this.isMonitoring,
      lastUpdate: new Date().toISOString()
    };
  }

  // Get health summary for load balancer
  getLoadBalancerHealth() {
    const healthyBackends = this.backends.filter(b => b.status === 'healthy');
    const totalBackends = this.backends.length;
    
    return {
      status: healthyBackends.length > 0 ? 'operational' : 'down',
      healthyInstances: healthyBackends.length,
      totalInstances: totalBackends,
      availabilityPercentage: Math.round((healthyBackends.length / totalBackends) * 100),
      backends: this.backends.map(b => ({
        id: b.id,
        status: b.status,
        responseTime: b.responseTime
      }))
    };
  }

  // Force immediate check of all backends
  async forceCheck() {
    console.log('🔄 Forcing immediate backend health check...');
    await this.checkAllBackends();
    return this.getBackendStatus();
  }

  // Get specific backend status
  getBackendById(backendId) {
    return this.backends.find(b => b.id === backendId);
  }

  // Update backend configuration
  updateBackendConfig(backendId, config) {
    const backend = this.getBackendById(backendId);
    if (backend) {
      Object.assign(backend, config);
      console.log(`🔧 Updated configuration for ${backend.name}`);
    }
  }

  // Get monitoring statistics
  getMonitoringStats() {
    const now = Date.now();
    const stats = {
      monitoringUptime: this.isMonitoring ? now - (this.startTime || now) : 0,
      totalChecks: this.backends.reduce((sum, b) => sum + (b.totalChecks || 0), 0),
      totalFailures: this.backends.reduce((sum, b) => sum + (b.totalFailures || 0), 0),
      averageResponseTime: 0,
      backends: []
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    this.backends.forEach(backend => {
      if (backend.responseTime !== null) {
        totalResponseTime += backend.responseTime;
        responseTimeCount++;
      }

      stats.backends.push({
        id: backend.id,
        name: backend.name,
        status: backend.status,
        uptime: backend.status === 'healthy' ? 100 : 0, // Simplified uptime calculation
        averageResponseTime: backend.responseTime,
        totalFailures: backend.totalFailures || 0
      });
    });

    if (responseTimeCount > 0) {
      stats.averageResponseTime = Math.round(totalResponseTime / responseTimeCount);
    }

    return stats;
  }
}

module.exports = BackendHealthMonitor;

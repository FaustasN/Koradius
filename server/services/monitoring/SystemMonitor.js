const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class SystemMonitor {
  constructor() {
    this.metrics = {
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: 0,
        used: 0,
        usagePercentage: 0,
        heap: {
          used: 0,
          total: 0,
          external: 0,
          rss: 0
        }
      },
      uptime: {
        system: 0,
        process: 0
      },
      network: {
        interfaces: {},
        connections: 0
      },
      disk: {
        usage: 0,
        free: 0,
        total: 0
      },
      processes: {
        count: 0,
        nodeProcesses: 0
      }
    };
    
    this.previousCpuUsage = this.getCpuUsage();
    this.monitoringInterval = null;
    this.historySize = 60; // Keep 60 data points (5 minutes at 5-second intervals)
    this.history = [];
    
    // Start monitoring immediately
    this.startMonitoring();
  }

  // Get current CPU usage
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  }

  // Calculate CPU usage percentage
  calculateCpuUsage() {
    const currentUsage = this.getCpuUsage();
    const idleDifference = currentUsage.idle - this.previousCpuUsage.idle;
    const totalDifference = currentUsage.total - this.previousCpuUsage.total;
    
    const usage = 100 - ~~(100 * idleDifference / totalDifference);
    this.previousCpuUsage = currentUsage;
    
    return Math.max(0, Math.min(100, usage));
  }

  // Get memory information
  getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const processMemory = process.memoryUsage();

    return {
      total: Math.round(total / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      usagePercentage: Math.round((used / total) * 100),
      heap: {
        used: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
        total: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
        external: Math.round(processMemory.external / 1024 / 1024), // MB
        rss: Math.round(processMemory.rss / 1024 / 1024) // MB
      }
    };
  }

  // Get network interfaces information
  getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = {};
    
    Object.keys(interfaces).forEach(name => {
      const iface = interfaces[name];
      const activeInterface = iface.find(addr => !addr.internal && addr.family === 'IPv4');
      
      if (activeInterface) {
        networkInfo[name] = {
          address: activeInterface.address,
          netmask: activeInterface.netmask,
          family: activeInterface.family,
          mac: activeInterface.mac
        };
      }
    });

    return networkInfo;
  }

  // Get disk usage information (Linux/Unix only, simplified for Docker)
  async getDiskInfo() {
    try {
      // In Docker, we'll focus on the container's filesystem
      await fs.stat('/app');
      
      // For container environments, we'll provide basic info
      return {
        usage: 0, // Would need more complex logic for actual disk usage
        free: 0,
        total: 0,
        path: '/app'
      };
    } catch (error) {
      console.error('Could not retrieve disk information:', error.message);
      return {
        usage: 0,
        free: 0,
        total: 0,
        error: 'Could not retrieve disk information'
      };
    }
  }

  // Get process information
  async getProcessInfo() {
    try {
      // Count total processes (simplified)
      let processCount = 0;
      let nodeProcesses = 0;
      
      // This is a simplified version - in production you might want more detailed process info
      processCount = 1; // At least this process
      nodeProcesses = 1; // This Node.js process
      
      return {
        count: processCount,
        nodeProcesses: nodeProcesses,
        pid: process.pid,
        ppid: process.ppid || 0,
        platform: os.platform(),
        arch: os.arch()
      };
    } catch (error) {
      console.error('Could not retrieve process information:', error.message);
      return {
        count: 0,
        nodeProcesses: 0,
        error: 'Could not retrieve process information'
      };
    }
  }

  // Get load average (Unix-like systems)
  getLoadAverage() {
    try {
      return os.loadavg();
    } catch (error) {
      console.error('Could not retrieve load average:', error.message);
      return [0, 0, 0];
    }
  }

  // Update all metrics
  async updateMetrics() {
    try {
      // CPU metrics
      this.metrics.cpu.usage = this.calculateCpuUsage();
      this.metrics.cpu.loadAverage = this.getLoadAverage();
      this.metrics.cpu.cores = os.cpus().length;

      // Memory metrics
      this.metrics.memory = this.getMemoryInfo();

      // Uptime metrics
      this.metrics.uptime.system = Math.floor(os.uptime());
      this.metrics.uptime.process = Math.floor(process.uptime());

      // Network metrics
      this.metrics.network.interfaces = this.getNetworkInfo();

      // Disk metrics
      this.metrics.disk = await this.getDiskInfo();

      // Process metrics
      this.metrics.processes = await this.getProcessInfo();

      // Add to history
      const timestamp = new Date().toISOString();
      this.history.push({
        timestamp,
        cpu: this.metrics.cpu.usage,
        memory: this.metrics.memory.usagePercentage,
        heapUsed: this.metrics.memory.heap.used,
        uptime: this.metrics.uptime.process
      });

      // Keep only recent history
      if (this.history.length > this.historySize) {
        this.history = this.history.slice(-this.historySize);
      }

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  // Start monitoring
  startMonitoring(interval = 5000) { // Default 5 seconds
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Initial update
    this.updateMetrics();

    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, interval);

    console.log(`📊 System monitoring started with ${interval}ms interval`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📊 System monitoring stopped');
    }
  }

  // Get current metrics
  getCurrentMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      instance: process.env.INSTANCE_ID || 'unknown'
    };
  }

  // Get metrics history
  getHistory(points = this.historySize) {
    return this.history.slice(-points);
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.history.length === 0) {
      return {
        cpu: { avg: 0, min: 0, max: 0 },
        memory: { avg: 0, min: 0, max: 0 },
        trend: 'stable'
      };
    }

    const cpuValues = this.history.map(h => h.cpu);
    const memoryValues = this.history.map(h => h.memory);

    const cpuAvg = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
    const memoryAvg = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;

    // Determine trend based on recent vs earlier data
    const recentData = this.history.slice(-10);
    const earlierData = this.history.slice(0, 10);
    
    let trend = 'stable';
    if (recentData.length >= 5 && earlierData.length >= 5) {
      const recentAvg = recentData.reduce((a, b) => a + b.cpu + b.memory, 0) / (recentData.length * 2);
      const earlierAvg = earlierData.reduce((a, b) => a + b.cpu + b.memory, 0) / (earlierData.length * 2);
      
      if (recentAvg > earlierAvg + 10) trend = 'increasing';
      else if (recentAvg < earlierAvg - 10) trend = 'decreasing';
    }

    return {
      cpu: {
        avg: Math.round(cpuAvg * 100) / 100,
        min: Math.min(...cpuValues),
        max: Math.max(...cpuValues)
      },
      memory: {
        avg: Math.round(memoryAvg * 100) / 100,
        min: Math.min(...memoryValues),
        max: Math.max(...memoryValues)
      },
      trend,
      dataPoints: this.history.length
    };
  }

  // Check if system is healthy
  isHealthy() {
    const { cpu, memory } = this.metrics;
    
    // Define thresholds
    const CPU_THRESHOLD = 85; // 85% CPU usage
    const MEMORY_THRESHOLD = 90; // 90% memory usage
    const HEAP_THRESHOLD = 85; // 85% heap usage relative to total memory

    const issues = [];
    
    if (cpu.usage > CPU_THRESHOLD) {
      issues.push(`High CPU usage: ${cpu.usage}%`);
    }
    
    if (memory.usagePercentage > MEMORY_THRESHOLD) {
      issues.push(`High memory usage: ${memory.usagePercentage}%`);
    }
    
    if (memory.heap.used > (memory.total * HEAP_THRESHOLD / 100)) {
      issues.push(`High heap usage: ${memory.heap.used}MB`);
    }

    let status;
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.length <= 2) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      healthy: issues.length === 0,
      issues: issues,
      status: status
    };
  }

  // Get alerts based on thresholds
  getAlerts() {
    const health = this.isHealthy();
    const alerts = [];
    
    if (!health.healthy) {
      alerts.push({
        type: 'system_performance',
        severity: health.status,
        message: `System performance issues detected: ${health.issues.join(', ')}`,
        timestamp: new Date().toISOString(),
        instance: process.env.INSTANCE_ID || 'unknown'
      });
    }

    // Check for rapid resource usage increase
    if (this.history.length >= 10) {
      const recent = this.history.slice(-5);
      const earlier = this.history.slice(-10, -5);
      
      const recentCpuAvg = recent.reduce((a, b) => a + b.cpu, 0) / recent.length;
      const earlierCpuAvg = earlier.reduce((a, b) => a + b.cpu, 0) / earlier.length;
      
      if (recentCpuAvg > earlierCpuAvg + 30) {
        alerts.push({
          type: 'cpu_spike',
          severity: 'warning',
          message: `Rapid CPU usage increase detected: ${earlierCpuAvg.toFixed(1)}% → ${recentCpuAvg.toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          instance: process.env.INSTANCE_ID || 'unknown'
        });
      }
    }

    return alerts;
  }
}

module.exports = SystemMonitor;

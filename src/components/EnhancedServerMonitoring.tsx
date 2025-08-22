import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Monitor,
  Network,
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  MemoryStick,
  Clock
} from 'lucide-react';
import { serverAPI } from '../services/adminApiService';
import { useRefreshContext } from '../contexts/RefreshContext';
import LoggingComponent from './LoggingComponent';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
    heap: {
      used: number;
      total: number;
      external: number;
      rss: number;
    };
  };
  uptime: {
    system: number;
    process: number;
  };
  network: {
    interfaces: any;
  };
  processes: {
    count: number;
    nodeProcesses: number;
    platform: string;
    arch: string;
    pid: number;
  };
  timestamp: string;
  instance: string;
}

interface SystemHealth {
  healthy: boolean;
  issues: string[];
  status: 'healthy' | 'warning' | 'critical';
}

interface PerformanceSummary {
  cpu: {
    avg: number;
    min: number;
    max: number;
  };
  memory: {
    avg: number;
    min: number;
    max: number;
  };
  trend: 'stable' | 'increasing' | 'decreasing';
  dataPoints: number;
}

interface SystemHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  heapUsed: number;
  uptime: number;
}

interface EnhancedServerStatus {
  status: string;
  instance: {
    id: string;
    port: number;
    uptime: number;
    nodeVersion: string;
    environment: string;
    platform: string;
    arch: string;
    pid: number;
  };
  database: {
    status: string;
    host: string;
    name: string;
  };
  system: {
    cpu: {
      usage: number;
      cores: number;
      loadAverage: number[];
    };
    memory: {
      total: number;
      used: number;
      free: number;
      usagePercentage: number;
      heap: {
        used: number;
        total: number;
        external: number;
        rss: number;
      };
    };
    uptime: {
      system: number;
      process: number;
    };
    health: SystemHealth;
    performance: PerformanceSummary;
  };
  queues: {
    health: any;
    stats: any;
  };
  redis: {
    host: string;
    port: string;
    status: string;
  };
  timestamp: string;
}

interface LoadBalancerStatus {
  loadBalancer: {
    status: string;
    backendServers: number;
    method: string;
    nginxProxy: string;
  };
  currentInstance: string;
  timestamp: string;
}

const EnhancedServerMonitoring: React.FC = () => {
  const { actions: refreshActions } = useRefreshContext();
  const [serverStatus, setServerStatus] = useState<EnhancedServerStatus | null>(null);
  const [systemHistory, setSystemHistory] = useState<SystemHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'metrics' | 'history' | 'logging'>('overview');

  const fetchServerData = async () => {
    try {
      setError(null);
      const [serverData, historyData] = await Promise.all([
        serverAPI.getServerStatusEnhanced(),
        serverAPI.getSystemHistory(60)
      ]);
      
      setServerStatus(serverData);
      setSystemHistory(historyData.history || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch server data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  // Subscribe to centralized refresh system
  useEffect(() => {
    // Subscribe to refresh events
    const unsubscribe = refreshActions.onRefresh('serverMonitoring', fetchServerData);
    
    // Enable server monitoring in the refresh system
    refreshActions.enableComponentRefresh('serverMonitoring');
    
    return () => {
      unsubscribe();
      refreshActions.disableComponentRefresh('serverMonitoring');
    };
  }, []); // Empty dependency array to avoid re-subscribing

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatBytes = (bytes: number): string => {
    return `${bytes.toFixed(1)}MB`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Monitor className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-blue-500" />;
    }
  };

  const getUsageBarColor = (percentage: number): string => {
    if (percentage > 85) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Enhanced queue operations
  // These functions are kept for future queue management functionality
  // const retryFailedJobs = async (queueName: string) => {
  //   try {
  //     setLoading(true);
  //     const response = await serverAPI.retryFailedJobs(queueName);
  //     console.log(`Retried failed jobs in ${queueName}:`, response);
  //     await fetchServerData();
  //   } catch (error) {
  //     console.error('Error retrying failed jobs:', error);
  //   } finally {
  const renderSystemOverview = () => (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-600" />
            System Overview
          </h3>
          <div className="flex items-center space-x-2">
            {serverStatus?.system?.health && getStatusIcon(serverStatus.system.health.status)}
            <span className={`font-medium ${serverStatus?.system?.health && getStatusColor(serverStatus.system.health.status)}`}>
              {serverStatus?.system?.health?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center">
                <Cpu className="w-4 h-4 mr-1" />
                CPU Usage
              </span>
              <span className="text-lg font-bold text-gray-900">
                {serverStatus?.system?.cpu?.usage?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(serverStatus?.system?.cpu?.usage || 0)}`}
                style={{ width: `${Math.min(serverStatus?.system?.cpu?.usage || 0, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {serverStatus?.system?.cpu?.cores} cores
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center">
                <MemoryStick className="w-4 h-4 mr-1" />
                Memory Usage
              </span>
              <span className="text-lg font-bold text-gray-900">
                {serverStatus?.system?.memory?.usagePercentage?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(serverStatus?.system?.memory?.usagePercentage || 0)}`}
                style={{ width: `${Math.min(serverStatus?.system?.memory?.usagePercentage || 0, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(serverStatus?.system?.memory?.used || 0)} / {formatBytes(serverStatus?.system?.memory?.total || 0)}
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Uptime
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatUptime(serverStatus?.system?.uptime?.process || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Process uptime
            </div>
          </div>

          {/* Performance Trend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                Trend
              </span>
              {serverStatus?.system?.performance && getTrendIcon(serverStatus.system.performance.trend)}
            </div>
            <div className="text-lg font-bold text-gray-900 capitalize">
              {serverStatus?.system?.performance?.trend || 'stable'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Performance trend
            </div>
          </div>
        </div>

        {/* Health Issues */}
        {serverStatus?.system?.health?.issues && serverStatus.system.health.issues.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">System Issues:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {serverStatus.system.health.issues.map((issue) => (
                <li key={issue} className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Instance Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Monitor className="w-5 h-5 mr-2 text-blue-600" />
          Instance Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-600">Instance ID</div>
            <p className="text-sm text-gray-900 font-mono">{serverStatus?.instance?.id}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Platform</div>
            <p className="text-sm text-gray-900">{serverStatus?.instance?.platform} ({serverStatus?.instance?.arch})</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Node.js Version</div>
            <p className="text-sm text-gray-900">{serverStatus?.instance?.nodeVersion}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Environment</div>
            <p className="text-sm text-gray-900">{serverStatus?.instance?.environment}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Process ID</div>
            <p className="text-sm text-gray-900">{serverStatus?.instance?.pid}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Port</div>
            <p className="text-sm text-gray-900">{serverStatus?.instance?.port}</p>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Database Status
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <div className="flex items-center space-x-2">
                {serverStatus?.database?.status === 'connected' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  serverStatus?.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {serverStatus?.database?.status?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Host</span>
              <span className="text-sm text-gray-900">{serverStatus?.database?.host}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Database</span>
              <span className="text-sm text-gray-900">{serverStatus?.database?.name}</span>
            </div>
          </div>
        </div>

        {/* Redis Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Network className="w-5 h-5 mr-2 text-blue-600" />
            Redis Status
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <div className="flex items-center space-x-2">
                {serverStatus?.redis?.status === 'connected' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  serverStatus?.redis?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {serverStatus?.redis?.status?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Host</span>
              <span className="text-sm text-gray-900">{serverStatus?.redis?.host}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Port</span>
              <span className="text-sm text-gray-900">{serverStatus?.redis?.port}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      {/* Detailed CPU Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Cpu className="w-5 h-5 mr-2 text-blue-600" />
          CPU Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {serverStatus?.system?.cpu?.usage?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600">Current Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(serverStatus?.system?.cpu?.usage || 0)}`}
                style={{ width: `${Math.min(serverStatus?.system?.cpu?.usage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {serverStatus?.system?.cpu?.cores || 0}
            </div>
            <div className="text-sm text-gray-600">CPU Cores</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600 mb-2">
              {serverStatus?.system?.cpu?.loadAverage?.[0]?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-600">Load Average (1m)</div>
          </div>
        </div>

        {/* Performance Summary */}
        {serverStatus?.system?.performance && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-blue-700">CPU Average</div>
                <div className="text-lg font-semibold text-blue-900">
                  {serverStatus.system.performance.cpu.avg.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600">
                  Min: {serverStatus.system.performance.cpu.min.toFixed(1)}% | 
                  Max: {serverStatus.system.performance.cpu.max.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Memory Average</div>
                <div className="text-lg font-semibold text-blue-900">
                  {serverStatus.system.performance.memory.avg.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600">
                  Min: {serverStatus.system.performance.memory.min.toFixed(1)}% | 
                  Max: {serverStatus.system.performance.memory.max.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-700">Trend</div>
                <div className="text-lg font-semibold text-blue-900 flex items-center">
                  {getTrendIcon(serverStatus.system.performance.trend)}
                  <span className="ml-2 capitalize">{serverStatus.system.performance.trend}</span>
                </div>
                <div className="text-xs text-blue-600">
                  Based on {serverStatus.system.performance.dataPoints} data points
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Memory Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <MemoryStick className="w-5 h-5 mr-2 text-blue-600" />
          Memory Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Memory */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">System Memory</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.used || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Free</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.free || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-medium">{serverStatus?.system?.memory?.usagePercentage?.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(serverStatus?.system?.memory?.usagePercentage || 0)}`}
                style={{ width: `${Math.min(serverStatus?.system?.memory?.usagePercentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Heap Memory */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Node.js Heap</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.heap?.used || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.heap?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">External</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.heap?.external || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">RSS</span>
                <span className="font-medium">{formatBytes(serverStatus?.system?.memory?.heap?.rss || 0)}</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div 
                className="h-3 rounded-full transition-all duration-300 bg-blue-500"
                style={{ 
                  width: `${Math.min(
                    ((serverStatus?.system?.memory?.heap?.used || 0) / 
                     (serverStatus?.system?.memory?.heap?.total || 1)) * 100, 
                    100
                  )}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      {/* Simple chart representation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          System Performance History
        </h3>
        
        {systemHistory && systemHistory.length > 0 ? (
          <div className="space-y-6">
            {/* CPU History */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">CPU Usage Over Time</h4>
              <div className="h-24 flex items-end space-x-1">
                {systemHistory.slice(-30).map((point) => (
                  <div
                    key={point.timestamp}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${Math.max(point.cpu, 2)}%` }}
                    title={`CPU: ${point.cpu.toFixed(1)}% at ${new Date(point.timestamp).toLocaleTimeString()}`}
                  ></div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">Last 30 data points</div>
            </div>

            {/* Memory History */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Usage Over Time</h4>
              <div className="h-24 flex items-end space-x-1">
                {systemHistory.slice(-30).map((point) => (
                  <div
                    key={`memory-${point.timestamp}`}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${Math.max(point.memory, 2)}%` }}
                    title={`Memory: ${point.memory.toFixed(1)}% at ${new Date(point.timestamp).toLocaleTimeString()}`}
                  ></div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">Last 30 data points</div>
            </div>

            {/* Recent History Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600">Time</th>
                      <th className="text-left py-2 text-gray-600">CPU</th>
                      <th className="text-left py-2 text-gray-600">Memory</th>
                      <th className="text-left py-2 text-gray-600">Heap</th>
                      <th className="text-left py-2 text-gray-600">Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemHistory.slice(-10).reverse().map((point) => (
                      <tr key={`history-${point.timestamp}`} className="border-b border-gray-100">
                        <td className="py-1">{new Date(point.timestamp).toLocaleTimeString()}</td>
                        <td className="py-1">{point.cpu.toFixed(1)}%</td>
                        <td className="py-1">{point.memory.toFixed(1)}%</td>
                        <td className="py-1">{formatBytes(point.heapUsed)}</td>
                        <td className="py-1">{formatUptime(point.uptime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No history data available</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !serverStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading server monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchServerData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Server Monitoring</h2>
          <p className="text-gray-600">Real-time system health and performance monitoring</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: Monitor },
              { id: 'metrics', label: 'Detailed Metrics', icon: BarChart3 },
              { id: 'history', label: 'History', icon: Activity },
              { id: 'logging', label: 'Logging', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id as any)}
                className={`${
                  activeSubTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'overview' && renderSystemOverview()}
          {activeSubTab === 'metrics' && renderMetricsTab()}
          {activeSubTab === 'history' && renderHistoryTab()}
          {activeSubTab === 'logging' && <LoggingComponent />}
        </div>
      </div>
    </div>
  );
};

export default EnhancedServerMonitoring;

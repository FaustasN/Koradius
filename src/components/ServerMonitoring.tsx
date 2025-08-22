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
  Settings,
  FileText,
  Shield
} from 'lucide-react';
import { serverAPI } from '../services/adminApiService';
import LoggingComponent from './LoggingComponent';

interface ServerStatus {
  status: string;
  instance: {
    id: string;
    port: number;
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
  database: {
    status: string;
    host: string;
    name: string;
  };
  memory: {
    used: number;
    total: number;
    external: number;
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

interface BackendHealthStatus {
  backends: Array<{
    id: string;
    name: string;
    url: string;
    status: 'healthy' | 'unhealthy' | 'down' | 'unknown';
    lastCheck: string | null;
    lastSeen: string | null;
    responseTime: number | null;
    consecutiveFailures: number;
    errorMessage: string | null;
    downtime: number | null;
  }>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    down: number;
    unknown: number;
  };
  isMonitoring: boolean;
  lastUpdate: string;
}

const ServerMonitoring: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loadBalancerStatus, setLoadBalancerStatus] = useState<LoadBalancerStatus | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'server' | 'backends' | 'logging'>('server');

  const fetchServerData = async () => {
    try {
      setError(null);
      const [serverData, lbData, backendHealthData] = await Promise.all([
        serverAPI.getServerStatus(),
        serverAPI.getLoadBalancerStatus(),
        serverAPI.getBackendHealth()
      ]);
      
      setServerStatus(serverData);
      setLoadBalancerStatus(lbData);
      setBackendHealth(backendHealthData);
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

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchServerData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemoryUsage = (used: number, total: number): string => {
    return `${used}MB / ${total}MB (${((used / total) * 100).toFixed(1)}%)`;
  };

  // Enhanced queue operations
  const retryFailedJobs = async (queueName: string) => {
    try {
      setLoading(true);
      const response = await serverAPI.retryFailedJobs(queueName);
      console.log(`Retried failed jobs in ${queueName}:`, response);
      // Refresh data after operation
      await fetchServerData();
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanQueue = async (queueName: string) => {
    try {
      setLoading(true);
      const response = await serverAPI.cleanQueue(queueName);
      console.log(`Cleaned ${queueName} queue:`, response);
      // Refresh data after operation
      await fetchServerData();
    } catch (error) {
      console.error('Error cleaning queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQueueHealthStatus = (queueName: string) => {
    const health = serverStatus?.queues?.health?.[queueName];
    if (!health) return { status: 'unknown', color: 'text-gray-500' };
    
    if (health.healthy) {
      return { status: 'healthy', color: 'text-green-600' };
    } else if (health.failed > 10) {
      return { status: 'critical', color: 'text-red-600' };
    } else {
      return { status: 'warning', color: 'text-yellow-600' };
    }
  };

  // Force backend health check
  const forceBackendHealthCheck = async () => {
    try {
      setLoading(true);
      await serverAPI.forceBackendHealthCheck();
      // Refresh data after forced check
      await fetchServerData();
    } catch (error) {
      console.error('Error forcing backend health check:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get backend status color and icon
  const getBackendStatusInfo = (status: string) => {
    switch (status) {
      case 'healthy':
        return { 
          color: 'text-green-600 bg-green-50', 
          icon: '✅', 
          label: 'Healthy',
          badge: 'bg-green-500'
        };
      case 'unhealthy':
        return { 
          color: 'text-yellow-600 bg-yellow-50', 
          icon: '⚠️', 
          label: 'Unhealthy',
          badge: 'bg-yellow-500'
        };
      case 'down':
        return { 
          color: 'text-red-600 bg-red-50', 
          icon: '🔴', 
          label: 'Down',
          badge: 'bg-red-500'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-50', 
          icon: '❓', 
          label: 'Unknown',
          badge: 'bg-gray-500'
        };
    }
  };

  // Format downtime duration
  const formatDowntime = (downtime: number | null): string => {
    if (!downtime) return 'N/A';
    
    const seconds = Math.floor(downtime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'active':
        return 'text-green-600';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600';
      case 'disconnected':
      case 'error':
      case 'unavailable':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'disconnected':
      case 'error':
      case 'unavailable':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading server status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Server Status</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={fetchServerData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Monitor className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Server Monitoring</h2>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchServerData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('server')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'server'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              System Status
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('backends')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'backends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Network className="w-4 h-4 mr-2" />
              Backend Health
              {backendHealth && backendHealth.summary.down > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {backendHealth.summary.down} down
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('logging')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'logging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Server Status</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveSubTab('logging')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'logging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Logging</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content based on active sub-tab */}
      {activeSubTab === 'server' && (
        <div className="space-y-6">
          {/* Overall Status */}
      {serverStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(serverStatus.status)}
              <h3 className="text-lg font-semibold ml-2">Overall System Status</h3>
            </div>
            <span className={`text-lg font-semibold capitalize ${getStatusColor(serverStatus.status)}`}>
              {serverStatus.status}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instance Information */}
        {serverStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Server className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Instance Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Instance ID:</span>
                <span className="font-mono text-sm">{serverStatus.instance.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Port:</span>
                <span>{serverStatus.instance.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span>{formatUptime(serverStatus.instance.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Node.js:</span>
                <span>{serverStatus.instance.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="capitalize">{serverStatus.instance.environment}</span>
              </div>
            </div>
          </div>
        )}

        {/* Load Balancer Status */}
        {loadBalancerStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Network className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Load Balancer</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center">
                  {getStatusIcon(loadBalancerStatus.loadBalancer.status)}
                  <span className={`ml-2 capitalize ${getStatusColor(loadBalancerStatus.loadBalancer.status)}`}>
                    {loadBalancerStatus.loadBalancer.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Backend Servers:</span>
                <span>{loadBalancerStatus.loadBalancer.backendServers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-mono text-sm">{loadBalancerStatus.loadBalancer.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Instance:</span>
                <span className="font-mono text-sm">{loadBalancerStatus.currentInstance}</span>
              </div>
            </div>
          </div>
        )}

        {/* Database Status */}
        {serverStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Database</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center">
                  {getStatusIcon(serverStatus.database.status)}
                  <span className={`ml-2 capitalize ${getStatusColor(serverStatus.database.status)}`}>
                    {serverStatus.database.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Host:</span>
                <span className="font-mono text-sm">{serverStatus.database.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="font-mono text-sm">{serverStatus.database.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Redis Status */}
        {serverStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold">Redis Queue</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center">
                  {getStatusIcon(serverStatus.redis.status)}
                  <span className={`ml-2 capitalize ${getStatusColor(serverStatus.redis.status)}`}>
                    {serverStatus.redis.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Host:</span>
                <span className="font-mono text-sm">{serverStatus.redis.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Port:</span>
                <span>{serverStatus.redis.port}</span>
              </div>
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {serverStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Cpu className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold">Memory Usage</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Used:</span>
                <span>{serverStatus.memory.used} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span>{serverStatus.memory.total} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">External:</span>
                <span>{serverStatus.memory.external} MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((serverStatus.memory.used / serverStatus.memory.total) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                {((serverStatus.memory.used / serverStatus.memory.total) * 100).toFixed(1)}% used
              </p>
            </div>
          </div>
        )}

        {/* Comprehensive Queue Management */}
        {serverStatus?.queues?.health && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold">Queue Management</h3>
              </div>
              <div className="text-sm text-gray-500">
                Real-time queue monitoring and management
              </div>
            </div>
            
            <div className="space-y-6">
              {Object.entries(serverStatus.queues.health).map(([queueName, queueData]: [string, any]) => {
                const stats = serverStatus.queues.stats?.[queueName] || {};
                const healthStatus = getQueueHealthStatus(queueName);
                
                return (
                  <div key={queueName} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          healthStatus.status === 'healthy' ? 'bg-green-500' : 
                          healthStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <h4 className="font-semibold capitalize text-lg">{queueName} Queue</h4>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          healthStatus.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                          healthStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {healthStatus.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        {queueData.failed > 0 && (
                          <button
                            onClick={() => retryFailedJobs(queueName)}
                            disabled={loading}
                            className="flex items-center px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            title="Retry all failed jobs"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry Failed
                          </button>
                        )}
                        <button
                          onClick={() => cleanQueue(queueName)}
                          disabled={loading}
                          className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                          title="Clean completed jobs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Clean
                        </button>
                      </div>
                    </div>
                    
                    {/* Queue Statistics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.waiting || queueData.waiting || 0}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Waiting</div>
                      </div>
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.active || queueData.active || 0}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Active</div>
                      </div>
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-2xl font-bold text-gray-600">{stats.completed || 0}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Completed</div>
                      </div>
                      <div className="bg-white rounded p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.failed || queueData.failed || 0}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wider">Failed</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar for Active Jobs */}
                    {(stats.active > 0 || queueData.active > 0) && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Processing Jobs</span>
                          <span>{stats.active || queueData.active} active</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                      </div>
                    )}
                    
                    {/* Error indicator */}
                    {queueData.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-sm text-red-700">Error: {queueData.error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
      )}

      {/* Backend Health Tab */}
      {activeSubTab === 'backends' && (
        <div className="space-y-6">
          {/* Backend Health Overview */}
          {backendHealth && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Network className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">Backend Health Overview</h3>
                </div>
                <button
                  onClick={forceBackendHealthCheck}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Force Check
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Healthy</p>
                      <p className="text-2xl font-bold text-green-800">{backendHealth.summary.healthy}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Unhealthy</p>
                      <p className="text-2xl font-bold text-yellow-800">{backendHealth.summary.unhealthy}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">Down</p>
                      <p className="text-2xl font-bold text-red-800">{backendHealth.summary.down}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-800">{backendHealth.summary.total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Backend Status */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 mb-4">Individual Backend Status</h4>
                {backendHealth.backends.map((backend) => {
                  const statusInfo = getBackendStatusInfo(backend.status);
                  return (
                    <div key={backend.id} className={`rounded-lg border p-4 ${statusInfo.color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{statusInfo.icon}</span>
                          <div>
                            <h5 className="font-semibold">{backend.name}</h5>
                            <p className="text-sm opacity-75">{backend.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <div className={`w-3 h-3 rounded-full ${statusInfo.badge}`}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Response Time:</span>
                          <p>{backend.responseTime ? `${backend.responseTime}ms` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Last Check:</span>
                          <p>{backend.lastCheck ? new Date(backend.lastCheck).toLocaleTimeString() : 'Never'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Failures:</span>
                          <p>{backend.consecutiveFailures}</p>
                        </div>
                        <div>
                          <span className="font-medium">Downtime:</span>
                          <p>{formatDowntime(backend.downtime)}</p>
                        </div>
                      </div>

                      {backend.errorMessage && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm">
                          <span className="font-medium text-red-800">Error:</span>
                          <span className="text-red-700 ml-1">{backend.errorMessage}</span>
                        </div>
                      )}

                      {backend.status === 'down' && backend.lastSeen && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Last Seen:</span>
                          <span className="ml-1">{new Date(backend.lastSeen).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>Monitoring Status: {backendHealth.isMonitoring ? '✅ Active' : '❌ Inactive'}</p>
                <p>Last Update: {new Date(backendHealth.lastUpdate).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logging Tab */}
      {activeSubTab === 'logging' && (
        <LoggingComponent />
      )}
    </div>
  );
};

export default ServerMonitoring;

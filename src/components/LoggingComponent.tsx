import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  XCircle,
  Clock,
  User,
  Database,
  Server,
  Shield,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react';
import { loggingAPI } from '../services/adminApiService';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  log_type: 'application' | 'audit';
  instance_id: string;
  metadata: any;
  trace_id?: string;
  span_id?: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;
}

interface LogStats {
  levelStats: Array<{
    log_type: string;
    level: string;
    count: number;
    first_occurrence: string;
    last_occurrence: string;
  }>;
  topErrors: Array<{
    message: string;
    count: number;
    last_occurrence: string;
  }>;
  instanceStats: Array<{
    instance_id: string;
    log_count: number;
    trace_count: number;
  }>;
  timeRange: string;
  generatedAt: string;
}

const LoggingComponent: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'audit' | 'stats'>('logs');
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
    endDate: new Date().toISOString().split('T')[0],
    level: '',
    logTypes: ['application', 'audit'],
    instanceId: '',
    userId: '',
    traceId: '',
    searchText: '',
    limit: 100,
    offset: 0
  });

  // Audit trail specific
  const [auditUserId, setAuditUserId] = useState('');
  const [auditTrail, setAuditTrail] = useState<LogEntry[]>([]);

  // Compliance report
  const [complianceReport, setComplianceReport] = useState<LogEntry[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState('');

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load logs on component mount and filter changes
  useEffect(() => {
    if (activeSubTab === 'logs') {
      loadLogs();
    } else if (activeSubTab === 'stats') {
      loadStats();
    }
  }, [activeSubTab, filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && activeSubTab === 'logs') {
      const interval = setInterval(loadLogs, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, activeSubTab]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchFilters = {
        ...filters,
        startDate: `${filters.startDate}T00:00:00.000Z`,
        endDate: `${filters.endDate}T23:59:59.999Z`,
        logTypes: filters.logTypes.length > 0 ? filters.logTypes : undefined
      };

      const response = await loggingAPI.getLogs(searchFilters);
      
      // Apply client-side text search if specified
      let filteredLogs = response.logs;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filteredLogs = response.logs.filter((log: LogEntry) => 
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
        );
      }
      
      setLogs(filteredLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timeRange = calculateTimeRange();
      const response = await loggingAPI.getLogStats(timeRange);
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!auditUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await loggingAPI.getUserAuditTrail(
        parseInt(auditUserId),
        `${filters.startDate}T00:00:00.000Z`,
        `${filters.endDate}T23:59:59.999Z`,
        filters.limit
      );
      
      setAuditTrail(response.auditTrail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await loggingAPI.getComplianceReport(
        `${filters.startDate}T00:00:00.000Z`,
        `${filters.endDate}T23:59:59.999Z`,
        selectedRegulation || undefined
      );
      
      setComplianceReport(response.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance report');
    } finally {
      setLoading(false);
    }
  };

  const cleanupLogs = async () => {
    if (!confirm('Are you sure you want to cleanup old logs? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await loggingAPI.cleanupLogs(30); // Default 30 days retention
      alert(`Successfully cleaned up ${response.deletedCount} old log entries`);
      
      // Reload current view
      if (activeSubTab === 'logs') {
        loadLogs();
      } else if (activeSubTab === 'stats') {
        loadStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup logs');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRange = () => {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '24h';
    if (diffDays <= 7) return '7d';
    if (diffDays <= 30) return '30d';
    return '30d';
  };

  const exportLogs = () => {
    const dataToExport = activeSubTab === 'audit' ? auditTrail : logs;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${activeSubTab}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Search className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'debug':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('lt-LT');
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const toggleLogType = (logType: string) => {
    const newLogTypes = filters.logTypes.includes(logType)
      ? filters.logTypes.filter(t => t !== logType)
      : [...filters.logTypes, logType];
    
    handleFilterChange('logTypes', newLogTypes);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Logs</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => activeSubTab === 'logs' ? loadLogs() : loadStats()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">System Logging</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={cleanupLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cleanup</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Application Logs</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Audit Trail</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search in messages..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Log Type Toggles */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Log Types:</span>
          <button
            onClick={() => toggleLogType('application')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filters.logTypes.includes('application')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Application
          </button>
          <button
            onClick={() => toggleLogType('audit')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filters.logTypes.includes('audit')
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Audit
          </button>
        </div>
      </div>

      {/* Content based on active sub-tab */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading logs...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{logs.length} log entries found</p>
                <button
                  onClick={loadLogs}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.message}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.log_type === 'audit' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {log.log_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Server className="w-3 h-3" />
                            <span>{log.instance_id}</span>
                          </span>
                          {log.user_id && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>User {log.user_id}</span>
                            </span>
                          )}
                          {log.trace_id && (
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span className="font-mono text-xs">{log.trace_id.substring(0, 8)}</span>
                            </span>
                          )}
                        </div>
                        {Object.keys(log.metadata || {}).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  placeholder="Enter user ID to view audit trail"
                  value={auditUserId}
                  onChange={(e) => setAuditUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={loadAuditTrail}
                disabled={!auditUserId || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                Load Audit Trail
              </button>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Compliance Report</h4>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Regulations</option>
                  <option value="GDPR">GDPR</option>
                  <option value="CCPA">CCPA</option>
                  <option value="SOX">SOX</option>
                </select>
                <button
                  onClick={loadComplianceReport}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {(auditTrail.length > 0 || complianceReport.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {auditTrail.length > 0 ? 'Audit Trail' : 'Compliance Report'}
              </h3>
              {(auditTrail.length > 0 ? auditTrail : complianceReport).map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 bg-purple-50 border-purple-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <div className="flex-1">
                        <div className="font-medium text-purple-900">{log.message}</div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-purple-700">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          <span>{log.instance_id}</span>
                          {log.user_id && <span>User {log.user_id}</span>}
                        </div>
                        {log.metadata && (
                          <details className="mt-2">
                            <summary className="text-sm text-purple-600 cursor-pointer">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-purple-100 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading statistics...</span>
            </div>
          ) : stats ? (
            <>
              {/* Level Statistics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Level Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.levelStats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {stat.log_type} - {stat.level}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                        </div>
                        {getLevelIcon(stat.level)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Errors */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Error Messages</h3>
                <div className="space-y-2">
                  {stats.topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{error.message}</p>
                        <p className="text-sm text-red-600">
                          Last occurred: {formatTimestamp(error.last_occurrence)}
                        </p>
                      </div>
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                        {error.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instance Statistics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instance Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.instanceStats.map((instance, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Server className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{instance.instance_id}</p>
                          <p className="text-sm text-blue-600">
                            {instance.log_count} logs, {instance.trace_count} traces
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No statistics available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoggingComponent;

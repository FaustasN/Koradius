import { useEffect, useState, useCallback } from 'react';
import ReactGA from 'react-ga4';
import { TrendingUp, TrendingDown, Users, Eye, Clock, Globe, MousePointer, Smartphone, Monitor } from 'lucide-react';
import analyticsConfig from '../config/analytics';

// Analytics data interfaces
interface AnalyticsData {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: Array<{ page: string; views: number; }>;
  deviceTypes: Array<{ device: string; percentage: number; }>;
  trafficSources: Array<{ source: string; percentage: number; }>;
  dailyUsers: Array<{ date: string; users: number; }>;
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ measurementId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Use config for measurement ID
  const configuredMeasurementId = measurementId || analyticsConfig.MEASUREMENT_ID;

  // Initialize Google Analytics
  useEffect(() => {
    if (configuredMeasurementId && configuredMeasurementId !== 'G-XXXXXXXXXX') {
      ReactGA.initialize(configuredMeasurementId);
    }
  }, [configuredMeasurementId]);

  // Mock data for demonstration - replace with real Google Analytics API calls
  const generateMockData = useCallback((): AnalyticsData => {
    let baseUsers: number;
    if (dateRange === '7d') {
      baseUsers = 450;
    } else if (dateRange === '30d') {
      baseUsers = 1850;
    } else {
      baseUsers = 5200;
    }
    
    let daysCount: number;
    if (dateRange === '7d') {
      daysCount = 7;
    } else if (dateRange === '30d') {
      daysCount = 30;
    } else {
      daysCount = 90;
    }
    
    return {
      totalUsers: baseUsers + Math.floor(Math.random() * 200),
      newUsers: Math.floor((baseUsers + Math.floor(Math.random() * 200)) * 0.65),
      sessions: Math.floor((baseUsers + Math.floor(Math.random() * 200)) * 1.3),
      pageViews: Math.floor((baseUsers + Math.floor(Math.random() * 200)) * 3.2),
      bounceRate: 45 + Math.floor(Math.random() * 25),
      avgSessionDuration: `${Math.floor(Math.random() * 3) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      topPages: [
        { page: '/', views: Math.floor(Math.random() * 500) + 800 },
        { page: '/gallery', views: Math.floor(Math.random() * 300) + 400 },
        { page: '/search', views: Math.floor(Math.random() * 200) + 300 },
        { page: '/about', views: Math.floor(Math.random() * 150) + 200 },
        { page: '/contact', views: Math.floor(Math.random() * 100) + 150 },
      ],
      deviceTypes: [
        { device: 'Desktop', percentage: 45 + Math.floor(Math.random() * 15) },
        { device: 'Mobile', percentage: 35 + Math.floor(Math.random() * 15) },
        { device: 'Tablet', percentage: 15 + Math.floor(Math.random() * 10) },
      ],
      trafficSources: [
        { source: 'Organic Search', percentage: 45 + Math.floor(Math.random() * 15) },
        { source: 'Direct', percentage: 25 + Math.floor(Math.random() * 10) },
        { source: 'Social Media', percentage: 15 + Math.floor(Math.random() * 10) },
        { source: 'Referral', percentage: 10 + Math.floor(Math.random() * 8) },
        { source: 'Email', percentage: 5 + Math.floor(Math.random() * 5) },
      ],
      dailyUsers: Array.from({ length: daysCount }, (_, i) => ({
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        users: Math.floor(Math.random() * 100) + 50,
      })).reverse(),
    };
  }, [dateRange]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, you would call the Google Analytics Reporting API here
        // For now, we'll use mock data
        const data = generateMockData();
        setAnalyticsData(data);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, generateMockData]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Desktop': return <Monitor className="h-5 w-5" />;
      case 'Mobile': return <Smartphone className="h-5 w-5" />;
      case 'Tablet': return <Smartphone className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Website Analytics</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => {
            let rangeLabel: string;
            if (range === '7d') {
              rangeLabel = 'Last 7 days';
            } else if (range === '30d') {
              rangeLabel = 'Last 30 days';
            } else {
              rangeLabel = 'Last 90 days';
            }
            
            return (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {rangeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalUsers)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+12.5%</span>
            <span className="text-sm text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.pageViews)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+8.2%</span>
            <span className="text-sm text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.bounceRate}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <MousePointer className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">-3.1%</span>
            <span className="text-sm text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Session Duration</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.avgSessionDuration}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+5.8%</span>
            <span className="text-sm text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>
      </div>

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h4>
          <div className="space-y-4">
            {analyticsData.topPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 w-8">{index + 1}.</span>
                  <span className="text-sm text-gray-600">{page.page}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatNumber(page.views)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Types */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h4>
          <div className="space-y-4">
            {analyticsData.deviceTypes.map((device) => (
              <div key={device.device} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getDeviceIcon(device.device)}
                  <span className="text-sm text-gray-600 ml-2">{device.device}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-teal-600 h-2 rounded-full" 
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h4>
          <div className="space-y-4">
            {analyticsData.trafficSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 ml-2">{source.source}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Users Trend</h4>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-4">
              {(() => {
                if (dateRange === '7d') return 'Users over the last 7 days';
                if (dateRange === '30d') return 'Users over the last 30 days';
                return 'Users over the last 90 days';
              })()}
            </div>
            {/* Simple bar chart representation */}
            <div className="flex items-end space-x-1 h-32">
              {analyticsData.dailyUsers.slice(-10).map((day) => (
                <div
                  key={day.date}
                  className="flex-1 bg-teal-200 rounded-t relative group cursor-pointer"
                  style={{ 
                    height: `${(day.users / Math.max(...analyticsData.dailyUsers.map(d => d.users))) * 100}%`,
                    minHeight: '8px'
                  }}
                >
                  <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.date}: {day.users} users
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {configuredMeasurementId === 'G-XXXXXXXXXX' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>To see real analytics data, you need to:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Create a Google Analytics 4 property</li>
                  <li>Get your Measurement ID (starts with G-)</li>
                  <li>Replace the placeholder ID in the configuration</li>
                  <li>Set up the Google Analytics Reporting API</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAnalytics;

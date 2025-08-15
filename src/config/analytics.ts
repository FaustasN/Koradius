/**
 * Google Analytics Configuration
 * 
 * To use real Google Analytics data:
 * 1. Replace MEASUREMENT_ID with your real Google Analytics 4 Measurement ID
 * 2. Set up environment variables for security
 * 3. Optionally configure Google Analytics Reporting API for advanced features
 */

// Safely access environment variables in Vite
const getEnvVar = (key: string, fallback: string = '') => {
  return import.meta.env?.[key] || fallback;
};

export const analyticsConfig = {
  // Replace with your real Google Analytics 4 Measurement ID
  // Format: G-XXXXXXXXXX
  MEASUREMENT_ID: getEnvVar('VITE_GOOGLE_ANALYTICS_ID', 'G-XXXXXXXXXX'),
  
  // Google Analytics Reporting API settings (optional)
  REPORTING_API: {
    enabled: false, // Set to true when you set up the Reporting API
    serviceAccountEmail: getEnvVar('GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL'),
    privateKey: getEnvVar('GOOGLE_ANALYTICS_PRIVATE_KEY'),
    viewId: getEnvVar('GOOGLE_ANALYTICS_VIEW_ID'),
  },
  
  // Data refresh settings
  REFRESH_INTERVAL: 60000, // 60 seconds
  
  // Date range options
  DATE_RANGES: {
    '7d': { days: 7, label: 'Last 7 days' },
    '30d': { days: 30, label: 'Last 30 days' },
    '90d': { days: 90, label: 'Last 90 days' },
  },
  
  // Mock data settings (for development)
  USE_MOCK_DATA: getEnvVar('VITE_GOOGLE_ANALYTICS_ID', 'G-XXXXXXXXXX') === 'G-XXXXXXXXXX',
};

export default analyticsConfig;

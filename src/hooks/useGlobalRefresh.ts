import { useState, useEffect, useCallback, useRef } from 'react';

export interface RefreshConfig {
  enabled: boolean;
  interval: number;
  lastRefresh: Date | null;
}

export interface GlobalRefreshState {
  // Main dashboard refresh settings
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Per-component refresh configs
  gallery: RefreshConfig;
  travelPackets: RefreshConfig;
  contacts: RefreshConfig;
  reviews: RefreshConfig;
  notifications: RefreshConfig;
  serverMonitoring: RefreshConfig;
  logging: RefreshConfig;
  backendHealth: RefreshConfig;
}

export interface RefreshActions {
  // Global controls
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Component-specific controls
  enableComponentRefresh: (component: keyof Omit<GlobalRefreshState, 'autoRefresh' | 'refreshInterval'>) => void;
  disableComponentRefresh: (component: keyof Omit<GlobalRefreshState, 'autoRefresh' | 'refreshInterval'>) => void;
  setComponentInterval: (component: keyof Omit<GlobalRefreshState, 'autoRefresh' | 'refreshInterval'>, interval: number) => void;
  
  // Manual refresh triggers
  refreshComponent: (component: keyof Omit<GlobalRefreshState, 'autoRefresh' | 'refreshInterval'>) => void;
  refreshAll: () => void;
  
  // Subscribe to refresh events
  onRefresh: (component: keyof Omit<GlobalRefreshState, 'autoRefresh' | 'refreshInterval'>, callback: () => void) => () => void;
}

const DEFAULT_INTERVALS = {
  gallery: 60000,           // 1 minute
  travelPackets: 60000,     // 1 minute
  contacts: 30000,          // 30 seconds
  reviews: 30000,           // 30 seconds
  notifications: 15000,     // 15 seconds
  serverMonitoring: 10000,  // 10 seconds
  logging: 30000,           // 30 seconds
  backendHealth: 15000,     // 15 seconds
};

export const useGlobalRefresh = (): [GlobalRefreshState, RefreshActions] => {
  const [autoRefresh, setAutoRefreshState] = useState<boolean>(true);
  const [refreshInterval, setRefreshIntervalState] = useState<number>(60000); // Default 1 minute
  
  const [refreshConfigs, setRefreshConfigs] = useState<Record<string, RefreshConfig>>({
    gallery: { enabled: false, interval: DEFAULT_INTERVALS.gallery, lastRefresh: null },
    travelPackets: { enabled: false, interval: DEFAULT_INTERVALS.travelPackets, lastRefresh: null },
    contacts: { enabled: false, interval: DEFAULT_INTERVALS.contacts, lastRefresh: null },
    reviews: { enabled: false, interval: DEFAULT_INTERVALS.reviews, lastRefresh: null },
    notifications: { enabled: true, interval: DEFAULT_INTERVALS.notifications, lastRefresh: null },
    serverMonitoring: { enabled: false, interval: DEFAULT_INTERVALS.serverMonitoring, lastRefresh: null },
    logging: { enabled: false, interval: DEFAULT_INTERVALS.logging, lastRefresh: null },
    backendHealth: { enabled: true, interval: DEFAULT_INTERVALS.backendHealth, lastRefresh: null },
  });

  // Store refresh callbacks and intervals in refs to avoid dependency issues
  const refreshCallbacks = useRef<Record<string, Set<() => void>>>({});
  const activeIntervals = useRef<Record<string, NodeJS.Timeout>>({});
  const configsRef = useRef(refreshConfigs);
  
  // Update ref when configs change
  useEffect(() => {
    configsRef.current = refreshConfigs;
  }, [refreshConfigs]);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshState(enabled);
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setRefreshIntervalState(interval);
  }, []);

  const enableComponentRefresh = useCallback((component: string) => {
    setRefreshConfigs(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        enabled: true
      }
    }));
  }, []);

  const disableComponentRefresh = useCallback((component: string) => {
    setRefreshConfigs(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        enabled: false
      }
    }));
    
    // Clear any active interval for this component
    if (activeIntervals.current[component]) {
      clearInterval(activeIntervals.current[component]);
      delete activeIntervals.current[component];
    }
  }, []);

  const setComponentInterval = useCallback((component: string, interval: number) => {
    setRefreshConfigs(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        interval
      }
    }));
  }, []);

  // Stable refresh function that doesn't cause re-renders
  const refreshComponent = useCallback((component: string) => {
    // Trigger callbacks without state updates
    const callbacks = refreshCallbacks.current[component];
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in refresh callback for ${component}:`, error);
        }
      });
    }
  }, []);

  const refreshAll = useCallback(() => {
    Object.entries(configsRef.current).forEach(([component, config]) => {
      if (config.enabled) {
        refreshComponent(component);
      }
    });
  }, [refreshComponent]);

  const onRefresh = useCallback((component: string, callback: () => void) => {
    if (!refreshCallbacks.current[component]) {
      refreshCallbacks.current[component] = new Set();
    }
    
    refreshCallbacks.current[component].add(callback);
    
    // Return unsubscribe function
    return () => {
      refreshCallbacks.current[component]?.delete(callback);
    };
  }, []);

  // Interval management with minimal dependencies
  useEffect(() => {
    const startInterval = (component: string, interval: number) => {
      if (activeIntervals.current[component]) {
        clearInterval(activeIntervals.current[component]);
      }
      activeIntervals.current[component] = setInterval(() => {
        refreshComponent(component);
      }, interval);
    };

    const stopInterval = (component: string) => {
      if (activeIntervals.current[component]) {
        clearInterval(activeIntervals.current[component]);
        delete activeIntervals.current[component];
      }
    };

    if (!autoRefresh) {
      // Clear all intervals when auto-refresh is disabled
      Object.keys(activeIntervals.current).forEach(stopInterval);
      return;
    }

    // Setup intervals for enabled components
    Object.entries(configsRef.current).forEach(([component, config]) => {
      if (config.enabled) {
        startInterval(component, config.interval);
      } else {
        stopInterval(component);
      }
    });

    return () => {
      // Cleanup all intervals
      Object.keys(activeIntervals.current).forEach(stopInterval);
    };
  }, [autoRefresh, refreshComponent]);

  // Handle enable/disable changes
  useEffect(() => {
    if (!autoRefresh) return;

    Object.entries(refreshConfigs).forEach(([component, config]) => {
      if (config.enabled && !activeIntervals.current[component]) {
        // Start interval for newly enabled component
        activeIntervals.current[component] = setInterval(() => {
          refreshComponent(component);
        }, config.interval);
      } else if (!config.enabled && activeIntervals.current[component]) {
        // Stop interval for disabled component
        clearInterval(activeIntervals.current[component]);
        delete activeIntervals.current[component];
      }
    });
  }, [Object.values(refreshConfigs).map(c => c.enabled).join(','), autoRefresh, refreshComponent]);

  const state: GlobalRefreshState = {
    autoRefresh,
    refreshInterval,
    gallery: refreshConfigs.gallery,
    travelPackets: refreshConfigs.travelPackets,
    contacts: refreshConfigs.contacts,
    reviews: refreshConfigs.reviews,
    notifications: refreshConfigs.notifications,
    serverMonitoring: refreshConfigs.serverMonitoring,
    logging: refreshConfigs.logging,
    backendHealth: refreshConfigs.backendHealth,
  };

  const actions: RefreshActions = {
    setAutoRefresh,
    setRefreshInterval,
    enableComponentRefresh,
    disableComponentRefresh,
    setComponentInterval,
    refreshComponent,
    refreshAll,
    onRefresh,
  };

  return [state, actions];
};

export default useGlobalRefresh;

import React from 'react';
import { RefreshCw, Clock, Play, Pause } from 'lucide-react';
import { useRefreshContext } from '../contexts/RefreshContext';

interface RefreshControlsProps {
  showComponentControls?: boolean;
  currentTab?: string;
  className?: string;
}

const RefreshControls: React.FC<RefreshControlsProps> = ({ 
  showComponentControls = false, 
  currentTab = '',
  className = ''
}) => {
  const { state, actions } = useRefreshContext();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getComponentConfig = (component: string) => {
    switch (component) {
      case 'gallery': return state.gallery;
      case 'travel-packets': return state.travelPackets;
      case 'contacts': return state.contacts;
      case 'reviews': return state.reviews;
      case 'notifications': return state.notifications;
      case 'server': return state.serverMonitoring;
      case 'logging': return state.logging;
      default: return null;
    }
  };

  const getComponentName = (component: string) => {
    switch (component) {
      case 'gallery': return 'Galerija';
      case 'travel-packets': return 'Kelionės paketai';
      case 'contacts': return 'Žinutės';
      case 'reviews': return 'Atsiliepimai';
      case 'notifications': return 'Pranešimai';
      case 'server': return 'Serveris';
      case 'logging': return 'Logai';
      default: return component;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Global Refresh Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Atnaujinimo valdymas</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              {state.autoRefresh ? 'Aktyvus' : 'Išjungtas'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => actions.setAutoRefresh(!state.autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              state.autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {state.autoRefresh ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Sustabdyti</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Pradėti</span>
              </>
            )}
          </button>
          
          <button
            onClick={actions.refreshAll}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atnaujinti viską</span>
          </button>
        </div>
      </div>

      {/* Global Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Globalus statusas</div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state.autoRefresh ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">{state.autoRefresh ? 'Veikia' : 'Sustabdytas'}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Aktyvūs komponentai</div>
          <div className="font-medium">
            {Object.values(state).filter(config => 
              typeof config === 'object' && config !== null && 'enabled' in config && config.enabled
            ).length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Paskutinis atnaujinimas</div>
          <div className="font-medium text-sm">
            {state.backendHealth.lastRefresh 
              ? new Date(state.backendHealth.lastRefresh).toLocaleTimeString('lt-LT')
              : 'Neatnaujinta'
            }
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Serverio būklė</div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state.serverMonitoring.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium text-sm">
              {state.serverMonitoring.enabled ? 'Stebimas' : 'Nestebimas'}
            </span>
          </div>
        </div>
      </div>

      {/* Component-specific controls */}
      {showComponentControls && (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Komponentų valdymas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {['gallery', 'travel-packets', 'contacts', 'reviews', 'notifications', 'server', 'logging'].map((component) => {
              const config = getComponentConfig(component);
              if (!config) return null;

              return (
                <div key={component} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getComponentName(component)}
                    </span>
                    <button
                      onClick={() => 
                        config.enabled 
                          ? actions.disableComponentRefresh(component as any)
                          : actions.enableComponentRefresh(component as any)
                      }
                      className={`w-8 h-5 rounded-full transition-colors ${
                        config.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        config.enabled ? 'translate-x-4' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Intervalas: {formatTime(config.interval)}</div>
                    {config.lastRefresh && (
                      <div>
                        Paskutinis: {new Date(config.lastRefresh).toLocaleTimeString('lt-LT')}
                      </div>
                    )}
                  </div>

                  {config.enabled && (
                    <button
                      onClick={() => actions.refreshComponent(component as any)}
                      className="mt-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                    >
                      Atnaujinti dabar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current tab refresh button */}
      {currentTab && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Dabartinis skirtuksa: <span className="font-medium">{getComponentName(currentTab)}</span>
            </span>
            <button
              onClick={() => actions.refreshComponent(currentTab as any)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atnaujinti {getComponentName(currentTab)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefreshControls;

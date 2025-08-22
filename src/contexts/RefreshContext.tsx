import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useGlobalRefresh, GlobalRefreshState, RefreshActions } from '../hooks/useGlobalRefresh';

interface RefreshContextType {
  state: GlobalRefreshState;
  actions: RefreshActions;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [state, actions] = useGlobalRefresh();

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefreshContext = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefreshContext must be used within a RefreshProvider');
  }
  return context;
};

export default RefreshProvider;

import { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSetShowProfileModal = (show: boolean) => {
    console.log('[DashboardContext] setShowProfileModal called:', show);
    setShowProfileModal(show);
  };

  return (
    <DashboardContext.Provider value={{ showProfileModal, setShowProfileModal: handleSetShowProfileModal }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardProvider');
  }
  return context;
}

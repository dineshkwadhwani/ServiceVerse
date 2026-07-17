import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Navbar } from '@/components/Shared/Navbar';
import { Sidebar } from '@/components/Shared/Sidebar';
import { DashboardProvider, useDashboardContext } from '@/context/DashboardContext';
import { COLORS } from '@/utils/theme';

function DashboardLayoutContent() {
  const { setShowProfileModal } = useDashboardContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: COLORS.bg.primary }}
    >
      {/* Navbar */}
      <Navbar onProfileClick={() => setShowProfileModal(true)} />

      {/* Layout with Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardLayoutContent />
    </DashboardProvider>
  );
}

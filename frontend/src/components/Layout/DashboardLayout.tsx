import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Shared/Navbar';
import { DashboardProvider, useDashboardContext } from '@/context/DashboardContext';
import { COLORS } from '@/utils/theme';

function DashboardLayoutContent() {
  const { setShowProfileModal } = useDashboardContext();

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: COLORS.bg.primary }}
    >
      {/* Navbar */}
      <Navbar onProfileClick={() => setShowProfileModal(true)} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
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

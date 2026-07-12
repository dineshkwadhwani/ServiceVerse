import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Shared/Navbar';
import { COLORS } from '@/utils/theme';

export function DashboardLayout() {
  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: COLORS.bg.primary }}
    >
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

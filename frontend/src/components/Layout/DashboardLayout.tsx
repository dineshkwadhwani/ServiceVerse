import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Shared/Navbar';

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

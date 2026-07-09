import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

// Pages & Layouts
import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { NotFound } from '@/pages/NotFound';
import { ToastContainer } from '@/components/Shared/Toast';
import { ServiceDashboard } from '@/components/SuperAdmin/ServiceDashboard';

// Placeholder pages (will be created next)
const DashboardPlaceholder = () => <div className="p-8">Dashboard</div>;

export function App() {
  const { setFirebaseUser, firebaseUser } = useAuthStore();
  const { toasts } = useNotificationStore();

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, [setFirebaseUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          {firebaseUser ? (
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPlaceholder />} />
              <Route path="superadmin/services" element={<ServiceDashboard />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />
      </div>
    </Router>
  );
}

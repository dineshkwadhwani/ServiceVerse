import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { USER_ROLES } from '@/utils/constants';

import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { NotFound } from '@/pages/NotFound';
import { ToastContainer } from '@/components/Shared/Toast';
import { ServiceDashboard } from '@/components/SuperAdmin/ServiceDashboard';
import { AccountManagerDashboard } from '@/components/SuperAdmin/AccountManagerDashboard';

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Loading ServiceVerse...</p>
    </div>
  );
}

function ProtectedRoute() {
  const { firebaseUser } = useAuthStore();
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function DashboardRedirect() {
  const { user } = useAuthStore();

  if (user?.role === USER_ROLES.SUPERADMIN) {
    return <Navigate to="/superadmin/services" replace />;
  }

  return <div className="p-8">Dashboard</div>;
}

export function App() {
  const { setFirebaseUser, loadUserProfile, setUser, isAuthReady } = useAuthStore();
  const { toasts } = useNotificationStore();

  useEffect(() => {
    useAuthStore.setState({ isAuthReady: false, isLoading: true });
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUser(null);
      }
      useAuthStore.setState({ isAuthReady: true, isLoading: false });
    });

    return () => unsubscribe();
  }, [setFirebaseUser, loadUserProfile, setUser]);

  if (!isAuthReady) {
    return <AuthLoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Navigate to="/superadmin/services" replace />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRedirect />} />
              <Route path="superadmin/services" element={<ServiceDashboard />} />
              <Route path="superadmin/account-managers" element={<AccountManagerDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer toasts={toasts} />
      </div>
    </Router>
  );
}

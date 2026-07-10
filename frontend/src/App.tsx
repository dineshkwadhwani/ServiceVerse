import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { USER_ROLES } from '@/utils/constants';

import { LoginPage } from '@/pages/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { ServiceLandingPage } from '@/pages/ServiceLandingPage';
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
          {/* ============================================================================ */}
          {/* PUBLIC ROUTES - NO AUTH REQUIRED */}
          {/* ============================================================================ */}

          {/* Main Landing Page - Shows all services */}
          <Route path="/" element={<LandingPage />} />

          {/* Login Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Service-Specific Landing Page */}
          <Route path="/:serviceName" element={<ServiceLandingPage />} />

          {/* ============================================================================ */}
          {/* PROTECTED ROUTES - AUTH REQUIRED */}
          {/* ============================================================================ */}

          <Route element={<ProtectedRoute />}>
            {/* Admin Redirect */}
            <Route path="/admin" element={<Navigate to="/superadmin/services" replace />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardRedirect />} />
            </Route>

            {/* SuperAdmin Routes */}
            <Route path="/superadmin" element={<DashboardLayout />}>
              <Route path="services" element={<ServiceDashboard />} />
              <Route path="account-managers" element={<AccountManagerDashboard />} />
            </Route>
          </Route>

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer toasts={toasts} />
      </div>
    </Router>
  );
}

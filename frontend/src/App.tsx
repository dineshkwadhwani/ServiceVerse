import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { USER_ROLES } from '@/utils/constants';

import { LoginPage } from '@/pages/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { ServiceLandingPage } from '@/pages/ServiceLandingPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { NotFound } from '@/pages/NotFound';
import { ToastContainer } from '@/components/Shared/Toast';
import { ServiceDashboard } from '@/components/SuperAdmin/ServiceDashboard';
import { AccountManagerDashboard } from '@/components/SuperAdmin/AccountManagerDashboard';
import { CustomerDashboard } from '@/components/Dashboard/CustomerDashboard';
import { SPDashboard } from '@/components/Dashboard/SPDashboard';
import { AMDashboard } from '@/components/Dashboard/AMDashboard';
import { SuperAdminDashboard } from '@/components/Dashboard/SuperAdminDashboard';

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

function RoleBasedDashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case USER_ROLES.SUPERADMIN:
      return <SuperAdminDashboard />;
    case USER_ROLES.ACCOUNT_MANAGER:
      return <AMDashboard />;
    case USER_ROLES.SERVICE_PROVIDER:
      return <SPDashboard />;
    case USER_ROLES.CUSTOMER:
      return <CustomerDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
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

          {/* Register Page */}
          <Route path="/register" element={<RegisterPage />} />

          {/* Email Verification Page */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Service-Specific Landing Page */}
          <Route path="/service/:serviceId" element={<ServiceLandingPage />} />

          {/* ============================================================================ */}
          {/* PROTECTED ROUTES - AUTH REQUIRED */}
          {/* ============================================================================ */}

          <Route element={<ProtectedRoute />}>
            {/* Unified Dashboard with layout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<RoleBasedDashboard />} />

              {/* SuperAdmin nested routes */}
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

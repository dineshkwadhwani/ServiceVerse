import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Navbar } from '@/components/Shared/Navbar';
import { ServiceCard } from '@/components/Landing/ServiceCard';
import { RoleSelectionModal } from '@/components/Auth/RoleSelectionModal';
import { LoginModal } from '@/components/Auth/LoginModal';
import { Loader2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import type { Service } from '@/types';

export function LandingPage() {
  const navigate = useNavigate();
  const { firebaseUser, user } = useAuthStore();
  const toast = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (firebaseUser && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [firebaseUser, user, navigate]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getServices();
      const activeServices = response.data?.services?.filter(
        (s: Service) => s.status === 'ACTIVE'
      ) || [];
      setServices(activeServices);
    } catch (error: any) {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    navigate(`/service/${service.serviceId}`);
  };

  const handleJoinClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setShowRoleSelection(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <Navbar onSignInClick={() => setShowLogin(true)} />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            Welcome to ServiceVerse
          </h1>
          <p
            className="text-lg"
            style={{ color: COLORS.text.secondary }}
          >
            Discover and book services from trusted providers in your area
          </p>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg border-2"
            style={{
              backgroundColor: COLORS.bg.surface,
              borderColor: COLORS.border.light,
            }}
          >
            <p style={{ color: COLORS.text.secondary }}>No services available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.serviceId}>
                <ServiceCard
                  service={service}
                  onClick={handleServiceClick}
                  compact={false}
                />
                <button
                  onClick={() => handleJoinClick(service.serviceId)}
                  className="w-full mt-3 px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                  style={{
                    backgroundColor: COLORS.semantic.info,
                  }}
                >
                  Join Now
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Login Modal (for Sign In) */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRoleSelection(true);
        }}
      />

      {/* Role Selection Modal (for Join Now) */}
      <RoleSelectionModal
        isOpen={showRoleSelection}
        onClose={() => {
          setShowRoleSelection(false);
          setSelectedServiceId(undefined);
        }}
        serviceId={selectedServiceId}
      />
    </div>
  );
}

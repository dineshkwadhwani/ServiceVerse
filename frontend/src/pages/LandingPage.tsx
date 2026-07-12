import { useEffect, useState } from 'react';
import { Loader2, LogIn, UserPlus, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveServices } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { LoginModal } from '@/components/Auth/LoginModal';
import { RegisterModal } from '@/components/Auth/RegisterModal';
import type { Service } from '@/types';

export function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuthStore();

  useEffect(() => {
    // Authenticated users go straight to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    fetchServices();
    checkDeviceSize();
    window.addEventListener('resize', checkDeviceSize);
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, [isAuthenticated, navigate]);

  const checkDeviceSize = () => {
    setIsDesktop(window.innerWidth >= 768);
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const activeServices = await getActiveServices();
      setServices(activeServices);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load services';
      toast.error('Failed to load services', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = () => {
    if (!isAuthenticated) {
      // Not logged in: show register modal
      setShowRegisterModal(true);
    } else {
      // Logged in: all roles go to unified dashboard
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const renderServiceTile = (service: Service) => {
    // Mobile: icon and name only
    if (!isDesktop) {
      return (
        <button
          key={service.serviceId}
          onClick={() => handleServiceClick()}
          className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/10 transition group"
        >
          {service.logo && (
            <img
              src={service.logo}
              alt={service.name}
              className="w-20 h-20 rounded-lg bg-white/10 border border-white/20 object-cover group-hover:scale-110 transition"
            />
          )}
          <p className="text-sm font-semibold text-white text-center line-clamp-2">
            {service.name}
          </p>
        </button>
      );
    }

    // Desktop: full tile with hero image, description, and join button
    return (
      <div
        key={service.serviceId}
        className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
      >
        {/* Hero Image */}
        <div
          className="h-40 relative overflow-hidden"
          style={{
            backgroundColor: service.colorTheme?.primary || '#3B82F6',
          }}
        >
          {service.heroImage && (
            <img
              src={service.heroImage}
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          )}
        </div>

        {/* Service Logo & Details */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {service.logo && (
              <img
                src={service.logo}
                alt={service.name}
                className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{service.name}</h3>
              {service.gstPercentage && (
                <p className="text-xs text-gray-400">GST: {service.gstPercentage}%</p>
              )}
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-6 line-clamp-2">{service.description}</p>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleServiceClick()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Join Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              service.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}
          >
            {service.status === 'ACTIVE' ? '✓ Active' : 'Inactive'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ServiceVerse</h1>
            <p className="text-sm text-gray-400">Multi-service Platform</p>
          </div>

          {/* Right side navigation */}
          <div className="flex gap-3 items-center">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-300 hidden sm:inline">Welcome back, {user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20 text-center">
        {isAuthenticated && user ? (
          <div className="mb-8">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-lg text-gray-300">
              Explore our services and manage your account
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Welcome to ServiceVerse
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover and book amazing services from our trusted providers.
              One account, unlimited services.
            </p>

            {/* Mobile: Auth buttons below hero on mobile */}
            {!isDesktop && (
              <div className="flex gap-3 justify-center flex-wrap mb-8">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Join
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading services...</p>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No services available yet</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for new services!</p>
          </div>
        ) : (
          <>
            {/* All Services Grid */}
            <div>
              {isAuthenticated && (
                <h3 className="text-2xl font-bold text-white mb-6">Available Services</h3>
              )}
              <div
                className={`grid gap-6 sm:gap-8 ${
                  isDesktop
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-3 sm:grid-cols-4'
                }`}
              >
                {services.map((service) => renderServiceTile(service))}
              </div>
            </div>
          </>
        )}
      </section>



      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 ServiceVerse. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}

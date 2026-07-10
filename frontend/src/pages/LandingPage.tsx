import { useEffect, useState } from 'react';
import { Loader2, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { getActiveServices } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import type { Service } from '@/types';

export function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleServiceClick = (serviceName: string) => {
    // Navigate to service-specific landing page
    window.location.href = `/${serviceName.toLowerCase().replace(/\s+/g, '-')}`;
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
          <div className="flex gap-4">
            <a
              href="/admin"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <LogIn className="w-4 h-4" />
              Admin
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Welcome to ServiceVerse
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Discover and book amazing services from our trusted providers. 
          One account, unlimited services.
        </p>

        {/* Search/Filter could go here */}
        <div className="mb-16">
          <p className="text-gray-400">Explore our services below</p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.serviceId}
                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                onClick={() => handleServiceClick(service.name)}
              >
                {/* Service Header with Color Theme */}
                <div
                  className="h-32 relative overflow-hidden"
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

                {/* Service Logo */}
                <div className="relative px-6 pt-0">
                  <div className="flex items-center gap-4 -mt-8 mb-4">
                    {service.logo && (
                      <img
                        src={service.logo}
                        alt={service.name}
                        className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      {service.gstPercentage && (
                        <p className="text-xs text-gray-400">GST: {service.gstPercentage}%</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                <div className="px-6">
                  <p className="text-gray-300 text-sm mb-6 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Service Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-white/10">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Menu Items</p>
                      <p className="text-lg font-bold text-white">
                        {/* This would need to be fetched from API */}
                        0
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Providers</p>
                      <p className="text-lg font-bold text-white">
                        {/* This would need to be fetched from API */}
                        0
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service.name);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Explore
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Status */}
                <div className="px-6 pb-6">
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
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center border-t border-white/10">
        <h3 className="text-3xl font-bold text-white mb-6">Ready to get started?</h3>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </a>
          <a
            href="/register"
            className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition border border-white/20"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400">
          <p>&copy; 2025 ServiceVerse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

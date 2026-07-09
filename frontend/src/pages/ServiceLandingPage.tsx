import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import type { Service } from '@/types';

export function ServiceLandingPage() {
  const { serviceName } = useParams<{ serviceName: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchService();
  }, [serviceName]);

  const fetchService = async () => {
    setIsLoading(true);
    try {
      // Fetch all services and find the matching one
      const response = await apiClient.getServices();
      const services = response.data?.services || [];
      
      const foundService = services.find(
        (s: Service) =>
          s.name.toLowerCase().replace(/\s+/g, '-') === serviceName?.toLowerCase()
      );

      if (!foundService) {
        toast.error('Service not found');
        navigate('/');
        return;
      }

      setService(foundService);
    } catch (error: any) {
      toast.error('Failed to load service', error.message);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Service not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Services
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = service.colorTheme?.primary || '#3B82F6';
  const secondaryColor = service.colorTheme?.secondary || '#10B981';

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}20 0%, #1a1a2e 100%)`,
      }}
    >
      {/* Navigation */}
      <nav className="backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Services
          </button>
          <div className="flex gap-4">
            <a
              href="/login"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section with Service Branding */}
      <section className="relative overflow-hidden py-20">
        {/* Background */}
        {service.heroImage && (
          <img
            src={service.heroImage}
            alt={service.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {service.logo && (
            <img
              src={service.logo}
              alt={service.name}
              className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-white/20 shadow-lg"
            />
          )}
          <h1 className="text-5xl font-bold text-white mb-4">{service.name}</h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {service.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition"
              style={{ backgroundColor: secondaryColor }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <LogIn className="w-5 h-5" />
              Sign In to Order
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-white/20 hover:bg-white/30 transition border border-white/30"
            >
              Create Account
            </a>
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service Info */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Service Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    service.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {service.status === 'ACTIVE' ? '✓ Active' : 'Inactive'}
                </span>
              </div>
              {service.gstPercentage && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">GST Rate</p>
                  <p className="text-white font-semibold">{service.gstPercentage}%</p>
                </div>
              )}
              {service.defaultCommission && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Commission</p>
                  <p className="text-white font-semibold">
                    {service.defaultCommission.type === 'PERCENTAGE'
                      ? `${service.defaultCommission.value}%`
                      : `₹${service.defaultCommission.value}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Why Choose Us?</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Fast Service</p>
                  <p className="text-gray-400 text-sm">Quick turnaround time</p>
                </div>
              </div>
              <div className="flex gap-3">
                <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Great Prices</p>
                  <p className="text-gray-400 text-sm">Competitive and transparent</p>
                </div>
              </div>
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
                </svg>
                <div>
                  <p className="text-white font-semibold">Quality</p>
                  <p className="text-gray-400 text-sm">Premium service guaranteed</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  1
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Create Account</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  2
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Place Order</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  3
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Track Status</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  4
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Rate & Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: `${primaryColor}20`,
            borderColor: `${primaryColor}40`,
            borderWidth: '2px',
          }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience Our Service?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers. Create your account today and start ordering.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition"
              style={{ backgroundColor: secondaryColor }}
            >
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-white/20 hover:bg-white/30 transition border border-white/30"
            >
              Create Account
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">{service.name}</h4>
              <p className="text-gray-400 text-sm">{service.description}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="/login" className="hover:text-white transition">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-white transition">
                    Register
                  </a>
                </li>
                <li>
                  <a href="/" className="hover:text-white transition">
                    All Services
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              {service.fromEmail && (
                <p className="text-gray-400 text-sm">Email: {service.fromEmail}</p>
              )}
              <p className="text-gray-400 text-sm mt-2">ServiceVerse © 2025</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 {service.name} - Powered by ServiceVerse</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

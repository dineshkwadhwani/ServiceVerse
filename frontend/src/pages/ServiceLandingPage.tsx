import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { getActiveServices } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import type { Service } from '@/types';

export function ServiceLandingPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const fetchService = async () => {
    setIsLoading(true);
    try {
      const services = await getActiveServices();
      const found = services.find((s) => s.serviceId === serviceId);
      if (found) {
        setService(found);
      } else {
        toast.error('Service not found');
        navigate('/');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load service';
      toast.error('Failed to load service', message);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'CUSTOMER') {
        navigate('/dashboard/customer');
      } else if (user?.role === 'SERVICE_PROVIDER') {
        navigate('/dashboard/service-provider');
      } else if (user?.role === 'ACCOUNT_MANAGER') {
        navigate('/dashboard/account-manager');
      } else if (user?.role === 'SUPERADMIN') {
        navigate('/dashboard/superadmin');
      }
    } else {
      setShowRoleSelection(true);
    }
  };

  const handleRoleSelection = (role: 'SERVICE_PROVIDER' | 'CUSTOMER') => {
    setShowRoleSelection(false);
    navigate(`/register?serviceId=${serviceId}&role=${role}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Service not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div
        className="relative h-96 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"
        style={{
          backgroundColor: service.colorTheme?.primary || '#3B82F6',
        }}
      >
        {service.heroImage ? (
          <>
            <img
              src={service.heroImage}
              alt={service.name}
              className="w-full h-full object-cover"
              onError={() => {
                console.error('Failed to load hero image:', service.heroImage);
                setImageLoadError(true);
              }}
              onLoad={() => {
                console.log('Hero image loaded successfully');
                setImageLoadError(false);
              }}
            />
            {imageLoadError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-white">Image failed to load</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">
              {service.logo ? (
                <img
                  src={service.logo}
                  alt={service.name}
                  className="w-32 h-32 object-contain mx-auto"
                />
              ) : (
                '📦'
              )}
            </div>
            <p className="text-white text-xl font-semibold">{service.name}</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 pb-20">
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8">
          <div className="flex items-start gap-6 mb-8">
            {service.logo && (
              <img
                src={service.logo}
                alt={service.name}
                className="w-24 h-24 rounded-lg border border-white/20 object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{service.name}</h1>
              <p className="text-gray-400 text-lg mb-4">{service.description}</p>

              {service.gstPercentage && (
                <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-sm text-gray-300 mb-4">
                  GST: {service.gstPercentage}%
                </div>
              )}

              <div className="flex gap-4 flex-wrap">
                <a
                  href="/login"
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </a>
                <button
                  onClick={handleJoinClick}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  <UserPlus className="w-5 h-5" />
                  {isAuthenticated ? 'Go to Dashboard' : 'Join Now'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                service.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {service.status === 'ACTIVE' ? '✓ Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {showRoleSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">Join {service.name}</h3>
            <p className="text-gray-400 mb-8">Choose how you want to get started</p>

            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelection('CUSTOMER')}
                className="w-full p-6 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-white/10 transition text-left group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">I'm a Customer</h4>
                    <p className="text-sm text-gray-400">Book and manage services</p>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection('SERVICE_PROVIDER')}
                className="w-full p-6 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-white/10 transition text-left group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">I'm a Service Provider</h4>
                    <p className="text-sm text-gray-400">Provide services and grow</p>
                  </div>
                  <span className="text-purple-400 group-hover:translate-x-1 transition">→</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleSelection(false)}
              className="w-full mt-6 px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

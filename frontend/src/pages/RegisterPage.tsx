import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, Loader2 } from 'lucide-react';
import { RegisterSPForm } from '@/components/Auth/RegisterSPForm';
import { RegisterCustomerForm } from '@/components/Auth/RegisterCustomerForm';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import type { Service } from '@/types';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [role, setRole] = useState<'SERVICE_PROVIDER' | 'CUSTOMER' | null>(
    (searchParams.get('role') as 'SERVICE_PROVIDER' | 'CUSTOMER') || null
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const serviceId = searchParams.get('serviceId');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await apiClient.getServices();
      setServices(response.data?.services || []);
    } catch (error: any) {
      toast.error('Failed to load services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  // If serviceId from URL, use it
  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.serviceId === serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [serviceId, services]);

  // Step 1: Service Selection
  if (!selectedService) {
    if (isLoadingServices) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading services...</p>
          </div>
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">No services available</p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Join ServiceVerse</h1>
            <p className="text-gray-400">Select a service to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service.serviceId}
                onClick={() => setSelectedService(service)}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-white/10 transition group text-left"
              >
                {service.logo && (
                  <img
                    src={service.logo}
                    alt={service.name}
                    className="w-16 h-16 rounded-lg mb-4 object-cover"
                  />
                )}
                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{service.description}</p>
                <div className="mt-4 flex items-center justify-start">
                  <span className="text-blue-400 font-semibold text-sm">Select →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Role Selection
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <button
            onClick={() => setSelectedService(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Join ServiceVerse</h1>
            <p className="text-gray-400 mb-2">Service: <span className="text-blue-400 font-semibold">{selectedService.name}</span></p>
            <p className="text-gray-400">Choose how you want to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Option */}
            <button
              onClick={() => setRole('CUSTOMER')}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Customer</h2>
              <p className="text-gray-400 text-sm">Book services and make orders</p>
              <div className="mt-6 flex items-center justify-center">
                <span className="text-blue-400 font-semibold">Get Started →</span>
              </div>
            </button>

            {/* Service Provider Option */}
            <button
              onClick={() => setRole('SERVICE_PROVIDER')}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition">
                  <Briefcase className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Service Provider</h2>
              <p className="text-gray-400 text-sm">Provide services and grow your business</p>
              <div className="mt-6 flex items-center justify-center">
                <span className="text-purple-400 font-semibold">Get Started →</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <button
          onClick={() => setRole(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {role === 'CUSTOMER' ? (
          <RegisterCustomerForm serviceId={selectedService.serviceId} />
        ) : (
          <RegisterSPForm serviceId={selectedService.serviceId} />
        )}
      </div>
    </div>
  );
}

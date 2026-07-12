import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, Loader2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { Navbar } from '@/components/Shared/Navbar';
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
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg.primary }}>
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2
                className="w-12 h-12 animate-spin mx-auto mb-4"
                style={{ color: COLORS.semantic.info }}
              />
              <p style={{ color: COLORS.text.secondary }}>Loading services...</p>
            </div>
          </div>
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg.primary }}>
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="mb-4" style={{ color: COLORS.semantic.error }}>
                No services available
              </p>
              <button
                onClick={() => navigate('/')}
                className="font-medium"
                style={{ color: COLORS.semantic.info }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg.primary }}>
        <Navbar />
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-20">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-12 transition"
            style={{ color: COLORS.text.secondary }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
              Join ServiceVerse
            </h1>
            <p style={{ color: COLORS.text.secondary }}>Select a service to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service.serviceId}
                onClick={() => setSelectedService(service)}
                className="p-6 border rounded-2xl transition group text-left"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                {service.logo && (
                  <img
                    src={service.logo}
                    alt={service.name}
                    className="w-16 h-16 rounded-lg mb-4 object-cover"
                  />
                )}
                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                  {service.name}
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: COLORS.text.secondary }}>
                  {service.description}
                </p>
                <div className="mt-4 flex items-center justify-start">
                  <span className="font-semibold text-sm" style={{ color: COLORS.semantic.info }}>
                    Select →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Step 2: Role Selection
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg.primary }}>
        <Navbar />
        <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <button
            onClick={() => setSelectedService(null)}
            className="flex items-center gap-2 mb-12 transition"
            style={{ color: COLORS.text.secondary }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
              Join ServiceVerse
            </h1>
            <p className="mb-2" style={{ color: COLORS.text.secondary }}>
              Service:{' '}
              <span className="font-semibold" style={{ color: COLORS.semantic.info }}>
                {selectedService.name}
              </span>
            </p>
            <p style={{ color: COLORS.text.secondary }}>Choose how you want to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Option */}
            <button
              onClick={() => setRole('CUSTOMER')}
              className="p-8 border rounded-2xl transition group"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
              }}
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  className="p-4 rounded-xl transition"
                  style={{
                    backgroundColor: `${COLORS.semantic.info}20`,
                  }}
                >
                  <User className="w-8 h-8" style={{ color: COLORS.semantic.info }} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                I'm a Customer
              </h2>
              <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                Book services and make orders
              </p>
              <div className="mt-6 flex items-center justify-center">
                <span className="font-semibold" style={{ color: COLORS.semantic.info }}>
                  Get Started →
                </span>
              </div>
            </button>

            {/* Service Provider Option */}
            <button
              onClick={() => setRole('SERVICE_PROVIDER')}
              className="p-8 border rounded-2xl transition group"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
              }}
            >
              <div className="flex items-center justify-center mb-6">
                <div
                  className="p-4 rounded-xl transition"
                  style={{
                    backgroundColor: `${COLORS.semantic.success}20`,
                  }}
                >
                  <Briefcase className="w-8 h-8" style={{ color: COLORS.semantic.success }} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                I'm a Service Provider
              </h2>
              <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                Provide services and grow your business
              </p>
              <div className="mt-6 flex items-center justify-center">
                <span className="font-semibold" style={{ color: COLORS.semantic.success }}>
                  Get Started →
                </span>
              </div>
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Step 3: Registration Form
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg.primary }}>
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <button
            onClick={() => setRole(null)}
            className="flex items-center gap-2 mb-12 transition"
            style={{ color: COLORS.text.secondary }}
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
    </div>
  );
}

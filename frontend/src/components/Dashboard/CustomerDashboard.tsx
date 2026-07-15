import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Loader2, ChevronRight } from 'lucide-react';
import { ServiceCard } from '@/components/Landing/ServiceCard';
import { EmptyState } from '@/components/Shared/EmptyState';
import { COLORS } from '@/utils/theme';
import type { Service } from '@/types';

interface ProviderInfo {
  spId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  logo: string;
}

interface CustomerService {
  serviceId: string;
  serviceName: string;
  logo?: string;
  provider?: ProviderInfo | null;
  associatedAt?: Date;
}

export function CustomerDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<CustomerService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all services
      const servicesResponse = await apiClient.getServices();
      const activeServices = (servicesResponse.data?.services || []).filter(
        (s: Service) => s.status === 'ACTIVE'
      );
      setAllServices(activeServices);

      // Load customer's services with their assigned providers
      const customerServicesResponse = await apiClient.getCustomerServices();
      const customerServices = (customerServicesResponse.data?.services || []) as CustomerService[];
      setMyServices(customerServices);
    } catch (error: any) {
      toast.error('Failed to load services');
      console.error('Error loading services:', error);
      // Set empty services on error
      setMyServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    navigate(`/dashboard/service/${service.serviceId}`);
  };

  const handleOtherServiceClick = (service: Service) => {
    navigate(`/service/${service.serviceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
      </div>
    );
  }

  const otherServices = allServices.filter(
    (s) => !myServices.some((ms) => ms.serviceId === s.serviceId)
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* My Services Section */}
        <section className="mb-12">
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ color: COLORS.text.primary }}
          >
            My Services
          </h2>

          {myServices.length > 0 ? (
            <div className="space-y-3">
              {myServices.map((ms) => {
                const service = allServices.find((s) => s.serviceId === ms.serviceId);
                if (!service) return null;
                return (
                  <button
                    key={ms.serviceId}
                    onClick={() => handleServiceClick(service)}
                    className="w-full p-4 rounded-lg border flex items-center gap-4 transition hover:shadow-md active:shadow-sm"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    {/* Service Logo */}
                    <div className="flex-shrink-0">
                      {service.logo ? (
                        <img
                          src={service.logo}
                          alt={service.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                          style={{
                            backgroundColor: service.colorTheme?.primary || COLORS.semantic.info,
                          }}
                        >
                          {service.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Service & Provider Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <h3
                        className="font-semibold text-base"
                        style={{ color: COLORS.text.primary }}
                      >
                        {service.name}
                      </h3>
                      <p
                        className="text-sm mt-1"
                        style={{
                          color: ms.provider?.businessName
                            ? COLORS.text.secondary
                            : COLORS.semantic.warning,
                        }}
                      >
                        {ms.provider?.businessName ? `Provider: ${ms.provider.businessName}` : 'No provider assigned'}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: COLORS.semantic.info }}>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState message="You haven't registered for any services yet" />
          )}
        </section>

        {/* All Other Services Section */}
        <section>
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ color: COLORS.text.primary }}
          >
            Browse More Services
          </h2>

          {otherServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherServices.map((service) => (
                <div key={service.serviceId}>
                  <ServiceCard
                    service={service}
                    onClick={handleOtherServiceClick}
                    compact={false}
                  />
                  <button
                    onClick={() => handleOtherServiceClick(service)}
                    className="w-full mt-3 px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    Browse Service
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No other services available" />
          )}
        </section>
      </main>
    </div>
  );
}

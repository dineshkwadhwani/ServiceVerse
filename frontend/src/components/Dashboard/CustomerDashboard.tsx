import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Loader2 } from 'lucide-react';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map((ms) => {
                const service = allServices.find((s) => s.serviceId === ms.serviceId);
                if (!service) return null;
                return (
                  <div
                    key={ms.serviceId}
                    className="cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    <ServiceCard
                      service={service}
                      onClick={handleServiceClick}
                      compact={false}
                    />
                    <div
                      className="mt-3 p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <p
                        className="text-sm font-medium"
                        style={{ color: COLORS.text.secondary }}
                      >
                        Your Provider
                      </p>
                      <p
                        className="font-semibold mt-1"
                        style={{
                          color: ms.provider?.businessName
                            ? COLORS.text.primary
                            : COLORS.text.secondary,
                        }}
                      >
                        {ms.provider?.businessName || 'No provider assigned'}
                      </p>
                    </div>
                  </div>
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

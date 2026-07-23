import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Loader2 } from 'lucide-react';
import { ServiceCard } from '@/components/Landing/ServiceCard';
import { EmptyState } from '@/components/Shared/EmptyState';
import { CustomerProfileEditModal } from '@/components/Dashboard/CustomerProfileEditModal';
import { useDashboardContext } from '@/context/DashboardContext';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/theme';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';
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
  const { firebaseUser } = useAuthStore();
  const { showProfileModal, setShowProfileModal } = useDashboardContext();

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<CustomerService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    loadData();
    if (firebaseUser?.uid) {
      loadCustomerProfile();
    }
  }, [firebaseUser?.uid]);

  const loadCustomerProfile = async () => {
    if (!firebaseUser?.uid) return;
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCustomerData(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading customer profile:', error);
    }
  };

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

      // Also load customer profile
      if (firebaseUser?.uid) {
        loadCustomerProfile();
      }
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
    // Must go to the authenticated /dashboard/service/:id route (ServiceCustomerDashboard),
    // not the public pre-login /service/:id page - that page's "Book Now" always routes
    // through role-selection into /register, even for an already signed-in customer.
    navigate(`/dashboard/service/${service.serviceId}`);
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
              {myServices.map((ms) => {
                const service = allServices.find((s) => s.serviceId === ms.serviceId);
                if (!service) return null;
                return (
                  <button
                    key={ms.serviceId}
                    onClick={() => handleServiceClick(service)}
                    className="flex flex-col items-center gap-3 transition active:opacity-70"
                  >
                    {/* Service Logo Square */}
                    {service.logo ? (
                      <img
                        src={service.logo}
                        alt={service.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-md"
                        style={{
                          backgroundColor: service.colorTheme?.primary || COLORS.semantic.info,
                        }}
                      >
                        {service.name.charAt(0)}
                      </div>
                    )}

                    {/* Service Name */}
                    <p
                      className="text-sm font-medium text-center line-clamp-2"
                      style={{ color: COLORS.text.primary }}
                    >
                      {service.name}
                    </p>
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

      {/* Profile Edit Modal */}
      {showProfileModal && firebaseUser?.uid && (
        <CustomerProfileEditModal
          userId={firebaseUser.uid}
          phone={customerData?.phone || ''}
          name={customerData?.name || ''}
          email={customerData?.email || ''}
          address={customerData?.address || ''}
          area={customerData?.area || ''}
          city={customerData?.city || ''}
          pin={customerData?.pin || ''}
          photoUrl={customerData?.photoUrl || ''}
          onClose={() => setShowProfileModal(false)}
          onComplete={() => loadCustomerProfile()}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, BarChart3, ShoppingBag, Plus } from 'lucide-react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useDashboardContext } from '@/context/DashboardContext';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { CreateOrderModal } from '@/components/Orders/CreateOrderModal';
import { OrderLifecycleModal } from '@/components/Orders/OrderLifecycleModal';
import { InvoiceModal } from '@/components/Orders/InvoiceModal';
import { CustomerProfileEditModal } from '@/components/Dashboard/CustomerProfileEditModal';
import { COLORS } from '@/utils/theme';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';
import type { Service } from '@/types';

interface Order {
  orderId: string;
  spId?: string;
  customerName?: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'NEW' | 'COMPLETED' | 'PAID';
  totalAmount: number;
  createdAt: Date;
  items: Array<{ name: string; quantity?: number; price?: number; qty?: number; customPrice?: number }>;
}

interface SPInfo {
  spId: string;
  businessName: string;
  logo?: string;
  area?: string;
  city?: string;
  averageRating?: number;
  totalOrders?: number;
  email?: string;
  phone?: string;
}

type ActiveTab = 'overview' | 'orders';

export function ServiceCustomerDashboard() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { firebaseUser } = useAuthStore();
  const { showProfileModal, setShowProfileModal } = useDashboardContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [spsInPinCode, setSPsInPinCode] = useState<SPInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedSPForOrder, setSelectedSPForOrder] = useState<SPInfo | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (serviceId && firebaseUser?.uid) {
      loadData();
    }
  }, [serviceId, firebaseUser?.uid]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load service
      const serviceResponse = await apiClient.getService(serviceId!);
      setService(serviceResponse.data?.service || serviceResponse.data);

      // Load customer's PIN code and fetch SPs from that PIN code
      if (firebaseUser?.uid && serviceId) {
        try {
          // Get customer's PIN code
          const customerDocRef = doc(db, 'users', firebaseUser.uid);
          const customerDoc = await getDoc(customerDocRef);
          if (customerDoc.exists()) {
            const customerDocData = customerDoc.data();
            setCustomerData(customerDocData);
            const pinCode = customerDocData?.pin || '';

            // Fetch all SPs with same PIN code who provide this service
            if (pinCode && serviceId) {
              const spDetails: SPInfo[] = [];

              try {
                const spProvidersResponse = await apiClient.getCustomerServiceProviders(serviceId);
                const spIds = spProvidersResponse.data?.providers || [];

                // Fetch full details for each SP and filter by pin code
                for (const provider of spIds) {
                  try {
                    const spDocRef = doc(db, 'users', provider.spId);
                    const spDoc = await getDoc(spDocRef);
                    if (spDoc.exists()) {
                      const spData = spDoc.data();
                      // Only include SPs from the same PIN code
                      if (spData?.pin === pinCode) {
                        spDetails.push({
                          spId: spDoc.id,
                          businessName: spData.businessName || spData.name || 'Service Provider',
                          logo: spData.businessLogo || spData.logo || undefined,
                          area: spData.area || '',
                          city: spData.city || '',
                          email: spData.email || '',
                          phone: spData.phone || '',
                          averageRating: spData.averageRating || 0,
                          totalOrders: spData.totalOrders || 0,
                        });
                      }
                    }
                  } catch (error) {
                    // Continue loading other SPs
                  }
                }
                setSPsInPinCode(spDetails);
              } catch (error) {
                // Providers not loaded
              }
            }
          }
        } catch (error) {
          console.error('Failed to load customer PIN code', error);
        }

        // Load customer's orders
        try {
          const ordersResponse = await apiClient.getCustomerOrdersList(firebaseUser.uid);
          const loadedOrders = (ordersResponse?.data?.orders || []).map((order: any) => ({
            orderId: order.orderId || '',
            spId: order.spId || '',
            customerName: order.customerName || '',
            status: order.status || 'NEW',
            totalAmount: order.total || 0,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            items: order.items || [],
          }));

          setOrders(loadedOrders);
        } catch (error) {
          // Orders not loaded
        }
      }
    } catch (error: any) {
      toast.error('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
      </div>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return COLORS.semantic.success;
      case 'READY':
        return COLORS.semantic.info;
      case 'CANCELLED':
        return COLORS.semantic.error;
      default:
        return COLORS.semantic.warning;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const canViewInvoice = (status: string) => {
    const normalized = String(status || '').toUpperCase();
    return normalized === 'COMPLETED' || normalized === 'DELIVERED' || normalized === 'PAID';
  };

  const handleStartOrder = (sp: SPInfo) => {
    setSelectedSPForOrder(sp);
    setShowCreateOrder(true);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    loadData();
  };

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Back Button & Title */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mb-4 font-medium transition"
            style={{ color: COLORS.semantic.info }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: COLORS.text.primary }}
          >
            {service.name}
          </h1>
        </div>

        {/* Service Providers List */}
        <div className="mb-8 space-y-3">
          {spsInPinCode.length > 0 ? (
            spsInPinCode.map((sp) => (
              <div
                key={sp.spId}
                className="p-4 rounded-lg border flex items-center gap-4 justify-between"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                {/* Logo */}
                <div className="flex-shrink-0">
                  {sp.logo ? (
                    <img
                      src={sp.logo}
                      alt={sp.businessName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : service?.logo ? (
                    <img
                      src={service.logo}
                      alt={service.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-white text-2xl"
                      style={{
                        backgroundColor: service?.colorTheme?.primary || COLORS.semantic.info,
                      }}
                    >
                      {sp.businessName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Business Name */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-base"
                    style={{ color: COLORS.text.primary }}
                  >
                    {sp.businessName}
                  </h3>
                </div>

                {/* Order Button */}
                <button
                  onClick={() => handleStartOrder(sp)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-white transition hover:opacity-90 flex items-center gap-1"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  <Plus className="w-4 h-4" />
                  Order
                </button>
              </div>
            ))
          ) : (
            <EmptyState message="No service providers available in your area for this service" />
          )}
        </div>

        {/* Tabs */}
        <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-4 md:p-6">
              <div className="mb-8">
                <StatsGrid
                  columns="grid-cols-1 md:grid-cols-3"
                  stats={[
                    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: COLORS.semantic.info },
                    {
                      label: 'Total Spent',
                      value: `₹${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}`,
                      icon: ShoppingBag,
                      color: COLORS.semantic.info,
                    },
                    {
                      label: 'Delivered',
                      value: orders.filter((o) => o.status === 'DELIVERED').length,
                      icon: CheckCircle2,
                      color: COLORS.semantic.success,
                    },
                  ]}
                />
              </div>

              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <h3
                  className="font-semibold mb-4"
                  style={{ color: COLORS.text.primary }}
                >
                  About This Service
                </h3>
                <p style={{ color: COLORS.text.secondary }}>
                  {service.description}
                </p>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-4 md:p-6">
              {/* Create New Order Button */}
              <div className="mb-6">
                <button
                  onClick={() => { setSelectedSPForOrder(null); setShowCreateOrder(true); }}
                  disabled={spsInPinCode.length === 0}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  <Plus className="w-4 h-4" />
                  Create New Order
                </button>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.text.secondary }}
                          >
                            Order #{order.orderId}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: COLORS.text.secondary }}
                          >
                            Order Date: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </div>

                      <div className="border-t border-b py-3 mb-3" style={{ borderColor: COLORS.border.light }}>
                        {order.items.map((item, idx) => {
                          const qty = item.quantity || item.qty || 0;
                          const price = item.price || item.customPrice || 0;
                          return (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                              style={{ color: COLORS.text.primary }}
                            >
                              <span>
                                {qty}x {item.name}
                              </span>
                              <span>₹{price.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between font-bold">
                        <span style={{ color: COLORS.text.primary }}>Total</span>
                        <span style={{ color: COLORS.semantic.info }}>
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {canViewInvoice(order.status) && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border.light }}>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setInvoiceOrder(order);
                            }}
                            className="text-sm font-semibold underline"
                            style={{ color: COLORS.semantic.info }}
                          >
                            View Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No orders yet. Start by booking a service!" />
              )}
            </div>
          )}
      </main>

      {/* Create Order Modal */}
      {showCreateOrder && (
        <CreateOrderModal
          spId={selectedSPForOrder?.spId || ''}
          spBusinessName={selectedSPForOrder?.businessName}
          serviceId={serviceId}
          isCustomerCreating={true}
          onClose={() => setShowCreateOrder(false)}
          onOrderCreated={() => {
            setShowCreateOrder(false);
            loadData();
          }}
        />
      )}

      {selectedOrder && (
        <OrderLifecycleModal
          order={selectedOrder}
          role="CUSTOMER"
          onClose={() => setSelectedOrder(null)}
          onSaved={() => loadData()}
        />
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          businessNameHint={selectedSPForOrder?.businessName || service.name}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

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
          onClose={() => setShowProfileModal(false)}
          onComplete={() => {
            // Reload data to refresh profile
            loadData();
          }}
        />
      )}
    </div>
  );
}

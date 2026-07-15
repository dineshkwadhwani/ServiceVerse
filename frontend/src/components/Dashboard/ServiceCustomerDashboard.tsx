import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, BarChart3, ShoppingBag, Plus } from 'lucide-react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { CreateOrderModal } from '@/components/Orders/CreateOrderModal';
import { OrderLifecycleModal } from '@/components/Orders/OrderLifecycleModal';
import { InvoiceModal } from '@/components/Orders/InvoiceModal';
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
}

type ActiveTab = 'overview' | 'orders';

export function ServiceCustomerDashboard() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { firebaseUser } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [spInfo, setSPInfo] = useState<SPInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [currentSpId, setCurrentSpId] = useState<string>('');
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

      // Load customer's orders (if authenticated)
      if (firebaseUser?.uid) {
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

        // Load SP info from first order if available
        if (loadedOrders.length > 0) {
          const firstOrder = loadedOrders[0];
          if (firstOrder.spId) {
            setCurrentSpId(firstOrder.spId);
            try {
              // Get SP info from Firestore
              const spDocRef = doc(db, 'users', firstOrder.spId);
              const spDoc = await getDoc(spDocRef);
              if (spDoc.exists()) {
                const spData = spDoc.data();
                setSPInfo({
                  spId: spDoc.id,
                  businessName: spData.businessName || spData.name || 'Service Provider',
                  area: spData.area || '',
                  city: spData.city || '',
                  averageRating: spData.averageRating || 0,
                  totalOrders: spData.totalOrders || 0,
                });
              }
            } catch (spError) {
              // SP info load failed - will show basic service info only
            }
          }
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

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      {/* Hero Image */}
      <div className="h-48 md:h-64 w-full overflow-hidden">
        {service.heroImage ? (
          <img
            src={service.heroImage}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: service.colorTheme?.primary || COLORS.semantic.info }}
          >
            {service.name.charAt(0)}
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mt-4 mb-6 font-medium transition"
          style={{ color: COLORS.semantic.info }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>

        {/* Service & SP Info */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: COLORS.text.primary }}
          >
            {service.name}
          </h1>

          {spInfo && (
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: COLORS.text.secondary }}
              >
                Your Service Provider
              </h2>
              <div className="flex items-start gap-4">
                {spInfo.logo ? (
                  <img
                    src={spInfo.logo}
                    alt={spInfo.businessName}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    {spInfo.businessName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3
                    className="font-semibold text-lg"
                    style={{ color: COLORS.text.primary }}
                  >
                    {spInfo.businessName}
                  </h3>
                  {(spInfo.area || spInfo.city) && (
                    <p style={{ color: COLORS.text.secondary }}>
                      {spInfo.area && spInfo.city
                        ? `${spInfo.area}, ${spInfo.city}`
                        : spInfo.city || spInfo.area}
                    </p>
                  )}
                  {spInfo.averageRating !== undefined && (
                    <p className="text-sm mt-2">
                      <span style={{ color: COLORS.semantic.warning }}>★</span>
                      <span
                        className="ml-1 font-semibold"
                        style={{ color: COLORS.text.primary }}
                      >
                        {spInfo.averageRating.toFixed(1)}
                      </span>
                      <span style={{ color: COLORS.text.secondary }}>
                        {' '}
                        ({spInfo.totalOrders} orders)
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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
                      value: `$${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}`,
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
            <div className="p-4 md:p-6 space-y-4">
              <button
                onClick={() => setShowCreateOrder(true)}
                className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Create Order
              </button>
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
                            className="text-sm mt-1"
                            style={{ color: COLORS.text.secondary }}
                          >
                            {new Date(order.createdAt).toLocaleDateString()}
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
                              <span>${price.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between font-bold">
                        <span style={{ color: COLORS.text.primary }}>Total</span>
                        <span style={{ color: COLORS.semantic.info }}>
                          ${order.totalAmount.toFixed(2)}
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
          spId={currentSpId || ''}
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
          businessNameHint={spInfo?.businessName || service.name}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

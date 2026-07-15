import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, BarChart3, ShoppingBag, Plus, Search, X } from 'lucide-react';
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
  email?: string;
  phone?: string;
}

type ActiveTab = 'overview' | 'orders';

export function ServiceCustomerDashboard() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { firebaseUser } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [associatedSPs, setAssociatedSPs] = useState<SPInfo[]>([]);
  const [selectedSP, setSelectedSP] = useState<SPInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSPs, setFilteredSPs] = useState<SPInfo[]>([]);
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

      // Load customer's service providers for this service
      if (firebaseUser?.uid && serviceId) {
        try {
          const spProvidersResponse = await apiClient.getCustomerServiceProviders(serviceId);
          const spIds = spProvidersResponse.data?.providers || [];

          // Fetch full details for each SP
          const spDetails: SPInfo[] = [];
          for (const provider of spIds) {
            try {
              const spDocRef = doc(db, 'users', provider.spId);
              const spDoc = await getDoc(spDocRef);
              if (spDoc.exists()) {
                const spData = spDoc.data();
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
            } catch (error) {
              // Continue loading other SPs
            }
          }
          setAssociatedSPs(spDetails);
          setFilteredSPs(spDetails);
          if (spDetails.length > 0) {
            setSelectedSP(spDetails[0]);
          }
        } catch (error) {
          // Providers not loaded
        }

        // Load customer's orders
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredSPs(associatedSPs);
    } else {
      const lowercaseQuery = query.toLowerCase();
      const filtered = associatedSPs.filter((sp) =>
        sp.businessName.toLowerCase().includes(lowercaseQuery) ||
        sp.area?.toLowerCase().includes(lowercaseQuery) ||
        sp.city?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredSPs(filtered);
    }
  };

  const handleStartOrder = (sp: SPInfo) => {
    setSelectedSP(sp);
    setShowCreateOrder(true);
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

        {/* Service Providers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.text.primary }}
            >
              Service Providers
            </h2>
            <button
              onClick={() => setShowSearchBox(!showSearchBox)}
              className="p-2 rounded-lg transition"
              style={{
                backgroundColor: showSearchBox ? COLORS.semantic.info : COLORS.bg.surface,
                color: showSearchBox ? 'white' : COLORS.semantic.info,
              }}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          {showSearchBox && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Search by name, area, or city..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                  '--tw-ring-color': COLORS.semantic.info,
                } as any}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: COLORS.bg.surface }}
                >
                  <X className="w-5 h-5" style={{ color: COLORS.text.secondary }} />
                </button>
              )}
            </div>
          )}

          {/* SP Grid */}
          {filteredSPs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredSPs.map((sp) => (
                <button
                  key={sp.spId}
                  onClick={() => setSelectedSP(sp)}
                  className="p-4 rounded-lg border text-left transition"
                  style={{
                    backgroundColor: selectedSP?.spId === sp.spId ? COLORS.semantic.info : COLORS.bg.surface,
                    borderColor: selectedSP?.spId === sp.spId ? COLORS.semantic.info : COLORS.border.light,
                  }}
                >
                  {sp.logo ? (
                    <img
                      src={sp.logo}
                      alt={sp.businessName}
                      className="w-12 h-12 rounded-lg object-cover mb-2"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white mb-2"
                      style={{ backgroundColor: COLORS.semantic.info }}
                    >
                      {sp.businessName.charAt(0)}
                    </div>
                  )}
                  <h3
                    className="font-semibold"
                    style={{
                      color: selectedSP?.spId === sp.spId ? 'white' : COLORS.text.primary,
                    }}
                  >
                    {sp.businessName}
                  </h3>
                  {(sp.area || sp.city) && (
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: selectedSP?.spId === sp.spId ? 'rgba(255,255,255,0.8)' : COLORS.text.secondary,
                      }}
                    >
                      {sp.area && sp.city ? `${sp.area}, ${sp.city}` : sp.city || sp.area}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : showSearchBox ? (
            <EmptyState message="No service providers found matching your search" />
          ) : (
            <EmptyState message="No service providers available for this service" />
          )}

          {/* Selected SP Details */}
          {selectedSP && (
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                {selectedSP.logo ? (
                  <img
                    src={selectedSP.logo}
                    alt={selectedSP.businessName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center font-bold text-white text-2xl"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    {selectedSP.businessName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3
                    className="font-semibold text-lg"
                    style={{ color: COLORS.text.primary }}
                  >
                    {selectedSP.businessName}
                  </h3>
                  {(selectedSP.area || selectedSP.city) && (
                    <p style={{ color: COLORS.text.secondary }}>
                      {selectedSP.area && selectedSP.city
                        ? `${selectedSP.area}, ${selectedSP.city}`
                        : selectedSP.city || selectedSP.area}
                    </p>
                  )}
                  {selectedSP.email && (
                    <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                      {selectedSP.email}
                    </p>
                  )}
                  {selectedSP.phone && (
                    <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                      {selectedSP.phone}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleStartOrder(selectedSP)}
                  className="px-6 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 whitespace-nowrap"
                  style={{ backgroundColor: COLORS.semantic.success }}
                >
                  <Plus className="w-4 h-4" />
                  Order
                </button>
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
              {/* Create Order Section with SP Selection */}
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
                  Create New Order
                </h3>

                <div className="mb-4">
                  <p
                    className="text-sm font-medium mb-3"
                    style={{ color: COLORS.text.secondary }}
                  >
                    Select a Service Provider
                  </p>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search by name, area, or city..."
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: COLORS.bg.primary,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                        '--tw-ring-color': COLORS.semantic.info,
                      } as any}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>

                  {filteredSPs.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                      {filteredSPs.map((sp) => (
                        <button
                          key={sp.spId}
                          onClick={() => {
                            setSelectedSP(sp);
                            setShowCreateOrder(true);
                          }}
                          className="p-3 rounded-lg border text-center transition"
                          style={{
                            backgroundColor: COLORS.bg.primary,
                            borderColor: COLORS.border.light,
                          }}
                        >
                          {sp.logo ? (
                            <img
                              src={sp.logo}
                              alt={sp.businessName}
                              className="w-12 h-12 rounded-lg object-cover mx-auto mb-2"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white mx-auto mb-2"
                              style={{ backgroundColor: COLORS.semantic.info }}
                            >
                              {sp.businessName.charAt(0)}
                            </div>
                          )}
                          <p
                            className="text-xs font-semibold line-clamp-2"
                            style={{ color: COLORS.text.primary }}
                          >
                            {sp.businessName}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: COLORS.text.secondary }}>No service providers found</p>
                  )}
                </div>

                <button
                  onClick={() => setShowCreateOrder(true)}
                  disabled={!selectedSP}
                  className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  <Plus className="w-4 h-4" />
                  Create Order
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
      {showCreateOrder && selectedSP && (
        <CreateOrderModal
          spId={selectedSP.spId}
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
          businessNameHint={selectedSP?.businessName || service.name}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

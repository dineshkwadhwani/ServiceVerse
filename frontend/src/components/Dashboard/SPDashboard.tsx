import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Package, Star, BarChart3, ShoppingBag, DollarSign, AlertCircle, Users, Plus } from 'lucide-react';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid, StatCard } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { SPProfileEditModal } from '@/components/Onboarding/SPProfileEditModal';
import { CreateOrderModal } from '@/components/Orders/CreateOrderModal';
import { CreateCustomerModal } from '@/components/Orders/CreateCustomerModal';
import { CreateCoworkerModal } from '@/components/Orders/CreateCoworkerModal';
import { OrderLifecycleModal } from '@/components/Orders/OrderLifecycleModal';
import { InvoiceModal } from '@/components/Orders/InvoiceModal';
import { SPReportPage } from '@/components/Reports/SPReports';
import { useDashboardContext } from '@/context/DashboardContext';
import { apiClient } from '@/services/apiClient';
import { COLORS } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | 'PAID' | 'ASSIGNED_FOR_PICKUP' | 'READY_FOR_DELIVERY';
  deliveryType?: 'DROP' | 'PICKUP';
  spId?: string;
  selectedCoworker?: string;
  totalAmount: number;
  createdAt: Date;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface SPStats {
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalCustomers: number;
}

interface SPDashboardData {
  stats: SPStats;
  orders: Order[];
  earnings: any[];
  customers: any[];
  hasMoreOrders: boolean;
}

const DASHBOARD_CACHE_TTL_MS = 30_000;
const dashboardDataCache = new Map<string, { timestamp: number; data: SPDashboardData }>();
const dashboardDataInFlight = new Map<string, Promise<SPDashboardData>>();

const USER_DOC_CACHE_TTL_MS = 30_000;
const userDocCache = new Map<string, { timestamp: number; data: any }>();
const userDocInFlight = new Map<string, Promise<any>>();

async function fetchSPDashboardData(uid: string, forceRefresh = false): Promise<SPDashboardData> {
  const now = Date.now();

  if (!forceRefresh) {
    const cached = dashboardDataCache.get(uid);
    if (cached && now - cached.timestamp < DASHBOARD_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = dashboardDataInFlight.get(uid);
    if (inFlight) {
      return inFlight;
    }
  }

  const requestPromise = (async () => {
    const [statsResponse, ordersResponse, earningsResponse, customersResponse] = await Promise.all([
      apiClient.getSPStats(uid),
      apiClient.getSPOrdersList(uid, 10),
      apiClient.getSPEarnings(uid),
      apiClient.getSPCustomers(),
    ]);

    const loadedOrders = (ordersResponse?.data?.orders || []).map((order: any) => ({
      orderId: order.orderId || '',
      customerId: order.customerId || '',
      customerName: order.customerName || 'Unknown',
      status: order.status || 'NEW',
      deliveryType: order.deliveryType || 'DROP',
      spId: order.spId || uid,
      selectedCoworker: order.selectedCoworker || '',
      totalAmount: order.total || order.totalAmount || 0,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      items: order.items || [],
    }));

    const loadedEarnings = (earningsResponse?.data?.earnings || []).map((earning: any) => ({
      date: earning.date || '',
      amount: earning.amount || 0,
      orders: earning.orders || 0,
    }));

    const loadedCustomers = (customersResponse?.data?.customers || []);

    const data: SPDashboardData = {
      stats: {
        totalOrders: statsResponse?.data?.totalOrders || 0,
        totalRevenue: statsResponse?.data?.totalRevenue || 0,
        averageRating: statsResponse?.data?.averageRating || 0,
        totalCustomers: statsResponse?.data?.totalCustomers || 0,
      },
      orders: loadedOrders,
      earnings: loadedEarnings,
      customers: loadedCustomers,
      hasMoreOrders: ordersResponse?.data?.hasMore || false,
    };

    dashboardDataCache.set(uid, { timestamp: Date.now(), data });
    return data;
  })();

  dashboardDataInFlight.set(uid, requestPromise);

  try {
    return await requestPromise;
  } finally {
    dashboardDataInFlight.delete(uid);
  }
}

async function fetchSPUserDoc(uid: string, forceRefresh = false): Promise<any> {
  const now = Date.now();

  if (!forceRefresh) {
    const cached = userDocCache.get(uid);
    if (cached && now - cached.timestamp < USER_DOC_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = userDocInFlight.get(uid);
    if (inFlight) {
      return inFlight;
    }
  }

  const requestPromise = (async () => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    userDocCache.set(uid, { timestamp: Date.now(), data });
    return data;
  })();

  userDocInFlight.set(uid, requestPromise);

  try {
    return await requestPromise;
  } finally {
    userDocInFlight.delete(uid);
  }
}

type ActiveTab = 'overview' | 'orders' | 'pickup' | 'earnings' | 'customers' | 'coworkers';
type ReportType = 'orders' | 'revenue' | 'customers' | null;

export function SPDashboard() {
  const { user, firebaseUser } = useAuthStore();
  const { showProfileModal, setShowProfileModal } = useDashboardContext();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [fullUserData, setFullUserData] = useState<any>(null);
  const [stats, setStats] = useState<SPStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalCustomers: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateCoworker, setShowCreateCoworker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchDate, setOrderSearchDate] = useState('');
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [openReport, setOpenReport] = useState<ReportType>(null);

  useEffect(() => {
    loadData();
    loadFullUserData();
  }, [firebaseUser?.uid]);

  const loadFullUserData = async (forceRefresh = false) => {
    if (!firebaseUser?.uid) return;

    try {
      const userData = await fetchSPUserDoc(firebaseUser.uid, forceRefresh);
      setFullUserData(userData);
    } catch (error) {
      // User data load failed
    }
  };

  const loadData = async (forceRefresh = false) => {
    if (!firebaseUser?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      const [data, coworkersResponse] = await Promise.all([
        fetchSPDashboardData(firebaseUser.uid, forceRefresh),
        apiClient.getSPCoworkers(firebaseUser.uid),
      ]);
      setStats(data.stats);
      setOrders(data.orders);
      setEarnings(data.earnings);
      setCustomers(data.customers);
      setHasMoreOrders(data.hasMoreOrders);
      setCoworkers((coworkersResponse?.data?.coworkers || []).map((c: any) => ({
        coworkerId: c.uid,
        phone: c.phone,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
      })));
    } catch (error: any) {
      // Failed to load SP data - keep default empty values
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreOrders = async () => {
    if (!firebaseUser?.uid || loadingMoreOrders || !hasMoreOrders) return;

    setLoadingMoreOrders(true);
    try {
      const lastOrderId = orders[orders.length - 1]?.orderId;
      const response = await apiClient.getSPOrdersList(firebaseUser.uid, 10, lastOrderId);
      const newOrders = (response?.data?.orders || []).map((order: any) => ({
        orderId: order.orderId || '',
        customerId: order.customerId || '',
        customerName: order.customerName || 'Unknown',
        status: order.status || 'NEW',
        deliveryType: order.deliveryType || 'DROP',
        spId: order.spId || firebaseUser.uid,
        selectedCoworker: order.selectedCoworker || '',
        totalAmount: order.total || order.totalAmount || 0,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        items: order.items || [],
      }));
      setOrders(prev => [...prev, ...newOrders]);
      setHasMoreOrders(response?.data?.hasMore || false);
    } catch (error) {
      // Failed to load more orders
    } finally {
      setLoadingMoreOrders(false);
    }
  };

  const getFilteredOrders = () => {
    return orders
      .filter(order => {
        const matchesName = orderSearchQuery === '' ||
          order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase());
        const matchesDate = orderSearchDate === '' ||
          order.createdAt.toLocaleDateString() === new Date(orderSearchDate).toLocaleDateString();
        return matchesName && matchesDate;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by date, newest first
  };

  // Show report page if one is selected
  if (openReport) {
    return (
      <SPReportPage
        reportType={openReport}
        orders={orders}
        customers={customers}
        stats={stats}
        onBack={() => setOpenReport(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
      </div>
    );
  }

  // Check if SP is ACTIVE - use fresh data from Firestore, not cached authStore
  const spUser = user as any; // Cast to access SP-specific properties
  const isActive = (fullUserData?.status || spUser?.status) === 'ACTIVE';

  // Show under review message if not active (but still allow modal to open)
  if (!isActive && !showProfileModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.bg.primary }}>
        <div
          className="max-w-md w-full p-8 rounded-2xl border-2"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.semantic.warning,
          }}
        >
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12" style={{ color: COLORS.semantic.warning }} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4" style={{ color: COLORS.text.primary }}>
            Registration Under Review
          </h2>
          <p className="text-center mb-6" style={{ color: COLORS.text.secondary }}>
            Your registration is under review. In the mean time you can complete your profile. An Account manager will help you get onboarded.
          </p>
          <button
            onClick={() => {
              setShowProfileModal(true);
            }}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white transition"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            Complete Profile
          </button>
        </div>
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

  const filteredEarnings = earnings.filter((e) => {
    if (filterFromDate && new Date(e.date) < new Date(filterFromDate)) return false;
    if (filterToDate && new Date(e.date) > new Date(filterToDate)) return false;
    return true;
  });

  const totalFilteredEarnings = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);

  const canViewInvoice = (status: string) => {
    const normalized = String(status || '').toUpperCase();
    return normalized === 'COMPLETED' || normalized === 'DELIVERED' || normalized === 'PAID';
  };

  const handleStatClick = (stat: StatCard) => {
    if (stat.id === 'orders') setOpenReport('orders');
    else if (stat.id === 'revenue') setOpenReport('revenue');
    else if (stat.id === 'customers') setOpenReport('customers');
  };

  const normalizeAssigneeName = (value?: string) =>
    (value || '')
      .trim()
      .toLowerCase()
      .replace(/^self\s*-\s*/, '')
      .replace(/\s*\([^)]*\)\s*$/, '');

  const spSelfNames = [
    fullUserData?.ownerName,
    fullUserData?.businessName,
    fullUserData?.name,
    (user as any)?.ownerName,
    (user as any)?.businessName,
    (user as any)?.name,
    firebaseUser?.displayName,
  ]
    .filter(Boolean)
    .map((name: string) => normalizeAssigneeName(name));

  const spSelfNamesSet = new Set([
    ...spSelfNames,
    normalizeAssigneeName(firebaseUser?.uid),
    'self',
  ]);

  const pickupOrdersForSP = orders
    .filter((order) => {
      const assignedTo = normalizeAssigneeName(order.selectedCoworker || '');
      const statusValue = String(order.status || '').toUpperCase();
      const isPickupOrder = order.deliveryType === 'PICKUP' || statusValue === 'ASSIGNED_FOR_PICKUP';
      return isPickupOrder && assignedTo !== '' && spSelfNamesSet.has(assignedTo);
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'pickup', icon: Package, label: 'Pickup' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'coworkers', icon: Users, label: 'Coworkers' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            <StatsGrid
              columns="grid-cols-2 lg:grid-cols-4"
              onStatClick={handleStatClick}
              stats={[
                { id: 'orders', label: 'Total Orders', value: stats.totalOrders, icon: Package, color: COLORS.semantic.info },
                { id: 'revenue', label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: COLORS.semantic.success },
                { label: 'Rating', value: stats.averageRating, icon: Star, color: COLORS.semantic.warning },
                { id: 'customers', label: 'Customers', value: stats.totalCustomers, icon: Package, color: COLORS.semantic.info },
              ]}
            />
          </div>
        )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-4 md:p-6">
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <h3
                  className="font-semibold mb-4 text-lg"
                  style={{ color: COLORS.text.primary }}
                >
                  Recent Orders
                </h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 rounded-lg border flex items-center justify-between"
                      style={{
                        backgroundColor: COLORS.bg.primary,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                          {order.customerName}
                        </p>
                        <p style={{ color: COLORS.text.secondary }}>
                          Order #{order.orderId} • ₹{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                        <div
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-4 md:p-6 space-y-4">
              {/* Create Button & Search */}
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={() => setShowCreateOrder(true)}
                  className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 md:w-auto w-full justify-center md:justify-start"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  <Plus className="w-4 h-4" />
                  Create Order
                </button>

                <input
                  type="text"
                  placeholder="Search by customer name..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.surface,
                    color: COLORS.text.primary,
                  }}
                />

                <input
                  type="date"
                  value={orderSearchDate}
                  onChange={e => setOrderSearchDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border focus:outline-none text-sm"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {getFilteredOrders().length > 0 ? (
                  <>
                    {getFilteredOrders().map((order) => (
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
                            <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                              {order.customerName}
                            </p>
                            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                              Order #{order.orderId} • {order.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {order.status}
                          </div>
                        </div>

                        <div className="border-t border-b py-3 mb-3" style={{ borderColor: COLORS.border.light }}>
                          {order.items.length > 0 ? (
                            order.items.map((item: any, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span style={{ color: COLORS.text.primary }}>
                                  {item.qty}x {item.name}
                                </span>
                                <span style={{ color: COLORS.text.primary }}>
                                  ₹{item.itemTotal?.toFixed(2) || (item.qty * item.customPrice).toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: COLORS.text.secondary }}>No items</p>
                          )}
                        </div>

                        <div className="flex justify-between font-bold">
                          <span style={{ color: COLORS.text.primary }}>Total</span>
                          <span style={{ color: COLORS.semantic.success }}>
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

                    {hasMoreOrders && (
                      <button
                        onClick={loadMoreOrders}
                        disabled={loadingMoreOrders}
                        className="w-full px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                        style={{
                          backgroundColor: COLORS.bg.surface,
                          color: COLORS.text.primary,
                          border: `1px solid ${COLORS.border.light}`,
                        }}
                      >
                        {loadingMoreOrders ? 'Loading...' : 'Load More Orders'}
                      </button>
                    )}
                  </>
                ) : (
                  <EmptyState message={orderSearchQuery || orderSearchDate ? 'No orders match your search' : 'No orders yet'} />
                )}
              </div>
            </div>
          )}

          {/* Pickup Tab */}
          {activeTab === 'pickup' && (
            <div className="p-4 md:p-6 space-y-3">
              {pickupOrdersForSP.length > 0 ? (
                pickupOrdersForSP.map((order) => (
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
                        <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                          {order.customerName}
                        </p>
                        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                          Order #{order.orderId} • {order.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                          Assigned pickup: {order.selectedCoworker}
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </div>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span style={{ color: COLORS.text.primary }}>Total</span>
                      <span style={{ color: COLORS.semantic.success }}>
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No pickup orders assigned to you yet" />
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="p-4 md:p-6 space-y-4">
              {/* Create Button */}
              <button
                onClick={() => setShowCreateCustomer(true)}
                className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Create Customer
              </button>

              {/* Customers List */}
              <div className="space-y-3">
                {customers.length > 0 ? (
                  customers.map((customer: any) => (
                    <div
                      key={customer.customerId}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                            {customer.name}
                          </p>
                          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                            {customer.phone}
                          </p>
                          {customer.email && (
                            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                              {customer.email}
                            </p>
                          )}
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor: customer.verified ? COLORS.semantic.success : COLORS.semantic.warning,
                          }}
                        >
                          {customer.verified ? 'Verified' : 'Unverified'}
                        </div>
                      </div>
                      {customer.addedAt && (
                        <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                          Added on {new Date(customer.addedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState message="No customers created yet" />
                )}
              </div>
            </div>
          )}

          {/* Coworkers Tab */}
          {activeTab === 'coworkers' && (
            <div className="p-4 md:p-6 space-y-4">
              {/* Create Button */}
              <button
                onClick={() => setShowCreateCoworker(true)}
                className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Create Coworker
              </button>

              {/* Coworkers List */}
              <div className="space-y-3">
                {coworkers.length > 0 ? (
                  coworkers.map((coworker: any) => (
                    <div
                      key={coworker.coworkerId}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                            {coworker.name}
                          </p>
                          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                            {coworker.phone}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor: coworker.status === 'ACTIVE' ? COLORS.semantic.success : COLORS.semantic.warning,
                          }}
                        >
                          {coworker.status}
                        </div>
                      </div>
                      {coworker.createdAt && (
                        <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                          Created on {new Date(coworker.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState message="No coworkers created yet" />
                )}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="p-4 md:p-6">
              {/* Filters */}
              <div className="mb-6 p-4 rounded-lg border" style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
              }}>
                <h3 className="font-semibold mb-4" style={{ color: COLORS.text.primary }}>
                  Date Range Filter
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.primary,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.primary,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div
                className="p-6 rounded-lg border mb-6"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <p style={{ color: COLORS.text.secondary }}>Total Earnings (filtered)</p>
                <p className="text-4xl font-bold mt-2" style={{ color: COLORS.semantic.success }}>
                  ₹{totalFilteredEarnings.toFixed(2)}
                </p>
              </div>

              {/* Earnings List */}
              <div className="space-y-3">
                {filteredEarnings.map((earning, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border flex items-center justify-between"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                        {new Date(earning.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                        {earning.orders} orders
                      </p>
                    </div>
                    <p className="font-bold text-lg" style={{ color: COLORS.semantic.success }}>
                      ₹{earning.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>

      {/* Profile Edit Modal */}
      {showProfileModal && firebaseUser?.uid && (
        <SPProfileEditModal
          spId={firebaseUser.uid}
          spPhone={fullUserData?.phone || (user as any)?.phone || ''}
          spEmail={fullUserData?.email || (user as any)?.email}
          spBusinessName={fullUserData?.businessName}
          spOwnerName={fullUserData?.ownerName}
          spAddress={fullUserData?.address}
          spArea={fullUserData?.area}
          spCity={fullUserData?.city}
          spPin={fullUserData?.pin}
          existingBasicInfo={fullUserData?.basicInfo ? {
            ...fullUserData.basicInfo,
            logoUrl: fullUserData.basicInfo.logoUrl || fullUserData.businessLogo || '',
          } : undefined}
          existingOperations={fullUserData?.operations}
          onComplete={() => {
            setShowProfileModal(false);
            loadFullUserData();
          }}
          onCancel={() => setShowProfileModal(false)}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrder && firebaseUser?.uid && (
        <CreateOrderModal
          spId={firebaseUser.uid}
          onClose={() => setShowCreateOrder(false)}
          onOrderCreated={() => {
            // Reload orders data to show new order
            loadData(true);
          }}
        />
      )}

      {/* Create Customer Modal */}
      {showCreateCustomer && (
        <CreateCustomerModal
          onClose={() => setShowCreateCustomer(false)}
          onCustomerCreated={() => {
            loadData(true);
          }}
        />
      )}

      {/* Create Coworker Modal */}
      {showCreateCoworker && firebaseUser?.uid && (
        <CreateCoworkerModal
          spId={firebaseUser.uid}
          onClose={() => setShowCreateCoworker(false)}
          onCoworkerCreated={() => {
            loadData(true);
          }}
        />
      )}

      {selectedOrder && (
        <OrderLifecycleModal
          order={selectedOrder}
          role={((user as any)?.role || 'SERVICE_PROVIDER') as any}
          coworkers={coworkers.map((c: any) => ({ uid: c.coworkerId, name: c.name }))}
          onClose={() => setSelectedOrder(null)}
          onSaved={() => loadData(true)}
        />
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          businessNameHint={fullUserData?.businessName || (user as any)?.businessName || (user as any)?.name}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

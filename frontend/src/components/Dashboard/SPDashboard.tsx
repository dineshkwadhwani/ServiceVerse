import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Package, Star, BarChart3, ShoppingBag, DollarSign } from 'lucide-react';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid } from '@/components/Shared/StatsGrid';
import { COLORS } from '@/utils/theme';

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'DELIVERED' | 'CANCELLED';
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

type ActiveTab = 'overview' | 'orders' | 'earnings';

export function SPDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats] = useState<SPStats>({
    totalOrders: 245,
    totalRevenue: 12450.75,
    averageRating: 4.8,
    totalCustomers: 89,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(false);

    // Mock orders
    const mockOrders: Order[] = [
      {
        orderId: '1',
        customerId: 'cust1',
        customerName: 'John Doe',
        status: 'DELIVERED',
        totalAmount: 45.99,
        createdAt: new Date('2024-01-15'),
        items: [{ name: 'Basic Laundry', quantity: 1, price: 45.99 }],
      },
      {
        orderId: '2',
        customerId: 'cust2',
        customerName: 'Jane Smith',
        status: 'READY',
        totalAmount: 89.99,
        createdAt: new Date('2024-01-20'),
        items: [{ name: 'Premium Laundry', quantity: 1, price: 89.99 }],
      },
      {
        orderId: '3',
        customerId: 'cust3',
        customerName: 'Bob Johnson',
        status: 'CONFIRMED',
        totalAmount: 65.5,
        createdAt: new Date('2024-01-22'),
        items: [{ name: 'Express Service', quantity: 1, price: 65.5 }],
      },
    ];
    setOrders(mockOrders);

    // Mock earnings data
    const mockEarnings = [
      { date: '2024-01-15', amount: 45.99, orders: 3 },
      { date: '2024-01-16', amount: 128.50, orders: 5 },
      { date: '2024-01-17', amount: 95.75, orders: 4 },
      { date: '2024-01-18', amount: 156.25, orders: 6 },
      { date: '2024-01-19', amount: 112.00, orders: 4 },
      { date: '2024-01-20', amount: 89.99, orders: 3 },
    ];
    setEarnings(mockEarnings);
  };

  if (isLoading) {
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

  const filteredEarnings = earnings.filter((e) => {
    if (filterFromDate && new Date(e.date) < new Date(filterFromDate)) return false;
    if (filterToDate && new Date(e.date) > new Date(filterToDate)) return false;
    return true;
  });

  const totalFilteredEarnings = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
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
              stats={[
                { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: COLORS.semantic.info },
                { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: COLORS.semantic.success },
                { label: 'Rating', value: stats.averageRating, icon: Star, color: COLORS.semantic.warning },
                { label: 'Customers', value: stats.totalCustomers, icon: Package, color: COLORS.semantic.info },
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
                          Order #{order.orderId} • ${order.totalAmount.toFixed(2)}
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
            <div className="p-4 md:p-6">
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
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
                          Order #{order.orderId} • {new Date(order.createdAt).toLocaleDateString()}
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
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span style={{ color: COLORS.text.primary }}>
                            {item.quantity}x {item.name}
                          </span>
                          <span style={{ color: COLORS.text.primary }}>
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-bold">
                      <span style={{ color: COLORS.text.primary }}>Total</span>
                      <span style={{ color: COLORS.semantic.info }}>
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
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
                  ${totalFilteredEarnings.toFixed(2)}
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
                      ${earning.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

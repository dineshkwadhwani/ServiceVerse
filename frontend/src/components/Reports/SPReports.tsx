import { useEffect, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | 'PAID' | 'ASSIGNED_FOR_PICKUP' | 'READY_FOR_DELIVERY';
  deliveryType?: 'DROP' | 'PICKUP';
  totalAmount: number;
  createdAt: Date;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  verified?: boolean;
  addedAt?: Date;
}

interface SPEarningRow {
  orderId: string;
  date: string;
  customerName: string;
  orderAmount: number;
  commissionAmount: number;
  earningAmount: number;
}

interface SPReportPageProps {
  reportType: 'orders' | 'earnings' | 'customers';
  orders: Order[];
  earnings: SPEarningRow[];
  customers: Customer[];
  stats: any;
  onBack: () => void;
}

export function SPReportPage({ reportType, orders, earnings, customers, stats, onBack }: SPReportPageProps) {
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [baseData, setBaseData] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [dataType, setDataType] = useState<'orders' | 'earnings' | 'customers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [earningsWindow, setEarningsWindow] = useState<'ALL_TIME' | 'MONTH' | 'TODAY'>('ALL_TIME');

  useEffect(() => {
    let data: any[] = [];
    if (reportType === 'orders') {
      setTitle(`All Orders (${stats.totalOrders || 0})`);
      setDataType('orders');
      data = orders;
    } else if (reportType === 'earnings') {
      setTitle('Earnings Report');
      setDataType('earnings');
      data = earnings;
    } else if (reportType === 'customers') {
      setTitle(`Customers (${stats.totalCustomers || 0})`);
      setDataType('customers');
      data = customers;
    }
    setBaseData(data);
    applyFilters(data);
    // Reset filters when changing report type
    setSearchQuery('');
    setStatusFilter('ALL');
    setVerifiedFilter('ALL');
    setFromDate('');
    setToDate('');
    setEarningsWindow('ALL_TIME');
  }, [reportType, orders, earnings, customers, stats]);

  useEffect(() => {
    if (baseData.length > 0) {
      applyFilters(baseData);
    }
  }, [searchQuery, statusFilter, verifiedFilter, fromDate, toDate, earningsWindow, baseData]);

  const applyFilters = (data: any[]) => {
    let filtered = data;

    if (dataType === 'orders' && reportType === 'orders') {
      if (searchQuery.trim()) {
        filtered = filtered.filter((o: any) =>
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.orderId.includes(searchQuery)
        );
      }
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((o: any) => o.status === statusFilter);
      }
      if (fromDate) {
        filtered = filtered.filter((o: any) => new Date(o.createdAt) >= new Date(fromDate));
      }
      if (toDate) {
        filtered = filtered.filter((o: any) => new Date(o.createdAt) <= new Date(toDate));
      }
    } else if (dataType === 'earnings') {
      if (searchQuery.trim()) {
        filtered = filtered.filter((e: any) =>
          String(e.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(e.orderId || '').includes(searchQuery)
        );
      }

      const now = new Date();
      if (earningsWindow === 'TODAY') {
        filtered = filtered.filter((e: any) => {
          const date = new Date(e.date);
          return date.toDateString() === now.toDateString();
        });
      } else if (earningsWindow === 'MONTH') {
        filtered = filtered.filter((e: any) => {
          const date = new Date(e.date);
          return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        });
      }
    } else if (dataType === 'customers') {
      if (searchQuery.trim()) {
        filtered = filtered.filter((c: any) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (verifiedFilter !== 'ALL') {
        const isVerified = verifiedFilter === 'VERIFIED';
        filtered = filtered.filter((c: any) => c.verified === isVerified);
      }
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
        return COLORS.semantic.success;
      case 'READY':
      case 'READY_FOR_DELIVERY':
        return COLORS.semantic.info;
      case 'CANCELLED':
        return COLORS.semantic.error;
      default:
        return COLORS.semantic.warning;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      {/* Header with Back Button */}
      <div
        className="sticky top-0 z-30 px-4 md:px-6 lg:px-8 py-4 border-b"
        style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.primary }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:opacity-70 transition rounded-lg flex-shrink-0"
            style={{ color: COLORS.semantic.info }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold flex-1 min-w-0" style={{ color: COLORS.text.primary }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div
        className="sticky top-16 z-30 px-4 md:px-6 lg:px-8 py-3 border-b"
        style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.primary }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border md:col-span-2" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
              <Search className="w-4 h-4" style={{ color: COLORS.text.secondary }} />
              <input
                type="text"
                placeholder={dataType === 'customers' ? 'Search by name, email, or phone...' : 'Search by name or order ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: COLORS.text.primary }}
              />
            </div>

            {/* Status Filter - Orders */}
            {dataType === 'orders' && reportType === 'orders' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}

            {/* Verified Filter - Customers */}
            {dataType === 'customers' && (
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Status</option>
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            )}

            {dataType === 'earnings' && (
              <select
                value={earningsWindow}
                onChange={(e) => setEarningsWindow(e.target.value as 'ALL_TIME' | 'MONTH' | 'TODAY')}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL_TIME">All Time</option>
                <option value="MONTH">This Month</option>
                <option value="TODAY">Today</option>
              </select>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-end px-4 py-2 text-sm" style={{ color: COLORS.text.secondary }}>
              Showing {filteredData.length} of {baseData.length}
            </div>
          </div>

          {/* Date Range - Orders Only */}
          {dataType === 'orders' && reportType === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pt-2">
        {filteredData.length > 0 ? (
          <div className="space-y-3">
            {dataType === 'orders' && reportType === 'orders' && filteredData.map((order) => (
              <div
                key={order.orderId}
                className="p-4 rounded-lg border flex flex-col"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex-1 mb-4">
                  <p className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                    Order #{order.orderId}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    {order.customerName}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                    Order Date: {order.createdAt.toLocaleDateString()}
                  </p>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border.light }}>
                    <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </div>
                  <span className="font-bold text-lg" style={{ color: COLORS.semantic.success }}>
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {dataType === 'earnings' && (
              <>
                <div
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.bg.surface,
                    borderColor: COLORS.border.light,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.secondary }}>Date</p>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.secondary }}>Customer Name</p>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.secondary }}>Order Amount</p>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.secondary }}>Commission Amount</p>
                  </div>
                </div>

                {filteredData.map((earning: any) => (
                  <div
                    key={earning.orderId}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <p className="text-sm" style={{ color: COLORS.text.primary }}>
                        {new Date(earning.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.text.primary }}>
                        {earning.customerName}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.text.primary }}>
                        ₹{Number(earning.orderAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.semantic.warning }}>
                        ₹{Number(earning.commissionAmount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2 text-xs" style={{ color: COLORS.text.secondary }}>
                      Order #{earning.orderId}
                    </div>
                  </div>
                ))}
              </>
            )}

            {dataType === 'customers' && filteredData.map((customer: any) => (
              <div
                key={customer.customerId}
                className="p-4 rounded-lg border flex flex-col"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex-1 mb-4">
                  <p className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                    {customer.name}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    {customer.phone}
                  </p>
                  {customer.email && (
                    <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                      {customer.email}
                    </p>
                  )}
                  {customer.addedAt && (
                    <p className="text-xs mt-3" style={{ color: COLORS.text.secondary }}>
                      Added on {new Date(customer.addedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white w-fit"
                  style={{
                    backgroundColor: customer.verified ? COLORS.semantic.success : COLORS.semantic.warning,
                  }}
                >
                  {customer.verified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: COLORS.text.secondary }}>No data available</p>
          </div>
        )}
      </main>
    </div>
  );
}

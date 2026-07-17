import { useEffect, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPERADMIN' | 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'CUSTOMER' | 'COWORKER';
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  verified: boolean;
  createdAt: Date;
}

interface ServiceListItem {
  serviceId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  logo?: string;
  createdAt?: Date;
}

interface SuperAdminReportPageProps {
  reportType: 'users' | 'services' | 'providers' | 'customers' | 'managers';
  users: User[];
  services: ServiceListItem[];
  stats: any;
  onBack: () => void;
}

export function SuperAdminReportPage({
  reportType,
  users,
  services,
  stats,
  onBack,
}: SuperAdminReportPageProps) {
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [baseData, setBaseData] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [dataType, setDataType] = useState<'users' | 'services'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    let data: any[] = [];
    if (reportType === 'users') {
      setTitle(`All Users (${stats.totalUsers || 0})`);
      setDataType('users');
      data = users;
    } else if (reportType === 'services') {
      setTitle(`All Services (${stats.totalServices || 0})`);
      setDataType('services');
      data = services;
    } else if (reportType === 'providers') {
      setTitle(`Service Providers (${stats.totalServiceProviders || 0})`);
      setDataType('users');
      data = users.filter(u => u.role === 'SERVICE_PROVIDER');
    } else if (reportType === 'customers') {
      setTitle(`Customers (${stats.totalCustomers || 0})`);
      setDataType('users');
      data = users.filter(u => u.role === 'CUSTOMER');
    } else if (reportType === 'managers') {
      setTitle(`Account Managers (${stats.totalAccountManagers || 0})`);
      setDataType('users');
      data = users.filter(u => u.role === 'ACCOUNT_MANAGER');
    }
    setBaseData(data);
    applyFilters(data);
    // Reset filters when changing report type
    setSearchQuery('');
    setStatusFilter('ALL');
    setRoleFilter('ALL');
    setServiceStatusFilter('ALL');
  }, [reportType, users, services, stats]);

  useEffect(() => {
    if (baseData.length > 0) {
      applyFilters(baseData);
    }
  }, [searchQuery, statusFilter, roleFilter, serviceStatusFilter, baseData]);

  const applyFilters = (data: any[]) => {
    let filtered = data;

    if (dataType === 'users') {
      if (searchQuery.trim()) {
        filtered = filtered.filter((u: any) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.includes(searchQuery)
        );
      }
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((u: any) => {
          const userStatus = u.role === 'SUPERADMIN' ? 'Active' : u.status || (u.verified ? 'Active' : 'Pending');
          return userStatus === statusFilter;
        });
      }
      if (roleFilter !== 'ALL' && reportType === 'users') {
        filtered = filtered.filter((u: any) => u.role === roleFilter);
      }
    } else if (dataType === 'services') {
      if (searchQuery.trim()) {
        filtered = filtered.filter((s: any) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (serviceStatusFilter !== 'ALL') {
        filtered = filtered.filter((s: any) => s.status === serviceStatusFilter);
      }
    }

    setFilteredData(filtered);
  };

  const getUserStatus = (user: User) => {
    if (user.role === 'SUPERADMIN') {
      return 'Active';
    }
    if (user.status) {
      return user.status === 'ACTIVE' ? 'Active' : user.status === 'PENDING' ? 'Pending' : 'Inactive';
    }
    return user.verified ? 'Active' : 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'ACTIVE':
        return COLORS.semantic.success;
      case 'Pending':
      case 'PENDING':
        return COLORS.semantic.warning;
      default:
        return COLORS.semantic.error;
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
                placeholder={dataType === 'users' ? 'Search by name, email, or phone...' : 'Search by service name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: COLORS.text.primary }}
              />
            </div>

            {/* Status Filter - Users */}
            {dataType === 'users' && (
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
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            )}

            {/* Status Filter - Services */}
            {dataType === 'services' && (
              <select
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            )}

            {/* Role Filter - All Users Report */}
            {dataType === 'users' && reportType === 'users' && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ACCOUNT_MANAGER">Account Manager</option>
                <option value="SERVICE_PROVIDER">Service Provider</option>
                <option value="CUSTOMER">Customer</option>
                <option value="COWORKER">Coworker</option>
              </select>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-end px-4 py-2 text-sm" style={{ color: COLORS.text.secondary }}>
              Showing {filteredData.length} of {baseData.length}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pt-2">
        {filteredData.length > 0 ? (
          <div className="space-y-3">
            {dataType === 'users' && filteredData.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-lg border flex flex-col"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex-1 mb-4">
                  <p className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                    {user.name}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                      {user.phone}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                    Joined {user.createdAt?.toLocaleDateString?.() || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: getStatusColor(getUserStatus(user)) }}
                  >
                    {getUserStatus(user)}
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}

            {dataType === 'services' && filteredData.map((service: any) => (
              <div
                key={service.serviceId}
                className="p-4 rounded-lg border flex flex-col"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex-1 mb-4">
                  <p className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                    {service.name}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    {service.description || 'No description'}
                  </p>
                  {service.createdAt && (
                    <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                      Created {new Date(service.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white w-fit"
                  style={{
                    backgroundColor: service.status === 'ACTIVE' ? COLORS.semantic.success : COLORS.semantic.error,
                  }}
                >
                  {service.status}
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

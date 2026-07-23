import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import {
  Users,
  Briefcase,
  Settings,
  Plus,
  Loader2,
  BarChart3,
  Edit2,
} from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { IndianRupeeIcon } from '@/components/Shared/IndianRupeeIcon';
import { EditUserModal } from './EditUserModal';
import { CreateServiceModal } from '@/components/SuperAdmin/CreateServiceModal';
import { ApprovalsTab } from '@/components/SuperAdmin/ApprovalsTab';
import { SuperAdminProfileEditModal } from '@/components/Dashboard/SuperAdminProfileEditModal';
import { SuperAdminReportPage } from '@/components/Reports/SuperAdminReports';
import { useDashboardContext } from '@/context/DashboardContext';
import { useAuthStore } from '@/store/authStore';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid, StatCard } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { CheckCircle2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';

interface SystemStats {
  totalUsers: number;
  totalServices: number;
  totalAccountManagers: number;
  totalServiceProviders: number;
  totalCustomers: number;
  totalEarnings?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPERADMIN' | 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'CUSTOMER' | 'COWORKER';
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  verified: boolean;
  businessName?: string;
  createdAt: Date;
}

interface ServiceListItem {
  serviceId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  logo?: string;
  heroImage?: string;
  colorTheme?: any;
  fromEmail?: string;
  fromName?: string;
  gstPercentage?: number;
  defaultCommission?: any;
  menuItems?: any[];
  unorphanReasons?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

const SA_CACHE_TTL_MS = 30_000;

const saStatsCache = { timestamp: 0, data: null as SystemStats | null };
let saStatsInFlight: Promise<SystemStats | null> | null = null;

const saUsersCache = { timestamp: 0, data: [] as User[] };
let saUsersInFlight: Promise<User[]> | null = null;

const saServicesCache = { timestamp: 0, data: [] as ServiceListItem[] };
let saServicesInFlight: Promise<ServiceListItem[]> | null = null;

async function fetchSAStats(forceRefresh = false): Promise<SystemStats | null> {
  const now = Date.now();
  if (!forceRefresh && saStatsCache.data && now - saStatsCache.timestamp < SA_CACHE_TTL_MS) {
    return saStatsCache.data;
  }

  if (!forceRefresh && saStatsInFlight) {
    return saStatsInFlight;
  }

  saStatsInFlight = (async () => {
    const response = await apiClient.getSuperAdminStats();
    const data = (response.data || null) as SystemStats | null;
    saStatsCache.timestamp = Date.now();
    saStatsCache.data = data;
    return data;
  })();

  try {
    return await saStatsInFlight;
  } finally {
    saStatsInFlight = null;
  }
}

async function fetchSAUsers(forceRefresh = false): Promise<User[]> {
  const now = Date.now();
  if (!forceRefresh && now - saUsersCache.timestamp < SA_CACHE_TTL_MS) {
    return saUsersCache.data;
  }

  if (!forceRefresh && saUsersInFlight) {
    return saUsersInFlight;
  }

  saUsersInFlight = (async () => {
    const response = await apiClient.getAllUsers();
    const data = (response.data?.users || []) as User[];
    saUsersCache.timestamp = Date.now();
    saUsersCache.data = data;
    return data;
  })();

  try {
    return await saUsersInFlight;
  } finally {
    saUsersInFlight = null;
  }
}

async function fetchSAServices(forceRefresh = false): Promise<ServiceListItem[]> {
  const now = Date.now();
  if (!forceRefresh && now - saServicesCache.timestamp < SA_CACHE_TTL_MS) {
    return saServicesCache.data;
  }

  if (!forceRefresh && saServicesInFlight) {
    return saServicesInFlight;
  }

  saServicesInFlight = (async () => {
    const response = await apiClient.getServices();
    const data = (response.data?.services || []) as ServiceListItem[];
    saServicesCache.timestamp = Date.now();
    saServicesCache.data = data;
    return data;
  })();

  try {
    return await saServicesInFlight;
  } finally {
    saServicesInFlight = null;
  }
}

type ActiveTab = 'overview' | 'users' | 'services' | 'managers' | 'approvals';
type ReportType = 'users' | 'services' | 'providers' | 'customers' | 'managers' | 'earnings' | null;

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { firebaseUser } = useAuthStore();
  const { showProfileModal, setShowProfileModal } = useDashboardContext();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingService, setEditingService] = useState<ServiceListItem | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ACCOUNT_MANAGER' as 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'CUSTOMER',
    serviceId: '', // For Account Managers
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saData, setSAData] = useState<any>(null);
  const [openReport, setOpenReport] = useState<ReportType>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'ALL' | User['role']>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Inactive'>('ALL');

  useEffect(() => {
    loadDashboardData();
    if (firebaseUser?.uid) {
      loadSAProfile();
    }
    // Load users and services for reports on overview tab
    loadUsers();
    loadServices();
  }, [firebaseUser?.uid]);

  const loadSAProfile = async () => {
    if (!firebaseUser?.uid) return;
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSAData(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading SuperAdmin profile:', error);
    }
  };

  const hasMountedTabEffect = useRef(false);
  useEffect(() => {
    if (!hasMountedTabEffect.current) {
      hasMountedTabEffect.current = true;
      return;
    }
    if (activeTab === 'overview') {
      loadDashboardData(true);
    } else if (activeTab === 'users' || activeTab === 'managers') {
      loadUsers(true);
    } else if (activeTab === 'services') {
      loadServices(true);
    }
  }, [activeTab]);

  const loadDashboardData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const data = await fetchSAStats(forceRefresh);
      setStats(data);

      // Load SA profile data
      if (firebaseUser?.uid) {
        loadSAProfile();
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async (forceRefresh = false) => {
    try {
      const data = await fetchSAUsers(forceRefresh);
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to load users');
    }
  };

  const loadServices = async (forceRefresh = false) => {
    try {
      const data = await fetchSAServices(forceRefresh);
      setServices(data);
    } catch (error: any) {
      toast.error('Failed to load services');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.name || !newUserForm.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (newUserForm.role === 'ACCOUNT_MANAGER') {
        // For Account Managers, use the dedicated createAccountManager endpoint (phone-only auth)
        // This endpoint does NOT create Firebase Auth email users
        // Service assignment can be done separately
        await apiClient.createAccountManager({
          name: newUserForm.name,
          email: newUserForm.email,
          phone: newUserForm.phone || '',
          serviceId: newUserForm.serviceId || undefined,
        });
        toast.success('Account Manager created successfully');
      } else {
        // For other roles, use the generic user creation endpoint
        await apiClient.createUserByAdmin({
          name: newUserForm.name,
          email: newUserForm.email,
          phone: newUserForm.phone || undefined,
          role: newUserForm.role,
        });
        toast.success(`${newUserForm.role} user created successfully`);
      }

      setShowCreateUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        phone: '',
        role: 'ACCOUNT_MANAGER',
        serviceId: '',
      });
      loadUsers(true);
    } catch (error: any) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show report page if one is selected
  if (openReport) {
    return (
      <SuperAdminReportPage
        reportType={openReport}
        users={users}
        services={services}
        stats={stats || {}}
        onBack={() => setOpenReport(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const getUserStatus = (user: User) => {
    if (user.role === 'SUPERADMIN') {
      return 'Active';
    }
    // Use status field if available, otherwise fallback to verified
    if (user.status) {
      return user.status === 'ACTIVE' ? 'Active' : (user.status === 'PENDING' ? 'Pending' : 'Inactive');
    }
    return user.verified ? 'Active' : 'Pending';
  };

  const filteredUsers = users.filter((u) => {
    if (userTypeFilter !== 'ALL' && u.role !== userTypeFilter) return false;
    if (userStatusFilter !== 'ALL' && getUserStatus(u) !== userStatusFilter) return false;
    return true;
  });

  const handleStatClick = (stat: StatCard) => {
    if (stat.id === 'users') setOpenReport('users');
    else if (stat.id === 'services') setOpenReport('services');
    else if (stat.id === 'providers') setOpenReport('providers');
    else if (stat.id === 'customers') setOpenReport('customers');
    else if (stat.id === 'managers') setOpenReport('managers');
    else if (stat.id === 'earnings') setOpenReport('earnings');
  };

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'managers', icon: Settings, label: 'Managers' },
    { id: 'approvals', icon: CheckCircle2, label: 'Approvals' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <StatsGrid
            columns="grid-cols-2 lg:grid-cols-6"
            onStatClick={handleStatClick}
            stats={[
              { id: 'users', label: 'Users', value: stats.totalUsers, icon: Users, color: COLORS.semantic.info },
              { id: 'services', label: 'Services', value: stats.totalServices, icon: Briefcase, color: COLORS.semantic.success },
              { id: 'providers', label: 'Providers', value: stats.totalServiceProviders, icon: Users, color: COLORS.semantic.warning },
              { id: 'customers', label: 'Customers', value: stats.totalCustomers, icon: Users, color: COLORS.semantic.error },
              { id: 'managers', label: 'Managers', value: stats.totalAccountManagers, icon: Settings, color: COLORS.semantic.info },
              { id: 'earnings', label: 'Earnings', value: `₹${Number(stats.totalEarnings || 0).toFixed(2)}`, icon: IndianRupeeIcon, color: COLORS.semantic.success },
            ]}
          />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: COLORS.text.primary }}>
                Users
              </h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm text-white hover:opacity-90"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value as typeof userTypeFilter)}
                className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Types</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ACCOUNT_MANAGER">Account Manager</option>
                <option value="SERVICE_PROVIDER">Service Provider</option>
                <option value="COWORKER">Coworker</option>
                <option value="CUSTOMER">Customer</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as typeof userStatusFilter)}
                className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState message={users.length === 0 ? 'No users yet' : 'No users match the selected filters'} />
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-lg p-4 flex items-center justify-between gap-3 border transition"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: COLORS.text.primary }}>
                        {u.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                          style={{ backgroundColor: COLORS.semantic.info }}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                        <p
                          className="text-xs"
                          style={{
                            color:
                              u.role === 'SUPERADMIN' || getUserStatus(u) === 'Active'
                                ? COLORS.semantic.success
                                : COLORS.semantic.warning,
                          }}
                        >
                          {getUserStatus(u)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(u)}
                      className="flex-shrink-0 p-2 rounded-lg transition hover:opacity-80"
                      style={{ color: COLORS.semantic.info }}
                      title="Edit user"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: COLORS.text.primary }}>
                Services
              </h2>
              <button
                onClick={() => navigate('/dashboard/services')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm text-white hover:opacity-90"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {services.length === 0 ? (
              <EmptyState message="No services created yet" />
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s.serviceId}
                    className="rounded-lg p-4 flex items-center justify-between gap-3 border transition"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: COLORS.text.primary }}>
                        {s.name}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: s.status === 'ACTIVE' ? COLORS.semantic.success : COLORS.text.secondary,
                        }}
                      >
                        {s.status}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingService(s)}
                      className="flex-shrink-0 p-2 rounded-lg transition hover:opacity-80"
                      style={{ color: COLORS.semantic.info }}
                      title="Edit service"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Managers Tab */}
        {activeTab === 'managers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: COLORS.text.primary }}>
                Account Managers
              </h2>
              <button
                onClick={() => {
                  setNewUserForm({ ...newUserForm, role: 'ACCOUNT_MANAGER' });
                  setShowCreateUserModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm text-white hover:opacity-90"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                <Plus className="w-4 h-4" />
                Add Manager
              </button>
            </div>

            {users.filter((u) => u.role === 'ACCOUNT_MANAGER').length === 0 ? (
              <EmptyState message="No account managers yet" />
            ) : (
              <div className="space-y-2">
                {users
                  .filter((u) => u.role === 'ACCOUNT_MANAGER')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg p-4 flex items-center justify-between gap-3 border transition"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: COLORS.text.primary }}>
                          {u.name}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{
                            color: getUserStatus(u) === 'Active' ? COLORS.semantic.success : COLORS.semantic.warning,
                          }}
                        >
                          {getUserStatus(u)}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingUser(u)}
                        className="flex-shrink-0 p-2 rounded-lg transition hover:opacity-80"
                        style={{ color: COLORS.semantic.info }}
                        title="Edit manager"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Approvals Tab */}
        <ApprovalsTab isActive={activeTab === 'approvals'} />
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={() => {
          loadUsers(true);
          loadDashboardData(true);
        }}
      />

      {/* Edit Service Modal */}
      {editingService && (
        <CreateServiceModal
          isOpen={true}
          onClose={() => setEditingService(null)}
          onSave={() => {
            loadServices(true);
            loadDashboardData(true);
          }}
          service={editingService as any}
        />
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                {newUserForm.role === 'ACCOUNT_MANAGER' ? 'Create Account Manager' : 'Create User'}
              </h2>

              {/* Role Selection */}
              <div>
                <label className="block text-white font-semibold text-sm mb-3">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ACCOUNT_MANAGER', 'SERVICE_PROVIDER', 'CUSTOMER'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewUserForm({ ...newUserForm, role: role as any })}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        newUserForm.role === role
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="9876543210 (required for login)"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-semibold text-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && firebaseUser?.uid && (
        <SuperAdminProfileEditModal
          userId={firebaseUser.uid}
          name={saData?.name || ''}
          email={saData?.email || ''}
          photoUrl={saData?.photoUrl || ''}
          onClose={() => setShowProfileModal(false)}
          onComplete={() => loadSAProfile()}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
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

interface SystemStats {
  totalUsers: number;
  totalServices: number;
  totalAccountManagers: number;
  totalServiceProviders: number;
  totalCustomers: number;
}

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

interface Service {
  serviceId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

type ActiveTab = 'overview' | 'users' | 'services' | 'managers';

export function SuperAdminDashboard() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ACCOUNT_MANAGER' as 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'CUSTOMER',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'services') {
      loadServices();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSuperAdminStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiClient.getAllUsers();
      setUsers(response.data?.users || []);
    } catch (error: any) {
      toast.error('Failed to load users');
    }
  };

  const loadServices = async () => {
    try {
      const response = await apiClient.getServices();
      setServices(response.data?.services || []);
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
      await apiClient.createUserByAdmin({
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || undefined,
        role: newUserForm.role,
      });

      toast.success(`${newUserForm.role} user created successfully`);
      setShowCreateUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        phone: '',
        role: 'ACCOUNT_MANAGER',
      });
      loadUsers();
    } catch (error: any) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    return user.verified ? 'Active' : 'Pending';
  };

  const tabs: { id: ActiveTab; icon: any; label: string }[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'managers', icon: Settings, label: 'Managers' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 sticky top-0 z-40 bg-slate-900/95 backdrop-blur">
        <div className="flex gap-1 md:gap-2 px-4 py-3 overflow-x-auto">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
              { label: 'Services', value: stats.totalServices, icon: Briefcase, color: 'text-green-400' },
              { label: 'Providers', value: stats.totalServiceProviders, icon: Users, color: 'text-purple-400' },
              { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-orange-400' },
              { label: 'Managers', value: stats.totalAccountManagers, icon: Settings, color: 'text-indigo-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
                <p className="text-gray-400 text-xs md:text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-white">Users</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {users.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                <p className="text-gray-400">No users yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3 hover:border-white/20 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{u.name}</p>
                      <p className={`text-xs mt-1 ${
                        u.role === 'SUPERADMIN'
                          ? 'text-green-400'
                          : getUserStatus(u) === 'Active'
                          ? 'text-green-400'
                          : 'text-yellow-400'
                      }`}>
                        {getUserStatus(u)}
                      </p>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition"
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
              <h2 className="text-lg md:text-xl font-bold text-white">Services</h2>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {services.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                <p className="text-gray-400">No services created yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s.serviceId}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3 hover:border-white/20 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{s.name}</p>
                      <p className={`text-xs mt-1 ${
                        s.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {s.status}
                      </p>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition"
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
              <h2 className="text-lg md:text-xl font-bold text-white">Account Managers</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Manager
              </button>
            </div>

            {users.filter((u) => u.role === 'ACCOUNT_MANAGER').length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                <p className="text-gray-400">No account managers yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users
                  .filter((u) => u.role === 'ACCOUNT_MANAGER')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3 hover:border-white/20 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{u.name}</p>
                        <p className={`text-xs mt-1 ${
                          getUserStatus(u) === 'Active' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {getUserStatus(u)}
                        </p>
                      </div>
                      <button
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition"
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
      </div>

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
                  placeholder="Phone (optional)"
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
    </div>
  );
}

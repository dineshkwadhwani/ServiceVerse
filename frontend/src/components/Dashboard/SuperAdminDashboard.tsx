import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import {
  Users,
  Briefcase,
  Settings,
  Plus,
  Loader2,
  Grid,
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

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'services' | 'account-managers'>(
    'overview'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const roleColors = {
    SUPERADMIN: 'bg-purple-500/20 text-purple-300',
    ACCOUNT_MANAGER: 'bg-blue-500/20 text-blue-300',
    SERVICE_PROVIDER: 'bg-green-500/20 text-green-300',
    CUSTOMER: 'bg-orange-500/20 text-orange-300',
    COWORKER: 'bg-indigo-500/20 text-indigo-300',
  };

  const getUserStatus = (user: User) => {
    if (user.role === 'SUPERADMIN') {
      return { status: 'ACTIVE', display: 'Active', color: 'text-green-300' };
    }
    return user.verified
      ? { status: 'ACTIVE', display: 'Active', color: 'text-green-300' }
      : { status: 'PENDING', display: 'Pending', color: 'text-yellow-300' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 sticky top-0 z-40 bg-slate-900/95">
        <div className="px-4 md:px-6 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">SuperAdmin Dashboard</h1>
        </div>
      </div>

      {/* Tabs - Mobile Responsive */}
      <div className="border-b border-white/10 overflow-x-auto">
        <div className="flex gap-2 md:gap-4 px-4 md:px-6 py-3">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'services', label: 'Services', icon: Briefcase },
            { id: 'account-managers', label: 'Managers', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm md:text-base font-semibold transition ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              {
                title: 'Total Users',
                value: stats.totalUsers,
                icon: Users,
                color: 'text-blue-400',
              },
              {
                title: 'Services',
                value: stats.totalServices,
                icon: Briefcase,
                color: 'text-green-400',
              },
              {
                title: 'Providers',
                value: stats.totalServiceProviders,
                icon: Grid,
                color: 'text-purple-400',
              },
              {
                title: 'Customers',
                value: stats.totalCustomers,
                icon: Users,
                color: 'text-orange-400',
              },
              {
                title: 'Managers',
                value: stats.totalAccountManagers,
                icon: Settings,
                color: 'text-indigo-400',
              },
            ].map(({ title, value, icon: Icon, color }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-semibold">{title}</p>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-white">Manage Users</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            </div>

            {users.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden md:block bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/10 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-white font-semibold text-sm">Name</th>
                        <th className="px-4 py-3 text-left text-white font-semibold text-sm">Email</th>
                        <th className="px-4 py-3 text-left text-white font-semibold text-sm">Role</th>
                        <th className="px-4 py-3 text-left text-white font-semibold text-sm">Status</th>
                        <th className="px-4 py-3 text-center text-white font-semibold text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((u) => {
                        const userStatus = getUserStatus(u);
                        return (
                          <tr key={u.id} className="hover:bg-white/5 transition">
                            <td className="px-4 py-3">
                              <p className="text-white font-semibold text-sm">{u.name}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{u.email}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  roleColors[u.role] || 'bg-gray-500/20 text-gray-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold ${userStatus.color}`}>
                              {userStatus.display}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                // onClick={() => navigate(`/dashboard/users/${u.id}`)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition"
                                title="Edit user"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {users.map((u) => {
                    const userStatus = getUserStatus(u);
                    return (
                      <div
                        key={u.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{u.name}</p>
                          <p className="text-gray-400 text-xs mt-1">{u.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                roleColors[u.role] || 'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {u.role}
                            </span>
                            <span className={`text-xs font-semibold ${userStatus.color}`}>
                              {userStatus.display}
                            </span>
                          </div>
                        </div>
                        <button
                          // onClick={() => navigate(`/dashboard/users/${u.id}`)}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition"
                          title="Edit user"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">Manage Services</h2>
              <button
                onClick={() => navigate('/dashboard/services')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                Go to Services
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300">Navigate to Services to manage all services</p>
            </div>
          </div>
        )}

        {/* Account Managers Tab */}
        {activeTab === 'account-managers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">Account Managers</h2>
              <button
                onClick={() => navigate('/dashboard/account-managers')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
              >
                Go to Managers
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300">Navigate to Account Managers to manage all managers</p>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Create New User</h2>

              {/* Role Selection */}
              <div>
                <label className="block text-white font-semibold text-sm mb-3">User Role</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['ACCOUNT_MANAGER', 'SERVICE_PROVIDER', 'CUSTOMER'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setNewUserForm({ ...newUserForm, role: role as any });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
                        newUserForm.role === role
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : 'bg-white/10 text-gray-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold text-sm mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="+1-555-0000"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

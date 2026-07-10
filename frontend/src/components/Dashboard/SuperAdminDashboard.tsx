import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import {
  Users,
  Briefcase,
  Settings,
  LogOut,
  Plus,
  Loader2,
  Grid,
  AlertCircle,
  CheckCircle2,
  BarChart3,
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
  verified: boolean;
  createdAt: Date;
}

export function SuperAdminDashboard() {
  const { user, signOut } = useAuthStore();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">SuperAdmin Dashboard</h1>
            <p className="text-gray-400">{user?.name} (System Administrator)</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('overview');
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              loadUsers();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'services'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('account-managers')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'account-managers'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Account Managers
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Users Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-semibold">Total Users</h3>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-gray-500 text-sm mt-2">Active users in system</p>
            </div>

            {/* Total Services Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-semibold">Services</h3>
                <Briefcase className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalServices}</p>
              <p className="text-gray-500 text-sm mt-2">Active services</p>
            </div>

            {/* Service Providers Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-semibold">Service Providers</h3>
                <Grid className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalServiceProviders}</p>
              <p className="text-gray-500 text-sm mt-2">Registered providers</p>
            </div>

            {/* Customers Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-semibold">Customers</h3>
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
              <p className="text-gray-500 text-sm mt-2">Registered customers</p>
            </div>

            {/* Account Managers Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-semibold">Account Managers</h3>
                <Settings className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalAccountManagers}</p>
              <p className="text-gray-500 text-sm mt-2">Active managers</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Users</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            </div>

            {users.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-white font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Email</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Role</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <p className="text-white font-semibold text-sm">{u.name}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors[u.role] || 'bg-gray-500/20 text-gray-300'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {u.verified ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  <span className="text-green-300 text-sm">Verified</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                                  <span className="text-yellow-300 text-sm">Pending</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Manage services via the Services Management page</p>
            <p className="text-gray-500 text-sm mt-2">Navigate to SuperAdmin → Services</p>
          </div>
        )}

        {/* Account Managers Tab */}
        {activeTab === 'account-managers' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Manage account managers via the Account Managers page</p>
            <p className="text-gray-500 text-sm mt-2">Navigate to SuperAdmin → Account Managers</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">User Role</label>
              <div className="grid grid-cols-3 gap-3">
                {['ACCOUNT_MANAGER', 'SERVICE_PROVIDER', 'CUSTOMER'].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setNewUserForm({ ...newUserForm, role: role as any });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
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
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="+1-555-0000"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateUserModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

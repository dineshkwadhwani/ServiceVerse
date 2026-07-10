import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Plus, Mail, Phone, Loader2, LogOut, Users, ShoppingCart } from 'lucide-react';

export function SPDashboard() {
  const { user, signOut } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'create-customer'>('orders');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    contactMethod: 'email' as 'email' | 'phone',
    email: '',
    phone: '',
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await apiClient.getOrders({ serviceProviderId: user?.uid });
      setOrders(response.data?.orders || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await apiClient.getSPCustomers();
      setCustomers(response.data?.customers || []);
    } catch (error: any) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.contactMethod === 'email') {
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return false;
      }
    } else {
      if (!formData.phone.trim() || formData.phone.length < 10) {
        toast.error('Valid phone number is required');
        return false;
      }
    }
    return true;
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload =
        formData.contactMethod === 'email'
          ? { email: formData.email }
          : { phone: formData.phone };

      await apiClient.createCustomerBySP(payload);
      toast.success('Invitation sent to customer');
      setShowCreateModal(false);
      setFormData({ contactMethod: 'email', email: '', phone: '' });
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to create customer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Service Provider Dashboard</h1>
            <p className="text-gray-400">{user?.name} - {user?.businessName || 'Service Provider'}</p>
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
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'orders'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'customers'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            My Customers
          </button>
          <button
            onClick={() => {
              setActiveTab('create-customer');
              setShowCreateModal(true);
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'create-customer'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Customer
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-white font-semibold">Order ID</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Customer</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Status</th>
                        <th className="px-6 py-3 text-right text-white font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 text-white text-sm">{order.orderId}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{order.customerName}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-white text-sm font-semibold">
                            ₹{order.totalAmount}
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

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div>
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : customers.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-gray-400 mb-4">No customers yet</p>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Customer
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                  <div key={customer.customerId} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
                    <h3 className="text-white font-bold mb-2">{customer.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{customer.email}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500">Added {new Date(customer.addedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create Customer</h2>

            {/* Contact Method Selection */}
            <div className="mb-6">
              <p className="text-white font-semibold mb-3">How would you like to add them?</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="email"
                    checked={formData.contactMethod === 'email'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactMethod: e.target.value as 'email' | 'phone',
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Send Invitation via Email</span>
                </label>
                <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="phone"
                    checked={formData.contactMethod === 'phone'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactMethod: e.target.value as 'email' | 'phone',
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Send Invitation via SMS</span>
                </label>
              </div>
            </div>

            {/* Email or Phone Input */}
            <div className="mb-6">
              {formData.contactMethod === 'email' ? (
                <div>
                  <label className="block text-white font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-white font-semibold mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit number"
                      maxLength="10"
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm text-blue-300">
              <p>
                An invitation link will be sent to the customer. They'll verify their{' '}
                {formData.contactMethod === 'email' ? 'email' : 'phone'} on first login and be connected to you.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ contactMethod: 'email', email: '', phone: '' });
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Send Invitation
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

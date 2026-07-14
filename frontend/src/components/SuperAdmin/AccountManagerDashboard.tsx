import { useEffect, useState } from 'react';
import { Plus, Edit2, Eye } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { CreateAccountManagerModal } from './CreateAccountManagerModal';
import type { AccountManager, Service } from '@/types';

export function AccountManagerDashboard() {
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAM, setSelectedAM] = useState<AccountManager | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch account managers and services
      const [amResponse, servicesResponse] = await Promise.all([
        apiClient.getAccountManagers(),
        apiClient.getServices(),
      ]);
      setAccountManagers(amResponse.data?.accountManagers || []);
      setServices(servicesResponse.data?.services || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAM = () => {
    setSelectedAM(null);
    setIsModalOpen(true);
  };

  const handleEditAM = (am: AccountManager) => {
    setSelectedAM(am);
    setIsModalOpen(true);
  };

  const handleAMSaved = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(
      selectedAM
        ? 'Account Manager updated successfully'
        : 'Account Manager created successfully'
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Managers</h1>
          <p className="text-gray-500 mt-1">Manage platform account managers and their portfolios</p>
        </div>
        <button
          onClick={handleCreateAM}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Account Manager
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total AMs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{accountManagers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Active AMs</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {accountManagers.filter((am) => am.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Services</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{services.length}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow animate-pulse h-64"></div>
      ) : accountManagers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No account managers yet</p>
          <button
            onClick={handleCreateAM}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mt-4"
          >
            <Plus className="w-4 h-4" />
            Create First Account Manager
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accountManagers.map((am) => (
                  <tr key={am.uid} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{am.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{am.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{am.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      All Services
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          am.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {am.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(am.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2 flex">
                      <button
                        onClick={() => handleEditAM(am)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 text-gray-600 rounded transition">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateAccountManagerModal
        isOpen={isModalOpen}
        accountManager={selectedAM}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAMSaved}
      />
    </div>
  );
}

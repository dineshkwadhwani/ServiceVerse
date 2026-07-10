import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Search, Plus, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import type { Service } from '@/types';

export function CustomerDashboard() {
  const { user, signOut } = useAuthStore();
  const toast = useToast();

  const [activeService, setActiveService] = useState<Service | null>(null);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [showUnorphanModal, setShowUnorphanModal] = useState(false);
  const [unorphanReasons, setUnorphanReasons] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmittingUnorphan, setIsSubmittingUnorphan] = useState(false);

  // Load customer's services
  useEffect(() => {
    loadMyServices();
  }, []);

  const loadMyServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await apiClient.getCustomerServices();
      setMyServices(response.data?.services || []);
      if (response.data?.services?.length > 0) {
        setActiveService(response.data.services[0]);
        loadUnorphanReasons(response.data.services[0].serviceId);
      }
    } catch (error: any) {
      toast.error('Failed to load services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadUnorphanReasons = async (serviceId: string) => {
    try {
      const response = await apiClient.getServiceDetails(serviceId);
      setUnorphanReasons(response.data?.unorphanReasons || []);
    } catch (error) {
      // Silently fail, reasons not critical
    }
  };

  const handleSearchSPs = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim() || !activeService) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.searchServiceProviders(activeService.serviceId, query);
      setSearchResults(response.data?.providers || []);
    } catch (error: any) {
      toast.error('Failed to search service providers');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSP = async (spId: string) => {
    try {
      await apiClient.addServiceProviderToCustomer(activeService!.serviceId, spId);
      toast.success('Service provider added successfully');
      setSearchQuery('');
      setSearchResults([]);
      loadMyServices(); // Reload to refresh list
    } catch (error: any) {
      toast.error('Failed to add service provider');
    }
  };

  const handleUnorphanRequest = async () => {
    if (!selectedReason || !activeService) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmittingUnorphan(true);
    try {
      await apiClient.requestUnorphan(activeService.serviceId, selectedReason);
      toast.success('Unorphan request submitted. Account Manager will review.');
      setShowUnorphanModal(false);
      setSelectedReason('');
    } catch (error: any) {
      toast.error('Failed to submit unorphan request');
    } finally {
      setIsSubmittingUnorphan(false);
    }
  };

  if (isLoadingServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (myServices.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-bold text-white">My Services</h1>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg">No services yet</p>
            <p className="text-gray-500 mt-2">Visit the ServiceVerse homepage to start using services</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.name}</h1>
            <p className="text-gray-400">Manage your services and find service providers</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Service Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {myServices.map((service) => (
            <button
              key={service.serviceId}
              onClick={() => {
                setActiveService(service);
                loadUnorphanReasons(service.serviceId);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                activeService?.serviceId === service.serviceId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {activeService && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search & Add SP */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Find Service Providers</h2>

                {/* Search Box */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchSPs(e.target.value)}
                      placeholder="Search service providers..."
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Search by business name or service provider</p>
                </div>

                {/* Search Results */}
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((sp) => (
                      <div
                        key={sp.spId}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition"
                      >
                        <div>
                          <p className="text-white font-semibold">{sp.businessName}</p>
                          <p className="text-sm text-gray-400">{activeService.name}</p>
                        </div>
                        <button
                          onClick={() => handleAddSP(sp.spId)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8 text-gray-400">
                    No service providers found
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Search to find service providers
                  </div>
                )}
              </div>
            </div>

            {/* My Service Providers & Unorphan */}
            <div className="space-y-6">
              {/* Current SPs */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">My Service Providers</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Placeholder - will be populated from API */}
                  <p className="text-gray-400 text-sm">Your service providers will appear here</p>
                </div>
              </div>

              {/* Unorphan Option (for non-orphaned customers) */}
              {!user?.isOrphaned && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-white font-bold mb-1">Limited Access</h3>
                      <p className="text-sm text-blue-300">
                        You're currently linked to one service provider. Request to unorphan to access multiple providers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUnorphanModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                  >
                    Request Unorphan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unorphan Modal */}
      {showUnorphanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Request Unorphan</h2>
            <p className="text-gray-400 mb-6">
              Select a reason for requesting to unorphan your account. An Account Manager will review and approve your request.
            </p>

            {/* Reason Selection */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {unorphanReasons.length > 0 ? (
                unorphanReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition">
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-white text-sm">{reason}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No reasons available for this service</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnorphanModal(false)}
                disabled={isSubmittingUnorphan}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnorphanRequest}
                disabled={isSubmittingUnorphan || !selectedReason}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isSubmittingUnorphan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

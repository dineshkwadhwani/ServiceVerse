import { useState, useEffect } from 'react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Loader2, Edit2, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { Modal } from '@/components/Shared/Modal';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { COLORS } from '@/utils/theme';

interface SP {
  uid: string;
  businessName: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  onboardedAt?: Date;
  createdAt: Date;
}

interface PendingOnboarding {
  requestId: string;
  spName: string;
  city: string;
  status: string;
  createdAt: Date;
}

interface SPProfile {
  uid: string;
  businessName: string;
  logo?: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  chargeGST: boolean;
  ownerName: string;
}

type ActiveTab = 'overview' | 'sps' | 'approvals';

export function AMDashboard() {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [sps, setSPs] = useState<SP[]>([]);
  const [pendingOnboarding, setPendingOnboarding] = useState<PendingOnboarding[]>([]);
  const [editingSP, setEditingSP] = useState<SPProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, spsResponse, onboardingResponse] = await Promise.all([
        apiClient.getAMStats(),
        apiClient.getServiceProviders(),
        apiClient.getAMPendingOnboarding(),
      ]);

      setStats(statsResponse.data || {});
      setSPs(spsResponse.data?.serviceProviders || []);
      setPendingOnboarding(onboardingResponse.data?.requests || []);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSP = (sp: SP) => {
    const spProfile: SPProfile = {
      uid: sp.uid,
      businessName: sp.businessName,
      logo: undefined,
      address: 'N/A',
      area: 'N/A',
      city: 'N/A',
      pincode: 'N/A',
      gstNumber: 'N/A',
      chargeGST: false,
      ownerName: 'N/A',
    };
    setEditingSP(spProfile);
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
      </div>
    );
  }

  const tabs: DashboardTab<ActiveTab>[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'sps', icon: Users, label: 'Manage SPs' },
    { id: 'approvals', icon: CheckCircle2, label: 'Approvals' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <DashboardTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {activeTab === 'overview' && stats && (
          <div className="mb-8">
            <StatsGrid
              columns="grid-cols-2 lg:grid-cols-3"
              stats={[
                { label: 'Assigned SPs', value: stats.totalSPs, icon: Users, color: COLORS.semantic.info },
                { label: 'Active SPs', value: stats.activeSPs, icon: CheckCircle2, color: COLORS.semantic.success },
                { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: COLORS.semantic.warning },
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
                  Your Service Providers
                </h3>
                {sps.length === 0 ? (
                  <EmptyState message="No service providers assigned" />
                ) : (
                  <div className="space-y-3">
                    {sps.map((sp) => (
                      <div
                        key={sp.uid}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.bg.primary,
                          borderColor: COLORS.border.light,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                              {sp.businessName}
                            </p>
                            <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                              Status:{' '}
                              <span
                                style={{
                                  color:
                                    sp.status === 'ACTIVE'
                                      ? COLORS.semantic.success
                                      : sp.status === 'ONBOARDING'
                                      ? COLORS.semantic.warning
                                      : COLORS.semantic.error,
                                }}
                              >
                                {sp.status}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleEditSP(sp)}
                            className="p-2 rounded-lg transition"
                            style={{ color: COLORS.semantic.info }}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        )}

        {/* Manage SPs Tab */}
        {activeTab === 'sps' && (
            <div className="p-4 md:p-6">
              {sps.length === 0 ? (
                <EmptyState message="No service providers to manage" />
              ) : (
                <div className="space-y-4">
                  {sps.map((sp) => (
                    <div
                      key={sp.uid}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                            {sp.businessName}
                          </h3>
                          <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                            Created: {new Date(sp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor:
                              sp.status === 'ACTIVE'
                                ? COLORS.semantic.success
                                : sp.status === 'ONBOARDING'
                                ? COLORS.semantic.warning
                                : COLORS.semantic.error,
                          }}
                        >
                          {sp.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pb-4 border-b" style={{ borderColor: COLORS.border.light }}>
                        <div>
                          <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                            Onboarding Status
                          </p>
                          <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                            {sp.status === 'ACTIVE' ? 'Complete' : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditSP(sp)}
                        className="w-full px-4 py-2 rounded-lg font-medium text-white transition"
                        style={{ backgroundColor: COLORS.semantic.info }}
                      >
                        Edit Onboarding Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
            <div className="p-4 md:p-6">
              {pendingOnboarding.length === 0 ? (
                <EmptyState message="No pending onboarding requests" />
              ) : (
                <div className="space-y-4">
                  {pendingOnboarding.map((request) => (
                    <div
                      key={request.requestId}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                              {request.spName}
                            </p>
                            <span
                              className="text-xs px-2 py-1 rounded-full font-semibold text-white"
                              style={{
                                backgroundColor: COLORS.semantic.warning,
                              }}
                            >
                              PENDING
                            </span>
                          </div>
                          <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                            {request.city}
                          </p>
                          <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        className="w-full px-4 py-2 rounded-lg font-medium text-white transition"
                        style={{ backgroundColor: COLORS.semantic.info }}
                      >
                        Start Onboarding
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
        )}
      </main>

      {/* Edit SP Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit SP Onboarding Profile"
        size="lg"
      >
        {editingSP && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                Business Name
              </label>
              <input
                type="text"
                defaultValue={editingSP.businessName}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                Owner Name
              </label>
              <input
                type="text"
                defaultValue={editingSP.ownerName}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                Address
              </label>
              <input
                type="text"
                defaultValue={editingSP.address}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                  Area
                </label>
                <input
                  type="text"
                  defaultValue={editingSP.area}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    borderColor: COLORS.border.light,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                  City
                </label>
                <input
                  type="text"
                  defaultValue={editingSP.city}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    borderColor: COLORS.border.light,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                Pincode
              </label>
              <input
                type="text"
                defaultValue={editingSP.pincode}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                GST Number
              </label>
              <input
                type="text"
                defaultValue={editingSP.gstNumber}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={editingSP.chargeGST}
                id="chargeGST"
                className="w-4 h-4"
              />
              <label htmlFor="chargeGST" style={{ color: COLORS.text.primary }}>
                Charge GST
              </label>
            </div>
            <button
              className="w-full px-4 py-2 rounded-lg font-semibold text-white transition"
              style={{ backgroundColor: COLORS.semantic.success }}
              onClick={() => {
                setShowEditModal(false);
                toast.success('SP profile updated and onboarding marked complete');
              }}
            >
              Complete Onboarding
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

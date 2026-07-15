import { useState, useEffect } from 'react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Loader2, Edit2, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { DashboardTabs, DashboardTab } from '@/components/Shared/DashboardTabs';
import { StatsGrid } from '@/components/Shared/StatsGrid';
import { EmptyState } from '@/components/Shared/EmptyState';
import { SPOnboardingStepper } from '@/components/Onboarding/SPOnboardingStepper';
import { COLORS } from '@/utils/theme';

interface SP {
  uid: string;
  businessName: string;
  email: string;
  phone: string;
  status: 'ASSIGNED' | 'ONBOARDED' | 'ACTIVE';
  onboardedAt?: Date;
  createdAt: Date;
  service?: {
    serviceId: string;
    serviceName: string;
  };
}

interface AMDashboardData {
  stats: any;
  sps: SP[];
}

const AM_CACHE_TTL_MS = 30_000;
let amDashboardCache: { timestamp: number; data: AMDashboardData | null } = {
  timestamp: 0,
  data: null,
};
let amDashboardInFlight: Promise<AMDashboardData> | null = null;

async function fetchAMDashboardData(forceRefresh = false): Promise<AMDashboardData> {
  const now = Date.now();

  if (!forceRefresh && amDashboardCache.data && now - amDashboardCache.timestamp < AM_CACHE_TTL_MS) {
    return amDashboardCache.data;
  }

  if (!forceRefresh && amDashboardInFlight) {
    return amDashboardInFlight;
  }

  amDashboardInFlight = (async () => {
    const [statsResponse, spsResponse] = await Promise.all([
      apiClient.getAMStats(),
      apiClient.getServiceProviders(),
    ]);

    const data: AMDashboardData = {
      stats: statsResponse.data || {},
      sps: spsResponse.data?.serviceProviders || [],
    };

    amDashboardCache = {
      timestamp: Date.now(),
      data,
    };

    return data;
  })();

  try {
    return await amDashboardInFlight;
  } finally {
    amDashboardInFlight = null;
  }
}

type ActiveTab = 'overview' | 'sps' | 'approvals';

export function AMDashboard() {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [sps, setSPs] = useState<SP[]>([]);
  const [onboardingSP, setOnboardingSP] = useState<SP | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      const data = await fetchAMDashboardData(forceRefresh);
      setStats(data.stats || {});
      setSPs(data.sps || []);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSP = (sp: SP) => {
    // Open the onboarding stepper to allow editing and activation
    setOnboardingSP(sp);
  };

  const handleActivateSP = async (spId: string, activate: boolean) => {
    try {
      await apiClient.updateSPActivationStatus(spId, activate);
      toast.success(activate ? 'SP activated successfully!' : 'SP inactivated successfully!');
      loadData(true); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to update SP status');
    }
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
                                      : sp.status === 'ONBOARDED'
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
                                : sp.status === 'ONBOARDED'
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

                      {sp.status === 'ASSIGNED' ? (
                        <button
                          onClick={() => setOnboardingSP(sp)}
                          className="w-full px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                          style={{ backgroundColor: COLORS.semantic.info }}
                        >
                          Start Onboarding
                        </button>
                      ) : sp.status === 'ONBOARDED' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => setOnboardingSP(sp)}
                            className="w-full px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                            style={{ backgroundColor: COLORS.semantic.info }}
                          >
                            Edit & Activate
                          </button>
                          <button
                            onClick={() => handleActivateSP(sp.uid, true)}
                            className="w-full px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                            style={{ backgroundColor: COLORS.semantic.success }}
                          >
                            Activate Now
                          </button>
                        </div>
                      ) : sp.status === 'ACTIVE' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleEditSP(sp)}
                            className="w-full px-4 py-2 rounded-lg font-medium text-white transition"
                            style={{ backgroundColor: COLORS.semantic.info }}
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => handleActivateSP(sp.uid, false)}
                            className="w-full px-4 py-2 rounded-lg font-medium text-white transition"
                            style={{ backgroundColor: COLORS.semantic.warning }}
                          >
                            Inactivate
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-2 rounded-lg font-medium text-white transition opacity-50 cursor-not-allowed"
                          style={{ backgroundColor: COLORS.semantic.error }}
                        >
                          {sp.status}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
            <div className="p-4 md:p-6">
              <EmptyState message="No pending approvals" />
            </div>
        )}
      </main>

      {/* Onboarding Stepper */}
      {onboardingSP && (() => {
        const serviceId = onboardingSP.service?.serviceId || '';
        const customMenusObj = (onboardingSP as any).customMenus;
        const currentServiceMenus = customMenusObj?.[serviceId] || [];

        return (
          <SPOnboardingStepper
            spId={onboardingSP.uid}
            spPhone={onboardingSP.phone}
            spEmail={onboardingSP.email}
            spBusinessName={onboardingSP.businessName}
            spOwnerName={(onboardingSP as any).ownerName}
            spAddress={(onboardingSP as any).address}
            spArea={(onboardingSP as any).area}
            spCity={(onboardingSP as any).city}
            spPin={(onboardingSP as any).pin}
            serviceId={serviceId}
            existingOperations={(onboardingSP as any).operations}
            existingDocumentation={(onboardingSP as any).documentation}
            existingCommission={(onboardingSP as any).commission}
            existingMenus={currentServiceMenus}
            onComplete={() => {
              setOnboardingSP(null);
              loadData(true);
            }}
            onCancel={() => setOnboardingSP(null)}
          />
        );
      })()}
    </div>
  );
}

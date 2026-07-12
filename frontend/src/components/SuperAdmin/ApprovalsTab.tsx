import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, User, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/store/notificationStore';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { EmptyState } from '@/components/Shared/EmptyState';

interface SPApprovalRequest {
  requestId: string;
  userId: string;
  serviceId: string;
  userName: string;
  businessName: string;
  userEmail: string;
  status: 'PENDING_AM_ASSIGNMENT' | 'ASSIGNED' | 'COMPLETED' | 'REJECTED';
  assignedAccountManagerId: string | null;
  createdAt: Date;
}

interface ApprovalRequest {
  requestId: string;
  type: 'MENU_ITEM' | 'UNORPHAN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  spId?: string;
  spName?: string;
  customerId?: string;
  customerName?: string;
  details: string;
  createdAt: Date;
}

interface ApprovalsTabProps {
  isActive: boolean;
}

export function ApprovalsTab({ isActive }: ApprovalsTabProps) {
  const toast = useToast();
  const [spApprovals, setSPApprovals] = useState<SPApprovalRequest[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accountManagers, setAccountManagers] = useState<any[]>([]);

  const [selectedSP, setSelectedSP] = useState<SPApprovalRequest | null>(null);
  const [showAssignAM, setShowAssignAM] = useState(false);
  const [assignedAM, setAssignedAM] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch pending SP onboarding requests
  useEffect(() => {
    if (!isActive) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getPendingOnboardingRequests() as any;

        // The response structure is: { success: true, data: { requests: [...], total: X } }
        let requestsData = response?.data?.requests;

        if (!requestsData && Array.isArray(response?.requests)) {
          // Fallback for unwrapped response
          requestsData = response.requests;
        }

        if (!Array.isArray(requestsData)) {
          setIsLoading(false);
          return;
        }

        const spData = requestsData.map((req: any) => ({
          requestId: req.requestId,
          userId: req.userId,
          serviceId: req.serviceId,
          userName: req.userName,
          businessName: req.businessName,
          userEmail: req.userEmail,
          status: req.status,
          assignedAccountManagerId: req.assignedAccountManagerId,
          createdAt: new Date(req.createdAt),
        }));

        setSPApprovals(spData);

        // Also fetch account managers for assignment dropdown
        const amsResponse = await apiClient.getAccountManagers() as any;

        // The response structure is: { success: true, data: { accountManagers: [...], total: X } }
        let amsData = amsResponse?.data?.accountManagers;

        if (!Array.isArray(amsData)) {
          amsData = [];
        }
        setAccountManagers(amsData);
      } catch (error: any) {
        toast.error('Failed to load pending approvals: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isActive]);

  const handleApproveSP = async (requestId: string) => {
    if (!assignedAM) {
      toast.error('Please select an Account Manager');
      return;
    }

    setIsAssigning(true);
    try {
      await apiClient.assignAccountManagerToSP(requestId, assignedAM);

      // Update local state
      setSPApprovals(
        spApprovals.map((sp) =>
          sp.requestId === requestId
            ? { ...sp, status: 'ASSIGNED' as const, assignedAccountManagerId: assignedAM }
            : sp
        )
      );
      setShowAssignAM(false);
      setAssignedAM('');
      setSelectedSP(null);
      toast.success('Account Manager assigned successfully');
    } catch (error: any) {
      toast.error('Failed to assign Account Manager');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRejectSP = (requestId: string) => {
    // TODO: Implement rejection API call
    setSPApprovals(
      spApprovals.filter((sp) => sp.requestId !== requestId)
    );
    toast.success('SP registration rejected');
  };

  const handleApproveRequest = (requestId: string) => {
    setRequests(
      requests.map((r) =>
        r.requestId === requestId ? { ...r, status: 'APPROVED' as const } : r
      )
    );
    toast.success('Request approved');
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(
      requests.map((r) =>
        r.requestId === requestId ? { ...r, status: 'REJECTED' as const } : r
      )
    );
    toast.success('Request rejected');
  };

  if (!isActive) return null;

  const pendingSPApprovals = spApprovals.filter((sp) => sp.status === 'PENDING_AM_ASSIGNMENT');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  if (!isActive) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* SP Registration Approvals */}
      <div>
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: COLORS.text.primary }}
        >
          Service Provider Registrations ({pendingSPApprovals.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.semantic.info }} />
            <span className="ml-2" style={{ color: COLORS.text.secondary }}>
              Loading approvals...
            </span>
          </div>
        ) : pendingSPApprovals.length > 0 ? (
          <div className="space-y-3">
            {pendingSPApprovals.map((sp) => (
              <div
                key={sp.requestId}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: COLORS.semantic.info }}
                      >
                        {sp.businessName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                          {sp.businessName}
                        </p>
                        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                          {sp.userName}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold text-white flex-shrink-0 ml-2"
                      style={{ backgroundColor: COLORS.semantic.warning }}
                    >
                      PENDING
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSP(sp);
                      setShowAssignAM(true);
                      setAssignedAM('');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: COLORS.semantic.info }}
                    disabled={isAssigning}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Assign
                  </button>
                  <button
                    onClick={() => handleRejectSP(sp.requestId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                    style={{ backgroundColor: COLORS.semantic.error }}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No pending SP registrations" />
        )}
      </div>

      {/* Other Approval Requests */}
      <div>
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: COLORS.text.primary }}
        >
          Other Requests ({pendingRequests.length})
        </h3>

        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.requestId}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-1"
                      style={{
                        backgroundColor:
                          request.type === 'MENU_ITEM'
                            ? COLORS.semantic.info
                            : COLORS.semantic.warning,
                      }}
                    >
                      {request.type === 'MENU_ITEM' ? (
                        <Package className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                        {request.type === 'MENU_ITEM' ? 'Menu Item Request' : 'Unorphan Request'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                        From: {request.spName || request.customerName}
                      </p>
                      <p className="text-sm mt-1" style={{ color: COLORS.text.primary }}>
                        {request.details}
                      </p>
                      <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-semibold text-white"
                    style={{ backgroundColor: COLORS.semantic.warning }}
                  >
                    PENDING
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(request.requestId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: COLORS.semantic.success }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.requestId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: COLORS.semantic.error }}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No pending requests" />
        )}
      </div>

      {/* Assign AM Modal */}
      {showAssignAM && selectedSP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-xl max-w-md w-full p-6 space-y-5"
            style={{
              backgroundColor: COLORS.bg.surface,
            }}
          >
            {/* Header */}
            <div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: COLORS.text.primary }}
              >
                Assign Account Manager
              </h3>
              <p
                className="text-sm"
                style={{ color: COLORS.text.secondary }}
              >
                Select who will onboard this Service Provider
              </p>
            </div>

            {/* SP Info Card */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderLeft: `4px solid ${COLORS.semantic.info}`,
              }}
            >
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: COLORS.text.secondary }}
              >
                Service Provider
              </p>
              <p
                className="font-bold text-sm"
                style={{ color: COLORS.text.primary }}
              >
                {selectedSP.businessName}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: COLORS.text.secondary }}
              >
                {selectedSP.userName} • {selectedSP.userEmail}
              </p>
            </div>

            {/* Account Manager Selection */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: COLORS.text.primary }}
              >
                Select Account Manager
              </label>
              {accountManagers.length > 0 ? (
                <select
                  value={assignedAM}
                  onChange={(e) => setAssignedAM(e.target.value)}
                  disabled={isAssigning}
                  className="w-full px-4 py-3 rounded-lg border font-medium text-sm focus:outline-none focus:border-blue-500 transition"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    borderColor: COLORS.border.light,
                    color: COLORS.text.primary,
                  }}
                >
                  <option value="">-- Choose an Account Manager --</option>
                  {accountManagers.map((am: any) => (
                    <option key={am.uid} value={am.uid}>
                      {am.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="p-4 rounded-lg text-center text-sm"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.semantic.error,
                  }}
                >
                  No Account Managers available. Please create one first.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAssignAM(false)}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition border"
                style={{
                  backgroundColor: COLORS.bg.primary,
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedSP && handleApproveSP(selectedSP.requestId)}
                disabled={isAssigning || !assignedAM || accountManagers.length === 0}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.semantic.success }}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Manager'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

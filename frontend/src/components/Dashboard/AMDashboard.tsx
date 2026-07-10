import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';

interface UnorphanRequest {
  requestId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: Date;
  createdBySP?: string;
  spName?: string;
}

export function AMDashboard() {
  const { user, signOut } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingRequests, setPendingRequests] = useState<UnorphanRequest[]>([]);
  const [reviewHistory, setReviewHistory] = useState<UnorphanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UnorphanRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAMUnorphanRequests();
      const pending = response.data?.requests?.filter((r: any) => r.status === 'PENDING') || [];
      const history = response.data?.requests?.filter((r: any) => r.status !== 'PENDING') || [];
      setPendingRequests(pending);
      setReviewHistory(history);
    } catch (error: any) {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClick = (request: UnorphanRequest) => {
    setSelectedRequest(request);
    setActionType('approve');
    setShowApproveModal(true);
    setApprovalNotes('');
  };

  const handleRejectClick = (request: UnorphanRequest) => {
    setSelectedRequest(request);
    setActionType('reject');
    setShowApproveModal(true);
    setApprovalNotes('');
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !actionType) return;

    setIsSubmitting(true);
    try {
      await apiClient.reviewUnorphanRequest(selectedRequest.requestId, {
        status: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
        approvalNotes,
      });

      toast.success(
        actionType === 'approve'
          ? 'Request approved and customer notified'
          : 'Request rejected'
      );

      setShowApproveModal(false);
      setSelectedRequest(null);
      setActionType(null);
      loadRequests();
    } catch (error: any) {
      toast.error('Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Account Manager Dashboard</h1>
            <p className="text-gray-400">{user?.name}</p>
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
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'pending'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'history'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            Review History
          </button>
        </div>

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending requests</p>
                <p className="text-gray-500 text-sm mt-2">All unorphan requests have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Customer Info */}
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Customer</p>
                        <p className="text-white font-semibold">{request.customerName}</p>
                        <p className="text-gray-400 text-sm">{request.customerEmail}</p>
                        <p className="text-gray-400 text-sm">{request.customerPhone}</p>
                      </div>

                      {/* Service Info */}
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Service</p>
                        <p className="text-white font-semibold">{request.serviceName}</p>
                        {request.spName && (
                          <>
                            <p className="text-gray-400 text-sm mt-2">Currently with</p>
                            <p className="text-white text-sm">{request.spName}</p>
                          </>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Reason for Unorphan</p>
                        <p className="text-white">{request.reason}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleRejectClick(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition font-semibold text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveClick(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review History Tab */}
        {activeTab === 'history' && (
          <div>
            {reviewHistory.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-gray-400">No review history yet</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-white font-semibold">Customer</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Service</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Reason</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-white font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {reviewHistory.map((request) => (
                        <tr key={request.requestId} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <p className="text-white font-semibold text-sm">{request.customerName}</p>
                            <p className="text-gray-400 text-xs">{request.customerEmail}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{request.serviceName}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{request.reason}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'APPROVED'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(request.requestedAt).toLocaleDateString()}
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
      </div>

      {/* Approve/Reject Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              {actionType === 'approve' ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>
            </div>

            {/* Request Summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Customer:</p>
              <p className="text-white font-semibold mb-3">{selectedRequest.customerName}</p>
              <p className="text-sm text-gray-400 mb-1">Reason:</p>
              <p className="text-white mb-3">{selectedRequest.reason}</p>
            </div>

            {/* Notes Field */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Add any notes about the approval...'
                    : 'Please provide a reason for rejection...'
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={4}
              />
            </div>

            {actionType === 'reject' && !approvalNotes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">Please provide a reason for rejection</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting || (actionType === 'reject' && !approvalNotes)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition disabled:opacity-50 font-semibold ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
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

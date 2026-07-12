import { useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import type { MenuItemRequest } from '@/types';

interface MenuItemRequestApprovalsProps {
  requests: MenuItemRequest[];
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export function MenuItemRequestApprovals({
  requests,
  onApprove,
  onReject,
  isLoading = false,
}: MenuItemRequestApprovalsProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onApprove(requestId);
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onReject(requestId, rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Item Requests</h2>
        <p className="text-gray-600">Approve or reject requests from ServiceProviders</p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Approvals ({pendingRequests.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.requestId}
                className="bg-white border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Requester Info */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Requested By</p>
                    <p className="font-medium text-gray-900">{request.spName}</p>
                    <p className="text-sm text-gray-600">{request.spEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">{request.serviceName}</p>
                  </div>

                  {/* Item Details */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Item Name</p>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-blue-600 font-semibold">₹{request.basePrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Image Preview */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Item Image</p>
                    {request.image ? (
                      <img
                        src={request.image}
                        alt={request.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {request.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(request.requestId)}
                      disabled={isLoading || processingId === request.requestId}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-sm transition-colors"
                    >
                      {processingId === request.requestId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() => setRejectingId(request.requestId)}
                      disabled={isLoading || rejectingId === request.requestId}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Rejection Reason Form */}
                {rejectingId === request.requestId && (
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-900">Rejection Reason (Optional)</p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                      rows={2}
                      disabled={processingId === request.requestId}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(request.requestId)}
                        disabled={processingId === request.requestId}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium text-sm"
                      >
                        {processingId === request.requestId && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Approved ({approvedRequests.length})
          </h3>
          <div className="space-y-2">
            {approvedRequests.map((request) => (
              <div
                key={request.requestId}
                className="bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-gray-600">
                      {request.spName} • {request.serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">₹{request.basePrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Approved by {request.reviewerName || 'Admin'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            Rejected ({rejectedRequests.length})
          </h3>
          <div className="space-y-2">
            {rejectedRequests.map((request) => (
              <div
                key={request.requestId}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-gray-600">
                      {request.spName} • {request.serviceName}
                    </p>
                    {request.rejectionReason && (
                      <p className="text-xs text-gray-600 mt-1">
                        Reason: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">₹{request.basePrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Rejected on{' '}
                      {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 font-medium">No menu item requests</p>
          <p className="text-gray-500 text-sm mt-1">
            Requests from ServiceProviders will appear here
          </p>
        </div>
      )}
    </div>
  );
}

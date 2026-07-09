import { useState, useEffect } from 'react';
import { ChevronRight, Package, Truck, CheckCircle, DollarSign, Star, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import type { Order } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters';

interface OrderTrackingProps {
  orderId: string;
  onStatusChange?: () => void;
}

export function OrderTracking({ orderId, onStatusChange }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.getOrder(orderId);
      setOrder(response.data);
    } catch (error: any) {
      if (isLoading) {
        toast.error('Failed to load order', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await apiClient.addOrderFeedback(orderId, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      toast.success('Thank you for your feedback!');
      fetchOrder();
      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (error: any) {
      toast.error('Failed to submit feedback', error.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-600 mt-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const statusSteps = [
    { status: 'CREATED', icon: Package, label: 'Created' },
    { status: 'CONFIRMED', icon: CheckCircle, label: 'Confirmed' },
    { status: 'READY_FOR_DELIVERY', icon: Package, label: 'Ready' },
    { status: 'DELIVERED', icon: Truck, label: 'Delivered' },
    { status: 'PAID', icon: DollarSign, label: 'Paid' },
    { status: 'COMPLETED', icon: CheckCircle, label: 'Completed' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.status === order.status);

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderId.slice(-6)}</h2>
            <p className="text-gray-500 mt-1">
              Created on {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              order.status === 'COMPLETED'
                ? 'bg-green-100 text-green-700'
                : order.status === 'DELIVERED'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>

        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.status} className="flex items-center gap-4">
                {/* Timeline Node */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-1 h-8 transition ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{step.label}</p>
                  {isCurrent && (
                    <p className="text-sm text-blue-600">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">{item.menuItemName}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900">₹{item.total}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">₹{order.subtotal}</span>
          </div>
          {order.gstApplicable && (
            <div className="flex justify-between">
              <span className="text-gray-600">GST ({order.gstPercentage}%):</span>
              <span className="font-medium text-gray-900">₹{order.gstAmount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Commission:</span>
            <span className="font-medium text-gray-900">
              ₹{order.commission?.amount || 0}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-gray-900">Total Amount:</span>
            <span className="font-bold text-blue-600">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {order.status !== 'CREATED' && order.status !== 'CONFIRMED' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Mode:</span>
              <span className="font-medium text-gray-900">
                {order.paymentMode === 'GATEWAY'
                  ? 'Online (Razorpay)'
                  : 'Direct UPI'}
              </span>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {order.razorpayPaymentId.slice(-8)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Section (Show only if Completed) */}
      {order.status === 'COMPLETED' && !order.feedback && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rate Your Experience
          </h3>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`w-10 h-10 text-xl rounded transition ${
                      star <= feedbackRating
                        ? 'bg-yellow-100 text-yellow-500'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitFeedback}
              disabled={isSubmittingFeedback || feedbackRating === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {isSubmittingFeedback && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Feedback
            </button>
          </div>
        </div>
      )}

      {/* Existing Feedback */}
      {order.feedback && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="font-semibold text-green-900">Thank you for your feedback!</p>
          <p className="text-green-800 mt-2">
            {'★'.repeat(order.feedback.rating)}{'☆'.repeat(5 - order.feedback.rating)}
          </p>
          {order.feedback.comment && (
            <p className="text-green-700 mt-2">"{order.feedback.comment}"</p>
          )}
        </div>
      )}
    </div>
  );
}

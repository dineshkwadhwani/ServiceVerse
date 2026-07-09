import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

interface RazorpayPaymentProps {
  orderId: string;
  amount: number;
  gstApplicable: boolean;
  gstPercentage: number;
  onPaymentSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayPayment({
  orderId,
  amount,
  gstApplicable,
  gstPercentage,
  onPaymentSuccess,
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Initialize payment
      const response = await apiClient.initializeRazorpayPayment(orderId);
      const { razorpayOrderId, keyId } = response.data;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: keyId,
        order_id: razorpayOrderId,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'ServiceVerse',
        description: `Order #${orderId.slice(-6)}`,
        handler: async (response: any) => {
          try {
            // Verify payment
            await apiClient.verifyRazorpayPayment(orderId, {
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.success('Payment successful! Your order will be processed soon.');
            onPaymentSuccess?.();
          } catch (error: any) {
            toast.error('Payment verification failed', error.message);
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#3B82F6',
        },
      });

      razorpay.open();
    } catch (error: any) {
      toast.error('Failed to initialize payment', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const gstAmount = gstApplicable ? (amount * gstPercentage) / 100 : 0;
  const totalAmount = amount + gstAmount;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-blue-600" />
        Complete Payment
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Service Amount:</span>
          <span className="font-medium text-gray-900">₹{amount.toFixed(2)}</span>
        </div>

        {gstApplicable && (
          <div className="flex justify-between">
            <span className="text-gray-600">GST ({gstPercentage}%):</span>
            <span className="font-medium text-gray-900">₹{gstAmount.toFixed(2)}</span>
          </div>
        )}

        <hr />

        <div className="flex justify-between text-lg">
          <span className="font-semibold text-gray-900">Total Payable:</span>
          <span className="font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? 'Processing...' : 'Pay with Razorpay'}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        💳 Secured by Razorpay. Your card details are encrypted and safe.
      </p>
    </div>
  );
}

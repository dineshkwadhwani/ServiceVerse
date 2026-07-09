import { useState } from 'react';
import { QrCode, Check, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

interface DirectQRPaymentProps {
  orderId: string;
  spUPIId: string;
  spName: string;
  amount: number;
  onPaymentConfirmed?: () => void;
}

export function DirectQRPayment({
  orderId,
  spUPIId,
  spName,
  amount,
  onPaymentConfirmed,
}: DirectQRPaymentProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const toast = useToast();

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await apiClient.confirmDirectPayment(orderId);
      setIsPaymentConfirmed(true);
      toast.success('Payment confirmed! Thank you for your order.');
      onPaymentConfirmed?.();
    } catch (error: any) {
      toast.error('Failed to confirm payment', error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  // Generate QR code data (this is a placeholder - in production, generate actual QR)
  const qrCodeData = `upi://pay?pa=${spUPIId}&pn=${encodeURIComponent(spName)}&am=${amount}&tn=ServiceVerse%20Order%20${orderId.slice(-6)}`;

  if (isPaymentConfirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Payment Confirmed</h3>
            <p className="text-green-700 mt-1">
              Amount: ₹{amount}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Your order will be processed shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-6 border border-purple-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-purple-600" />
        Pay via UPI QR Code
      </h3>

      <div className="space-y-6">
        {/* Amount Display */}
        <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
          <p className="text-3xl font-bold text-purple-600">₹{amount}</p>
        </div>

        {/* QR Code Placeholder */}
        <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center">
          <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center text-gray-500">
              <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm">QR Code</p>
              <p className="text-xs mt-1">Scan to Pay via UPI</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Or share this UPI ID: <br />
            <code className="font-mono font-bold text-gray-700">{spUPIId}</code>
          </p>
        </div>

        {/* Service Provider Info */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-600">Paying to:</p>
          <p className="font-semibold text-gray-900">{spName}</p>
          <p className="text-xs text-gray-500">
            Order ID: #{orderId.slice(-6)}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to Pay:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
            <li>Scan the QR code OR enter the UPI ID</li>
            <li>Verify the amount (₹{amount})</li>
            <li>Complete the payment</li>
            <li>Click "Confirm Payment" below</li>
          </ol>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmPayment}
          disabled={isConfirming}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {isConfirming && <Loader2 className="w-5 h-5 animate-spin" />}
          {isConfirming ? 'Confirming...' : 'Confirm Payment Complete'}
        </button>

        {/* Important Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Important:</strong> Click "Confirm Payment" only after completing the UPI transfer. 
            This is for verification purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

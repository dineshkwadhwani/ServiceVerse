import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

interface OrderItem {
  menuItemId: string;
  name: string;
  customPrice: number;
  qty: number;
  itemTotal: number;
}

interface Props {
  spId: string;
  customer: any;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryDateTime?: string;
  specialInstructions: string;
  paymentMethod: 'ONLINE' | 'DIRECT';
  spGstPercent?: number;
  spGstMandatory?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onComplete: (orderId: string) => void;
}

export function OrderReviewStep({
  spId,
  customer,
  items,
  deliveryAddress,
  deliveryDateTime,
  specialInstructions,
  paymentMethod,
  spGstPercent = 0,
  spGstMandatory = false,
  onBack,
  onCancel,
  onComplete,
}: Props) {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);

  // GST is applied if:
  // 1. SP has gstCollectionMandatory = true, OR
  // 2. Payment method is ONLINE
  const applyGST = spGstMandatory || paymentMethod === 'ONLINE';
  const gstAmount = applyGST && spGstPercent > 0 ? (subtotal * spGstPercent) / 100 : 0;
  const total = subtotal + gstAmount;

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      const orderData = {
        spId,
        customerId: customer.customerId,
        customerPhone: customer.phone,
        customerName: customer.name,
        customerAddress: customer.address,
        deliveryAddress,
        deliveryDateTime: deliveryDateTime ? new Date(deliveryDateTime).toISOString() : null,
        specialInstructions,
        paymentMethod,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          customPrice: item.customPrice,
          qty: item.qty,
          itemTotal: item.itemTotal,
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gst: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        applyGST,
      };

      const response = await apiClient.createOrder(orderData);
      toast.success('Order created successfully!');
      onComplete(response?.data?.orderId);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create order');
      console.error('Order creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
        <h3 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>
          Customer Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: COLORS.text.secondary }}>Name</span>
            <span className="font-semibold" style={{ color: COLORS.text.primary }}>
              {customer.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: COLORS.text.secondary }}>Phone</span>
            <span className="font-semibold" style={{ color: COLORS.text.primary }}>
              {customer.phone}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: COLORS.text.secondary }}>Delivery Address</span>
            <span className="font-semibold text-right" style={{ color: COLORS.text.primary }}>
              {deliveryAddress}
            </span>
          </div>
          {deliveryDateTime && (
            <div className="flex justify-between">
              <span style={{ color: COLORS.text.secondary }}>Delivery Date/Time</span>
              <span className="font-semibold" style={{ color: COLORS.text.primary }}>
                {new Date(deliveryDateTime).toLocaleString()}
              </span>
            </div>
          )}
          {specialInstructions && (
            <div className="flex justify-between">
              <span style={{ color: COLORS.text.secondary }}>Instructions</span>
              <span className="font-semibold text-right" style={{ color: COLORS.text.primary }}>
                {specialInstructions}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: COLORS.text.secondary }}>Payment Method</span>
            <span className="font-semibold" style={{ color: COLORS.text.primary }}>
              {paymentMethod === 'DIRECT' ? 'Direct Payment' : 'Online Payment'}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
        <h3 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>
          Order Items
        </h3>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span style={{ color: COLORS.text.primary }}>
                {item.qty}x {item.name}
              </span>
              <span className="font-semibold" style={{ color: COLORS.text.primary }}>
                ₹{item.itemTotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
        <h3 className="font-semibold" style={{ color: COLORS.text.primary }}>
          Order Summary
        </h3>

        <div className="border-t" style={{ borderColor: COLORS.border.light }}>
          <div className="mt-3 flex justify-between text-sm">
            <span style={{ color: COLORS.text.secondary }}>Subtotal</span>
            <span style={{ color: COLORS.text.primary }}>₹{subtotal.toFixed(2)}</span>
          </div>

          {applyGST && (
            <div className="flex justify-between text-sm mt-2">
              <span style={{ color: COLORS.text.secondary }}>
                GST ({spGstPercent}%)
              </span>
              <span style={{ color: COLORS.text.primary }}>₹{gstAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span style={{ color: COLORS.text.primary }}>Total</span>
            <span style={{ color: COLORS.semantic.success }}>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex-1 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          style={{
            backgroundColor: COLORS.bg.surface,
            color: COLORS.text.primary,
            border: `1px solid ${COLORS.border.light}`,
          }}
        >
          Back
        </button>

        <button
          onClick={onCancel}
          disabled={isCreating}
          className="flex-1 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          style={{
            backgroundColor: COLORS.bg.surface,
            color: COLORS.text.primary,
            border: `1px solid ${COLORS.border.light}`,
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleConfirm}
          disabled={isCreating}
          className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.semantic.success }}
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isCreating ? 'Creating...' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
}

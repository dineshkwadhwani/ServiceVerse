import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { OrderDetailsStep } from './OrderDetailsStep';
import { OrderReviewStep } from './OrderReviewStep';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';

type Step = 'details' | 'review';

interface OrderItem {
  menuItemId: string;
  name: string;
  customPrice: number;
  qty: number;
  itemTotal: number;
}

interface Props {
  spId: string;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export function CreateOrderModal({ spId, onClose, onOrderCreated }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [spGstPercent, setSpGstPercent] = useState(0);
  const [spGstMandatory, setSpGstMandatory] = useState(false);

  // Order data
  const [orderData, setOrderData] = useState<{
    customer: any;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryDateTime?: string;
    specialInstructions: string;
    paymentMethod: 'ONLINE' | 'DIRECT';
  } | null>(null);

  // Load SP's GST settings
  useEffect(() => {
    loadSPGSTSettings();
  }, [spId]);

  const loadSPGSTSettings = async () => {
    try {
      const docRef = doc(db, 'users', spId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSpGstPercent(data?.documentation?.gstPercent || 0);
        setSpGstMandatory(data?.documentation?.gstCollectionMandatory || false);
      }
    } catch (error) {
      console.error('Failed to load SP GST settings:', error);
    }
  };

  const handleDetailsNext = (data: any) => {
    setOrderData(data);
    setCurrentStep('review');
  };

  const handleReviewBack = () => {
    setCurrentStep('details');
  };

  const handleOrderComplete = (_orderId: string) => {
    onOrderCreated?.();
    // Close modal; orders load naturally via pagination
    onClose();
  };

  const handleCancel = () => {
    if (currentStep === 'review' && orderData) {
      const confirm = window.confirm('Are you sure you want to cancel? All order data will be lost.');
      if (confirm) {
        setCurrentStep('details');
        setOrderData(null);
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: COLORS.bg.primary }}
      >
        {/* Header */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: COLORS.border.light }}
        >
          <div>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              {currentStep === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
            <h2 className="text-xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
              Create Order
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={currentStep === 'review' && !!orderData}
            className="p-2 hover:opacity-70 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" style={{ color: COLORS.text.secondary }} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.border.light }}>
          <div className="flex gap-2">
            {(['details', 'review'] as const).map((step, idx) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{
                    backgroundColor:
                      step === currentStep
                        ? COLORS.semantic.info
                        : step === 'details'
                          ? COLORS.semantic.success
                          : `${COLORS.text.secondary}40`,
                    color:
                      step === currentStep || step === 'details'
                        ? 'white'
                        : COLORS.text.secondary,
                  }}
                >
                  {idx + 1}
                </div>

                {idx < 1 && (
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{
                      backgroundColor: currentStep === 'review' ? COLORS.semantic.success : COLORS.border.light,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 'details' && (
            <OrderDetailsStep
              spId={spId}
              initialData={orderData || undefined}
              onNext={handleDetailsNext}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'review' && orderData && (
            <OrderReviewStep
              spId={spId}
              customer={orderData.customer}
              items={orderData.items}
              deliveryAddress={orderData.deliveryAddress}
              deliveryDateTime={orderData.deliveryDateTime}
              specialInstructions={orderData.specialInstructions}
              paymentMethod={orderData.paymentMethod}
              spGstPercent={spGstPercent}
              spGstMandatory={spGstMandatory}
              onBack={handleReviewBack}
              onCancel={handleCancel}
              onComplete={handleOrderComplete}
            />
          )}
        </div>

        {/* Footer - Back button for review step */}
        {currentStep === 'review' && (
          <div
            className="border-t px-6 py-4"
            style={{ borderColor: COLORS.border.light }}
          >
            <button
              onClick={handleReviewBack}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: COLORS.semantic.info }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

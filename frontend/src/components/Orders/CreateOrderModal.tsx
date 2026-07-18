import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { OrderDetailsStep } from './OrderDetailsStep';
import { OrderReviewStep } from './OrderReviewStep';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';

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
  spBusinessName?: string;
  serviceId?: string;
  isCustomerCreating?: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export function CreateOrderModal({ spId, spBusinessName, serviceId, isCustomerCreating, onClose, onOrderCreated }: Props) {
  const { firebaseUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>(isCustomerCreating ? 'details' : 'details');
  const [spGstPercent, setSpGstPercent] = useState(0);
  const [spGstMandatory, setSpGstMandatory] = useState(false);
  const [selectedSpId, setSelectedSpId] = useState(spId || '');
  const [availableSPs, setAvailableSPs] = useState<Array<{ spId: string; businessName: string }>>([]);
  const [associatedSpId, setAssociatedSpId] = useState('');
  const [initialSpName] = useState(isCustomerCreating ? (spBusinessName || '') : '');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Order data
  const [orderData, setOrderData] = useState<{
    customer: any;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryDateTime?: string;
    specialInstructions: string;
    paymentMethod: 'ONLINE' | 'DIRECT';
    deliveryType: 'DROP' | 'PICKUP';
    selectedCoworker: string;
    spId: string;
  } | null>(null);

  // Load SP's GST settings and customer data (if customer creating order)
  useEffect(() => {
    if (!isCustomerCreating) {
      setSelectedSpId(spId);
    }
  }, [spId, isCustomerCreating]);

  useEffect(() => {
    if (selectedSpId) {
      loadSPGSTSettings(selectedSpId);
    }
  }, [selectedSpId]);

  useEffect(() => {
    if (isCustomerCreating && firebaseUser?.uid) {
      loadCustomerData();
      loadCustomerServiceProviders();
    }
  }, [isCustomerCreating, firebaseUser?.uid, serviceId]);

  // Sync selectedSpId from orderData when order data is set (for customer SP selection)
  useEffect(() => {
    console.log('[CreateOrderModal] useEffect triggered. orderData?.spId:', orderData?.spId, 'selectedSpId:', selectedSpId);
    if (orderData?.spId && !selectedSpId) {
      console.log('[CreateOrderModal] Setting selectedSpId from orderData:', orderData.spId);
      setSelectedSpId(orderData.spId);
    }
  }, [orderData?.spId]);

  const loadSPGSTSettings = async (targetSpId: string) => {
    try {
      const docRef = doc(db, 'users', targetSpId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSpGstPercent(data?.documentation?.gstPercent || 0);
        setSpGstMandatory(data?.documentation?.gstCollectionMandatory || false);
      }
    } catch (error) {
      // SP GST settings load failed - defaults to 0% are used
    }
  };

  const loadCustomerServiceProviders = async () => {
    if (!serviceId) return;
    try {
      const response: any = await apiClient.getCustomerServiceProviders(serviceId);
      const providers = response?.data?.providers || [];
      setAvailableSPs(providers);

      const assocId = response?.data?.associatedSpId || '';
      setAssociatedSpId(assocId);
      if (assocId) {
        setSelectedSpId(assocId);
      }
    } catch (error) {
      setAvailableSPs([]);
    }
  };

  const loadCustomerData = async () => {
    if (!firebaseUser?.uid) return;
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const customerInfo = {
          customerId: firebaseUser.uid,
          phone: data?.phone || '',
          name: data?.name || '',
          email: data?.email || '',
          address: data?.address || '',
        };

        // Pre-populate order with customer data
        setOrderData({
          customer: customerInfo,
          items: [],
          deliveryAddress: data?.address || '',
          deliveryDateTime: undefined,
          specialInstructions: '',
          paymentMethod: 'DIRECT',
          deliveryType: 'DROP',
          selectedCoworker: '',
          spId: '',
        });
      }
    } catch (error) {
      // Customer data load failed - will show empty forms
    }
  };

  const handleDetailsNext = (data: any) => {
    console.log('[CreateOrderModal] handleDetailsNext received data:', { spId: data?.spId, customerId: data?.customer?.customerId, itemsCount: data?.items?.length });
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
      setShowCancelConfirm(true);
      return;
    }
    onClose();
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
            onClick={handleCancel}
            className="p-2 hover:opacity-70 transition"
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
              spId={selectedSpId}
              isCustomerCreating={isCustomerCreating}
              availableSPs={availableSPs}
              selectedSpId={selectedSpId}
              onSPChange={setSelectedSpId}
              associatedSpId={associatedSpId}
              initialSpName={initialSpName}
              initialData={orderData || undefined}
              spGstMandatory={spGstMandatory}
              onNext={handleDetailsNext}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'review' && orderData && (
            <OrderReviewStep
              spId={selectedSpId}
              customer={orderData.customer}
              items={orderData.items}
              deliveryAddress={orderData.deliveryAddress}
              deliveryDateTime={orderData.deliveryDateTime}
              specialInstructions={orderData.specialInstructions}
              paymentMethod={orderData.paymentMethod}
              deliveryType={orderData.deliveryType}
              selectedCoworker={orderData.selectedCoworker}
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

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div
            className="w-full max-w-md rounded-xl border p-5"
            style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              Cancel order creation?
            </h3>
            <p className="text-sm mb-4" style={{ color: COLORS.text.secondary }}>
              Your unsaved order details will be discarded.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  color: COLORS.text.primary,
                  border: `1px solid ${COLORS.border.light}`,
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: COLORS.semantic.error }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/utils/firebase-config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

interface OrderLike {
  orderId: string;
  spId?: string;
  customerId?: string;
  customerName?: string;
  createdBy?: string;
  createdByRole?: string;
  createdByUserId?: string;
  status: string;
  totalAmount?: number;
  deliveryType?: string;
  selectedCoworker?: string;
  paymentMethod?: 'ONLINE' | 'DIRECT';
  specialInstructions?: string;
  isFrozen?: boolean;
  items?: Array<{ name: string; qty?: number; quantity?: number; itemTotal?: number; customPrice?: number; price?: number }>;
}

interface Props {
  order: OrderLike;
  role: 'SERVICE_PROVIDER' | 'CUSTOMER' | 'COWORKER';
  coworkers?: Array<{ uid?: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}

const SP_STATUSES = ['CONFIRMED', 'ASSIGNED_FOR_PICKUP', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
const COWORKER_STATUSES = ['CONFIRMED', 'READY_FOR_DELIVERY', 'DELIVERED'];

export function OrderLifecycleModal({ order, role, coworkers = [], onClose, onSaved }: Props) {
  const toast = useToast();
  const { user, firebaseUser } = useAuthStore();
  const [orderDetails, setOrderDetails] = useState<OrderLike>(order);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  const [status, setStatus] = useState(order.status);
  const [selectedCoworker, setSelectedCoworker] = useState(order.selectedCoworker || '');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'DIRECT'>(order.paymentMethod || 'DIRECT');
  const [deliveryType, setDeliveryType] = useState<'DROP' | 'PICKUP'>((order.deliveryType as 'DROP' | 'PICKUP') || 'DROP');
  const [specialInstructions, setSpecialInstructions] = useState(order.specialInstructions || '');
  const [editableItems, setEditableItems] = useState<Array<any>>(order.items || []);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showPaidPopup, setShowPaidPopup] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showDirectPayPopup, setShowDirectPayPopup] = useState(false);
  const [spQrCodeUrl, setSpQrCodeUrl] = useState('');
  const [spUpiId, setSpUpiId] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoadingOrder(true);
      try {
        const response: any = await apiClient.getOrder(order.orderId);
        const fullOrder = response?.data || response;
        setOrderDetails(fullOrder);
        setStatus(fullOrder?.status || order.status);
        setSelectedCoworker(fullOrder?.selectedCoworker || '');
        setPaymentMethod((fullOrder?.paymentMethod || 'DIRECT') as 'ONLINE' | 'DIRECT');
        setDeliveryType((fullOrder?.deliveryType || 'DROP') as 'DROP' | 'PICKUP');
        setSpecialInstructions(fullOrder?.specialInstructions || '');
        setEditableItems(fullOrder?.items || []);

        const spId = fullOrder?.spId || fullOrder?.serviceProviderId;
        if (spId) {
          try {
            const spDoc = await getDoc(doc(db, 'users', spId));
            const spData: any = spDoc.exists() ? spDoc.data() : {};
            const qr =
              spData?.documentation?.qrCodeUrl ||
              spData?.upiQRCode ||
              '';
            const upiId =
              spData?.documentation?.upiId ||
              spData?.upiId ||
              '';

            setSpQrCodeUrl(qr);
            setSpUpiId(upiId);
          } catch {
            setSpQrCodeUrl('');
            setSpUpiId('');
          }

          // Load SP's full configured menu so items can be added, not just adjusted.
          // Needed when a customer creates an order with 0 items for SP/Coworker to fill in.
          if (role === 'SERVICE_PROVIDER' || role === 'COWORKER') {
            setIsLoadingMenu(true);
            try {
              const menuResponse: any = await apiClient.getSPConfiguredMenu(spId);
              const menuItems = (menuResponse?.menuItems || menuResponse?.data?.menuItems || []) as Array<any>;
              const existingItems = fullOrder?.items || [];

              const merged = menuItems.map((menuItem: any) => {
                const existing = existingItems.find((i: any) => i.menuItemId === menuItem.menuItemId);
                return {
                  menuItemId: menuItem.menuItemId,
                  name: menuItem.name,
                  customPrice: menuItem.customPrice,
                  qty: existing?.qty || existing?.quantity || 0,
                  itemTotal: existing?.itemTotal || 0,
                };
              });

              setEditableItems(merged);
            } catch {
              // Menu load failed - fall back to items already on the order
            } finally {
              setIsLoadingMenu(false);
            }
          }
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load order details');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    loadOrder();
  }, [order.orderId]);

  const currentStatus = orderDetails?.status || status;
  const creatorRole = (orderDetails as any)?.createdByRole || (orderDetails as any)?.createdBy || '';
  const createdByCustomer =
    creatorRole === 'CUSTOMER' ||
    (!!(orderDetails as any)?.createdByUserId &&
      !!(orderDetails as any)?.customerId &&
      (orderDetails as any)?.createdByUserId === (orderDetails as any)?.customerId);
  const isPreConfirmStatus = ['NEW', 'PENDING'].includes(String(currentStatus || '').toUpperCase());
  const displayCustomerName =
    orderDetails?.customerName ||
    order?.customerName ||
    (role === 'CUSTOMER' ? (user as any)?.name : '') ||
    'N/A';
  const canCustomerConfirm = role === 'CUSTOMER' && isPreConfirmStatus && !createdByCustomer;
  const canCustomerPay = role === 'CUSTOMER' && currentStatus === 'DELIVERED';
  const currentPaymentMethod = paymentMethod || orderDetails?.paymentMethod || order?.paymentMethod || 'DIRECT';
  console.log('[OrderLifecycleModal] payment method resolution:', {
    paymentMethodState: paymentMethod,
    orderDetailsPaymentMethod: orderDetails?.paymentMethod,
    orderPropPaymentMethod: order?.paymentMethod,
    currentPaymentMethod,
    currentStatus,
    canCustomerPay,
  });
  const isFullEditMode =
    (role === 'SERVICE_PROVIDER' || role === 'COWORKER') &&
    !orderDetails?.isFrozen &&
    currentStatus !== 'CONFIRMED' &&
    currentStatus !== 'READY_FOR_DELIVERY' &&
    currentStatus !== 'DELIVERED' &&
    currentStatus !== 'PAID' &&
    currentStatus !== 'COMPLETED';

  const subtotal = useMemo(
    () => editableItems.reduce((sum, item) => sum + (Number(item.customPrice || item.price || 0) * Number(item.qty || item.quantity || 0)), 0),
    [editableItems]
  );

  const assigneeOptions = useMemo(() => {
    const selfName =
      (user as any)?.name ||
      (user as any)?.ownerName ||
      (user as any)?.businessName ||
      firebaseUser?.displayName ||
      'Self';
    const selfUid = firebaseUser?.uid;

    const base = (coworkers || []).filter((c) => c?.name);
    const hasSelf = !!selfUid && base.some((c) => c.uid === selfUid);

    if (role !== 'SERVICE_PROVIDER') return base;
    if (hasSelf) return base;

    return [{ uid: selfUid, name: selfName }, ...base];
  }, [coworkers, role, user, firebaseUser]);

  const adjustItemQty = (index: number, delta: number) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextQty = Math.max(0, Number(item.qty || item.quantity || 0) + delta);
        return {
          ...item,
          qty: nextQty,
          itemTotal: Number((nextQty * Number(item.customPrice || item.price || 0)).toFixed(2)),
        };
      })
    );
  };

  const getStatusOptions = () => {
    if (role === 'SERVICE_PROVIDER') return [...SP_STATUSES, 'PAID'];
    if (role === 'COWORKER') return COWORKER_STATUSES;
    return [];
  };

  const saveDetails = async () => {
    console.log('[OrderLifecycleModal] saveDetails sending paymentMethod:', paymentMethod);
    setIsSaving(true);
    try {
      await apiClient.updateOrderDetails(order.orderId, {
        items: editableItems,
        specialInstructions,
        deliveryType,
        selectedCoworker,
        paymentMethod,
      });
      toast.success('Order details updated');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update order details');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmFromEditMode = async () => {
    if (editableItems.filter((item) => Number(item.qty || item.quantity || 0) > 0).length === 0) {
      toast.error('Please select at least one item before confirming');
      return;
    }

    console.log('[OrderLifecycleModal] confirmFromEditMode sending paymentMethod:', paymentMethod);
    setIsSaving(true);
    try {
      // Persist current items/details first - the order may have been created with 0 items
      // (customer flow) and items only exist in local edit state until saved.
      await apiClient.updateOrderDetails(order.orderId, {
        items: editableItems,
        specialInstructions,
        deliveryType,
        selectedCoworker,
        paymentMethod,
      });
      await apiClient.updateOrderLifecycle(order.orderId, { status: 'CONFIRMED' });
      toast.success('Order confirmed');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to confirm order');
    } finally {
      setIsSaving(false);
    }
  };

  const saveStatus = async (nextStatus: string, proofUrl?: string) => {
    setIsSaving(true);
    try {
      const payload: any = { status: nextStatus };
      if (nextStatus === 'ASSIGNED_FOR_PICKUP') {
        payload.selectedCoworker = selectedCoworker;
      }
      if (nextStatus === 'PAID' && proofUrl) {
        payload.paymentProofUrl = proofUrl;
      }

      await apiClient.updateOrderLifecycle(order.orderId, payload);
      toast.success(`Order marked as ${nextStatus}`);
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const loadRazorpayScript = async () => {
    if ((window as any).Razorpay) return true;

    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayNow = async () => {
    console.log('[OrderLifecycleModal] handleOnlinePayNow invoked. currentPaymentMethod:', currentPaymentMethod);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const useServerPayment = import.meta.env.VITE_USE_SERVER_RAZORPAY === 'true';

      const openCheckout = (keyId: string, amount: number, razorpayOrderId?: string) => {
        const options: any = {
          key: keyId,
          amount,
          currency: 'INR',
          name: 'ServiceVerse',
          description: `Order ${order.orderId}`,
          handler: async (response: any) => {
            try {
              if (razorpayOrderId && response?.razorpay_order_id && response?.razorpay_payment_id && response?.razorpay_signature) {
                await apiClient.verifyRazorpayPayment(order.orderId, {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
              } else {
                // Dev fallback when backend payment init is unavailable.
                await saveStatus('PAID');
              }

              toast.success('Payment completed successfully');
              onSaved();
              onClose();
            } catch (error: any) {
              toast.error(error?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: (user as any)?.name || '',
            email: (user as any)?.email || '',
            contact: (user as any)?.phone || '',
          },
          theme: {
            color: COLORS.semantic.info,
          },
        };

        if (razorpayOrderId) {
          options.order_id = razorpayOrderId;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      if (!useServerPayment) {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        const amount = Math.round(Number(orderDetails?.totalAmount || order?.totalAmount || 0) * 100);

        if (!keyId || amount <= 0) {
          toast.error('Razorpay key or amount is invalid. Please check configuration.');
          return;
        }

        openCheckout(keyId, amount);
        return;
      }

      const initResp: any = await apiClient.initializeRazorpayPayment(order.orderId);
      const payload = initResp?.data || initResp;

      const razorpayOrderId = payload?.razorpayOrderId;
      const keyId = payload?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const amount = payload?.amount;

      if (!razorpayOrderId || !keyId || !amount) {
        throw new Error('Payment initialization failed');
      }

      openCheckout(keyId, amount, razorpayOrderId);
    } catch (error: any) {
      toast.error(error?.message || 'Unable to start online payment');
    }
  };

  const buildUpiIntent = () => {
    const raw = (spQrCodeUrl || '').trim();
    if (raw.toLowerCase().startsWith('upi://pay')) {
      return raw;
    }

    const upiId = (spUpiId || '').trim();
    if (!upiId) return '';

    const amount = Number(orderDetails?.totalAmount || order?.totalAmount || 0).toFixed(2);
    const payeeName = encodeURIComponent('Service Provider');
    const note = encodeURIComponent(`Order ${order.orderId}`);
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
  };

  const handleDirectPayNow = () => {
    console.log('[OrderLifecycleModal] handleDirectPayNow invoked. currentPaymentMethod:', currentPaymentMethod, 'spQrCodeUrl:', spQrCodeUrl, 'spUpiId:', spUpiId);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    const upiIntent = buildUpiIntent();

    if (isMobile && upiIntent) {
      window.location.href = upiIntent;
      return;
    }

    if (!spQrCodeUrl) {
      toast.error('SP QR code is not configured yet');
      return;
    }

    // Show the QR inline instead of window.open - an invalid/relative spQrCodeUrl
    // can cause the browser to open a blank tab.
    setShowDirectPayPopup(true);
  };

  const handleSubmitPaidWithProof = async () => {
    if (!paymentProofFile) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setIsUploadingProof(true);
    try {
      const ext = paymentProofFile.name.split('.').pop() || 'jpg';
      const filePath = `payment-proofs/${order.orderId}/${firebaseUser?.uid || 'user'}-${Date.now()}.${ext}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, paymentProofFile);
      const proofUrl = await getDownloadURL(storageRef);

      await saveStatus('PAID', proofUrl);
      setShowPaidPopup(false);
      setPaymentProofFile(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload payment screenshot');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSave = () => {
    if (status === 'ASSIGNED_FOR_PICKUP' && !selectedCoworker) {
      toast.error('Please select assignee for pickup');
      return;
    }
    saveStatus(status);
  };

  if (isLoadingOrder) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="p-6 rounded-xl border" style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.semantic.info }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-xl border" style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.border.light }}>
          <h3 className="font-bold" style={{ color: COLORS.text.primary }}>Order #{order.orderId}</h3>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" style={{ color: COLORS.text.secondary }} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>Customer</p>
            <p className="font-semibold" style={{ color: COLORS.text.primary }}>{displayCustomerName}</p>
          </div>

          <div>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>Current Status</p>
            <p className="font-semibold" style={{ color: COLORS.text.primary }}>{currentStatus}</p>
          </div>

          {isFullEditMode && (
            <>
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Order Items (Editable until confirmed)</label>
                {isLoadingMenu ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.semantic.info }} />
                  </div>
                ) : editableItems.length === 0 ? (
                  <p className="text-sm p-3" style={{ color: COLORS.text.secondary }}>No menu items configured for this service provider yet.</p>
                ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {editableItems.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
                      <div>
                        <p className="font-semibold" style={{ color: COLORS.text.primary }}>{item.name}</p>
                        <p className="text-xs" style={{ color: COLORS.text.secondary }}>₹{Number(item.customPrice || item.price || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustItemQty(idx, -1)}
                          className="p-1 rounded"
                          style={{ backgroundColor: COLORS.bg.primary }}
                        >
                          <Minus className="w-4 h-4" style={{ color: COLORS.text.primary }} />
                        </button>
                        <span style={{ color: COLORS.text.primary }} className="w-8 text-center">{Number(item.qty || item.quantity || 0)}</span>
                        <button
                          onClick={() => adjustItemQty(idx, 1)}
                          className="p-1 rounded"
                          style={{ backgroundColor: `${COLORS.semantic.success}20` }}
                        >
                          <Plus className="w-4 h-4" style={{ color: COLORS.semantic.success }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
                <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>Subtotal: ₹{subtotal.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Customer Instructions</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  rows={2}
                  style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'ONLINE' | 'DIRECT')}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
                >
                  <option value="DIRECT">DIRECT</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Delivery Type</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'DROP' | 'PICKUP')}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
                >
                  <option value="DROP">DROP</option>
                  <option value="PICKUP">PICKUP</option>
                </select>
              </div>

              {deliveryType === 'PICKUP' && role === 'SERVICE_PROVIDER' && (
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Assign Pickup</label>
                  <select
                    value={selectedCoworker}
                    onChange={(e) => setSelectedCoworker(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
                  >
                    <option value="">-- Select Assignee --</option>
                    {assigneeOptions.map((c) => (
                      <option key={c.uid || c.name} value={c.name}>
                        {c.uid && c.uid === firebaseUser?.uid ? `Self - ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={saveDetails}
                disabled={isSaving || isLoadingMenu}
                className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: COLORS.semantic.success }}
              >
                Save Order Details
              </button>

              {(role === 'SERVICE_PROVIDER' || role === 'COWORKER') && (
                <button
                  onClick={confirmFromEditMode}
                  disabled={isSaving || isLoadingMenu}
                  className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  Confirm Order
                </button>
              )}
            </>
          )}

          {!isFullEditMode && (role === 'SERVICE_PROVIDER' || role === 'COWORKER') && (
            <div>
              <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
              >
                <option value="">-- Select Status --</option>
                {getStatusOptions().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {!isFullEditMode && role === 'SERVICE_PROVIDER' && status === 'ASSIGNED_FOR_PICKUP' && (
            <div>
              <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>Assign Pickup</label>
              <select
                value={selectedCoworker}
                onChange={(e) => setSelectedCoworker(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
              >
                <option value="">-- Select Assignee --</option>
                {assigneeOptions.map((c) => (
                  <option key={c.uid || c.name} value={c.name}>
                    {c.uid && c.uid === firebaseUser?.uid ? `Self - ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canCustomerPay && (
            <div className="space-y-2">
              {currentPaymentMethod === 'ONLINE' ? (
                <button
                  onClick={handleOnlinePayNow}
                  disabled={isSaving}
                  className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: COLORS.semantic.info }}
                >
                  Pay Now
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDirectPayNow}
                    disabled={isSaving}
                    className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: COLORS.semantic.info }}
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => setShowPaidPopup(true)}
                    disabled={isSaving}
                    className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: COLORS.semantic.success }}
                  >
                    Paid
                  </button>
                </>
              )}
            </div>
          )}

          {canCustomerConfirm && (
            <button
              onClick={() => saveStatus('CONFIRMED')}
              disabled={isSaving}
              className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: COLORS.semantic.info }}
            >
              Confirm Order
            </button>
          )}

          {!isFullEditMode && (role === 'SERVICE_PROVIDER' || role === 'COWORKER') && (
            <button
              onClick={handleSave}
              disabled={isSaving || !status}
              className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: COLORS.semantic.success }}
            >
              Save Status
            </button>
          )}
        </div>
      </div>

      {showPaidPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-md rounded-xl border p-4" style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light }}>
            <h4 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>Attach Payment Screenshot</h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface, color: COLORS.text.primary }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setShowPaidPopup(false);
                  setPaymentProofFile(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: COLORS.bg.surface, color: COLORS.text.primary, border: `1px solid ${COLORS.border.light}` }}
              >
                Close
              </button>
              <button
                onClick={handleSubmitPaidWithProof}
                disabled={isUploadingProof}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: COLORS.semantic.success }}
              >
                {isUploadingProof ? 'Uploading...' : 'Submit Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDirectPayPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-md rounded-xl border p-4" style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light }}>
            <h4 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>Pay Using UPI QR</h4>
            {spQrCodeUrl ? (
              <img
                src={spQrCodeUrl}
                alt="SP UPI QR"
                className="w-full rounded-lg border"
                style={{ borderColor: COLORS.border.light }}
              />
            ) : (
              <p style={{ color: COLORS.text.secondary }}>QR code not configured for this service provider.</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowDirectPayPopup(false)}
                className="flex-1 px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: COLORS.bg.surface, color: COLORS.text.primary, border: `1px solid ${COLORS.border.light}` }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

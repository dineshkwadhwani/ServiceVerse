import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Loader2, CheckCircle2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { CustomerNotFoundModal } from './CustomerNotFoundModal';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  menuItemId: string;
  name: string;
  customPrice: number;
}

interface OrderItem extends MenuItem {
  qty: number;
  itemTotal: number;
}

interface Props {
  spId: string;
  isCustomerCreating?: boolean;
  availableSPs?: Array<{ spId: string; businessName: string }>;
  selectedSpId?: string;
  onSPChange?: (spId: string) => void;
  associatedSpId?: string;
  initialSpName?: string;
  initialData?: {
    customer: any;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryDateTime?: string;
    specialInstructions: string;
    paymentMethod: 'ONLINE' | 'DIRECT';
    deliveryType?: 'DROP' | 'PICKUP';
    selectedCoworker?: string;
  };
  onNext: (data: {
    customer: any;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryDateTime?: string;
    specialInstructions: string;
    paymentMethod: 'ONLINE' | 'DIRECT';
    deliveryType: 'DROP' | 'PICKUP';
    selectedCoworker: string;
    spId: string;
  }) => void;
  onCancel: () => void; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export function OrderDetailsStep({
  spId,
  isCustomerCreating,
  availableSPs,
  selectedSpId,
  onSPChange,
  associatedSpId,
  initialSpName,
  initialData,
  onNext,
  onCancel,
}: Props) {
  const toast = useToast();
  const { user, firebaseUser } = useAuthStore();

  // Customer search
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer?.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [customer, setCustomer] = useState<any>(initialData?.customer || null);
  const [showCustomerNotFound, setShowCustomerNotFound] = useState(false);

  // Menu items
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialData?.items || []);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Delivery details
  const [deliveryAddress, setDeliveryAddress] = useState(initialData?.deliveryAddress || '');
  const [deliveryDateTime, setDeliveryDateTime] = useState(initialData?.deliveryDateTime || '');
  const [specialInstructions, setSpecialInstructions] = useState(initialData?.specialInstructions || '');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'DIRECT'>(initialData?.paymentMethod || 'DIRECT');

  // Pickup/Drop delivery type
  const [deliveryType, setDeliveryType] = useState<'DROP' | 'PICKUP'>(
    initialData?.deliveryType || (isCustomerCreating ? 'PICKUP' : 'DROP')
  );
  const [selectedCoworker, setSelectedCoworker] = useState('');

  // SP search state (customer flow)
  const [spSearchText, setSpSearchText] = useState('');
  const [spSearchResults, setSpSearchResults] = useState<Array<{ spId: string; businessName: string }> | null>(null);
  const [selectedSPName, setSelectedSPName] = useState(initialSpName || '');

  // Coworkers
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [isLoadingCoworkers, setIsLoadingCoworkers] = useState(false);

  // Track locally selected SP (for customer flow when searching)
  const [localSelectedSpId, setLocalSelectedSpId] = useState<string>('');

  const spSelfName =
    (user as any)?.name ||
    (user as any)?.ownerName ||
    (user as any)?.businessName ||
    firebaseUser?.displayName ||
    'Self';

  // Load menu items and coworkers
  useEffect(() => {
    if (!spId) {
      setOrderItems([]);
      setIsLoadingMenu(false);
      return;
    }

    // Only load if we don't have initial data with items
    if (!initialData?.items || initialData.items.length === 0) {
      loadMenuItems();
    } else {
      setIsLoadingMenu(false);
    }

    if (!isCustomerCreating) {
      loadCoworkers();
    } else {
      setCoworkers([]);
      setSelectedCoworker('');
    }
  }, [spId]);

  // Sync state when initial data arrives asynchronously (customer flow prefill)
  useEffect(() => {
    if (!initialData) return;

    setCustomer(initialData.customer || null);
    setCustomerPhone(initialData.customer?.phone || '');
    setDeliveryAddress(initialData.deliveryAddress || initialData.customer?.address || '');
    setDeliveryDateTime(initialData.deliveryDateTime || '');
    setSpecialInstructions(initialData.specialInstructions || '');
    setPaymentMethod(initialData.paymentMethod || 'DIRECT');
    setDeliveryType(initialData.deliveryType || (isCustomerCreating ? 'PICKUP' : 'DROP'));
    setSelectedCoworker(initialData.selectedCoworker || '');
  }, [initialData, isCustomerCreating]);

  const loadCoworkers = async () => {
    setIsLoadingCoworkers(true);
    try {
      const response: any = await apiClient.getSPCoworkers(spId);
      const coworkerList = (response?.data?.coworkers || []).map((c: any) => ({
        uid: c.uid,
        name: c.name,
        phone: c.phone,
        status: c.status,
      }));

      const selfEntry = {
        uid: firebaseUser?.uid || spId,
        name: spSelfName,
        phone: (user as any)?.phone || '',
        status: 'ACTIVE',
      };

      // Keep self as a guaranteed, explicit option using UID-based detection.
      const hasSelf = coworkerList.some((c: any) => c.uid === (firebaseUser?.uid || spId));
      const mergedList = hasSelf ? coworkerList : [selfEntry, ...coworkerList];

      setCoworkers(mergedList);
    } catch (error: any) {
      setCoworkers([
        {
          uid: firebaseUser?.uid || spId,
          name: spSelfName,
          phone: (user as any)?.phone || '',
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setIsLoadingCoworkers(false);
    }
  };

  const loadMenuItems = async () => {
    setIsLoadingMenu(true);
    try {
      const response: any = await apiClient.getSPConfiguredMenu(spId);
      console.log('[OrderDetailsStep] Menu API Response:', response);

      const items = (response?.menuItems || response?.data?.menuItems || []) as MenuItem[];
      console.log('[OrderDetailsStep] Parsed menu items:', items);

      if (items.length === 0) {
        console.warn('[OrderDetailsStep] No menu items found. Response structure:', JSON.stringify(response, null, 2));
      }

      // Initialize order items with 0 qty (or preserve existing qty if coming back from review)
      setOrderItems(
        items.map((item: MenuItem) => {
          const existingItem = initialData?.items?.find((i: OrderItem) => i.menuItemId === item.menuItemId);
          return {
            ...item,
            qty: existingItem?.qty || 0,
            itemTotal: existingItem?.itemTotal || 0,
          };
        })
      );
    } catch (error: any) {
      console.error('[OrderDetailsStep] Failed to load menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Auto-select associated SP (or only SP) when customer opens order flow
  useEffect(() => {
    if (!isCustomerCreating || !availableSPs?.length || selectedSPName) return;
    const targetId = associatedSpId; // only auto-select when explicitly associated
    if (!targetId) return;
    const sp = availableSPs.find(s => s.spId === targetId);
    if (sp) {
      setSelectedSPName(sp.businessName);
      onSPChange?.(sp.spId);
    }
  }, [associatedSpId, availableSPs, isCustomerCreating]);

  const handleSPSearch = () => {
    const query = spSearchText.trim().toLowerCase();
    const results = !query
      ? (availableSPs || [])
      : (availableSPs || []).filter(sp => sp.businessName.toLowerCase().includes(query));
    setSpSearchResults(results);
  };

  const handleSelectSP = (sp: { spId: string; businessName: string }) => {
    console.log('[OrderDetailsStep] SP selected:', sp.spId, sp.businessName);
    setLocalSelectedSpId(sp.spId);
    onSPChange?.(sp.spId);
    setSelectedSPName(sp.businessName);
    setSpSearchResults(null);
  };

  const handleSearchCustomer = async () => {
    if (!customerPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.searchCustomer(customerPhone);
      if (response?.data) {
        setCustomer(response.data);
        setDeliveryAddress(response.data.address || '');
      }
    } catch (error: any) {
      setShowCustomerNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQtyChange = (menuItemId: string, delta: number) => {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.menuItemId === menuItemId) {
          const newQty = Math.max(0, item.qty + delta);
          return {
            ...item,
            qty: newQty,
            itemTotal: newQty * item.customPrice,
          };
        }
        return item;
      })
    );
  };

  const handleReview = () => {
    // Use localSelectedSpId if available (customer selected SP via search), otherwise use prop spId
    const effectiveSpId = localSelectedSpId || spId;

    console.log('[OrderDetailsStep] handleReview called. effectiveSpId:', effectiveSpId, 'localSelectedSpId:', localSelectedSpId, 'spId prop:', spId, 'customer:', customer?.customerId);

    if (!customer) {
      toast.error(isCustomerCreating ? 'Profile is loading, please wait' : 'Please search for a customer');
      return;
    }

    if (!effectiveSpId) {
      console.error('[OrderDetailsStep] effectiveSpId is empty! localSelectedSpId:', localSelectedSpId, 'spId:', spId);
      toast.error('Please select a service provider');
      return;
    }

    const selectedItems = orderItems.filter(item => item.qty > 0);
    if (!isCustomerCreating && selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!isCustomerCreating && deliveryType === 'PICKUP' && !selectedCoworker) {
      toast.error('Please select a coworker for pickup');
      return;
    }

    const orderPayload = {
      customer,
      items: selectedItems,
      deliveryAddress,
      deliveryDateTime,
      specialInstructions,
      paymentMethod,
      deliveryType,
      selectedCoworker,
      spId: effectiveSpId,
    };
    console.log('[OrderDetailsStep] Sending to onNext:', { spId: effectiveSpId, customerId: customer?.customerId, itemsCount: selectedItems.length });
    onNext(orderPayload);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const selectedItemsCount = orderItems.filter(i => i.qty > 0).length;
  const isReviewDisabled =
    !customer ||
    !spId ||
    (!isCustomerCreating && selectedItemsCount === 0) ||
    (!isCustomerCreating && deliveryType === 'PICKUP' && !selectedCoworker);

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="space-y-6">
      {/* Customer Section */}
      {!isCustomerCreating ? (
      <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
        <h3 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>
          Find Customer
        </h3>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Enter customer phone number"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchCustomer()}
            disabled={!!customer}
            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm"
            style={{
              borderColor: COLORS.border.light,
              backgroundColor: COLORS.bg.primary,
              color: COLORS.text.primary,
            }}
          />
          <button
            onClick={handleSearchCustomer}
            disabled={isSearching || !!customer}
            className="px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {customer && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.bg.primary, borderColor: COLORS.border.light, border: `1px solid` }}>
            <p style={{ color: COLORS.text.secondary }}>Customer</p>
            <p className="font-semibold" style={{ color: COLORS.text.primary }}>
              {customer.name}
            </p>
            <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
              {customer.phone}
            </p>
            <button
              onClick={() => {
                setCustomer(null);
                setCustomerPhone('');
                setDeliveryAddress('');
              }}
              className="text-sm mt-2 underline"
              style={{ color: COLORS.semantic.error }}
            >
              Change Customer
            </button>
          </div>
        )}
      </div>
      ) : (
      <div className="p-4 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
        <h3 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>
          Service Provider
        </h3>

        {/* Selected SP chip */}
        {selectedSPName && (
          <div
            className="mb-3 p-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: `${COLORS.semantic.success}15`, border: `1px solid ${COLORS.semantic.success}40` }}
          >
            <div>
              <p className="text-xs mb-0.5" style={{ color: COLORS.text.secondary }}>Selected</p>
              <p className="font-semibold" style={{ color: COLORS.text.primary }}>{selectedSPName}</p>
              {selectedSpId === associatedSpId && associatedSpId && (
                <p className="text-xs mt-0.5" style={{ color: COLORS.semantic.success }}>Your Provider</p>
              )}
            </div>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.semantic.success }} />
          </div>
        )}

        {/* Search row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            value={spSearchText}
            onChange={e => setSpSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSPSearch()}
            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm"
            style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.primary, color: COLORS.text.primary }}
          />
          <button
            onClick={handleSPSearch}
            className="px-3 py-2 rounded-lg font-medium text-white flex items-center gap-1 text-sm transition hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>

        {/* Results popup */}
        {spSearchResults !== null && (
          <div className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: COLORS.border.light }}>
            {spSearchResults.length === 0 ? (
              <p className="p-3 text-sm text-center" style={{ color: COLORS.text.secondary }}>
                No providers found matching your search
              </p>
            ) : (
              spSearchResults.map(sp => (
                <button
                  key={sp.spId}
                  onClick={() => handleSelectSP(sp)}
                  className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition flex items-center justify-between border-b last:border-b-0"
                  style={{
                    backgroundColor: sp.spId === selectedSpId ? `${COLORS.semantic.info}10` : COLORS.bg.primary,
                    borderColor: COLORS.border.light,
                    color: COLORS.text.primary,
                  }}
                >
                  <span className="font-medium">{sp.businessName}</span>
                  {sp.spId === associatedSpId && associatedSpId && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{ backgroundColor: `${COLORS.semantic.success}20`, color: COLORS.semantic.success }}
                    >
                      Your Provider
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      )}

      {/* Menu Items - Scrollable with sticky summary */}
      {!isLoadingMenu ? (
        <div className="space-y-4">
          <h3 className="font-semibold" style={{ color: COLORS.text.primary }}>
            Select Items
          </h3>

          {/* Scrollable list with sticky footer */}
          <div className="flex flex-col rounded-lg border overflow-hidden" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
            {/* Scrollable items container */}
            <div className="max-h-96 overflow-y-auto space-y-2 p-2">
              {orderItems.map(item => (
                <div
                  key={item.menuItemId}
                  className="p-3 rounded-lg border flex items-center justify-between"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: item.qty > 0 ? `${COLORS.semantic.success}10` : COLORS.bg.primary,
                  }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: COLORS.text.primary }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                      ₹{item.customPrice}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQtyChange(item.menuItemId, -1)}
                      disabled={item.qty === 0}
                      className="p-1 rounded transition disabled:opacity-50"
                      style={{ backgroundColor: COLORS.bg.surface }}
                    >
                      <Minus className="w-4 h-4" style={{ color: COLORS.text.primary }} />
                    </button>

                    <span className="w-8 text-center font-semibold text-sm" style={{ color: COLORS.text.primary }}>
                      {item.qty}
                    </span>

                    <button
                      onClick={() => handleQtyChange(item.menuItemId, 1)}
                      className="p-1 rounded transition"
                      style={{ backgroundColor: COLORS.semantic.success + '20' }}
                    >
                      <Plus className="w-4 h-4" style={{ color: COLORS.semantic.success }} />
                    </button>
                  </div>

                  <span className="ml-4 font-semibold text-sm w-16 text-right" style={{ color: COLORS.text.primary }}>
                    ₹{item.itemTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Sticky Summary at bottom of container */}
            <div
              className="p-4 border-t"
              style={{
                borderColor: COLORS.border.light,
                backgroundColor: COLORS.bg.surface,
              }}
            >
              <div className="flex justify-between mb-2">
                <span style={{ color: COLORS.text.secondary }}>Subtotal</span>
                <span className="font-semibold" style={{ color: COLORS.text.primary }}>
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.text.secondary }}>
                  {orderItems.filter(i => i.qty > 0).length} items selected
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
        </div>
      )}

      {/* Delivery Details */}
      {(customer || isCustomerCreating) && (
        <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
          <h3 className="font-semibold" style={{ color: COLORS.text.primary }}>
            {isCustomerCreating ? 'Order Preferences' : 'Delivery Details'}
          </h3>

          {!isCustomerCreating && (
            <>
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                  rows={3}
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                  Delivery Date/Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={deliveryDateTime}
                  onChange={e => setDeliveryDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                  rows={2}
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                  }}
                />
              </div>
            </>
          )}

          {isCustomerCreating && (
            <div>
              <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                Instructions for Service Provider (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
                rows={2}
                style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.primary,
                  color: COLORS.text.primary,
                }}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
              Delivery Type
            </label>
            <div className="flex gap-4">
              {(['DROP', 'PICKUP'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryType"
                    value={type}
                    checked={deliveryType === type}
                    onChange={e => setDeliveryType(e.target.value as 'DROP' | 'PICKUP')}
                  />
                  <span style={{ color: COLORS.text.primary }}>{type === 'DROP' ? 'Delivery (Drop)' : 'Pickup'}</span>
                </label>
              ))}
            </div>
          </div>

          {deliveryType === 'PICKUP' && !isCustomerCreating && (
            <div>
              <label className="text-sm font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                Select Coworker for Pickup
              </label>
              {isLoadingCoworkers ? (
                <div className="w-full px-3 py-2 rounded-lg border text-sm" style={{
                  borderColor: COLORS.border.light,
                  backgroundColor: COLORS.bg.primary,
                  color: COLORS.text.secondary,
                }}>
                  Loading coworkers...
                </div>
              ) : (
                <select
                  value={selectedCoworker}
                  onChange={e => setSelectedCoworker(e.target.value)}
                  disabled={coworkers.length === 0}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm disabled:opacity-50"
                  style={{
                    borderColor: COLORS.border.light,
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                  }}
                >
                  <option value="">
                    {coworkers.length === 0 ? '-- No coworkers available --' : '-- Select Coworker --'}
                  </option>
                  {coworkers.map(coworker => (
                    <option key={coworker.uid} value={coworker.name}>
                      {coworker.uid === (firebaseUser?.uid || spId)
                        ? `Self - ${coworker.name}${coworker.phone ? ` (${coworker.phone})` : ''}`
                        : `${coworker.name}${coworker.phone ? ` (${coworker.phone})` : ''}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
              Payment Method
            </label>
            <div className="flex gap-4">
              {(['DIRECT', 'ONLINE'] as const).map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={e => setPaymentMethod(e.target.value as 'ONLINE' | 'DIRECT')}
                  />
                  <span style={{ color: COLORS.text.primary }}>{method === 'DIRECT' ? 'Direct Payment' : 'Online Payment'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex gap-3">
              {!isCustomerCreating && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold transition"
                  style={{
                    backgroundColor: COLORS.bg.surface,
                    color: COLORS.text.primary,
                    border: `1px solid ${COLORS.border.light}`,
                  }}
                >
                  Cancel
                </button>
              )}

              <button
                onClick={handleReview}
                disabled={isReviewDisabled}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: COLORS.semantic.info,
                }}
              >
                {isCustomerCreating && !selectedSpId ? 'Select a provider first' : isCustomerCreating && !customer ? 'Loading profile...' : 'Review Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Not Found Modal */}
      {showCustomerNotFound && (
        <CustomerNotFoundModal
          customerPhone={customerPhone}
          onCancel={() => setShowCustomerNotFound(false)}
          onCreateNew={() => {
            setShowCustomerNotFound(false);
            toast.error('TODO: Customer Create flow to be implemented');
          }}
        />
      )}
    </div>
  );
}

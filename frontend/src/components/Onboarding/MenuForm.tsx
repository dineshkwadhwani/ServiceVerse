import { useState, useEffect } from 'react';
import { Menu, Loader2, AlertCircle } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import type { MenuItem, CustomMenuItemData, OnboardingCommissionConfig } from '@/types';

interface Props {
  serviceId: string;
  menuItems: CustomMenuItemData[];
  commissionData: OnboardingCommissionConfig;
  onChange: (items: CustomMenuItemData[]) => void;
}

export function MenuForm({ serviceId, menuItems, commissionData, onChange }: Props) {
  const [masterMenuItems, setMasterMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[MenuForm] Loading menu for serviceId:', serviceId);
    if (!serviceId) {
      setError('Service ID is required to load menu items');
      setIsLoading(false);
      return;
    }
    loadMasterMenu();
  }, [serviceId]);

  const loadMasterMenu = async () => {
    console.log('[MenuForm] loadMasterMenu starting for serviceId:', serviceId);
    setIsLoading(true);
    setError(null);
    try {
      if (!serviceId) {
        throw new Error('Service ID is required to load menu items');
      }

      const response = await apiClient.getServiceMenuItems(serviceId);
      console.log('[MenuForm] Menu items loaded:', response.data?.menuItems?.length || 0);
      setMasterMenuItems(response.data?.menuItems || []);

      // Initialize customMenuItems from master menu if not already done
      if (menuItems.length === 0) {
        const initialized = (response.data?.menuItems || []).map((item: MenuItem) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          basePrice: item.basePrice,
          customPrice: item.basePrice,
          isEnabled: false,
          commissionPerItem: commissionData.type === 'FIXED' ? 0 : undefined,
        }));
        onChange(initialized);
        console.log('[MenuForm] Initialized custom menu items:', initialized.length);
      }
    } catch (err: any) {
      console.error('[MenuForm] Failed to load master menu:', err);
      setError(err.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMenuItem = (menuItemId: string, updates: Partial<CustomMenuItemData>) => {
    const updated = menuItems.map((item) =>
      item.menuItemId === menuItemId ? { ...item, ...updates } : item
    );
    onChange(updated);
  };

  const toggleItemEnabled = (menuItemId: string) => {
    const item = menuItems.find((m) => m.menuItemId === menuItemId);
    if (item) {
      updateMenuItem(menuItemId, { isEnabled: !item.isEnabled });
    }
  };

  const enabledCount = menuItems.filter((m) => m.isEnabled).length;
  const isValid = enabledCount > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Menu Items
          </h2>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: COLORS.semantic.info }} />
            <p style={{ color: COLORS.text.secondary }}>Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Menu Items
        </h2>
        <p style={{ color: COLORS.text.secondary }}>
          Select items you want to offer and set pricing
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{
            backgroundColor: `${COLORS.semantic.error}15`,
            color: COLORS.semantic.error,
          }}
        >
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load menu</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadMasterMenu}
              className="text-sm font-semibold mt-2 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {masterMenuItems.length === 0 && !error && (
        <div
          className="rounded-lg p-8 text-center border"
          style={{
            backgroundColor: COLORS.bg.primary,
            borderColor: COLORS.border.light,
          }}
        >
          <Menu className="w-8 h-8 mx-auto mb-3" style={{ color: COLORS.text.secondary }} />
          <p style={{ color: COLORS.text.secondary }}>
            No menu items available for this service yet
          </p>
        </div>
      )}

      {masterMenuItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ color: COLORS.text.primary }}>
                Available Items
              </h3>
              <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                {enabledCount} of {masterMenuItems.length} selected
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (enabledCount === masterMenuItems.length) {
                  onChange(menuItems.map((m) => ({ ...m, isEnabled: false })));
                } else {
                  onChange(
                    menuItems.map((m) => ({ ...m, isEnabled: true }))
                  );
                }
              }}
              className="text-sm font-semibold px-3 py-1 rounded border transition"
              style={{
                backgroundColor: `${COLORS.semantic.info}20`,
                borderColor: COLORS.semantic.info,
                color: COLORS.semantic.info,
              }}
            >
              {enabledCount === masterMenuItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {menuItems.map((item) => (
              <div
                key={item.menuItemId}
                className="p-4 border rounded-lg transition"
                style={{
                  backgroundColor: item.isEnabled ? `${COLORS.semantic.success}10` : COLORS.bg.primary,
                  borderColor: item.isEnabled ? COLORS.semantic.success : COLORS.border.light,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.isEnabled}
                    onChange={() => toggleItemEnabled(item.menuItemId)}
                    className="w-5 h-5 mt-1 rounded cursor-pointer"
                  />

                  {/* Item Details */}
                  <div className="flex-1">
                    <h4
                      className="font-semibold"
                      style={{ color: COLORS.text.primary }}
                    >
                      {item.name}
                    </h4>

                    {item.isEnabled && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {/* Cost */}
                        <div>
                          <label className="text-xs font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                            Cost
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.customPrice}
                              onChange={(e) =>
                                updateMenuItem(item.menuItemId, {
                                  customPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              min="0"
                              step="1"
                              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none text-sm"
                              style={{
                                backgroundColor: COLORS.bg.surface,
                                borderColor: COLORS.border.light,
                                color: COLORS.text.primary,
                              }}
                            />
                            <span style={{ color: COLORS.text.primary }} className="font-semibold">
                              ₹
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                            Master: ₹{item.basePrice}
                          </p>
                        </div>

                        {/* Commission (Fixed only) */}
                        {commissionData.type === 'FIXED' && (
                          <div>
                            <label className="text-xs font-semibold block mb-1" style={{ color: COLORS.text.secondary }}>
                              Commission
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.commissionPerItem ?? 0}
                                onChange={(e) =>
                                  updateMenuItem(item.menuItemId, {
                                    commissionPerItem: parseFloat(e.target.value) || 0,
                                  })
                                }
                                min="0"
                                step="1"
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none text-sm"
                                style={{
                                  backgroundColor: COLORS.bg.surface,
                                  borderColor: COLORS.border.light,
                                  color: COLORS.text.primary,
                                }}
                              />
                              <span style={{ color: COLORS.text.primary }} className="font-semibold">
                                ₹
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                              Per order
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isValid && masterMenuItems.length > 0 && (
        <div
          className="rounded-lg p-4 flex items-start gap-2"
          style={{
            backgroundColor: `${COLORS.semantic.warning}15`,
            color: COLORS.semantic.warning,
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Please select at least one menu item</p>
          </div>
        </div>
      )}
    </div>
  );
}

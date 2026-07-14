import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';

interface MenuItem {
  menuItemId: string;
  name: string;
  price: number;
  description?: string;
}

interface MenuItemWithSelection extends MenuItem {
  selected: boolean;
  customPrice: number;
  masterPrice: number;
}

interface MenuSelectionStepProps {
  spId: string;
  serviceId: string;
}

export function MenuSelectionStep({ spId, serviceId }: MenuSelectionStepProps) {
  const [menuItems, setMenuItems] = useState<MenuItemWithSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadMasterMenu();
  }, [serviceId]);

  const loadMasterMenu = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getServiceMenuItems(serviceId);
      const items = response.data?.menuItems || [];
      setMenuItems(
        items.map((item: any) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          description: item.description,
          selected: false,
          customPrice: item.price,
          masterPrice: item.price,
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (menuItemId: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const updatePrice = (menuItemId: string, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    setMenuItems(
      menuItems.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, customPrice: price }
          : item
      )
    );
  };

  const handleSaveMenu = async () => {
    const selectedItems = menuItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      toast.error('Please select at least one menu item');
      return;
    }

    // Validate all selected items have prices
    const invalidItems = selectedItems.filter(item => !item.customPrice || isNaN(item.customPrice));
    if (invalidItems.length > 0) {
      toast.error(`Price is required for: ${invalidItems.map(i => i.name).join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.saveSPMenuSelection(spId, serviceId, selectedItems);
      toast.success(`Menu configured with ${selectedItems.length} items`);
    } catch (error: any) {
      toast.error('Failed to save menu selection');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.semantic.info }} />
      </div>
    );
  }

  const selectedCount = menuItems.filter(item => item.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 style={{ color: COLORS.text.primary }} className="font-semibold">
            Select Menu Items
          </h3>
          <p style={{ color: COLORS.text.secondary }} className="text-sm">
            Choose which items this SP will offer. Prices default to master menu but can be customized.
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: selectedCount > 0 ? COLORS.semantic.info : COLORS.bg.hover,
            color: selectedCount > 0 ? 'white' : COLORS.text.secondary,
          }}
        >
          {selectedCount} selected
        </span>
      </div>

      {menuItems.length === 0 ? (
        <div
          className="p-6 rounded-lg border text-center"
          style={{
            backgroundColor: COLORS.bg.hover,
            borderColor: COLORS.border.light,
          }}
        >
          <p style={{ color: COLORS.text.secondary }}>No menu items available for this service</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3" style={{ borderColor: COLORS.border.light }}>
          {menuItems.map((item) => (
            <div
              key={item.menuItemId}
              className="p-3 rounded-lg border flex items-start gap-3"
              style={{
                backgroundColor: item.selected ? COLORS.bg.hover : COLORS.bg.primary,
                borderColor: item.selected ? COLORS.semantic.info : COLORS.border.light,
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItem(item.menuItemId)}
                className="mt-1"
                style={{ accentColor: COLORS.semantic.info }}
              />

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p style={{ color: COLORS.text.primary }} className="font-semibold text-sm">
                  {item.name}
                </p>
                {item.description && (
                  <p style={{ color: COLORS.text.secondary }} className="text-xs mt-1">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Price Input */}
              {item.selected && (
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS.text.secondary }} className="text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={item.customPrice}
                    onChange={(e) => updatePrice(item.menuItemId, e.target.value)}
                    placeholder={String(item.masterPrice)}
                    className="w-16 px-2 py-1 rounded border text-sm"
                    style={{
                      borderColor: COLORS.border.light,
                      backgroundColor: COLORS.bg.surface,
                      color: COLORS.text.primary,
                    }}
                    disabled={isSaving}
                  />
                  {item.customPrice !== item.masterPrice && (
                    <span style={{ color: COLORS.semantic.warning }} className="text-xs">
                      (was ₹{item.masterPrice})
                    </span>
                  )}
                </div>
              )}

              {/* Price Display (when not selected) */}
              {!item.selected && (
                <span style={{ color: COLORS.text.secondary }} className="text-sm whitespace-nowrap">
                  ₹{item.masterPrice}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveMenu}
        disabled={isSaving || selectedCount === 0}
        className="w-full px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50"
        style={{ backgroundColor: COLORS.semantic.success }}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Saving...
          </>
        ) : (
          `Save Menu (${selectedCount} items)`
        )}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItem, SPMenuItem } from '@/types';

interface SPMenuManagerProps {
  masterMenu: MenuItem[];
  spMenu: SPMenuItem[];
  onUpdateItem: (menuItemId: string, spPrice: number, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

interface EditingItem {
  menuItemId: string;
  spPrice: number;
}

export function SPMenuManager({
  masterMenu,
  spMenu,
  onUpdateItem,
  isLoading = false,
}: SPMenuManagerProps) {
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create a map for quick lookup
  const spMenuMap = new Map(spMenu.map((item) => [item.menuItemId, item]));

  const handleToggleItem = async (item: MenuItem) => {
    const spItem = spMenuMap.get(item.menuItemId);
    const isActive = spItem?.isActive ?? false;
    const spPrice = spItem?.spPrice ?? item.basePrice;

    setIsSaving(true);
    try {
      await onUpdateItem(item.menuItemId, spPrice, !isActive);
      // Update map
      if (spItem) {
        spItem.isActive = !isActive;
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrice = async (menuItemId: string, newPrice: number) => {
    const spItem = spMenuMap.get(menuItemId);
    const isActive = spItem?.isActive ?? false;

    if (newPrice < 0) {
      alert('Price cannot be negative');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateItem(menuItemId, newPrice, isActive);
      setEditingItem(null);
      // Update map
      if (spItem) {
        spItem.spPrice = newPrice;
      }
    } catch (error) {
      console.error('Error saving price:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getItemStatus = (item: MenuItem) => {
    const spItem = spMenuMap.get(item.menuItemId);
    return spItem || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Menu Management</h3>
        <span className="text-sm text-gray-600">
          {spMenu.filter((m) => m.isActive).length} of {masterMenu.length} items enabled
        </span>
      </div>

      {masterMenu.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No menu items available yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {masterMenu.map((item) => {
            const spItem = getItemStatus(item);
            const isActive = spItem?.isActive ?? false;
            const spPrice = spItem?.spPrice ?? item.basePrice;
            const isEditing = editingItem?.menuItemId === item.menuItemId;

            return (
              <div
                key={item.menuItemId}
                className={`border rounded-lg transition-all ${
                  isActive
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleItem(item)}
                      disabled={isLoading || isSaving}
                      className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                        isActive ? 'bg-blue-600' : 'bg-gray-300'
                      } flex items-center justify-between px-1 cursor-pointer disabled:opacity-50`}
                      title={isActive ? 'Click to disable' : 'Click to enable'}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-4' : ''
                        }`}
                      />
                    </button>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {item.name}
                      </p>
                      {item.image ? (
                        <p className="text-xs text-gray-500">Has custom image</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {item.name.substring(0, 2).toUpperCase()}
                        </p>
                      )}
                    </div>

                    {/* Master Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">Master: ₹{item.basePrice.toFixed(2)}</p>
                      <p
                        className={`font-semibold ${
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        Your: ₹{spPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() =>
                        setExpandedItem(expandedItem === item.menuItemId ? null : item.menuItemId)
                      }
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {expandedItem === item.menuItemId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedItem === item.menuItemId && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-200 space-y-3">
                    {/* Description */}
                    {item.description && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Description</p>
                        <p className="text-sm text-gray-700">{item.description}</p>
                      </div>
                    )}

                    {/* Image Preview */}
                    {item.image && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Item Image</p>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Price Edit */}
                    {isActive && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-2">Set Your Price</p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingItem?.spPrice ?? spPrice}
                              onChange={(e) =>
                                setEditingItem({
                                  menuItemId: item.menuItemId,
                                  spPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              autoFocus
                              disabled={isSaving}
                            />
                            <button
                              onClick={() =>
                                handleSavePrice(
                                  item.menuItemId,
                                  editingItem?.spPrice ?? spPrice
                                )
                              }
                              disabled={isSaving}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{spPrice.toFixed(2)}
                            </p>
                            <button
                              onClick={() =>
                                setEditingItem({
                                  menuItemId: item.menuItemId,
                                  spPrice,
                                })
                              }
                              disabled={isSaving}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                            >
                              <Edit2 className="w-3 h-3" />
                              Change Price
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

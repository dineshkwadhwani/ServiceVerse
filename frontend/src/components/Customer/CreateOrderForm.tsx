import { useState, useEffect } from 'react';
import { Plus, Minus, Calendar, Clock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@/utils/validators';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import type { SPMenuItem } from '@/types';

interface CreateOrderFormProps {
  serviceProviderId: string;
  spName: string;
  onOrderCreated?: () => void;
}

export function CreateOrderForm({
  serviceProviderId,
  spName,
  onOrderCreated,
}: CreateOrderFormProps) {
  const [menuItems, setMenuItems] = useState<SPMenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      items: [],
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: '09:00',
    },
  });

  const pickupDate = watch('pickupDate');
  const pickupTime = watch('pickupTime');

  useEffect(() => {
    fetchMenuItems();
  }, [serviceProviderId]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch SP's menu items from API
      // For now, use mock data
      const mockMenuItems: SPMenuItem[] = [
        {
          menuItemId: '1',
          name: 'Shirt',
          description: 'Regular shirt',
          basePrice: 50,
          spPrice: 50,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menuItemId: '2',
          name: 'Pant',
          description: 'Regular pant',
          basePrice: 60,
          spPrice: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          menuItemId: '3',
          name: 'Saree',
          description: 'Silk saree',
          basePrice: 100,
          spPrice: 100,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setMenuItems(mockMenuItems);
    } catch (error: any) {
      toast.error('Failed to load menu items', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newItems = { ...selectedItems };
      delete newItems[itemId];
      setSelectedItems(newItems);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: quantity });
    }
  };

  const getTotalItems = () => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    return Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find((m) => m.menuItemId === itemId);
      return sum + (item?.spPrice || 0) * qty;
    }, 0);
  };

  const onSubmit = async (data: any) => {
    if (getTotalItems() === 0) {
      toast.error('Please select at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        serviceProviderId,
        items: Object.entries(selectedItems).map(([itemId, quantity]) => {
          const item = menuItems.find((m) => m.menuItemId === itemId);
          return {
            menuItemId: itemId,
            menuItemName: item?.name,
            quantity,
            price: item?.spPrice,
          };
        }),
        pickupDate: new Date(data.pickupDate),
        pickupTime: data.pickupTime,
        totalAmount: getTotalAmount(),
      };

      await apiClient.createOrder(orderData);
      toast.success('Order created successfully');
      onOrderCreated?.();
    } catch (error: any) {
      toast.error('Failed to create order', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-600 mt-2">Loading menu items...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold">Create Order</h2>
        <p className="text-blue-100 mt-1">Order from {spName}</p>
      </div>

      {/* Menu Items Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Items</h3>

        {menuItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No items available</p>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item) => {
              const quantity = selectedItems[item.menuItemId] || 0;
              return (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      ₹{item.spPrice}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.menuItemId, quantity - 1)}
                      disabled={quantity === 0}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 rounded transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) =>
                        updateItemQuantity(item.menuItemId, parseInt(e.target.value) || 0)
                      }
                      className="w-16 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.menuItemId, quantity + 1)}
                      className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {quantity > 0 && (
                    <div className="ml-6 text-right font-semibold text-gray-900">
                      ₹{item.spPrice * quantity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pickup Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pickup Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Pickup Date *
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('pickupDate')}
            />
            {errors.pickupDate && (
              <p className="text-red-600 text-sm mt-1">{errors.pickupDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pickup Time *
            </label>
            <input
              type="time"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('pickupTime')}
            />
            {errors.pickupTime && (
              <p className="text-red-600 text-sm mt-1">{errors.pickupTime.message}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          ℹ️ Pickup will be from your registered address. Delivery will be from the service provider's location.
        </p>
      </div>

      {/* Order Summary */}
      {getTotalItems() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium text-gray-900">{getTotalItems()}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{getTotalAmount()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || getTotalItems() === 0}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
      >
        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {getTotalItems() === 0 ? 'Select Items to Create Order' : `Create Order (₹${getTotalAmount()})`}
      </button>
    </form>
  );
}

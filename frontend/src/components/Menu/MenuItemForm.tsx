import { useState } from 'react';
import { Upload, Trash2, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemSchema } from '@/utils/validators';
import { FormInput } from '@/components/Form/FormInput';
import type { MenuItem } from '@/types';

interface MenuItemFormProps {
  onAdd: (item: Omit<MenuItem, 'menuItemId' | 'createdAt' | 'updatedAt'>) => void;
  items: MenuItem[];
  onRemove: (index: number) => void;
  isLoading?: boolean;
}

interface MenuItemFormData {
  name: string;
  description?: string;
  basePrice: number;
  image?: File | null;
}

export function MenuItemForm({ onAdd, items, onRemove, isLoading = false }: MenuItemFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    mode: 'onBlur',
  });

  const imageFile = watch('image');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024) {
        alert('Image must be less than 100KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('image', file);
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    try {
      // Create menu item without image URL (will be uploaded separately)
      const newItem: Omit<MenuItem, 'menuItemId' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        image: imagePreview || undefined,
      };

      onAdd(newItem);
      reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Add Menu Items</h3>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Name */}
          <FormInput
            label="Item Name"
            placeholder="e.g., Wash & Iron"
            {...register('name')}
            error={errors.name?.message}
            disabled={isLoading || isSubmitting}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="e.g., Professional washing and ironing service"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm disabled:bg-gray-100"
              disabled={isLoading || isSubmitting}
              {...register('description')}
              rows={2}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Base Price */}
          <FormInput
            label="Price (₹)"
            placeholder="e.g., 150"
            type="number"
            step="0.01"
            min="0"
            {...register('basePrice', { valueAsNumber: true })}
            error={errors.basePrice?.message}
            disabled={isLoading || isSubmitting}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image (Optional, Max 100KB)
            </label>
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setValue('image', null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center text-xs text-blue-600 font-semibold border border-dashed border-blue-300">
                  {imageFile ? '✓' : 'No image'}
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isLoading || isSubmitting}
                />
              </label>
            </div>
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
            )}
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Menu Item'
            )}
          </button>
        </form>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Menu Items ({items.length})
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg border border-gray-200 flex items-start justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3 flex-1">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-blue-600">₹{item.basePrice.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-700 p-1 disabled:text-gray-300"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Items Warning */}
      {items.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <span className="text-amber-700 text-sm">
            ⚠️ At least 1 menu item is required to create a service
          </span>
        </div>
      )}
    </div>
  );
}

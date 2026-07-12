import { useState } from 'react';
import { Upload, Loader2, X, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemRequestSchema } from '@/utils/validators';
import { FormInput } from '@/components/Form/FormInput';
import type { MenuItemRequest } from '@/types';

interface RequestMenuItemFormProps {
  serviceId: string;
  serviceName: string;
  onSubmit: (data: {
    name: string;
    basePrice: number;
    image?: File;
  }) => Promise<void>;
  pendingRequests?: MenuItemRequest[];
}

interface FormData {
  name: string;
  basePrice: number;
  image?: File | null;
}

export function RequestMenuItemForm({
  serviceId,
  serviceName,
  onSubmit,
  pendingRequests = [],
}: RequestMenuItemFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(menuItemRequestSchema),
    mode: 'onBlur',
  });

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

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        name: data.name,
        basePrice: data.basePrice,
        image: data.image || undefined,
      });
      reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request New Menu Item</h3>
        <p className="text-sm text-gray-600 mb-6">
          Request a new item to be added to {serviceName} menu. SuperAdmin or AccountManager will
          review your request.
        </p>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Item Name */}
          <FormInput
            label="Item Name"
            placeholder="e.g., Dry Cleaning Service"
            {...register('name')}
            error={errors.name?.message}
            disabled={isSubmitting}
          />

          {/* Price */}
          <FormInput
            label="Price (₹)"
            placeholder="e.g., 200"
            type="number"
            step="0.01"
            min="0"
            {...register('basePrice', { valueAsNumber: true })}
            error={errors.basePrice?.message}
            disabled={isSubmitting}
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
                  No image
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
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-3">
            Your Pending Requests ({pendingRequests.length})
          </p>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.requestId} className="bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-gray-600">₹{request.basePrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      Pending
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

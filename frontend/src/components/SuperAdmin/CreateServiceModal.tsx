import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createServiceSchema } from '@/utils/validators';
import { createService as createServiceInFirestore } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import { DEFAULT_COLORS } from '@/utils/constants';
import type { Service, CreateServiceFormData } from '@/types';

interface CreateServiceModalProps {
  isOpen: boolean;
  service?: Service | null;
  onClose: () => void;
  onSave: () => void;
}

export function CreateServiceModal({
  isOpen,
  service,
  onClose,
  onSave,
}: CreateServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(service?.logo || null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(
    service?.heroImage || null
  );
  const [colors, setColors] = useState(
    service?.colorTheme || {
      primary: DEFAULT_COLORS.primary,
      secondary: DEFAULT_COLORS.secondary,
      accent: DEFAULT_COLORS.accent,
      primaryFontColor: DEFAULT_COLORS.primaryFont,
      secondaryFontColor: DEFAULT_COLORS.secondaryFont,
    }
  );
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      fromEmail: service?.fromEmail || '',
      fromName: service?.fromName || '',
      gstPercentage: service?.gstPercentage || 5,
      defaultCommission: service?.defaultCommission || {
        type: 'PERCENTAGE',
        value: 10,
        active: true,
      },
      colorTheme: colors,
    },
  });

  const commissionType = watch('defaultCommission.type');
  const gstPercentage = watch('gstPercentage');

  if (!isOpen) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('logo', file);
    }
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('heroImage', file);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    setValue('colorTheme', newColors);
  };

  const onSubmit = async (data: CreateServiceFormData) => {
    setIsSubmitting(true);
    try {
      if (service) {
        toast.error('Update not implemented yet');
        return;
      }

      await createServiceInFirestore(data);
      onSave();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save service';
      toast.error('Failed to save service', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {service ? 'Edit Service' : 'Create New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Laundry Service"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              placeholder="Describe the service"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Logo *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-input"
              />
              <label
                htmlFor="logo-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain mb-2"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                )}
                <span className="text-sm text-gray-600">Click to upload logo</span>
              </label>
            </div>
          </div>

          {/* Hero Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageChange}
                className="hidden"
                id="hero-input"
              />
              <label
                htmlFor="hero-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                {heroImagePreview ? (
                  <img
                    src={heroImagePreview}
                    alt="Hero preview"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                )}
                <span className="text-sm text-gray-600">Click to upload hero image</span>
              </label>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Theme *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'primary', label: 'Primary Color' },
                { key: 'secondary', label: 'Secondary Color' },
                { key: 'accent', label: 'Accent Color' },
                { key: 'primaryFontColor', label: 'Primary Font Color' },
              ].map((color) => (
                <div key={color.key}>
                  <label className="text-sm text-gray-600 mb-1 block">
                    {color.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[color.key as keyof typeof colors]}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colors[color.key as keyof typeof colors]}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email *
              </label>
              <input
                type="email"
                placeholder="noreply@serviceverse.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('fromEmail')}
              />
              {errors.fromEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.fromEmail.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name *
              </label>
              <input
                type="text"
                placeholder="ServiceVerse"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('fromName')}
              />
              {errors.fromName && (
                <p className="text-red-600 text-sm mt-1">{errors.fromName.message}</p>
              )}
            </div>
          </div>

          {/* GST & Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Percentage *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('gstPercentage', { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">Currently: {gstPercentage}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Type *
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('defaultCommission.type')}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="PER_ITEM">Per Item (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Value *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={commissionType === 'PERCENTAGE' ? '10' : '100'}
                {...register('defaultCommission.value', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 mt-8 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                  {...register('defaultCommission.active')}
                />
                <span className="text-sm text-gray-700">Commission Active</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium py-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createServiceSchema } from '@/utils/validators';
import { createService as createServiceInFirestore } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import { DEFAULT_COLORS } from '@/utils/constants';
import { FormInput } from '@/components/Form/FormInput';
import { FormTextarea } from '@/components/Form/FormTextarea';
import { MenuItemForm } from '@/components/Menu/MenuItemForm';
import { useFormErrors } from '@/hooks/useFormErrors';
import type { Service, CreateServiceFormData, MenuItem } from '@/types';

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>(service?.menuItems || []);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setFocus,
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
    mode: 'onBlur',
  });

  // Load existing service data when service prop changes
  useEffect(() => {
    if (service) {
      setMenuItems(service.menuItems || []);
    }
  }, [service?.serviceId]);

  const { hasErrors, errorCount } = useFormErrors({ errors, setFocus });
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
    // Validate at least 1 menu item
    if (menuItems.length === 0) {
      toast.error('At least 1 menu item is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (service) {
        toast.error('Update not implemented yet');
        return;
      }

      // Create service with embedded menu items
      await createServiceInFirestore(data, menuItems);
      onSave();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save service';
      toast.error('Failed to save service', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMenuItem = (item: Omit<MenuItem, 'menuItemId'>) => {
    const newItem: MenuItem = {
      ...item,
      menuItemId: `temp-${Date.now()}`,
    };
    setMenuItems([...menuItems, newItem]);
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
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
          {/* Error Summary */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Validation Error</h3>
                <p className="text-red-700 text-sm">
                  Please fix the {errorCount} error{errorCount !== 1 ? 's' : ''} below before saving.
                </p>
              </div>
            </div>
          )}

          {/* Service Name */}
          <FormInput
            label="Service Name"
            placeholder="e.g., Laundry Service"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Description */}
          <FormTextarea
            label="Description"
            placeholder="Describe the service"
            rows={3}
            error={errors.description?.message}
            required
            {...register('description')}
          />

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Logo <span className="text-red-500">*</span>
            </label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 transition
                ${errors.logo
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
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
                  <Upload className={`w-8 h-8 mb-2 ${errors.logo ? 'text-red-400' : 'text-gray-400'}`} />
                )}
                <span className={`text-sm ${errors.logo ? 'text-red-600' : 'text-gray-600'}`}>
                  Click to upload logo
                </span>
              </label>
            </div>
            {errors.logo && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.logo.message}
              </p>
            )}
          </div>

          {/* Hero Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image <span className="text-red-500">*</span>
            </label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 transition
                ${errors.heroImage
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
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
                  <Upload className={`w-8 h-8 mb-2 ${errors.heroImage ? 'text-red-400' : 'text-gray-400'}`} />
                )}
                <span className={`text-sm ${errors.heroImage ? 'text-red-600' : 'text-gray-600'}`}>
                  Click to upload hero image
                </span>
              </label>
            </div>
            {errors.heroImage && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.heroImage.message}
              </p>
            )}
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Theme <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'primary', label: 'Primary Color' },
                { key: 'secondary', label: 'Secondary Color' },
                { key: 'accent', label: 'Accent Color' },
                { key: 'primaryFontColor', label: 'Primary Font Color' },
              ].map((color) => {
                const colorError = (errors.colorTheme as any)?.[color.key];
                return (
                  <div key={color.key}>
                    <label className={`text-sm mb-1 block ${colorError ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {color.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[color.key as keyof typeof colors]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className={`w-12 h-10 rounded cursor-pointer border-2 ${colorError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <input
                        type="text"
                        value={colors[color.key as keyof typeof colors]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className={`
                          flex-1 px-3 py-2 border rounded text-sm
                          ${colorError
                            ? 'border-red-500 bg-red-50 focus:ring-red-400'
                            : 'border-gray-300 focus:ring-blue-500'
                          }
                          focus:outline-none focus:ring-2 transition
                        `}
                        placeholder="#000000"
                      />
                    </div>
                    {colorError && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {colorError.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Details */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="From Email"
              type="email"
              placeholder="noreply@serviceverse.com"
              error={errors.fromEmail?.message}
              required
              {...register('fromEmail')}
            />
            <FormInput
              label="From Name"
              type="text"
              placeholder="ServiceVerse"
              error={errors.fromName?.message}
              required
              {...register('fromName')}
            />
          </div>

          {/* GST & Commission */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="GST Percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              helperText={`Currently: ${gstPercentage}%`}
              error={errors.gstPercentage?.message}
              required
              {...register('gstPercentage', { valueAsNumber: true })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Type <span className="text-red-500">*</span>
              </label>
              <select
                className={`
                  w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
                  ${errors.defaultCommission?.type
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                  }
                `}
                {...register('defaultCommission.type')}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="PER_ITEM">Per Item (₹)</option>
              </select>
              {errors.defaultCommission?.type && (
                <p className="text-red-600 text-sm mt-1">{errors.defaultCommission.type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Commission Value"
              type="number"
              step="0.1"
              min="0"
              placeholder={commissionType === 'PERCENTAGE' ? '10' : '100'}
              error={errors.defaultCommission?.value?.message}
              required
              {...register('defaultCommission.value', { valueAsNumber: true })}
            />
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

          {/* Menu Items */}
          <div className="border-t border-gray-200 pt-6">
            <MenuItemForm
              items={menuItems}
              onAdd={handleAddMenuItem}
              onRemove={handleRemoveMenuItem}
              isLoading={isSubmitting}
            />
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

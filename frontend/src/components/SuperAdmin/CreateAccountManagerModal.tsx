import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import type { AccountManager } from '@/types';

const amSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit phone number is required'),
});

type AMFormData = z.infer<typeof amSchema>;

interface CreateAccountManagerModalProps {
  isOpen: boolean;
  accountManager?: AccountManager | null;
  onClose: () => void;
  onSave: () => void;
}

export function CreateAccountManagerModal({
  isOpen,
  accountManager,
  onClose,
  onSave,
}: CreateAccountManagerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AMFormData>({
    resolver: zodResolver(amSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: accountManager?.name || '',
        email: accountManager?.email || '',
        phone: accountManager?.phone || '',
      });
    }
  }, [isOpen, accountManager, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: AMFormData) => {
    setIsSubmitting(true);
    try {
      if (accountManager) {
        // Update existing AM
        await apiClient.updateAccountManager(accountManager.uid, data);
        toast.success('Account Manager updated successfully');
      } else {
        // Create new AM
        await apiClient.createAccountManager(data);
        toast.success('Account Manager created successfully');
      }
      onSave();
      onClose();
    } catch (error: any) {
      toast.error('Failed to save Account Manager', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {accountManager ? 'Edit Account Manager' : 'Create Account Manager'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('name')}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('email')}
            />
            <p className="text-xs text-gray-500 mt-1">Used for notifications and business communications</p>
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number * (Required for Login)
            </label>
            <input
              type="tel"
              placeholder="9876543210 (required for login)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('phone')}
            />
            <p className="text-xs text-gray-500 mt-1">Used for OTP-based authentication only</p>
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Note:</p>
            <p>
              The Account Manager can manage ServiceProviders and handle their portfolios after assignment.
            </p>
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
              {accountManager ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

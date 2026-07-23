import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';

interface EditUserModalProps {
  isOpen: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'SUPERADMIN' | 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'CUSTOMER' | 'COWORKER';
    status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
    verified?: boolean;
    businessName?: string;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

export function EditUserModal({ isOpen, user, onClose, onSave }: EditUserModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'INACTIVE',
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        status: user.status || 'ACTIVE',
      });
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isServiceProvider = user.role === 'SERVICE_PROVIDER';

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.updateUserByAdmin(user.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        status: formData.status,
        ...(isServiceProvider ? { businessName: formData.businessName } : {}),
      });

      toast.success('User updated successfully');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error('Failed to update user', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (user.role === 'SUPERADMIN') {
      return 'SUPERADMIN (always active)';
    }
    return status || 'ACTIVE';
  };

  const canChangeStatus = user.role !== 'SUPERADMIN';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-white/10 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit User</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Business Name (Service Providers only) */}
            {isServiceProvider && (
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">
                {isServiceProvider ? 'Owner Name' : 'Name'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Status */}
            {canChangeStatus && (
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Status</label>
                <div className="flex gap-2">
                  {['ACTIVE', 'INACTIVE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFormData({ ...formData, status: status as 'ACTIVE' | 'INACTIVE' })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        formData.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!canChangeStatus && (
              <div>
                <label className="block text-white font-semibold text-sm mb-2">Status</label>
                <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                  {getStatusDisplay(formData.status)}
                </div>
              </div>
            )}

            {/* Role (read-only) */}
            <div>
              <label className="block text-white font-semibold text-sm mb-2">Role</label>
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300 text-sm">
                {user.role} (read-only)
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-semibold text-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

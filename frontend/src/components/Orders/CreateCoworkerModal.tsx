import { useState } from 'react';
import { X } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

interface Props {
  spId: string;
  onClose: () => void;
  onCoworkerCreated?: () => void;
}

export function CreateCoworkerModal({ spId, onClose, onCoworkerCreated }: Props) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createCoworker(spId, {
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        status: formData.status,
      });

      toast.success('Coworker created successfully!');
      onCoworkerCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create coworker');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        style={{ backgroundColor: COLORS.bg.primary }}
      >
        {/* Header */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: COLORS.border.light }}
        >
          <h2 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Create Coworker
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:opacity-70 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" style={{ color: COLORS.text.secondary }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g., 9876543210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
              style={{
                borderColor: COLORS.border.light,
                backgroundColor: COLORS.bg.primary,
                color: COLORS.text.primary,
              }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
              Name
            </label>
            <input
              type="text"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
              style={{
                borderColor: COLORS.border.light,
                backgroundColor: COLORS.bg.primary,
                color: COLORS.text.primary,
              }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none text-sm"
              style={{
                borderColor: COLORS.border.light,
                backgroundColor: COLORS.bg.primary,
                color: COLORS.text.primary,
              }}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.surface,
                color: COLORS.text.primary,
                border: `1px solid ${COLORS.border.light}`,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: COLORS.semantic.info }}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

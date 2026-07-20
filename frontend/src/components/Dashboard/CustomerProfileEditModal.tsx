import { useState } from 'react';
import { X, Loader2, Mail, User, MapPin, Phone } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { ProfilePictureUpload } from '@/components/Shared/ProfilePictureUpload';

interface Props {
  userId: string;
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  area?: string;
  city?: string;
  pin?: string;
  photoUrl?: string;
  onClose: () => void;
  onComplete?: () => void;
}

interface FormData {
  name: string;
  email: string;
  address: string;
  area: string;
  city: string;
  pin: string;
  photoUrl: string;
}

export function CustomerProfileEditModal({
  userId,
  phone,
  name = '',
  email = '',
  address = '',
  area = '',
  city = '',
  pin = '',
  photoUrl = '',
  onClose,
  onComplete,
}: Props) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: name || '',
    email: email || '',
    address: address || '',
    area: area || '',
    city: city || '',
    pin: pin || '',
    photoUrl: photoUrl || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await apiClient.updateCustomerProfile(userId, formData);
      toast.success('Profile updated successfully!');
      onComplete?.();
      onClose();
    } catch (error: any) {
      toast.error('Failed to update profile: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.bg.surface,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-6 border-b"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-opacity-50 rounded transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Profile Picture */}
          <ProfilePictureUpload
            uid={userId}
            photoUrl={formData.photoUrl}
            name={formData.name}
            onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
          />

          {/* Phone (Read-only) */}
          <div>
            <label className="flex items-center gap-2 font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <div
              className="w-full px-4 py-3 border rounded-lg"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.secondary,
              }}
            >
              +91 {phone}
            </div>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Cannot be changed after registration
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              <MapPin className="w-4 h-4" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Street address"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>

          {/* Area */}
          <div>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Area / Locality"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>

          {/* City & PIN */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="City"
              className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
            <input
              type="text"
              name="pin"
              value={formData.pin}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="PIN Code"
              className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex gap-3 p-6 border-t"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border rounded-lg font-semibold transition hover:bg-opacity-50 disabled:opacity-50"
            style={{
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { Mail, Phone, User, MapPin, Upload, ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/utils/firebase-config';
import { COLORS } from '@/utils/theme';
import { ProfilePictureUpload } from '@/components/Shared/ProfilePictureUpload';
import { resolveImageContentType, withTimeout } from '@/utils/imageUpload';
import { useToast } from '@/store/notificationStore';
import type { BasicInfoData } from '@/types';

const UPLOAD_TIMEOUT_MS = 20_000;
const TIMEOUT_MESSAGE = 'Upload timed out - please check your connection and try again';

interface Props {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  phoneNumber?: string;
  spId?: string;
}

export function BasicInfoForm({ data, onChange, phoneNumber, spId }: Props) {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof BasicInfoData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const path = `sp-logos/${spId || 'unknown'}/logo`;
      const storageRef = ref(storage, path);
      await withTimeout(
        uploadBytes(storageRef, file, { contentType: resolveImageContentType(file) }),
        UPLOAD_TIMEOUT_MS,
        TIMEOUT_MESSAGE
      );
      const url = await withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS, TIMEOUT_MESSAGE);
      onChange({ ...data, logoUrl: url });
    } catch (error: any) {
      console.error('Logo upload failed', { spId, code: error?.code, message: error?.message, error });
      toast.error(error?.message?.includes('timed out') ? error.message : `Failed to upload logo${error?.code ? ` (${error.code})` : ''}`);
    } finally {
      setIsUploading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValid = data.email && validateEmail(data.email) &&
                  data.name && data.ownerName &&
                  data.address && data.area && data.city && data.pinCode;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Basic Information
        </h2>
        <p style={{ color: COLORS.text.secondary }}>
          Update your business details
        </p>
      </div>

      <form className="space-y-6">
        {/* Your Photo (Owner - Optional) */}
        <div>
          <label className="flex items-center gap-2 font-semibold mb-3" style={{ color: COLORS.text.primary }}>
            <User className="w-4 h-4" />
            Your Photo <span className="text-xs font-normal ml-1" style={{ color: COLORS.text.secondary }}>(optional)</span>
          </label>
          <ProfilePictureUpload
            uid={spId || 'unknown'}
            photoUrl={data.photoUrl}
            name={data.ownerName || data.name}
            onChange={(url) => handleChange('photoUrl', url)}
          />
          <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
            This is you, the owner — separate from your business logo.
          </p>
        </div>

        {/* Business Logo (Optional) */}
        <div>
          <label className="flex items-center gap-2 font-semibold mb-3" style={{ color: COLORS.text.primary }}>
            <ImageIcon className="w-4 h-4" />
            Business Logo <span className="text-xs font-normal ml-1" style={{ color: COLORS.text.secondary }}>(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
              style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.hover }}
              onClick={() => fileInputRef.current?.click()}
            >
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Business logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8" style={{ color: COLORS.text.tertiary }} />
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition"
                style={{
                  borderColor: COLORS.border.light,
                  color: COLORS.text.primary,
                  backgroundColor: COLORS.bg.primary,
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : data.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                JPG, PNG or GIF · Max 2MB
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* Phone (Non-Editable) */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Phone className="w-4 h-4" />
            Phone Number
          </label>
          <div
            className="w-full px-4 py-3 border rounded-lg"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.secondary,
              opacity: 0.7,
            }}
          >
            +91 {phoneNumber || '—'}
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            Cannot be changed
          </p>
        </div>

        {/* Email */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="business@email.com"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
          />
          {data.email && !validateEmail(data.email) && (
            <p className="text-xs mt-1" style={{ color: COLORS.semantic.error }}>
              Please enter a valid email
            </p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <User className="w-4 h-4" />
            Business Name <span style={{ color: COLORS.semantic.error }}>*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your business name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
          />
        </div>

        {/* Owner Name */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <User className="w-4 h-4" />
            Owner Name
          </label>
          <input
            type="text"
            value={data.ownerName}
            onChange={(e) => handleChange('ownerName', e.target.value)}
            placeholder="Owner's full name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
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
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <MapPin className="w-4 h-4" />
            Address
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Street address"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
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
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <MapPin className="w-4 h-4" />
            Area
          </label>
          <input
            type="text"
            value={data.area}
            onChange={(e) => handleChange('area', e.target.value)}
            placeholder="Locality / Area"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block font-semibold mb-3 text-sm"
              style={{ color: COLORS.text.primary }}
            >
              City
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
          </div>
          <div>
            <label
              className="block font-semibold mb-3 text-sm"
              style={{ color: COLORS.text.primary }}
            >
              PIN Code
            </label>
            <input
              type="text"
              value={data.pinCode}
              onChange={(e) => handleChange('pinCode', e.target.value)}
              placeholder="PIN code"
              maxLength={6}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
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
      </form>

      {!isValid && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: `${COLORS.semantic.warning}15`,
            color: COLORS.semantic.warning,
          }}
        >
          Please fill in all required fields
        </div>
      )}
    </div>
  );
}

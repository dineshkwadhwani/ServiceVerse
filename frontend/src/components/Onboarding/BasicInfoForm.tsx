import { Mail, Phone, User, MapPin } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import type { BasicInfoData } from '@/types';

interface Props {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  phoneNumber?: string;
}

export function BasicInfoForm({ data, onChange, phoneNumber }: Props) {
  const handleChange = (field: keyof BasicInfoData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
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

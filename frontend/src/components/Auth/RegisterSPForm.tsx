import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Briefcase, User, Loader2, MapPin } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { COLORS } from '@/utils/theme';
import { auth } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { clearRegistrationContext } from '@/utils/sessionStorage';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { OTPVerificationStep } from './OTPVerificationStep';

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  area?: string;
  city?: string;
  pin?: string;
}

interface Props {
  serviceId: string;
  serviceName?: string;
}

export function RegisterSPForm({ serviceId, serviceName }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    pin: '',
  });
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | null>(null);
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return false;
    }
    if (!formData.ownerName.trim()) {
      toast.error('Owner name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (formData.phone.length < 10) {
      toast.error('Phone number must be at least 10 digits');
      return false;
    }
    if (!formData.address?.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!formData.area?.trim()) {
      toast.error('Area is required');
      return false;
    }
    if (!formData.city?.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.pin?.trim()) {
      toast.error('PIN code is required');
      return false;
    }
    return true;
  };

  const handleSendPhoneOTP = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${formData.phone}`,
        recaptchaVerifier
      );

      setPhoneConfirmationResult(confirmationResult);
      setVerificationMethod('phone');
      setStep('verification');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneOTP = async () => {
    if (!validateForm()) return;

    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = '';
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      `+91${formData.phone}`,
      recaptchaVerifier
    );

    setPhoneConfirmationResult(confirmationResult);
    setVerificationMethod('phone');
  };

  const handleVerificationComplete = async (_verifiedMethod: 'email' | 'phone') => {
    setIsLoading(true);
    console.log('[RegisterSP] 🔵 Step 1: handleVerificationComplete called', { method: _verifiedMethod });

    try {
      // Complete registration (creates Firestore document if needed)

      const currentUser = await auth.currentUser?.getIdToken();
      console.log('[RegisterSP] 🔵 Step 2: Firebase auth check', {
        hasUser: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        hasToken: !!currentUser
      });

      const payload = {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        name: formData.ownerName, // Use owner name as user name
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        area: formData.area,
        city: formData.city,
        pin: formData.pin,
        serviceId,
        role: 'SERVICE_PROVIDER',
      };

      console.log('[RegisterSP] 🔵 Step 3: Sending completeRegistration request', payload);

      const response = await apiClient.completeRegistration(payload);

      console.log('[RegisterSP] 🟢 Step 4: Registration response received', response);

      // Step 5: Load user profile to populate auth store before navigation
      console.log('[RegisterSP] 🔵 Step 5: Loading user profile...');
      const { loadUserProfile } = useAuthStore.getState();
      if (auth.currentUser) {
        await loadUserProfile(auth.currentUser);
        console.log('[RegisterSP] 🟢 Step 6: User profile loaded, navigating to dashboard');
      }

      toast.success('Registration successful! Pending account manager assignment.');
      clearRegistrationContext(); // Clear sensitive data from sessionStorage
      navigate(`/dashboard`);
    } catch (error: any) {
      console.error('[RegisterSP] 🔴 Registration ERROR:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        fullError: error,
      });
      toast.error('Registration failed: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verification' && verificationMethod) {
    return (
      <OTPVerificationStep
        method={verificationMethod}
        email={formData.email}
        phone={formData.phone}
        onVerified={() => handleVerificationComplete(verificationMethod)}
        onBack={() => setStep('details')}
        onResend={verificationMethod === 'phone' ? handleResendPhoneOTP : undefined}
        isLoading={isLoading}
        confirmationResult={phoneConfirmationResult}
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Register as Service Provider
        </h1>
        <p style={{ color: COLORS.text.secondary }}>Grow your business with ServiceVerse</p>
      </div>

      <form
        className="space-y-6 border rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: COLORS.border.light,
        }}
      >
        {/* Service (Uneditable) */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Briefcase className="w-4 h-4" />
            Service
          </label>
          <div
            className="w-full px-4 py-3 border rounded-lg"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
              opacity: 0.7,
            }}
          >
            {serviceName || 'Service'}
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            You are registering to provide this service
          </p>
        </div>

        {/* Business Name */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Briefcase className="w-4 h-4" />
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            placeholder="Your business name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
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
            name="ownerName"
            value={formData.ownerName}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
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
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="business@email.com"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            For invoices and business communications
          </p>
        </div>

        {/* Phone */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Phone className="w-4 h-4" />
            Phone Number *
          </label>
          <div className="flex gap-2">
            <span
              className="px-4 py-3 border rounded-lg"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.secondary,
              }}
            >
              +91
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="10-digit phone number"
              maxLength={10}
              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
              style={{
                backgroundColor: COLORS.bg.primary,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
              required
            />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            *Will use this to verify your account
          </p>
        </div>

        {/* Address */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <MapPin className="w-4 h-4" />
            Business Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Street address"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
        </div>

        {/* Area */}
        <div>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            placeholder="Area / Locality *"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
        </div>

        {/* City & PIN */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="City *"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
          <input
            type="text"
            name="pin"
            value={formData.pin}
            onChange={handleInputChange}
            placeholder="PIN Code *"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.success)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
        </div>

        {/* Verification */}
        <div
          className="pt-4 border-t"
          style={{ borderColor: COLORS.border.light }}
        >
          <button
            type="button"
            onClick={handleSendPhoneOTP}
            disabled={isLoading || !formData.phone}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: COLORS.semantic.success }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            {isLoading ? 'Sending OTP...' : 'Verify with Phone OTP'}
          </button>
        </div>

        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: `${COLORS.semantic.info}15`,
            borderColor: `${COLORS.semantic.info}30`,
            borderWidth: '1px',
            color: COLORS.semantic.info,
          }}
        >
          <p className="font-semibold mb-2">Next Steps:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Your account will be created in PENDING status</li>
            <li>SuperAdmin will assign you to an Account Manager</li>
            <li>Account Manager will help you complete onboarding</li>
            <li>You'll be active once onboarding is complete</li>
          </ul>
        </div>
      </form>

      <div id="recaptcha-container" className="mt-4"></div>

      <p className="text-center text-sm mt-6" style={{ color: COLORS.text.secondary }}>
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          style={{ color: COLORS.semantic.info }}
          className="hover:opacity-80"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

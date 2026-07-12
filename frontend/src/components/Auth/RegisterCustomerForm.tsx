import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, User, MapPin, Loader2 } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { COLORS } from '@/utils/theme';
import { auth } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { OTPVerificationStep } from './OTPVerificationStep';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  pin?: string;
}

export function RegisterCustomerForm({ serviceId }: { serviceId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
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
    if (!formData.name.trim()) {
      toast.error('Name is required');
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
    return true;
  };

  const handleSendPhoneOTP = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
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
      toast.error('Failed to send phone OTP: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = async (_verifiedMethod: 'email' | 'phone') => {
    setIsLoading(true);
    console.log('[RegisterCustomer] 🔵 Step 1: handleVerificationComplete called', { method: _verifiedMethod });

    try {
      // For phone: user is already signed in via Firebase Auth
      // For email: user will be signed in via email link (handled in callback page)

      const currentUser = await auth.currentUser?.getIdToken();
      console.log('[RegisterCustomer] 🔵 Step 2: Firebase auth check', {
        hasUser: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        hasToken: !!currentUser
      });

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        pin: formData.pin,
        serviceId,
        role: 'CUSTOMER',
      };

      console.log('[RegisterCustomer] 🔵 Step 3: Sending completeRegistration request', payload);

      // Complete registration (creates Firestore document if needed)
      const response = await apiClient.completeRegistration(payload);

      console.log('[RegisterCustomer] 🟢 Step 4: Registration response received', response);

      // Step 5: Load user profile to populate auth store before navigation
      console.log('[RegisterCustomer] 🔵 Step 5: Loading user profile...');
      const { loadUserProfile } = useAuthStore.getState();
      if (auth.currentUser) {
        await loadUserProfile(auth.currentUser);
        console.log('[RegisterCustomer] 🟢 Step 6: User profile loaded, navigating to dashboard');
      }

      toast.success('Registration successful!');
      navigate(`/dashboard`);
    } catch (error: any) {
      console.error('[RegisterCustomer] 🔴 Registration ERROR:', {
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
        isLoading={isLoading}
        confirmationResult={phoneConfirmationResult}
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Create Customer Account
        </h1>
        <p style={{ color: COLORS.text.secondary }}>Join ServiceVerse to discover and book services</p>
      </div>

      <form
        className="space-y-6 border rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: COLORS.border.light,
        }}
      >
        {/* Name */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <User className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            required
          />
        </div>

        {/* Email - For business communications only */}
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
            placeholder="your@email.com"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
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
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
              required
            />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            *Will use this to verify your account
          </p>
        </div>

        {/* Address (Optional) */}
        <div>
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <MapPin className="w-4 h-4" />
            Address{' '}
            <span className="text-sm" style={{ color: COLORS.text.secondary }}>
              (Optional - complete before ordering)
            </span>
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
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
          />
        </div>

        {/* City & PIN */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="City"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
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
            placeholder="PIN Code"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
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
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            {isLoading ? 'Sending OTP...' : 'Verify with Phone OTP'}
          </button>
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

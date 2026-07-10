import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, User, MapPin, Loader2 } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
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
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

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
      // Initialize reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${formData.phone}`,
        recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setVerificationMethod('phone');
      setStep('verification');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error('Failed to send phone OTP: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiClient.sendEmailOTP(formData.email);
      setVerificationMethod('email');
      setStep('verification');
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error('Failed to send email OTP: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = async (verifiedMethod: 'email' | 'phone') => {
    setIsLoading(true);
    try {
      await apiClient.registerCustomer({
        ...formData,
        serviceId,
        verifiedMethod,
      });

      toast.success('Registration successful!');
      navigate(`/services/${serviceId}`);
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message);
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
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Customer Account</h1>
        <p className="text-gray-400">Join ServiceVerse to discover and book services</p>
      </div>

      <form className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-8">
        {/* Name */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <User className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <Mail className="w-4 h-4" />
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-400 mt-1">*Will use this to verify your account</p>
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <Phone className="w-4 h-4" />
            Phone Number *
          </label>
          <div className="flex gap-2">
            <span className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-400">
              +91
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="10-digit phone number"
              maxLength="10"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">*Will use this to verify your account</p>
        </div>

        {/* Address (Optional) */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <MapPin className="w-4 h-4" />
            Address <span className="text-gray-400 text-sm">(Optional - complete before ordering)</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Street address"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            name="pin"
            value={formData.pin}
            onChange={handleInputChange}
            placeholder="PIN Code"
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Verification Methods */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-white font-semibold mb-4">Verify your account with at least one method:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleSendEmailOTP}
              disabled={isLoading || !formData.email}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Email OTP
            </button>

            <button
              type="button"
              onClick={handleSendPhoneOTP}
              disabled={isLoading || !formData.phone}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              Phone OTP
            </button>
          </div>
        </div>
      </form>

      <div id="recaptcha-container" className="mt-4"></div>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-400 hover:text-blue-300"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

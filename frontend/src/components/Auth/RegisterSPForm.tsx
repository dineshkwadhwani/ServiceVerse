import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Briefcase, User, Loader2 } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { OTPVerificationStep } from './OTPVerificationStep';

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
}

export function RegisterSPForm({ serviceId }: { serviceId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
  });
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | null>(null);

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
    return true;
  };

  const handleSendPhoneOTP = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      await signInWithPhoneNumber(
        auth,
        `+91${formData.phone}`,
        recaptchaVerifier
      );

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
      await apiClient.registerServiceProvider({
        ...formData,
        serviceId,
        verifiedMethod,
      });

      toast.success('Registration successful! Pending account manager assignment.');
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
        <h1 className="text-3xl font-bold text-white mb-2">Register as Service Provider</h1>
        <p className="text-gray-400">Grow your business with ServiceVerse</p>
      </div>

      <form className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-8">
        {/* Business Name */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <Briefcase className="w-4 h-4" />
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            placeholder="Your business name"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <User className="w-4 h-4" />
            Owner Name
          </label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
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
            placeholder="business@email.com"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
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
              maxLength={10}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">*Will use this to verify your account</p>
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

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
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

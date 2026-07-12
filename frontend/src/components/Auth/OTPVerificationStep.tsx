import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/store/notificationStore';

interface OTPVerificationStepProps {
  method: 'email' | 'phone';
  email: string;
  phone: string;
  onVerified: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  confirmationResult?: any; // Firebase phone confirmation result
}

export function OTPVerificationStep({
  method,
  email,
  phone,
  onVerified,
  onBack,
  isLoading,
  confirmationResult,
}: OTPVerificationStepProps) {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const displayValue = method === 'email' ? email : `+91 ${phone}`;

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      return;
    }

    setIsVerifying(true);
    try {
      if (method === 'phone' && confirmationResult) {
        // Verify phone OTP using Firebase confirmationResult
        await confirmationResult.confirm(otp);
        setIsVerified(true);
        toast.success('Phone verified successfully!');

        setTimeout(async () => {
          await onVerified();
        }, 1000);
      } else if (method === 'email') {
        // Email verification is handled via link - this shouldn't be called
        toast.error('Email verification is link-based. Please check your email.');
      }
    } catch (error: any) {
      toast.error('Verification failed: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // For email, show a different UI
  if (method === 'email') {
    return (
      <div>
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400">We've sent a verification link to</p>
          <p className="text-white font-semibold mt-2">{email}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-3">Check Your Email</h3>
            <p className="text-gray-400 mb-6">
              Click the verification link in your email to complete your registration. The link will open automatically when you click it.
            </p>
            <p className="text-sm text-gray-500">
              If you don't see the email, check your spam folder or wait a moment and refresh.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-semibold mb-1">✓ Link expires in 24 hours</p>
          <p className="text-xs">The verification link is secure and will only work for your account.</p>
        </div>
      </div>
    );
  }

  // For phone, show OTP input
  if (isVerified) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
        <p className="text-gray-400">Completing your registration...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        disabled={isVerifying || isLoading}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verify Your Phone</h1>
        <p className="text-gray-400">We've sent a verification code to</p>
        <p className="text-white font-semibold mt-2">{displayValue}</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <label className="flex items-center gap-2 text-white font-semibold mb-3">
            <Phone className="w-4 h-4" />
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest font-mono"
            disabled={isVerifying || isLoading}
          />
          <p className="text-xs text-gray-400 mt-2">Check your SMS for the code</p>
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={isVerifying || isLoading || otp.length < 6}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          {isVerifying || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>
      </div>

      <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-300">
        <p className="font-semibold mb-1">⏱️ Code expires in 10 minutes</p>
        <p className="text-xs">If you didn't request this code, you can safely ignore this message.</p>
      </div>
    </div>
  );
}

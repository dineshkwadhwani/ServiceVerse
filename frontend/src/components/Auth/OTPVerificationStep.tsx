import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

interface OTPVerificationStepProps {
  method: 'email' | 'phone';
  email: string;
  phone: string;
  onVerified: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function OTPVerificationStep({
  method,
  email,
  phone,
  onVerified,
  onBack,
  isLoading,
}: OTPVerificationStepProps) {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const displayValue = method === 'email' ? email : `+91 ${phone}`;

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      return;
    }

    setIsVerifying(true);
    try {
      let isValid = false;

      if (method === 'email') {
        isValid = await apiClient.verifyEmailOTP(email, otp);
      } else {
        isValid = await apiClient.verifyPhoneOTP(phone, otp);
      }

      if (isValid) {
        setIsVerified(true);
        toast.success('OTP verified successfully!');

        setTimeout(async () => {
          await onVerified();
        }, 1000);
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error('Verification failed: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsVerifying(true);
    try {
      if (method === 'email') {
        await apiClient.sendEmailOTP(email);
      } else {
        await apiClient.sendPhoneOTP(phone);
      }
      toast.success('OTP resent successfully');
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error('Failed to resend OTP: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-white mb-2">Verify Your {method === 'email' ? 'Email' : 'Phone'}</h1>
        <p className="text-gray-400">We've sent a verification code to</p>
        <p className="text-white font-semibold mt-2">{displayValue}</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        {/* OTP Input */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 text-white font-semibold mb-3`}>
            {method === 'email' ? (
              <Mail className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest font-mono"
            disabled={isVerifying || isLoading}
          />
          <p className="text-xs text-gray-400 mt-2">Check your {method} for the code</p>
        </div>

        {/* Verify Button */}
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

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-3">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={isVerifying || isLoading || resendCountdown > 0}
            className="text-blue-400 hover:text-blue-300 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-300">
        <p className="font-semibold mb-1">⏱️ Code expires in 10 minutes</p>
        <p className="text-xs">If you didn't request this code, you can safely ignore this message.</p>
      </div>
    </div>
  );
}

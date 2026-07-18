import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { useToast } from '@/store/notificationStore';
import { getAuthErrorMessage } from '@/utils/authErrors';

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
      toast.error(getAuthErrorMessage(error));
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
          className="flex items-center gap-2 mb-8 disabled:opacity-50 transition"
          style={{ color: COLORS.text.secondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Verify Your Email
          </h1>
          <p style={{ color: COLORS.text.secondary }}>We've sent a verification link to</p>
          <p className="font-semibold mt-2" style={{ color: COLORS.text.primary }}>
            {email}
          </p>
        </div>

        <div
          className="border rounded-2xl p-8"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.semantic.info }} />
            <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.text.primary }}>
              Check Your Email
            </h3>
            <p className="mb-6" style={{ color: COLORS.text.secondary }}>
              Click the verification link in your email to complete your registration. The link will open automatically when you click it.
            </p>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              If you don't see the email, check your spam folder or wait a moment and refresh.
            </p>
          </div>
        </div>

        <div
          className="mt-6 border rounded-lg p-4 text-sm"
          style={{
            backgroundColor: `${COLORS.semantic.info}15`,
            borderColor: `${COLORS.semantic.info}30`,
            color: COLORS.semantic.info,
          }}
        >
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
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.semantic.success}15` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: COLORS.semantic.success }} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Verified!
        </h2>
        <p style={{ color: COLORS.text.secondary }}>Completing your registration...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        disabled={isVerifying || isLoading}
        className="flex items-center gap-2 mb-8 disabled:opacity-50 transition"
        style={{ color: COLORS.text.secondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Verify Your Phone
        </h1>
        <p style={{ color: COLORS.text.secondary }}>We've sent a verification code to</p>
        <p className="font-semibold mt-2" style={{ color: COLORS.text.primary }}>
          {displayValue}
        </p>
      </div>

      <div
        className="border rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: COLORS.border.light,
        }}
      >
        <div className="mb-6">
          <label
            className="flex items-center gap-2 font-semibold mb-3"
            style={{ color: COLORS.text.primary }}
          >
            <Phone className="w-4 h-4" />
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 text-center text-lg tracking-widest font-mono transition"
            style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
              color: COLORS.text.primary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
            onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            disabled={isVerifying || isLoading}
          />
          <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
            Check your SMS for the code
          </p>
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={isVerifying || isLoading || otp.length < 6}
          className="w-full px-4 py-3 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: COLORS.semantic.info }}
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

      <div
        className="mt-6 border rounded-lg p-4 text-sm"
        style={{
          backgroundColor: `${COLORS.semantic.warning}15`,
          borderColor: `${COLORS.semantic.warning}30`,
          color: COLORS.semantic.warning,
        }}
      >
        <p className="font-semibold mb-1">⏱️ Code expires in 10 minutes</p>
        <p className="text-xs">If you didn't request this code, you can safely ignore this message.</p>
      </div>
    </div>
  );
}

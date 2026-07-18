import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { getAuthErrorMessage } from '@/utils/authErrors';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { firebaseUser, loadUserProfile } = useAuthStore();
  const toast = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Close modal if logged in
  useEffect(() => {
    if (firebaseUser) {
      onClose();
    }
  }, [firebaseUser, onClose]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const recaptchaContainer = document.getElementById('login-recaptcha');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const recaptchaContainer = document.getElementById('login-recaptcha');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier);
      setConfirmationResult(result);
      setOtp('');
      toast.success('OTP resent to your phone');
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      toast.error('Please enter a valid OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (!confirmationResult) {
        toast.error('Something went wrong. Please try again.');
        return;
      }

      await confirmationResult.confirm(otp);

      if (auth.currentUser) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/auth/complete-phone-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: auth.currentUser.uid,
              phone: `+91${phone}`,
            }),
          });
        } catch (error) {
          console.warn('Backend sync failed, continuing with login');
        }

        await loadUserProfile(auth.currentUser);
        toast.success('Login successful!');
        onClose();
      }
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Login</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="p-6 space-y-4">
          {step === 'phone' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send OTP
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify OTP
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending || isLoading}
                className="w-full text-blue-600 hover:text-blue-700 font-medium py-1 transition disabled:opacity-50 text-sm"
              >
                {isResending ? 'Resending OTP...' : 'Resend OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setConfirmationResult(null);
                }}
                className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition"
              >
                Back to Phone
              </button>
            </>
          )}

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register
            </button>
          </div>
        </form>

        {/* Recaptcha container */}
        <div id="login-recaptcha" />
      </div>
    </div>
  );
}

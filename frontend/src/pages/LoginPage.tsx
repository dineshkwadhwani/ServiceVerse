import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/utils/firebase-config';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { firebaseUser, loadUserProfile } = useAuthStore();
  const toast = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (firebaseUser) {
      navigate('/dashboard');
    }
  }, [firebaseUser, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaVerifier
      );

      setConfirmationResult(result);
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error('Failed to send OTP: ' + error.message);
    } finally {
      setIsLoading(false);
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

      // Call backend to handle phone sign-in completion
      // This sets custom claims and migrates pre-seeded users (like SuperAdmin)
      if (auth.currentUser) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/auth/complete-phone-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: auth.currentUser.uid,
              phone,
            }),
          });
        } catch (error) {
          console.warn('Could not complete phone sign-in on backend:', error);
        }

        // Refresh token to get updated custom claims
        await auth.currentUser.getIdToken(true);
      }

      setIsVerified(true);
      toast.success('Login successful!');

      // Load user profile after sign-in
      if (auth.currentUser) {
        await loadUserProfile(auth.currentUser);
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error: any) {
      toast.error('Invalid OTP: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ServiceVerse</h1>
          <p className="text-blue-100">Multi-Utility Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {step === 'phone' ? 'Sign In' : 'Verify OTP'}
          </h2>

          <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="space-y-5">
            {/* Phone Field */}
            {step === 'phone' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-600 font-medium">+91</span>
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">We'll send an OTP to verify your identity</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-lg tracking-widest font-mono"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2">Check your SMS for the code</p>
              </div>
            )}

            {/* Back Button (on OTP step) */}
            {step === 'otp' && (
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to phone number
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 'phone' ? 'Sending OTP...' : 'Verifying...'}
                </>
              ) : (
                step === 'phone' ? 'Send OTP' : 'Verify & Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo SuperAdmin:</p>
            <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
              <p><strong>Name:</strong> Dinesh Wadhwani</p>
              <p><strong>Phone:</strong> 9767676738</p>
              <p><strong>Email:</strong> dinesh.k.wadhwani@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-blue-100 text-sm">
          <p>© 2025 ServiceVerse. All rights reserved.</p>
        </div>
      </div>

      {/* Recaptcha Container */}
      <div id="recaptcha-container" />
    </div>
  );
}

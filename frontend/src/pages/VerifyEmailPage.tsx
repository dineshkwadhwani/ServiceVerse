import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signInWithEmailLink, isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/utils/firebase-config';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    handleEmailLinkVerification();
  }, []);

  const handleEmailLinkVerification = async () => {
    try {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        toast.error('Invalid verification link');
        navigate('/');
        return;
      }

      let email = window.localStorage.getItem('emailForSignIn');

      if (!email) {
        email = window.prompt('Please provide your email address for confirmation:') || '';
      }

      if (!email) {
        toast.error('Email is required');
        navigate('/');
        return;
      }

      await signInWithEmailLink(auth, email, window.location.href);

      const customerData = localStorage.getItem('customerRegistrationData');
      const spData = localStorage.getItem('spRegistrationData');

      if (customerData) {
        const data = JSON.parse(customerData);
        await apiClient.registerCustomer({
          ...data,
          verifiedMethod: 'email',
        });
        toast.success('Email verified! Registration complete.');
        localStorage.removeItem('customerRegistrationData');
        navigate('/dashboard/customer');
      } else if (spData) {
        const data = JSON.parse(spData);
        await apiClient.registerServiceProvider({
          ...data,
          verifiedMethod: 'email',
        });
        toast.success('Email verified! Registration complete.');
        localStorage.removeItem('spRegistrationData');
        navigate('/dashboard/service-provider');
      } else {
        toast.error('Registration data not found');
        navigate('/');
      }

      localStorage.removeItem('emailForSignIn');
    } catch (error: any) {
      toast.error('Email verification failed: ' + error.message);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return null;
}

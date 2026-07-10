import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase } from 'lucide-react';
import { RegisterSPForm } from '@/components/Auth/RegisterSPForm';
import { RegisterCustomerForm } from '@/components/Auth/RegisterCustomerForm';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<'SERVICE_PROVIDER' | 'CUSTOMER' | null>(
    (searchParams.get('role') as 'SERVICE_PROVIDER' | 'CUSTOMER') || null
  );

  const serviceId = searchParams.get('serviceId');

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Invalid registration link</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Join ServiceVerse</h1>
            <p className="text-gray-400">Choose how you want to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Option */}
            <button
              onClick={() => setRole('CUSTOMER')}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Customer</h2>
              <p className="text-gray-400 text-sm">Book services and make orders</p>
              <div className="mt-6 flex items-center justify-center">
                <span className="text-blue-400 font-semibold">Get Started →</span>
              </div>
            </button>

            {/* Service Provider Option */}
            <button
              onClick={() => setRole('SERVICE_PROVIDER')}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition">
                  <Briefcase className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Service Provider</h2>
              <p className="text-gray-400 text-sm">Provide services and grow your business</p>
              <div className="mt-6 flex items-center justify-center">
                <span className="text-purple-400 font-semibold">Get Started →</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <button
          onClick={() => setRole(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {role === 'CUSTOMER' ? (
          <RegisterCustomerForm serviceId={serviceId} />
        ) : (
          <RegisterSPForm serviceId={serviceId} />
        )}
      </div>
    </div>
  );
}

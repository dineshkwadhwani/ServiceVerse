import { X, User, Briefcase } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole: 'SERVICE_PROVIDER' | 'CUSTOMER') => {
    // Close modal and navigate to full registration page with role
    onClose();
    window.location.href = `/register?role=${selectedRole}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Choose your account type to get started
          </p>

          <button
            onClick={() => handleRoleSelect('CUSTOMER')}
            className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <User className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Register as Customer</p>
              <p className="text-xs text-gray-600">Browse and order services</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('SERVICE_PROVIDER')}
            className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
          >
            <Briefcase className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Register as Service Provider</p>
              <p className="text-xs text-gray-600">Offer services to customers</p>
            </div>
          </button>

          <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

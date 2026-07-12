import { X, User, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/utils/theme';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string;
}

export function RoleSelectionModal({ isOpen, onClose, serviceId }: RoleSelectionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'CUSTOMER' | 'SERVICE_PROVIDER') => {
    const params = new URLSearchParams();
    params.append('role', role);
    if (serviceId) params.append('serviceId', serviceId);
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-6"
        style={{
          backgroundColor: COLORS.bg.surface,
          boxShadow: COLORS.shadow.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ color: COLORS.text.primary }}
          >
            Get Started
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition"
            style={{ color: COLORS.text.secondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p
          className="mb-6 text-sm"
          style={{ color: COLORS.text.secondary }}
        >
          Choose your account type to get started
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Customer Option */}
          <button
            onClick={() => handleRoleSelect('CUSTOMER')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition"
            style={{
              borderColor: COLORS.border.light,
              backgroundColor: COLORS.bg.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.semantic.info;
              e.currentTarget.style.backgroundColor = COLORS.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border.light;
              e.currentTarget.style.backgroundColor = COLORS.bg.primary;
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: COLORS.semantic.info }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p
                className="font-semibold"
                style={{ color: COLORS.text.primary }}
              >
                I'm a Customer
              </p>
              <p
                className="text-xs"
                style={{ color: COLORS.text.secondary }}
              >
                Browse and book services
              </p>
            </div>
          </button>

          {/* Service Provider Option */}
          <button
            onClick={() => handleRoleSelect('SERVICE_PROVIDER')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 transition"
            style={{
              borderColor: COLORS.border.light,
              backgroundColor: COLORS.bg.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.semantic.success;
              e.currentTarget.style.backgroundColor = COLORS.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border.light;
              e.currentTarget.style.backgroundColor = COLORS.bg.primary;
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: COLORS.semantic.success }}
            >
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p
                className="font-semibold"
                style={{ color: COLORS.text.primary }}
              >
                I'm a Service Provider
              </p>
              <p
                className="text-xs"
                style={{ color: COLORS.text.secondary }}
              >
                Offer services to customers
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

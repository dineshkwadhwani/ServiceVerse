import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`}
        style={{
          backgroundColor: COLORS.bg.surface,
          boxShadow: COLORS.shadow.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: COLORS.border.light,
            backgroundColor: COLORS.bg.primary,
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: COLORS.text.primary }}
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition hover:bg-white"
              style={{ color: COLORS.text.secondary }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

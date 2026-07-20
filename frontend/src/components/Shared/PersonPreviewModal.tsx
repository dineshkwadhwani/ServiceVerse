import { User } from 'lucide-react';
import { Modal } from '@/components/Shared/Modal';
import { COLORS } from '@/utils/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  photoUrl?: string;
  label?: string;
}

export function PersonPreviewModal({ isOpen, onClose, name, photoUrl, label }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={label || 'Details'} size="sm">
      <div className="flex flex-col items-center text-center gap-3">
        <div
          className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: COLORS.bg.hover }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : name ? (
            <span className="text-4xl font-semibold" style={{ color: COLORS.text.secondary }}>
              {name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-12 h-12" style={{ color: COLORS.text.tertiary }} />
          )}
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
            {name}
          </p>
          {label && (
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              {label}
            </p>
          )}
        </div>
        {!photoUrl && (
          <p className="text-xs" style={{ color: COLORS.text.tertiary }}>
            No photo on file yet
          </p>
        )}
      </div>
    </Modal>
  );
}

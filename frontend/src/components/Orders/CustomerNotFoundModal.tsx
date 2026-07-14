import { AlertCircle } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface Props {
  customerPhone: string;
  onCancel: () => void;
  onCreateNew: () => void;
}

export function CustomerNotFoundModal({ customerPhone, onCancel, onCreateNew }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        style={{ backgroundColor: COLORS.bg.primary }}
      >
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12" style={{ color: COLORS.semantic.warning }} />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: COLORS.text.primary }}>
          Customer Not Found
        </h2>

        <p className="text-center mb-6" style={{ color: COLORS.text.secondary }}>
          No customer found with phone number{' '}
          <span className="font-semibold">{customerPhone}</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={onCreateNew}
            className="w-full px-4 py-2 rounded-lg font-semibold text-white transition"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            Create New Customer
          </button>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 rounded-lg font-semibold transition"
            style={{
              backgroundColor: COLORS.bg.surface,
              color: COLORS.text.primary,
              border: `1px solid ${COLORS.border.light}`,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { COLORS } from '@/utils/theme';

interface EmptyStateProps {
  message: string;
  children?: ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div
      className="rounded-lg p-8 text-center border"
      style={{
        backgroundColor: COLORS.bg.surface,
        borderColor: COLORS.border.light,
      }}
    >
      <p style={{ color: COLORS.text.secondary }}>{message}</p>
      {children}
    </div>
  );
}

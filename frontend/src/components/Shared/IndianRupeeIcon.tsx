import type { CSSProperties } from 'react';

interface IndianRupeeIconProps {
  className?: string;
  style?: CSSProperties;
}

// lucide-react@0.294 has no Indian Rupee glyph - this mirrors its icon API
// (className/style props, currentColor via style.color) so it drops in
// anywhere a lucide icon component is expected (e.g. StatsGrid's `icon` prop).
export function IndianRupeeIcon({ className = '', style }: IndianRupeeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M6 3h12M6 8h12M6 13h4c6 0 6-5 0-5M6 13l7 8" />
    </svg>
  );
}

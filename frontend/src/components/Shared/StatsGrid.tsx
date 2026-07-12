import { ComponentType } from 'react';
import { COLORS } from '@/utils/theme';

export interface StatCard {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: string;
}

export function StatsGrid({ stats, columns = 'grid-cols-2 lg:grid-cols-4' }: StatsGridProps) {
  return (
    <div className={`grid ${columns} gap-3 md:gap-4`}>
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <Icon className="w-6 h-6 mb-2" style={{ color }} />
          <p className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.text.primary }}>
            {value}
          </p>
          <p className="text-xs md:text-sm mt-1" style={{ color: COLORS.text.secondary }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

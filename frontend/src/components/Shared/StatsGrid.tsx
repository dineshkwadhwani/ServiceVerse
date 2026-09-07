import { ComponentType } from 'react';
import { COLORS } from '@/utils/theme';

export interface StatCard {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  id?: string;
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: string;
  onStatClick?: (stat: StatCard) => void;
}

export function StatsGrid({ stats, columns = 'grid-cols-2 lg:grid-cols-4', onStatClick }: StatsGridProps) {
  return (
    <div className={`grid ${columns} gap-3 md:gap-4`}>
      {stats.map((stat) => (
        <div
          key={stat.id || stat.label}
          onClick={() => onStatClick?.(stat)}
          className={`rounded-lg p-4 border ${onStatClick ? 'cursor-pointer transition hover:shadow-md hover:scale-105' : ''}`}
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <stat.icon className="w-6 h-6 mb-2" style={{ color: stat.color }} />
          <p className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.text.primary }}>
            {stat.value}
          </p>
          <p className="text-xs md:text-sm mt-1" style={{ color: COLORS.text.secondary }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

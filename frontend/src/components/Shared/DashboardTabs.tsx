import { ComponentType } from 'react';
import { COLORS } from '@/utils/theme';

export interface DashboardTab<T extends string = string> {
  id: T;
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface DashboardTabsProps<T extends string> {
  tabs: DashboardTab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}

export function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: DashboardTabsProps<T>) {
  return (
    <div
      className="border-b sticky top-0 z-20"
      style={{
        backgroundColor: COLORS.bg.surface,
        borderColor: COLORS.border.light,
      }}
    >
      <div className="flex gap-1 md:gap-2 px-4 py-3 justify-between sm:justify-start sm:overflow-x-auto">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg border whitespace-nowrap transition flex-1 sm:flex-none min-w-0"
            style={{
              color: activeTab === id ? 'white' : COLORS.text.secondary,
              backgroundColor: activeTab === id ? COLORS.semantic.info : COLORS.bg.hover,
              borderColor: activeTab === id ? COLORS.semantic.info : COLORS.border.medium,
            }}
            title={label}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

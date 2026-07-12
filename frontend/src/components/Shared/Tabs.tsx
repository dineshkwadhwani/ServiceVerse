import { ReactNode } from 'react';
import { COLORS } from '@/utils/theme';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div
        className="flex gap-1 overflow-x-auto border-b px-4 py-3 md:px-6 md:py-4"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: COLORS.border.light,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg
              whitespace-nowrap transition font-medium text-sm
              ${activeTab === tab.id ? 'font-semibold' : ''}
            `}
            style={{
              color:
                activeTab === tab.id
                  ? COLORS.semantic.info
                  : COLORS.text.secondary,
              backgroundColor:
                activeTab === tab.id ? COLORS.bg.hover : 'transparent',
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${COLORS.semantic.info}`
                  : 'none',
              paddingBottom: activeTab === tab.id ? '10px' : '14px',
            }}
          >
            {tab.icon && <div className="w-5 h-5 flex-shrink-0">{tab.icon}</div>}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// Tab Content component
interface TabContentProps {
  isActive: boolean;
  children: ReactNode;
}

export function TabContent({ isActive, children }: TabContentProps) {
  if (!isActive) return null;
  return <>{children}</>;
}

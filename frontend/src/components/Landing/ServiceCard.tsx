import { ChevronRight } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  onClick: (service: Service) => void;
  compact?: boolean; // mobile view
  showDetails?: boolean; // show status and menu items (default: false for landing page)
}

export function ServiceCard({
  service,
  onClick,
  compact = false,
  showDetails = false,
}: ServiceCardProps) {
  return (
    <button
      onClick={() => onClick(service)}
      className="w-full text-left rounded-lg overflow-hidden transition hover:shadow-lg active:shadow-md"
      style={{
        backgroundColor: COLORS.bg.surface,
        boxShadow: COLORS.shadow.md,
      }}
    >
      {/* Hero Image */}
      <div className={`w-full overflow-hidden ${compact ? 'h-32' : 'h-48'}`}>
        {service.heroImage ? (
          <img
            src={service.heroImage}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: service.colorTheme?.primary || COLORS.semantic.info,
              color: 'white',
            }}
          >
            {service.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
        {/* Logo & Name */}
        <div className="flex items-start gap-3">
          {!compact && service.logo && (
            <img
              src={service.logo}
              alt={service.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold truncate ${compact ? 'text-sm' : 'text-lg'}`}
              style={{ color: COLORS.text.primary }}
            >
              {service.name}
            </h3>
            {!compact && (
              <p
                className="text-xs mt-1 line-clamp-2"
                style={{ color: COLORS.text.secondary }}
              >
                {service.description}
              </p>
            )}
          </div>
        </div>

        {/* Details (Desktop only, only show if showDetails is true) */}
        {!compact && showDetails && (
          <div className="space-y-2 py-2 border-t" style={{ borderColor: COLORS.border.light }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: COLORS.text.secondary }}>Menu Items</span>
              <span
                className="font-semibold"
                style={{ color: COLORS.text.primary }}
              >
                {service.menuItems?.length || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: COLORS.text.secondary }}>Status</span>
              <span
                className="font-semibold"
                style={{
                  color:
                    service.status === 'ACTIVE'
                      ? COLORS.semantic.success
                      : COLORS.semantic.error,
                }}
              >
                {service.status}
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-2" style={{ color: COLORS.semantic.info }}>
          <span className="text-xs font-medium">View Service</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}

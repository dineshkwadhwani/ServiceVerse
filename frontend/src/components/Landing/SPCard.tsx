import { Star, MapPin } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface SPCardProps {
  sp: {
    spId: string;
    businessName: string;
    logo?: string;
    area?: string;
    city?: string;
    averageRating?: number;
    totalOrders?: number;
  };
  onClick: () => void;
}

export function SPCard({ sp, onClick }: SPCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border transition hover:border-blue-400 hover:shadow-md active:shadow-sm"
      style={{
        backgroundColor: COLORS.bg.surface,
        borderColor: COLORS.border.light,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        {sp.logo ? (
          <img
            src={sp.logo}
            alt={sp.businessName}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0"
            style={{ backgroundColor: COLORS.semantic.info }}
          >
            {sp.businessName.charAt(0)}
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: COLORS.text.primary }}
          >
            {sp.businessName}
          </h3>

          {/* Location */}
          {(sp.area || sp.city) && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: COLORS.text.secondary }}>
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {sp.area && sp.city ? `${sp.area}, ${sp.city}` : sp.city || sp.area}
              </span>
            </div>
          )}

          {/* Rating & Orders */}
          <div className="flex items-center justify-between mt-2">
            {sp.averageRating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" style={{ color: COLORS.semantic.warning }} />
                <span className="text-xs font-semibold" style={{ color: COLORS.text.primary }}>
                  {sp.averageRating.toFixed(1)}
                </span>
              </div>
            )}
            {sp.totalOrders !== undefined && (
              <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                {sp.totalOrders} orders
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

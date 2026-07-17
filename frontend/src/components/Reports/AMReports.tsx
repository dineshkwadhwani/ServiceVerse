import { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface SP {
  uid: string;
  businessName: string;
  email: string;
  phone: string;
  status: 'ASSIGNED' | 'ONBOARDED' | 'ACTIVE';
  onboardedAt?: Date;
  createdAt: Date;
  service?: {
    serviceId: string;
    serviceName: string;
  };
}

interface AMReportPageProps {
  reportType: 'assigned' | 'active' | 'pending';
  sps: SP[];
  stats: any;
  onBack: () => void;
  onRowClick?: (sp: SP) => void;
}

export function AMReportPage({ reportType, sps, stats, onBack, onRowClick }: AMReportPageProps) {
  const [filteredData, setFilteredData] = useState<SP[]>([]);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'ONBOARDED' | 'ACTIVE'>('ALL');
  const [baseData, setBaseData] = useState<SP[]>([]);

  useEffect(() => {
    let data: SP[] = [];
    if (reportType === 'assigned') {
      setTitle(`All Assigned Service Providers (${stats.totalSPs || 0})`);
      data = sps;
    } else if (reportType === 'active') {
      setTitle(`Active Service Providers (${stats.activeSPs || 0})`);
      data = sps.filter(sp => sp.status === 'ACTIVE');
    } else if (reportType === 'pending') {
      setTitle(`Pending Approvals (${stats.pendingApprovals || 0})`);
      data = sps.filter(sp => sp.status === 'ASSIGNED' || sp.status === 'ONBOARDED');
    }
    setBaseData(data);
    applyFilters(data, '', 'ALL');
    // Reset filters when changing report type
    setSearchQuery('');
    setStatusFilter('ALL');
  }, [reportType, sps, stats]);

  useEffect(() => {
    if (baseData.length > 0) {
      applyFilters(baseData, searchQuery, statusFilter);
    }
  }, [searchQuery, statusFilter, baseData]);

  const applyFilters = (data: SP[], query: string, status: string) => {
    let filtered = data;

    if (query.trim()) {
      filtered = filtered.filter(sp =>
        sp.businessName.toLowerCase().includes(query.toLowerCase()) ||
        sp.email.toLowerCase().includes(query.toLowerCase()) ||
        sp.phone.includes(query)
      );
    }

    if (status !== 'ALL') {
      filtered = filtered.filter(sp => sp.status === status);
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return COLORS.semantic.success;
      case 'ONBOARDED':
        return COLORS.semantic.warning;
      default:
        return COLORS.semantic.error;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      {/* Header with Back Button */}
      <div
        className="sticky top-0 z-30 px-4 md:px-6 lg:px-8 py-4 border-b"
        style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.primary }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:opacity-70 transition rounded-lg flex-shrink-0"
            style={{ color: COLORS.semantic.info }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold flex-1 min-w-0" style={{ color: COLORS.text.primary }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div
        className="sticky top-16 z-30 px-4 md:px-6 lg:px-8 py-3 border-b"
        style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.primary }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ borderColor: COLORS.border.light, backgroundColor: COLORS.bg.surface }}>
            <Search className="w-4 h-4" style={{ color: COLORS.text.secondary }} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: COLORS.text.primary }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border text-sm font-medium"
            style={{
              borderColor: COLORS.border.light,
              backgroundColor: COLORS.bg.surface,
              color: COLORS.text.primary,
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ONBOARDED">Onboarded</option>
            <option value="ACTIVE">Active</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-end px-4 py-2 text-sm" style={{ color: COLORS.text.secondary }}>
            Showing {filteredData.length} of {baseData.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pt-2">
        {filteredData.length > 0 ? (
          <div className="space-y-3">
            {filteredData.map((sp) => (
              <div
                key={sp.uid}
                onClick={() => onRowClick?.(sp)}
                className="p-4 rounded-lg border flex flex-col cursor-pointer hover:opacity-80 transition"
                style={{
                  backgroundColor: COLORS.bg.surface,
                  borderColor: COLORS.border.light,
                }}
              >
                <div className="flex-1 mb-4">
                  <p className="font-semibold text-lg" style={{ color: COLORS.text.primary }}>
                    {sp.businessName}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    {sp.email}
                  </p>
                  <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                    {sp.phone}
                  </p>
                  {sp.service && (
                    <p className="text-xs mt-3" style={{ color: COLORS.text.secondary }}>
                      Service: <span className="font-semibold">{sp.service.serviceName}</span>
                    </p>
                  )}
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white w-fit"
                  style={{ backgroundColor: getStatusColor(sp.status) }}
                >
                  {sp.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: COLORS.text.secondary }}>No data available</p>
          </div>
        )}
      </main>
    </div>
  );
}

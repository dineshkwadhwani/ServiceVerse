import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/store/notificationStore';
import { apiClient } from '@/services/apiClient';
import { Navbar } from '@/components/Shared/Navbar';
import { Tabs, TabContent } from '@/components/Shared/Tabs';
import { SPCard } from '@/components/Landing/SPCard';
import { RoleSelectionModal } from '@/components/Auth/RoleSelectionModal';
import { COLORS } from '@/utils/theme';
import type { Service, MenuItem } from '@/types';

interface SPDetail {
  spId: string;
  businessName: string;
  logo?: string;
  area?: string;
  city?: string;
  averageRating?: number;
  totalOrders?: number;
}

export function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [sps, setSPs] = useState<SPDetail[]>([]);
  const [filteredSPs, setFilteredSPs] = useState<SPDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'providers'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  useEffect(() => {
    if (serviceId) {
      loadService();
      loadSPs();
    }
  }, [serviceId]);

  useEffect(() => {
    filterSPs();
  }, [sps, searchQuery, filterCity, filterArea]);

  const loadService = async () => {
    try {
      const response = await apiClient.getService(serviceId!);
      setService(response.data?.service || response.data);
    } catch (error: any) {
      toast.error('Failed to load service');
    }
  };

  const loadSPs = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockSPs: SPDetail[] = [
        {
          spId: '1',
          businessName: 'Clean Pro Services',
          area: 'Downtown',
          city: 'New York',
          averageRating: 4.8,
          totalOrders: 245,
        },
        {
          spId: '2',
          businessName: 'Quick Service Solutions',
          area: 'Midtown',
          city: 'New York',
          averageRating: 4.6,
          totalOrders: 189,
        },
        {
          spId: '3',
          businessName: 'Best Service Provider',
          area: 'Brooklyn',
          city: 'Brooklyn',
          averageRating: 4.9,
          totalOrders: 312,
        },
      ];
      setSPs(mockSPs);
    } catch (error: any) {
      toast.error('Failed to load service providers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSPs = () => {
    let filtered = [...sps].sort((a, b) =>
      a.businessName.localeCompare(b.businessName)
    );

    if (searchQuery) {
      filtered = filtered.filter((sp) =>
        sp.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCity) {
      filtered = filtered.filter((sp) =>
        sp.city?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }

    if (filterArea) {
      filtered = filtered.filter((sp) =>
        sp.area?.toLowerCase().includes(filterArea.toLowerCase())
      );
    }

    setFilteredSPs(filtered);
  };

  if (!service && isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.semantic.info }} />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p style={{ color: COLORS.text.secondary }}>Service not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: COLORS.semantic.info }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      <Navbar />

      <main className="pb-8">
        {/* Hero Image */}
        <div className="h-48 md:h-64 w-full overflow-hidden">
          {service.heroImage ? (
            <img
              src={service.heroImage}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
              style={{ backgroundColor: service.colorTheme?.primary || COLORS.semantic.info }}
            >
              {service.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mt-4 mb-6 font-medium transition"
            style={{ color: COLORS.semantic.info }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Service Info */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: COLORS.text.primary }}
            >
              {service.name}
            </h1>
            <p style={{ color: COLORS.text.secondary }}>{service.description}</p>
          </div>

          {/* Tabs */}
          <Tabs
            tabs={[
              { id: 'menu', label: 'Master Menu' },
              { id: 'providers', label: 'Service Providers' },
            ]}
            activeTab={activeTab as any}
            onTabChange={(tab) => setActiveTab(tab as any)}
          >
            {/* Master Menu Tab */}
            <TabContent isActive={activeTab === 'menu'}>
              <div className="p-4 md:p-6">
                {service.menuItems && service.menuItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.menuItems.map((item: MenuItem) => (
                      <div
                        key={item.menuItemId}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.bg.surface,
                          borderColor: COLORS.border.light,
                        }}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <h3
                          className="font-semibold mb-1"
                          style={{ color: COLORS.text.primary }}
                        >
                          {item.name}
                        </h3>
                        {item.description && (
                          <p
                            className="text-sm mb-2"
                            style={{ color: COLORS.text.secondary }}
                          >
                            {item.description}
                          </p>
                        )}
                        <p
                          className="font-bold"
                          style={{ color: COLORS.semantic.info }}
                        >
                          ${item.basePrice}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: COLORS.text.secondary }}>No menu items available</p>
                )}
              </div>
            </TabContent>

            {/* Service Providers Tab */}
            <TabContent isActive={activeTab === 'providers'}>
              <div className="p-4 md:p-6 space-y-4">
                {/* Filters */}
                <div className="space-y-3 mb-6">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3 w-5 h-5"
                      style={{ color: COLORS.text.secondary }}
                    />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    />
                  </div>

                  {/* City & Area Filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Filter by city..."
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Filter by area..."
                      value={filterArea}
                      onChange={(e) => setFilterArea(e.target.value)}
                      className="px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    />
                  </div>
                </div>

                {/* SP List */}
                {filteredSPs.length > 0 ? (
                  <div className="space-y-3">
                    {filteredSPs.map((sp) => (
                      <div key={sp.spId} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <SPCard sp={sp} onClick={() => setShowRoleSelection(true)} />
                        </div>
                        <button
                          onClick={() => setShowRoleSelection(true)}
                          className="px-4 py-2 rounded-lg font-medium text-white transition whitespace-nowrap"
                          style={{ backgroundColor: COLORS.semantic.info }}
                        >
                          Book Now
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: COLORS.text.secondary }}>No service providers found</p>
                )}
              </div>
            </TabContent>
          </Tabs>
        </div>
      </main>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
        serviceId={serviceId}
      />
    </div>
  );
}

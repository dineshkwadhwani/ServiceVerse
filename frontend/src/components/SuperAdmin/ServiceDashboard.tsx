import { useEffect, useState } from 'react';
import { Plus, Edit2, Eye } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { CreateServiceModal } from './CreateServiceModal';
import { ServiceCard } from './ServiceCard';
import type { Service } from '@/types';

export function ServiceDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const toast = useToast();

  const ITEMS_PER_PAGE = 6;

  // Fetch services
  useEffect(() => {
    fetchServices();
  }, [currentPage]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getServices(currentPage, ITEMS_PER_PAGE);
      setServices(response.data.services || []);
      setTotalServices(response.data.total || 0);
    } catch (error: any) {
      toast.error('Failed to fetch services', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleServiceSaved = () => {
    setIsModalOpen(false);
    fetchServices();
    toast.success(
      selectedService ? 'Service updated successfully' : 'Service created successfully'
    );
  };

  const handleViewService = (service: Service) => {
    // Navigate to service detail page
    // window.location.href = `/superadmin/services/${service.serviceId}`;
    toast.info('View service detail', `Service: ${service.name}`);
  };

  const totalPages = Math.ceil(totalServices / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage all utility services on the platform</p>
        </div>
        <button
          onClick={handleCreateService}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Create Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Services</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalServices}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Active Services</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {services.filter((s) => s.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Inactive Services</p>
          <p className="text-3xl font-bold text-gray-400 mt-2">
            {services.filter((s) => s.status === 'INACTIVE').length}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No services created yet</p>
          <button
            onClick={handleCreateService}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition mt-4"
          >
            <Plus className="w-4 h-4" />
            Create First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.serviceId}
              service={service}
              onEdit={handleEditService}
              onView={handleViewService}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Service Modal */}
      <CreateServiceModal
        isOpen={isModalOpen}
        service={selectedService}
        onClose={() => setIsModalOpen(false)}
        onSave={handleServiceSaved}
      />
    </div>
  );
}

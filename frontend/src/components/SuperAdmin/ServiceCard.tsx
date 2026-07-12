import { Edit2, Eye, ToggleRight, ToggleLeft } from 'lucide-react';
import type { Service } from '@/types';
import { toggleServiceStatus } from '@/services/serviceService';
import { useToast } from '@/store/notificationStore';
import { useState } from 'react';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onView: (service: Service) => void;
  onStatusChange?: () => void;
}

export function ServiceCard({ service, onEdit, onView, onStatusChange }: ServiceCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [status, setStatus] = useState(service.status);
  const toast = useToast();

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await toggleServiceStatus(service.serviceId, newStatus);
      setStatus(newStatus);
      toast.success(`Service ${newStatus.toLowerCase()}`);
      // Notify parent to refresh services list
      onStatusChange?.();
    } catch (error: any) {
      toast.error('Failed to update service status', error.message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 overflow-hidden">
      {/* Header with Logo */}
      <div
        className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${service.colorTheme.primary}, ${service.colorTheme.secondary})`,
        }}
      >
        {service.logo && (
          <img
            src={service.logo}
            alt={service.name}
            className="w-20 h-20 object-contain"
          />
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {service.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Menu Items:</span>
            <span className="font-semibold text-gray-900">
              {service.defaultCommission ? 12 : 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Commission:</span>
            <span className="font-semibold text-gray-900">
              {service.defaultCommission.type === 'PERCENTAGE'
                ? `${service.defaultCommission.value}%`
                : `₹${service.defaultCommission.value}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">GST:</span>
            <span className="font-semibold text-gray-900">
              {service.gstPercentage}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => onView(service)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg transition"
            title="View details"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">View</span>
          </button>
          <button
            onClick={() => onEdit(service)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 py-2 rounded-lg transition"
            title="Edit service"
          >
            <Edit2 className="w-4 h-4" />
            <span className="text-sm font-medium">Edit</span>
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
              status === 'ACTIVE'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            } disabled:opacity-50`}
            title={status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            {status === 'ACTIVE' ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

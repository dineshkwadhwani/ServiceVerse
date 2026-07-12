import { useState } from 'react';
import { X, Edit2 } from 'lucide-react';
import type { Service } from '@/types';
import { CreateServiceModal } from './CreateServiceModal';

interface ViewServiceModalProps {
  isOpen: boolean;
  service: Service | null;
  onClose: () => void;
  onServiceUpdated: () => void;
}

export function ViewServiceModal({
  isOpen,
  service,
  onClose,
  onServiceUpdated,
}: ViewServiceModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  if (!isOpen || !service) return null;

  // If in edit mode, show the CreateServiceModal with the service data
  if (isEditMode) {
    return (
      <CreateServiceModal
        isOpen={true}
        service={service}
        onClose={() => setIsEditMode(false)}
        onSave={() => {
          setIsEditMode(false);
          onServiceUpdated();
        }}
      />
    );
  }

  // View mode
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logo and Hero Image */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Logo</p>
              {service.logo && (
                <img
                  src={service.logo}
                  alt="Service logo"
                  className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Hero Image</p>
              {service.heroImage && (
                <img
                  src={service.heroImage}
                  alt="Hero image"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-gray-900 mt-1">{service.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">From Name</p>
                <p className="text-gray-900 mt-1">{service.fromName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">From Email</p>
                <p className="text-gray-900 mt-1">{service.fromEmail}</p>
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm font-medium text-gray-600 mb-3">Color Theme</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Primary', color: service.colorTheme.primary },
                { label: 'Secondary', color: service.colorTheme.secondary },
                { label: 'Accent', color: service.colorTheme.accent },
                { label: 'Primary Font', color: service.colorTheme.primaryFontColor },
                { label: 'Secondary Font', color: service.colorTheme.secondaryFontColor },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border border-gray-200"
                    style={{ backgroundColor: item.color }}
                    title={item.color}
                  />
                  <span className="text-sm text-gray-900">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Info */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">GST Percentage</p>
              <p className="text-gray-900 mt-1 text-lg font-semibold">
                {service.gstPercentage}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Commission Type</p>
              <p className="text-gray-900 mt-1 text-lg font-semibold">
                {service.defaultCommission.type === 'PERCENTAGE' ? 'Percentage' : 'Per Item'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Commission Value</p>
              <p className="text-gray-900 mt-1 text-lg font-semibold">
                {service.defaultCommission.type === 'PERCENTAGE'
                  ? `${service.defaultCommission.value}%`
                  : `₹${service.defaultCommission.value}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  service.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {service.status}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 space-y-1">
            <p>
              Created: {new Date(service.createdAt).toLocaleDateString()}{' '}
              {new Date(service.createdAt).toLocaleTimeString()}
            </p>
            <p>
              Updated: {new Date(service.updatedAt).toLocaleDateString()}{' '}
              {new Date(service.updatedAt).toLocaleTimeString()}
            </p>
            <p>Service ID: {service.serviceId}</p>
          </div>

          {/* Close Button */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

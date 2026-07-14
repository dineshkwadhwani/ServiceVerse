import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { COLORS } from '@/utils/theme';

interface CreateCustomerModalProps {
  onClose: () => void;
  onCustomerCreated: () => void;
}

type Step = 'search' | 'details' | 'confirmation';

interface SearchResult {
  status: 'NOT_EXISTS' | 'ASSOCIATED_OTHER_SP' | 'ASSOCIATED_SAME_SP' | 'EXISTS_ORPHANED';
  message?: string;
  customer?: {
    customerId: string;
    phone: string;
    name: string;
    address: string;
    email?: string;
  };
}

interface FormData {
  phone: string;
  name: string;
  address: string;
  email: string;
}

export function CreateCustomerModal({ onClose, onCustomerCreated }: CreateCustomerModalProps) {
  const [step, setStep] = useState<Step>('search');
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    name: '',
    address: '',
    email: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSearchCustomer = async () => {
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const result = await apiClient.searchCustomerByPhone(phone);
      setSearchResult(result?.data);

      if (result?.data?.status === 'NOT_EXISTS') {
        setFormData({ phone, name: '', address: '', email: '' });
        setStep('details');
      } else if (result?.data?.status === 'EXISTS_ORPHANED') {
        setStep('details');
      } else if (result?.data?.status === 'ASSOCIATED_OTHER_SP') {
        setError(result?.data?.message || 'Customer already exists and is associated with another Service Provider');
      } else if (result?.data?.status === 'ASSOCIATED_SAME_SP') {
        setError('Customer is already associated with you');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search customer');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateNewCustomer = async () => {
    if (!formData.name?.trim() || !formData.address?.trim()) {
      setError('Name and address are required');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      await apiClient.createNewCustomerWithAssociation(formData);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssociateExisting = async () => {
    if (!searchResult?.customer?.customerId) {
      setError('Customer ID not found');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      await apiClient.associateExistingCustomer(searchResult.customer.customerId);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to associate customer');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-xl"
        style={{ backgroundColor: COLORS.bg.surface }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: COLORS.border.light }}
        >
          <h2 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Create Customer
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70 transition"
          >
            <X className="w-6 h-6" style={{ color: COLORS.text.secondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Search by Phone */}
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.text.secondary }}
                >
                  Phone Number (10 digits)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  placeholder="9876543210"
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                  style={{
                    borderColor: error ? COLORS.semantic.error : COLORS.border.light,
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                  }}
                  disabled={isSearching}
                />
              </div>

              {error && (
                <div
                  className="p-3 rounded-lg flex gap-2"
                  style={{ backgroundColor: `${COLORS.semantic.error}20` }}
                >
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: COLORS.semantic.error }}
                  />
                  <p style={{ color: COLORS.semantic.error }} className="text-sm">
                    {error}
                  </p>
                </div>
              )}

              <button
                onClick={handleSearchCustomer}
                disabled={!phone || isSearching}
                className="w-full px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSearching ? 'Searching...' : 'Search Customer'}
              </button>
            </div>
          )}

          {/* Step 2: Details (New Customer or Associate) */}
          {step === 'details' && (
            <div className="space-y-4">
              {searchResult?.status === 'NOT_EXISTS' && (
                <>
                  <p style={{ color: COLORS.text.secondary }} className="text-sm">
                    Customer not found. Create new customer:
                  </p>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.text.secondary }}
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setError('');
                      }}
                      placeholder="Customer name"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                      style={{
                        borderColor: COLORS.border.light,
                        backgroundColor: COLORS.bg.primary,
                        color: COLORS.text.primary,
                      }}
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.text.secondary }}
                    >
                      Address *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        setError('');
                      }}
                      placeholder="Customer address"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none resize-none"
                      style={{
                        borderColor: COLORS.border.light,
                        backgroundColor: COLORS.bg.primary,
                        color: COLORS.text.primary,
                      }}
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.text.secondary }}
                    >
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                      }}
                      placeholder="customer@email.com"
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                      style={{
                        borderColor: COLORS.border.light,
                        backgroundColor: COLORS.bg.primary,
                        color: COLORS.text.primary,
                      }}
                      disabled={isCreating}
                    />
                  </div>
                </>
              )}

              {searchResult?.status === 'EXISTS_ORPHANED' && (
                <>
                  <p style={{ color: COLORS.text.secondary }} className="text-sm">
                    Customer found. Associate with your service:
                  </p>

                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: COLORS.bg.primary,
                      borderColor: COLORS.border.light,
                    }}
                  >
                    <p style={{ color: COLORS.text.primary }} className="font-medium">
                      {searchResult.customer?.name}
                    </p>
                    <p style={{ color: COLORS.text.secondary }} className="text-sm">
                      {searchResult.customer?.phone}
                    </p>
                    {searchResult.customer?.address && (
                      <p style={{ color: COLORS.text.secondary }} className="text-sm">
                        {searchResult.customer.address}
                      </p>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div
                  className="p-3 rounded-lg flex gap-2"
                  style={{ backgroundColor: `${COLORS.semantic.error}20` }}
                >
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: COLORS.semantic.error }}
                  />
                  <p style={{ color: COLORS.semantic.error }} className="text-sm">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStep('search');
                    setPhone('');
                    setSearchResult(null);
                    setFormData({ phone: '', name: '', address: '', email: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold transition"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    color: COLORS.text.primary,
                    border: `1px solid ${COLORS.border.light}`,
                  }}
                  disabled={isCreating}
                >
                  Back
                </button>

                <button
                  onClick={
                    searchResult?.status === 'NOT_EXISTS'
                      ? handleCreateNewCustomer
                      : handleAssociateExisting
                  }
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.semantic.success }}
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreating
                    ? 'Processing...'
                    : searchResult?.status === 'NOT_EXISTS'
                      ? 'Create Customer'
                      : 'Associate Customer'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2
                  className="w-12 h-12"
                  style={{ color: COLORS.semantic.success }}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text.primary }}>
                  Success!
                </h3>
                <p style={{ color: COLORS.text.secondary }} className="text-sm">
                  {searchResult?.status === 'NOT_EXISTS'
                    ? 'Customer created and associated successfully. A welcome email has been sent.'
                    : 'Customer associated successfully.'}
                </p>
              </div>

              <button
                onClick={() => {
                  onCustomerCreated();
                  onClose();
                }}
                className="w-full px-4 py-2 rounded-lg font-semibold text-white transition"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

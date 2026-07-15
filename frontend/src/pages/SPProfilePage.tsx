import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { BasicInfoForm } from '@/components/Onboarding/BasicInfoForm';
import { OperationsForm } from '@/components/Onboarding/OperationsForm';
import { COLORS } from '@/utils/theme';
import type { BasicInfoData, OperationsData } from '@/types';

export function SPProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<'basic' | 'operations'>('basic');

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    email: user?.email || '',
    name: '',
    ownerName: '',
    address: '',
    area: '',
    city: '',
    pinCode: '',
  });

  const [operations, setOperations] = useState<OperationsData>({
    workingHours: {
      monday: { open: false },
      tuesday: { open: false },
      wednesday: { open: false },
      thursday: { open: false },
      friday: { open: false },
      saturday: { open: false },
      sunday: { open: false },
    },
    pickupAvailable: false,
    deliveryAvailable: false,
  });

  useEffect(() => {
    // Load existing data from user profile if available
    const spUser = user as any; // Cast to access SP-specific properties
    if (spUser?.basicInfo) {
      setBasicInfo(spUser.basicInfo);
    }
    if (spUser?.operations) {
      setOperations(spUser.operations);
    }
  }, [user]);

  const isBasicInfoValid = () => {
    return (
      basicInfo.email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicInfo.email) &&
      basicInfo.name &&
      basicInfo.ownerName &&
      basicInfo.address &&
      basicInfo.area &&
      basicInfo.city &&
      basicInfo.pinCode
    );
  };

  const isOperationsValid = () => {
    return operations.pickupAvailable || operations.deliveryAvailable;
  };

  const handleSave = async () => {
    if (!isBasicInfoValid() || !isOperationsValid()) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Call API to save SP profile
      // const payload = { basicInfo, operations };
      // await apiClient.updateSPProfile(user!.uid, payload);

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg.primary }}>
      {/* Header */}
      <div
        className="border-b px-4 md:px-6 py-4"
        style={{ borderColor: COLORS.border.light }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg transition"
              style={{ color: COLORS.text.secondary }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                Complete Your Profile
              </h1>
              <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                Update your basic information and operations details
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Step Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveStep('basic')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeStep === 'basic'
                ? 'text-white'
                : ''
            }`}
            style={{
              backgroundColor: activeStep === 'basic' ? COLORS.semantic.info : COLORS.bg.surface,
              color: activeStep === 'basic' ? 'white' : COLORS.text.primary,
            }}
          >
            Step 1: Basic Info
          </button>
          <button
            onClick={() => setActiveStep('operations')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeStep === 'operations'
                ? 'text-white'
                : ''
            }`}
            style={{
              backgroundColor: activeStep === 'operations' ? COLORS.semantic.info : COLORS.bg.surface,
              color: activeStep === 'operations' ? 'white' : COLORS.text.primary,
            }}
          >
            Step 2: Operations
          </button>
        </div>

        {/* Content */}
        <div
          className="p-8 rounded-xl border"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          {activeStep === 'basic' && (
            <BasicInfoForm data={basicInfo} onChange={setBasicInfo} phoneNumber={user.phone} spId={user.uid} />
          )}

          {activeStep === 'operations' && (
            <OperationsForm data={operations} onChange={setOperations} />
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-lg font-semibold transition"
            style={{
              backgroundColor: COLORS.bg.surface,
              color: COLORS.text.primary,
              border: `1px solid ${COLORS.border.light}`,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isBasicInfoValid() || !isOperationsValid() || isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition disabled:opacity-50"
            style={{
              backgroundColor: COLORS.semantic.success,
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

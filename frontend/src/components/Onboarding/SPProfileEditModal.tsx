import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { BasicInfoForm } from './BasicInfoForm';
import { OperationsForm } from './OperationsForm';
import type {
  BasicInfoData,
  OperationsData,
} from '@/types';

interface Props {
  spId: string;
  spPhone: string;
  spEmail?: string;
  spBusinessName?: string;
  spOwnerName?: string;
  spAddress?: string;
  spArea?: string;
  spCity?: string;
  spPin?: string;
  // Existing data (for edit mode)
  existingBasicInfo?: BasicInfoData;
  existingOperations?: OperationsData;
  onComplete?: () => void;
  onCancel?: () => void;
}

type Step = 'basicInfo' | 'operations';

const STEPS: { id: Step; label: string; title: string }[] = [
  { id: 'basicInfo', label: 'Basic Info', title: 'Step 1 of 2' },
  { id: 'operations', label: 'Operations', title: 'Step 2 of 2' },
];

export function SPProfileEditModal({
  spId,
  spPhone,
  spEmail,
  spBusinessName,
  spOwnerName,
  spAddress,
  spArea,
  spCity,
  spPin,
  existingBasicInfo,
  existingOperations,
  onComplete,
  onCancel,
}: Props) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('basicInfo');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from existing data if available, otherwise from props
  const initialBasicInfo = existingBasicInfo || {
    email: spEmail || '',
    name: spBusinessName || '',
    ownerName: spOwnerName || '',
    address: spAddress || '',
    area: spArea || '',
    city: spCity || '',
    pinCode: spPin || '',
  };

  console.log('[SPProfileEditModal] Initializing with:', {
    existingBasicInfo,
    spEmail,
    spBusinessName,
    spAddress,
    spArea,
    spCity,
    spPin,
    initialBasicInfo,
  });

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>(initialBasicInfo);

  const [operations, setOperations] = useState<OperationsData>(
    existingOperations || {
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
    }
  );

  // Validation helpers
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
    return true; // All fields in operations are optional
  };

  const getStepValidity = (step: Step) => {
    switch (step) {
      case 'basicInfo':
        return isBasicInfoValid();
      case 'operations':
        return isOperationsValid();
    }
  };

  const canProceedToNext = getStepValidity(currentStep);
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    if (!isBasicInfoValid() || !isOperationsValid()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateSPData(spId, { basicInfo, operations });
      toast.success('Profile updated successfully!');
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        'Are you sure you want to cancel? All unsaved changes will be lost.'
      )
    ) {
      onCancel?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: COLORS.bg.primary }}
      >
        {/* Header */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: COLORS.border.light }}
        >
          <div>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              {STEPS[currentStepIndex].title}
            </p>
            <h2 className="text-xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
              Edit Your Profile
            </h2>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-2 hover:opacity-70 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" style={{ color: COLORS.text.secondary }} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.border.light }}>
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => {
                    if (index < currentStepIndex) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={index > currentStepIndex}
                  className="relative"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition"
                    style={{
                      backgroundColor:
                        index < currentStepIndex
                          ? COLORS.semantic.success
                          : index === currentStepIndex
                            ? COLORS.semantic.info
                            : `${COLORS.text.secondary}40`,
                      color: index <= currentStepIndex ? 'white' : COLORS.text.secondary,
                    }}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-1 rounded-full transition"
                    style={{
                      backgroundColor:
                        index < currentStepIndex ? COLORS.semantic.success : COLORS.border.light,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 'basicInfo' && (
            <BasicInfoForm
              data={basicInfo}
              onChange={setBasicInfo}
              phoneNumber={spPhone}
            />
          )}

          {currentStep === 'operations' && (
            <OperationsForm data={operations} onChange={setOperations} />
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t px-6 py-4 flex items-center justify-between"
          style={{ borderColor: COLORS.border.light }}
        >
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            style={{
              color: COLORS.text.primary,
              borderColor: COLORS.border.light,
              border: `1px solid ${COLORS.border.light}`,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              style={{
                backgroundColor: COLORS.bg.surface,
                color: COLORS.text.primary,
                border: `1px solid ${COLORS.border.light}`,
              }}
            >
              Cancel
            </button>

            {currentStepIndex === STEPS.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.semantic.success,
                }}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext || isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.semantic.info,
                }}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

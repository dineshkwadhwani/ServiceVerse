import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { BasicInfoForm } from './BasicInfoForm';
import { OperationsForm } from './OperationsForm';
import { DocumentationForm } from './DocumentationForm';
import { MenuForm } from './MenuForm';
import { ActivationStep } from './ActivationStep';
import type {
  BasicInfoData,
  OperationsData,
  DocumentationData,
  OnboardingCommissionConfig,
  CustomMenuItemData,
} from '@/types';

interface Props {
  spId: string;
  spPhone: string;
  spEmail: string;
  spBusinessName?: string;
  spOwnerName?: string;
  spAddress?: string;
  spArea?: string;
  spCity?: string;
  spPin?: string;
  serviceId: string;
  // Existing onboarding data (for edit mode)
  existingLogoUrl?: string;
  existingOperations?: any;
  existingDocumentation?: any;
  existingCommission?: any;
  existingMenus?: any;
  onComplete?: () => void;
  onCancel?: () => void;
}

type Step = 'basicInfo' | 'operations' | 'documentation' | 'menu' | 'activation';

const STEPS: { id: Step; label: string; title: string }[] = [
  { id: 'basicInfo', label: 'Basic Info', title: 'Step 1 of 5' },
  { id: 'operations', label: 'Operations', title: 'Step 2 of 5' },
  { id: 'documentation', label: 'Documentation', title: 'Step 3 of 5' },
  { id: 'menu', label: 'Menu', title: 'Step 4 of 5' },
  { id: 'activation', label: 'Activation', title: 'Step 5 of 5' },
];

export function SPOnboardingStepper({
  spId,
  spPhone,
  spEmail,
  spBusinessName,
  spOwnerName,
  spAddress,
  spArea,
  spCity,
  spPin,
  serviceId,
  existingLogoUrl,
  existingOperations,
  existingDocumentation,
  existingCommission,
  existingMenus,
  onComplete,
  onCancel,
}: Props) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('basicInfo');
  const [isSaving, setIsSaving] = useState(false);

  console.log('[SPOnboardingStepper] Rendered with:', {
    spId,
    serviceId,
    currentStep,
    hasExistingOperations: !!existingOperations,
    hasExistingMenus: !!existingMenus,
  });

  useEffect(() => {
    return () => {
      console.log('[SPOnboardingStepper] Component unmounting, currentStep was:', currentStep);
    };
  }, [currentStep]);

  // Form states - initialize with existing data if available (edit mode)
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    email: spEmail,
    name: spBusinessName || '',
    ownerName: spOwnerName || '',
    address: spAddress || '',
    area: spArea || '',
    city: spCity || '',
    pinCode: spPin || '',
    logoUrl: existingLogoUrl || '',
  });

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

  const [documentation, setDocumentation] = useState<DocumentationData>(
    existingDocumentation || {
      gstNumber: '',
      gstCollectionMandatory: false,
      directPaymentAllowed: false,
    }
  );

  const [commission, setCommission] = useState<OnboardingCommissionConfig>(
    existingCommission || {
      type: 'PERCENTAGE',
      value: 0,
    }
  );

  const [customMenus, setCustomMenus] = useState<CustomMenuItemData[]>(
    existingMenus || []
  );

  const [activation, setActivation] = useState({
    completeOnboarding: false,
    activateImmediately: false,
  });

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

  const isDocumentationValid = () => {
    return (
      (!documentation.gstCollectionMandatory || documentation.gstNumber) &&
      documentation.gstCollectionMandatory !== undefined &&
      documentation.directPaymentAllowed !== undefined &&
      (!documentation.directPaymentAllowed || documentation.qrCodeUrl) &&
      commission.type &&
      (commission.type === 'FIXED' || (commission.type === 'PERCENTAGE' && commission.value))
    );
  };

  const isMenuValid = () => {
    return customMenus.some((m) => m.isEnabled);
  };

  const getStepValidity = (step: Step) => {
    switch (step) {
      case 'basicInfo':
        return isBasicInfoValid();
      case 'operations':
        return isOperationsValid();
      case 'documentation':
        return isDocumentationValid();
      case 'menu':
        return isMenuValid();
    }
  };

  const canProceedToNext = getStepValidity(currentStep);
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    try {
      if (currentStepIndex < STEPS.length - 1) {
        const nextStep = STEPS[currentStepIndex + 1].id;
        console.log('[SPOnboardingStepper] Moving to step:', nextStep, {
          serviceId,
          currentStep,
          spId,
        });

        // Validate menu step requirements
        if (nextStep === 'menu' && !serviceId) {
          console.error('[SPOnboardingStepper] ERROR: Cannot proceed to menu step without serviceId!', {
            serviceId,
            spId,
          });
          toast.error('Service ID is missing. Cannot load menu items. Please contact your Account Manager.');
          return;
        }

        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('[SPOnboardingStepper] handleNext error:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    if (!isBasicInfoValid() || !isOperationsValid() || !isDocumentationValid() || !isMenuValid()) {
      toast.error('Please complete all steps');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        basicInfo,
        operations,
        documentation,
        commission,
        customMenus: {
          [serviceId]: customMenus.filter((m) => m.isEnabled),
        },
        activation,
      };

      await apiClient.completeOnboarding(spId, payload);
      toast.success('Onboarding completed successfully!');
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete onboarding');
      console.error('Onboarding error:', error);
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
              Onboard Service Provider
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
              spId={spId}
            />
          )}

          {currentStep === 'operations' && (
            <OperationsForm data={operations} onChange={setOperations} />
          )}

          {currentStep === 'documentation' && (
            <DocumentationForm
              documentationData={documentation}
              commissionData={commission}
              onDocumentationChange={setDocumentation}
              onCommissionChange={setCommission}
            />
          )}

          {currentStep === 'menu' && (
            <>
              {console.log('[SPOnboardingStepper] Rendering MenuForm with serviceId:', serviceId)}
              <MenuForm
                serviceId={serviceId}
                menuItems={customMenus}
                commissionData={commission}
                onChange={setCustomMenus}
              />
            </>
          )}

          {currentStep === 'activation' && (
            <ActivationStep
              spName={basicInfo.name}
              onCompleted={setActivation}
            />
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
                disabled={!activation.completeOnboarding || isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.semantic.success,
                }}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? 'Completing...' : 'Complete'}
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

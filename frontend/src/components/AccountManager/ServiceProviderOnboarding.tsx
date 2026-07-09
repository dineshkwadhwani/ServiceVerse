import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { spOnboardingSchema } from '@/utils/validators';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { DocumentUploadForm } from './DocumentUploadForm';
import { WorkingHoursForm } from './WorkingHoursForm';
import { CommissionSetupForm } from './CommissionSetupForm';
import type { OnboardSPFormData } from '@/types';

interface ServiceProviderOnboardingProps {
  spId: string;
  onComplete?: () => void;
}

export function ServiceProviderOnboarding({
  spId,
  onComplete,
}: ServiceProviderOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OnboardSPFormData>({
    resolver: zodResolver(spOnboardingSchema),
    mode: 'onChange',
    defaultValues: {
      businessName: '',
      ownerName: '',
      businessAddress: '',
      businessPhone: '',
      gstNumber: '',
      bankAccountDetails: {
        accountHolder: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
      },
      workingHours: {
        monday: { start: '09:00', end: '18:00', open: true },
        tuesday: { start: '09:00', end: '18:00', open: true },
        wednesday: { start: '09:00', end: '18:00', open: true },
        thursday: { start: '09:00', end: '18:00', open: true },
        friday: { start: '09:00', end: '18:00', open: true },
        saturday: { start: '10:00', end: '16:00', open: true },
        sunday: { start: '10:00', end: '14:00', open: false },
      },
      commission: {
        type: 'PERCENTAGE',
        value: 10,
        active: true,
      },
    },
  });

  const formData = watch();

  const steps = [
    {
      number: 1,
      title: 'Basic Information',
      description: 'Business and owner details',
    },
    {
      number: 2,
      title: 'Documents & Hours',
      description: 'Documents and working hours',
    },
    {
      number: 3,
      title: 'Commission',
      description: 'Commission setup and confirmation',
    },
  ];

  const handleNext = async () => {
    // Validate current step before moving to next
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardSPFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.onboardServiceProvider(spId, data);
      toast.success('ServiceProvider onboarded successfully');
      onComplete?.();
    } catch (error: any) {
      toast.error('Failed to onboard ServiceProvider', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold transition
                  ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {currentStep > step.number ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.number
                )}
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 transition
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Sudha's Laundry"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('businessName')}
                  />
                  {errors.businessName && (
                    <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Sudha Kumar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('ownerName')}
                  />
                  {errors.ownerName && (
                    <p className="text-red-600 text-sm mt-1">{errors.ownerName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address *
                </label>
                <textarea
                  placeholder="123 Main Street, Pune, 411001"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  {...register('businessAddress')}
                />
                {errors.businessAddress && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessAddress.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('businessPhone')}
                />
                {errors.businessPhone && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessPhone.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Documents & Working Hours */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Documents & Setup</h2>

              <DocumentUploadForm
                register={register}
                errors={errors}
                setValue={setValue}
                bankDetails={formData.bankAccountDetails}
              />

              <hr className="my-6" />

              <WorkingHoursForm
                register={register}
                formData={formData}
                setValue={setValue}
              />
            </div>
          )}

          {/* Step 3: Commission Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Commission & Confirmation</h2>

              <CommissionSetupForm
                register={register}
                watch={watch}
                errors={errors}
              />

              {/* Review Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Onboarding Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business Name:</span>
                    <span className="font-medium text-gray-900">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium text-gray-900">{formData.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{formData.businessPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-medium text-gray-900">
                      {formData.commission.type === 'PERCENTAGE'
                        ? `${formData.commission.value}%`
                        : `₹${formData.commission.value}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium py-3"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium py-3"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              Complete Onboarding
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

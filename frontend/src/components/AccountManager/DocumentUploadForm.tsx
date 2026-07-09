import { Upload } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { OnboardSPFormData } from '@/types';

interface DocumentUploadFormProps {
  register: UseFormRegister<OnboardSPFormData>;
  errors: FieldErrors<OnboardSPFormData>;
  setValue: UseFormSetValue<OnboardSPFormData>;
  bankDetails: OnboardSPFormData['bankAccountDetails'];
}

export function DocumentUploadForm({
  register,
  errors,
  setValue,
  bankDetails,
}: DocumentUploadFormProps) {
  const handleGSTUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('gstCertificate', file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('businessLogo', file);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Documents & Banking</h3>

      {/* GST Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GST Number (Optional)
        </label>
        <input
          type="text"
          placeholder="29ABCDE1234F0Z5"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('gstNumber')}
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty if not GST registered (business turnover &lt; ₹20L)
        </p>
      </div>

      {/* GST Certificate Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GST Certificate (PDF)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleGSTUpload}
            className="hidden"
            id="gst-upload"
          />
          <label htmlFor="gst-upload" className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload GST certificate</span>
          </label>
        </div>
      </div>

      {/* Business Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Logo *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
          />
          <label htmlFor="logo-upload" className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload business logo</span>
          </label>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Bank Account Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name *
          </label>
          <input
            type="text"
            placeholder="Sudha Kumar"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('bankAccountDetails.accountHolder')}
          />
          {errors.bankAccountDetails?.accountHolder && (
            <p className="text-red-600 text-sm mt-1">
              {errors.bankAccountDetails.accountHolder.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              placeholder="1234567890123456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('bankAccountDetails.accountNumber')}
            />
            {errors.bankAccountDetails?.accountNumber && (
              <p className="text-red-600 text-sm mt-1">
                {errors.bankAccountDetails.accountNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              placeholder="SBIN0001234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('bankAccountDetails.ifscCode')}
            />
            {errors.bankAccountDetails?.ifscCode && (
              <p className="text-red-600 text-sm mt-1">
                {errors.bankAccountDetails.ifscCode.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name *
          </label>
          <input
            type="text"
            placeholder="State Bank of India"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('bankAccountDetails.bankName')}
          />
          {errors.bankAccountDetails?.bankName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.bankAccountDetails.bankName.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

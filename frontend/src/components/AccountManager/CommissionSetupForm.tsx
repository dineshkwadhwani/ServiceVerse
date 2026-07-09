import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import type { OnboardSPFormData } from '@/types';

interface CommissionSetupFormProps {
  register: UseFormRegister<OnboardSPFormData>;
  watch: UseFormWatch<OnboardSPFormData>;
  errors: FieldErrors<OnboardSPFormData>;
}

export function CommissionSetupForm({
  register,
  watch,
  errors,
}: CommissionSetupFormProps) {
  const commissionType = watch('commission.type');
  const commissionValue = watch('commission.value');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Configuration</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Service Default:</strong> The platform has a default commission for this service.
            You can override it for this ServiceProvider if needed.
          </p>
        </div>

        <div className="space-y-4">
          {/* Commission Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Commission Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="PERCENTAGE"
                  className="w-4 h-4"
                  {...register('commission.type')}
                />
                <span className="text-gray-700">
                  Percentage (%)
                  <span className="text-gray-500 text-sm ml-2">
                    e.g., 10% of order value
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="PER_ITEM"
                  className="w-4 h-4"
                  {...register('commission.type')}
                />
                <span className="text-gray-700">
                  Per Item (₹)
                  <span className="text-gray-500 text-sm ml-2">
                    e.g., ₹10 per service item
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Commission Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Value *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder={commissionType === 'PERCENTAGE' ? '10' : '100'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('commission.value', { valueAsNumber: true })}
              />
              <span className="text-gray-600 font-medium">
                {commissionType === 'PERCENTAGE' ? '%' : '₹'}
              </span>
            </div>
            {errors.commission?.value && (
              <p className="text-red-600 text-sm mt-1">
                {errors.commission.value.message}
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
              {...register('commission.active')}
            />
            <span className="text-sm text-gray-700">Commission is active</span>
          </label>
        </div>
      </div>

      {/* Commission Preview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Commission Preview</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium text-gray-900">
              {commissionType === 'PERCENTAGE' ? 'Percentage' : 'Per Item'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Commission Rate:</span>
            <span className="font-medium text-gray-900">
              {commissionType === 'PERCENTAGE'
                ? `${commissionValue}% of order value`
                : `₹${commissionValue} per item`}
            </span>
          </div>

          <hr />

          {/* Example Calculation */}
          <div className="pt-3">
            <p className="font-medium text-gray-900 mb-2">Example Calculation:</p>
            {commissionType === 'PERCENTAGE' ? (
              <div className="space-y-1 text-gray-600">
                <div>Order Total: ₹1,000</div>
                <div>Commission ({commissionValue}%): ₹{(1000 * (commissionValue || 0)) / 100}</div>
                <div className="font-medium text-gray-900">
                  SP Receives: ₹{1000 - (1000 * (commissionValue || 0)) / 100}
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-gray-600">
                <div>Order with 3 items</div>
                <div>Commission (₹{commissionValue} × 3): ₹{(commissionValue || 0) * 3}</div>
                <div className="font-medium text-gray-900">
                  SP gets commission deducted from order total
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This commission will be applied to all orders placed through this
          ServiceProvider. Commission is only collected when payments are made through the platform
          (Razorpay). Direct payments (QR/UPI) need manual reconciliation.
        </p>
      </div>
    </div>
  );
}

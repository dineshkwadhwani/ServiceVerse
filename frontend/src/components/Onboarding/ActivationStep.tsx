import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { COLORS } from '@/utils/theme';

interface ActivationStepProps {
  spName: string;
  onCompleted: (data: {
    completeOnboarding: boolean;
    activateImmediately: boolean;
  }) => void;
}

export function ActivationStep({ spName, onCompleted }: ActivationStepProps) {
  const [completeOnboarding, setCompleteOnboarding] = useState(false);
  const [activateImmediately, setActivateImmediately] = useState(false);

  const handleContinue = () => {
    if (!completeOnboarding) {
      alert('Please check "Complete Onboarding" to proceed');
      return;
    }

    onCompleted({
      completeOnboarding,
      activateImmediately,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
          Review & Activate
        </h2>
        <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
          Complete the onboarding and manage activation status for {spName}
        </p>
      </div>

      {/* Completion Section */}
      <div
        className="p-6 rounded-lg border-2"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: completeOnboarding
            ? COLORS.semantic.success
            : COLORS.border.light,
        }}
      >
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={completeOnboarding}
            onChange={(e) => setCompleteOnboarding(e.target.checked)}
            className="w-6 h-6 mt-1 rounded"
            style={{
              accentColor: COLORS.semantic.info,
              cursor: 'pointer',
            }}
          />
          <div className="flex-1">
            <label
              className="text-lg font-semibold cursor-pointer"
              style={{ color: COLORS.text.primary }}
            >
              Complete Onboarding
            </label>
            <p
              className="text-sm mt-2"
              style={{ color: COLORS.text.secondary }}
            >
              Mark this Service Provider's onboarding as complete. They will enter the "Under Review" state and can edit their profile (Steps 1 & 2) while awaiting activation.
            </p>
            <div
              className="mt-4 p-3 rounded flex items-start gap-2"
              style={{
                backgroundColor: COLORS.semantic.info + '15',
                color: COLORS.semantic.info,
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                Status will be set to <span className="font-semibold">ONBOARDED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activation Section */}
      {completeOnboarding && (
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: COLORS.text.primary }}
          >
            Activation Status
          </h3>

          <div className="space-y-4">
            {/* Activate */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer transition"
              onClick={() => {
                setActivateImmediately(true);
              }}
              style={{
                backgroundColor:
                  activateImmediately === true
                    ? COLORS.semantic.success + '10'
                    : COLORS.bg.primary,
                borderColor:
                  activateImmediately === true
                    ? COLORS.semantic.success
                    : COLORS.border.light,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: COLORS.text.primary }}
                  >
                    Activate Now
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: COLORS.text.secondary }}
                  >
                    SP can immediately access their dashboard and serve customers
                  </p>
                </div>
                <input
                  type="radio"
                  checked={activateImmediately === true}
                  onChange={() => setActivateImmediately(true)}
                  className="w-5 h-5"
                  style={{ accentColor: COLORS.semantic.success }}
                />
              </div>
            </div>

            {/* Keep Under Review */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer transition"
              onClick={() => {
                setActivateImmediately(false);
              }}
              style={{
                backgroundColor:
                  activateImmediately === false
                    ? COLORS.semantic.warning + '10'
                    : COLORS.bg.primary,
                borderColor:
                  activateImmediately === false
                    ? COLORS.semantic.warning
                    : COLORS.border.light,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: COLORS.text.primary }}
                  >
                    Keep Under Review
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: COLORS.text.secondary }}
                  >
                    SP cannot access dashboard. They can still complete their profile (Steps 1 & 2)
                  </p>
                </div>
                <input
                  type="radio"
                  checked={activateImmediately === false}
                  onChange={() => setActivateImmediately(false)}
                  className="w-5 h-5"
                  style={{ accentColor: COLORS.semantic.warning }}
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div
            className="mt-4 p-3 rounded flex items-start gap-2"
            style={{
              backgroundColor: COLORS.semantic.warning + '15',
              color: COLORS.semantic.warning,
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              You can change the activation status anytime from the "Manage SPs" list
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition"
          disabled={!completeOnboarding}
          style={{
            backgroundColor: completeOnboarding
              ? COLORS.semantic.success
              : COLORS.border.light,
            opacity: completeOnboarding ? 1 : 0.5,
            cursor: completeOnboarding ? 'pointer' : 'not-allowed',
          }}
        >
          Complete Onboarding
        </button>
      </div>
    </div>
  );
}

import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { OnboardSPFormData } from '@/types';

interface WorkingHoursFormProps {
  register: UseFormRegister<OnboardSPFormData>;
  formData: OnboardSPFormData;
  setValue: UseFormSetValue<OnboardSPFormData>;
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const dayKeys = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function WorkingHoursForm({
  register,
  formData,
  setValue,
}: WorkingHoursFormProps) {
  const workingHours = formData.workingHours;

  const handleOpenToggle = (day: string, open: boolean) => {
    setValue(`workingHours.${day}.open` as any, !open);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>

      <div className="space-y-3">
        {dayKeys.map((dayKey, index) => {
          const dayLabel = days[index];
          const hours = workingHours[dayKey];
          const isOpen = hours.open !== false;

          return (
            <div key={dayKey} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-20">
                <label className="text-sm font-medium text-gray-700">{dayLabel}</label>
              </div>

              {isOpen ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      defaultValue={hours.start}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register(`workingHours.${dayKey}.start`)}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      defaultValue={hours.end}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register(`workingHours.${dayKey}.end`)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenToggle(dayKey, isOpen)}
                    className="ml-auto px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm font-medium transition"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-500 text-sm">Closed</span>
                  <button
                    type="button"
                    onClick={() => handleOpenToggle(dayKey, isOpen)}
                    className="ml-auto px-3 py-2 bg-green-100 text-green-600 hover:bg-green-200 rounded text-sm font-medium transition"
                  >
                    Open
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Set your business operating hours. You can mark days as closed to indicate non-working days.
      </p>
    </div>
  );
}

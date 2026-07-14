import { Clock, Truck, Package } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import type { OperationsData, WorkingHourDay } from '@/types';

interface Props {
  data: OperationsData;
  onChange: (data: OperationsData) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function OperationsForm({ data, onChange }: Props) {
  const updateWorkingHours = (day: typeof DAYS[number], dayData: WorkingHourDay) => {
    onChange({
      ...data,
      workingHours: {
        ...data.workingHours,
        [day]: dayData,
      },
    });
  };

  const openAllDays = () => {
    const defaultTime = { open: true, startHour: 9, endHour: 18 };
    const newHours = {} as OperationsData['workingHours'];
    DAYS.forEach(day => {
      newHours[day] = defaultTime;
    });
    onChange({
      ...data,
      workingHours: newHours,
    });
  };

  const closeAllDays = () => {
    const closedTime = { open: false };
    const newHours = {} as OperationsData['workingHours'];
    DAYS.forEach(day => {
      newHours[day] = closedTime;
    });
    onChange({
      ...data,
      workingHours: newHours,
    });
  };

  const isValid = true; // All fields are optional

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Operations
        </h2>
        <p style={{ color: COLORS.text.secondary }}>
          Set your working hours and service availability
        </p>
      </div>

      <form className="space-y-6">
        {/* Working Hours */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label
              className="flex items-center gap-2 font-semibold"
              style={{ color: COLORS.text.primary }}
            >
              <Clock className="w-4 h-4" />
              Working Hours
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openAllDays}
                className="text-xs font-semibold px-3 py-1 rounded border transition"
                style={{
                  backgroundColor: `${COLORS.semantic.success}20`,
                  borderColor: COLORS.semantic.success,
                  color: COLORS.semantic.success,
                }}
              >
                Open All
              </button>
              <button
                type="button"
                onClick={closeAllDays}
                className="text-xs font-semibold px-3 py-1 rounded border transition"
                style={{
                  backgroundColor: `${COLORS.semantic.error}20`,
                  borderColor: COLORS.semantic.error,
                  color: COLORS.semantic.error,
                }}
              >
                Close All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayData = data.workingHours[day];
              return (
                <div
                  key={day}
                  className="p-4 border rounded-lg"
                  style={{
                    backgroundColor: COLORS.bg.primary,
                    borderColor: COLORS.border.light,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <label
                      className="font-semibold flex-1"
                      style={{ color: COLORS.text.primary }}
                    >
                      {DAY_LABELS[day]}
                    </label>
                    <select
                      value={dayData.open ? 'open' : 'closed'}
                      onChange={(e) => {
                        if (e.target.value === 'closed') {
                          updateWorkingHours(day, { open: false });
                        } else {
                          updateWorkingHours(day, {
                            open: true,
                            startHour: 9,
                            endHour: 18,
                          });
                        }
                      }}
                      className="px-3 py-2 border rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: COLORS.bg.surface,
                        borderColor: COLORS.border.light,
                        color: COLORS.text.primary,
                      }}
                    >
                      <option value="closed">Closed</option>
                      <option value="open">Open</option>
                    </select>
                  </div>

                  {dayData.open && (
                    <div className="flex gap-3 mt-4 items-center">
                      <div className="flex-1">
                        <label className="text-xs font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
                          Start Time
                        </label>
                        <select
                          value={dayData.startHour ?? 9}
                          onChange={(e) =>
                            updateWorkingHours(day, {
                              ...dayData,
                              startHour: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                          style={{
                            backgroundColor: COLORS.bg.surface,
                            borderColor: COLORS.border.light,
                            color: COLORS.text.primary,
                          }}
                        >
                          {HOURS.map((hour) => (
                            <option key={hour} value={hour}>
                              {formatHour(hour)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold block mb-2" style={{ color: COLORS.text.secondary }}>
                          End Time
                        </label>
                        <select
                          value={dayData.endHour ?? 18}
                          onChange={(e) =>
                            updateWorkingHours(day, {
                              ...dayData,
                              endHour: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                          style={{
                            backgroundColor: COLORS.bg.surface,
                            borderColor: COLORS.border.light,
                            color: COLORS.text.primary,
                          }}
                        >
                          {HOURS.map((hour) => (
                            <option key={hour} value={hour}>
                              {formatHour(hour)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Availability */}
        <div className="border-t pt-6" style={{ borderColor: COLORS.border.light }}>
          <label className="font-semibold mb-4 block" style={{ color: COLORS.text.primary }}>
            Service Availability
          </label>

          <div className="space-y-4">
            {/* Pickup Available */}
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border" style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
            }}>
              <input
                type="checkbox"
                checked={data.pickupAvailable}
                onChange={(e) => onChange({ ...data, pickupAvailable: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold" style={{ color: COLORS.text.primary }}>
                  <Package className="w-4 h-4" />
                  Pickup Available
                </div>
                <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                  Customers can pick up orders from your location
                </p>
              </div>
            </label>

            {/* Delivery Available */}
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border" style={{
              backgroundColor: COLORS.bg.primary,
              borderColor: COLORS.border.light,
            }}>
              <input
                type="checkbox"
                checked={data.deliveryAvailable}
                onChange={(e) => onChange({ ...data, deliveryAvailable: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold" style={{ color: COLORS.text.primary }}>
                  <Truck className="w-4 h-4" />
                  Delivery Available
                </div>
                <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                  You can deliver orders to customers
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>

      {!isValid && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: `${COLORS.semantic.warning}15`,
            color: COLORS.semantic.warning,
          }}
        >
          Please select at least one service availability option (Pickup or Delivery)
        </div>
      )}
    </div>
  );
}

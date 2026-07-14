import { FileText, QrCode, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { COLORS } from '@/utils/theme';
import type { DocumentationData, OnboardingCommissionConfig } from '@/types';

interface Props {
  documentationData: DocumentationData;
  commissionData: OnboardingCommissionConfig;
  onDocumentationChange: (data: DocumentationData) => void;
  onCommissionChange: (data: OnboardingCommissionConfig) => void;
}

export function DocumentationForm({
  documentationData,
  commissionData,
  onDocumentationChange,
  onCommissionChange,
}: Props) {
  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onDocumentationChange({
          ...documentationData,
          qrCodeUrl: url,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const isQRRequired = documentationData.directPaymentAllowed && !documentationData.qrCodeUrl;
  const isValid =
    documentationData.gstNumber &&
    (!documentationData.directPaymentAllowed || documentationData.qrCodeUrl) &&
    commissionData.type &&
    (commissionData.type === 'FIXED' || (commissionData.type === 'PERCENTAGE' && commissionData.value));

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Documentation & Commission
        </h2>
        <p style={{ color: COLORS.text.secondary }}>
          Set up payment and commission details
        </p>
      </div>

      <form className="space-y-6">
        {/* GST Section */}
        <div
          className="border rounded-lg p-6"
          style={{
            backgroundColor: COLORS.bg.primary,
            borderColor: COLORS.border.light,
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text.primary }}>
            <FileText className="w-5 h-5" />
            GST Information
          </h3>

          {/* GST Number */}
          <div className="mb-4">
            <label
              className="block font-semibold mb-2 text-sm"
              style={{ color: COLORS.text.primary }}
            >
              GST Number *
            </label>
            <input
              type="text"
              value={documentationData.gstNumber}
              onChange={(e) =>
                onDocumentationChange({
                  ...documentationData,
                  gstNumber: e.target.value.toUpperCase(),
                })
              }
              placeholder="15-digit GST number"
              maxLength={15}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
                color: COLORS.text.primary,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
            />
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              e.g., 27AABCT1234H1Z0
            </p>
          </div>

          {/* GST Collection Mandatory */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded border" style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}>
            <input
              type="checkbox"
              checked={documentationData.gstCollectionMandatory}
              onChange={(e) =>
                onDocumentationChange({
                  ...documentationData,
                  gstCollectionMandatory: e.target.checked,
                })
              }
              className="w-5 h-5 rounded"
            />
            <div>
              <div className="font-semibold text-sm" style={{ color: COLORS.text.primary }}>
                GST Collection Mandatory
              </div>
              <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                Collect GST from customers on all orders
              </p>
            </div>
          </label>
        </div>

        {/* Payment Section */}
        <div
          className="border rounded-lg p-6"
          style={{
            backgroundColor: COLORS.bg.primary,
            borderColor: COLORS.border.light,
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text.primary }}>
            <QrCode className="w-5 h-5" />
            Payment Options
          </h3>

          {/* Direct Payment Allowed */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded border mb-4" style={{
            backgroundColor: COLORS.bg.surface,
            borderColor: COLORS.border.light,
          }}>
            <input
              type="checkbox"
              checked={documentationData.directPaymentAllowed}
              onChange={(e) => {
                const newData = {
                  ...documentationData,
                  directPaymentAllowed: e.target.checked,
                };
                if (!e.target.checked) {
                  newData.qrCodeUrl = undefined;
                }
                onDocumentationChange(newData);
              }}
              className="w-5 h-5 rounded"
            />
            <div>
              <div className="font-semibold text-sm" style={{ color: COLORS.text.primary }}>
                Direct Payment Allowed
              </div>
              <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                Customers can pay directly via UPI/QR code
              </p>
            </div>
          </label>

          {/* QR Code Upload */}
          {documentationData.directPaymentAllowed && (
            <div>
              <label
                className="block font-semibold mb-2 text-sm"
                style={{ color: COLORS.text.primary }}
              >
                UPI QR Code {isQRRequired && '*'}
              </label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition"
                style={{
                  borderColor: isQRRequired ? COLORS.semantic.error : COLORS.border.light,
                  backgroundColor: `${COLORS.bg.surface}80`,
                }}
                onClick={() => document.getElementById('qr-upload')?.click()}
              >
                {documentationData.qrCodeUrl ? (
                  <div>
                    <div
                      className="w-24 h-24 mx-auto mb-3 rounded-lg overflow-hidden border"
                      style={{ borderColor: COLORS.border.light }}
                    >
                      <img
                        src={documentationData.qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: COLORS.semantic.success }}>
                      QR Code uploaded
                    </p>
                    <p
                      className="text-xs mt-1 cursor-pointer"
                      style={{ color: COLORS.semantic.info }}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('qr-upload')?.click();
                      }}
                    >
                      Change
                    </p>
                  </div>
                ) : (
                  <div>
                    <QrCode className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.text.secondary }} />
                    <p className="font-semibold text-sm" style={{ color: COLORS.text.primary }}>
                      Upload QR Code
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
              />
              {isQRRequired && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.semantic.error }}>
                  <AlertCircle className="w-3 h-3" />
                  QR Code is required for direct payments
                </p>
              )}
            </div>
          )}
        </div>

        {/* Commission Section */}
        <div
          className="border rounded-lg p-6"
          style={{
            backgroundColor: COLORS.bg.primary,
            borderColor: COLORS.border.light,
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text.primary }}>
            <DollarSign className="w-5 h-5" />
            Commission Model
          </h3>

          <div className="space-y-4">
            {/* Percentage */}
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded border" style={{
              backgroundColor: COLORS.bg.surface,
              borderColor: commissionData.type === 'PERCENTAGE' ? COLORS.semantic.info : COLORS.border.light,
              borderWidth: commissionData.type === 'PERCENTAGE' ? '2px' : '1px',
            }}>
              <input
                type="radio"
                name="commission-type"
                value="PERCENTAGE"
                checked={commissionData.type === 'PERCENTAGE'}
                onChange={() => onCommissionChange({ type: 'PERCENTAGE' })}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold" style={{ color: COLORS.text.primary }}>
                  <Percent className="w-4 h-4" />
                  Percentage Commission
                </div>
                <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                  Fixed percentage on all menu items
                </p>
              </div>
            </label>

            {commissionData.type === 'PERCENTAGE' && (
              <div className="ml-8 p-4 border rounded-lg" style={{
                backgroundColor: `${COLORS.semantic.info}10`,
                borderColor: `${COLORS.semantic.info}30`,
              }}>
                <label className="block font-semibold mb-2 text-sm" style={{ color: COLORS.text.primary }}>
                  Commission Rate (%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commissionData.value ?? ''}
                    onChange={(e) =>
                      onCommissionChange({
                        type: 'PERCENTAGE',
                        value: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 5"
                    min="0"
                    step="0.1"
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:border-2 transition"
                    style={{
                      backgroundColor: COLORS.bg.surface,
                      borderColor: COLORS.border.light,
                      color: COLORS.text.primary,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.semantic.info)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border.light)}
                  />
                  <span style={{ color: COLORS.text.primary }} className="font-semibold">
                    %
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: COLORS.text.secondary }}>
                  Commission will be calculated as: Order Total × {commissionData.value || '0'}%
                </p>
              </div>
            )}

            {/* Fixed */}
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded border" style={{
              backgroundColor: COLORS.bg.surface,
              borderColor: commissionData.type === 'FIXED' ? COLORS.semantic.info : COLORS.border.light,
              borderWidth: commissionData.type === 'FIXED' ? '2px' : '1px',
            }}>
              <input
                type="radio"
                name="commission-type"
                value="FIXED"
                checked={commissionData.type === 'FIXED'}
                onChange={() => onCommissionChange({ type: 'FIXED' })}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold" style={{ color: COLORS.text.primary }}>
                  <DollarSign className="w-4 h-4" />
                  Fixed Commission
                </div>
                <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                  Set commission per menu item (configure in next step)
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>

      {!isValid && (
        <div
          className="rounded-lg p-4 text-sm flex items-start gap-2"
          style={{
            backgroundColor: `${COLORS.semantic.warning}15`,
            color: COLORS.semantic.warning,
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Please complete all required fields:</p>
            <ul className="list-disc list-inside text-xs mt-2 ml-2">
              {!documentationData.gstNumber && <li>GST Number</li>}
              {isQRRequired && <li>QR Code (required for direct payments)</li>}
              {commissionData.type === 'PERCENTAGE' && !commissionData.value && <li>Commission percentage</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

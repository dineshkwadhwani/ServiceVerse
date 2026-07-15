import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/store/notificationStore';
import { COLORS } from '@/utils/theme';
import { db } from '@/utils/firebase-config';

interface InvoiceItem {
  name: string;
  qty?: number;
  quantity?: number;
  price?: number;
  customPrice?: number;
  itemTotal?: number;
}

interface InvoiceOrder {
  orderId: string;
  customerName?: string;
  spId?: string;
  createdAt?: Date;
  totalAmount?: number;
  items?: InvoiceItem[];
}

interface Props {
  order: InvoiceOrder;
  onClose: () => void;
  businessNameHint?: string;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const normalizeDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
  return new Date();
};

const getQty = (item: InvoiceItem) => Number(item.qty || item.quantity || 0);

const getUnitPrice = (item: InvoiceItem) => Number(item.customPrice || item.price || 0);

const getLineTotal = (item: InvoiceItem) => {
  if (typeof item.itemTotal === 'number') return Number(item.itemTotal);
  return getQty(item) * getUnitPrice(item);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function InvoiceModal({ order, onClose, businessNameHint }: Props) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState(businessNameHint || 'Service Provider');
  const [orderNumber, setOrderNumber] = useState(order.orderId || 'N/A');
  const [orderDate, setOrderDate] = useState<Date>(normalizeDate(order.createdAt));
  const [customerName, setCustomerName] = useState(order.customerName || 'N/A');
  const [items, setItems] = useState<InvoiceItem[]>(order.items || []);
  const [totalAmount, setTotalAmount] = useState(Number(order.totalAmount || 0));

  useEffect(() => {
    const loadInvoiceData = async () => {
      setIsLoading(true);
      try {
        const response: any = await apiClient.getOrder(order.orderId);
        const fullOrder = response?.data || response || {};

        const resolvedOrderNumber = fullOrder.orderId || order.orderId || 'N/A';
        const resolvedOrderDate = normalizeDate(fullOrder.createdAt || order.createdAt);
        const resolvedCustomerName = fullOrder.customerName || order.customerName || 'N/A';
        const resolvedItems = fullOrder.items || order.items || [];
        const resolvedTotal = Number(fullOrder.totalAmount || fullOrder.total || order.totalAmount || 0);
        const spId = fullOrder.spId || fullOrder.serviceProviderId || order.spId;

        setOrderNumber(resolvedOrderNumber);
        setOrderDate(resolvedOrderDate);
        setCustomerName(resolvedCustomerName);
        setItems(resolvedItems);
        setTotalAmount(resolvedTotal);

        if (spId) {
          try {
            const spRef = firestoreDoc(db, 'users', spId);
            const spSnap = await getDoc(spRef);
            if (spSnap.exists()) {
              const spData: any = spSnap.data();
              const resolvedBusinessName =
                spData.businessName ||
                spData.name ||
                businessNameHint ||
                'Service Provider';
              setBusinessName(resolvedBusinessName);
            }
          } catch {
            setBusinessName(businessNameHint || 'Service Provider');
          }
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load invoice details');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [order.orderId]);

  const computedTotal = useMemo(() => {
    if (totalAmount > 0) return totalAmount;
    return items.reduce((sum, item) => sum + getLineTotal(item), 0);
  }, [items, totalAmount]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print the invoice.');
      return;
    }

    const itemRows = items
      .map((item) => {
        const qty = getQty(item);
        const unitPrice = getUnitPrice(item);
        const lineTotal = getLineTotal(item);
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${escapeHtml(item.name || 'Item')}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${qty}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${currencyFormatter.format(unitPrice)}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${currencyFormatter.format(lineTotal)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${escapeHtml(orderNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          .meta { margin-bottom: 16px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #111827; }
          .total-row { margin-top: 16px; display: flex; justify-content: flex-end; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(businessName)}</h1>
        <div class="meta">
          <div><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</div>
          <div><strong>Order Date:</strong> ${escapeHtml(orderDate.toLocaleDateString())}</div>
          <div><strong>Customer Name:</strong> ${escapeHtml(customerName)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Unit Price</th>
              <th style="text-align:right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <div class="total-row">
          Total: ${currencyFormatter.format(computedTotal)}
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    const right = 555;
    let y = 50;

    pdf.setFontSize(20);
    pdf.text(businessName, left, y);

    y += 30;
    pdf.setFontSize(11);
    pdf.text(`Order Number: ${orderNumber}`, left, y);
    y += 18;
    pdf.text(`Order Date: ${orderDate.toLocaleDateString()}`, left, y);
    y += 18;
    pdf.text(`Customer Name: ${customerName}`, left, y);

    y += 24;
    pdf.setDrawColor(31, 41, 55);
    pdf.line(left, y, right, y);
    y += 18;

    pdf.setFontSize(10);
    pdf.text('Item', left, y);
    pdf.text('Qty', 330, y, { align: 'right' });
    pdf.text('Unit Price', 430, y, { align: 'right' });
    pdf.text('Line Total', right, y, { align: 'right' });

    y += 8;
    pdf.line(left, y, right, y);
    y += 18;

    items.forEach((item) => {
      if (y > 760) {
        pdf.addPage();
        y = 50;
      }

      const qty = getQty(item);
      const unitPrice = getUnitPrice(item);
      const lineTotal = getLineTotal(item);

      pdf.text(String(item.name || 'Item'), left, y);
      pdf.text(String(qty), 330, y, { align: 'right' });
      pdf.text(`INR ${unitPrice.toFixed(2)}`, 430, y, { align: 'right' });
      pdf.text(`INR ${lineTotal.toFixed(2)}`, right, y, { align: 'right' });
      y += 18;
    });

    y += 6;
    pdf.line(left, y, right, y);
    y += 22;
    pdf.setFontSize(12);
    pdf.text(`Total: INR ${computedTotal.toFixed(2)}`, right, y, { align: 'right' });

    pdf.save(`invoice-${orderNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-xl"
        style={{
          backgroundColor: COLORS.bg.surface,
          borderColor: COLORS.border.light,
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.border.light }}>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
            Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition"
            style={{ color: COLORS.text.secondary }}
            aria-label="Close invoice modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.semantic.info }} />
          </div>
        ) : (
          <div className="px-6 py-5">
            <h3 className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
              {businessName}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.text.secondary }}>Order Number</p>
                <p className="font-semibold" style={{ color: COLORS.text.primary }}>{orderNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.text.secondary }}>Order Date</p>
                <p className="font-semibold" style={{ color: COLORS.text.primary }}>{orderDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.text.secondary }}>Customer Name</p>
                <p className="font-semibold" style={{ color: COLORS.text.primary }}>{customerName}</p>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden" style={{ borderColor: COLORS.border.light }}>
              <div
                className="grid grid-cols-[1fr_80px_120px_120px] gap-2 px-4 py-3 text-sm font-semibold"
                style={{ backgroundColor: COLORS.bg.primary, color: COLORS.text.primary }}
              >
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Line Total</span>
              </div>

              {items.length > 0 ? (
                items.map((item, index) => {
                  const qty = getQty(item);
                  const unitPrice = getUnitPrice(item);
                  const lineTotal = getLineTotal(item);
                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="grid grid-cols-[1fr_80px_120px_120px] gap-2 px-4 py-3 text-sm border-t"
                      style={{ borderColor: COLORS.border.light, color: COLORS.text.primary }}
                    >
                      <span>{item.name || 'Item'}</span>
                      <span className="text-right">{qty}</span>
                      <span className="text-right">{currencyFormatter.format(unitPrice)}</span>
                      <span className="text-right">{currencyFormatter.format(lineTotal)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-sm" style={{ color: COLORS.text.secondary }}>
                  No line items available for this order.
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.text.secondary }}>
                  Total
                </p>
                <p className="text-xl font-bold" style={{ color: COLORS.semantic.success }}>
                  {currencyFormatter.format(computedTotal)}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg border font-semibold transition"
                style={{ borderColor: COLORS.border.light, color: COLORS.text.primary }}
              >
                Print
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg font-semibold text-white transition"
                style={{ backgroundColor: COLORS.semantic.info }}
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { format, formatDistanceToNow } from 'date-fns';

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Date formatting
export function formatDate(date: Date | undefined, formatStr: string = 'dd MMM yyyy'): string {
  if (!date) return '-';
  return format(new Date(date), formatStr);
}

export function formatDateTime(date: Date | undefined, formatStr: string = 'dd MMM yyyy, HH:mm'): string {
  if (!date) return '-';
  return format(new Date(date), formatStr);
}

// Relative time formatting
export function formatTimeAgo(date: Date | undefined): string {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Phone number formatting
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

// Order status badge
export function getOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    CREATED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-purple-100 text-purple-800',
    READY_FOR_DELIVERY: 'bg-yellow-100 text-yellow-800',
    DELIVERED: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-teal-100 text-teal-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function getOrderStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    CREATED: '📝',
    CONFIRMED: '✅',
    READY_FOR_DELIVERY: '📦',
    DELIVERED: '🚚',
    PAID: '💳',
    COMPLETED: '✓',
  };
  return statusIcons[status] || '•';
}

// Commission formatting
export function formatCommission(type: string, value: number): string {
  if (type === 'PERCENTAGE') {
    return `${value}%`;
  }
  return formatCurrency(value);
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Truncate text
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Convert kebab-case to Title Case
export function kebabToTitle(text: string): string {
  return text
    .split('-')
    .map(word => capitalize(word))
    .join(' ');
}

// Order ID formatting
export function formatOrderId(id: string): string {
  return '#' + id.slice(-6).toUpperCase();
}

// Rating formatting
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} ⭐`;
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Time formatting (HH:MM)
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

// Status label formatting
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SUSPENDED: 'Suspended',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PAID: 'Paid',
    DUE: 'Due',
    COMPLETED: 'Completed',
  };
  return labels[status] || status;
}

// Address formatting
export function formatAddress(address: string): string {
  if (!address) return '-';
  return truncateText(address, 40);
}

// GST number formatting
export function formatGSTNumber(gst: string | undefined): string {
  if (!gst) return '-';
  return gst.toUpperCase();
}

// Invoice number formatting
export function formatInvoiceNumber(invoiceNumber: string): string {
  return `INV-${invoiceNumber}`;
}

// Business hours formatting
export function formatBusinessHours(hours: Record<string, any>): string {
  const openDays = Object.entries(hours)
    .filter(([_, data]) => data.open !== false)
    .map(([day, data]) => `${capitalize(day)}: ${data.start}-${data.end}`);
  return openDays.join(', ');
}

// Array to readable list
export function formatList(items: string[]): string {
  if (items.length === 0) return '-';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore, Toast } from '@/store/notificationStore';

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  const { removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={`${colors[toast.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in pointer-events-auto max-w-sm`}
      role="alert"
    >
      <div className={iconColors[toast.type]}>{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

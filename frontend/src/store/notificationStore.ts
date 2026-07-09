import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationState {
  toasts: Toast[];
  
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 5000);
    }

    return id;
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),

  clearToasts: () => set({ toasts: [] }),
}));

// Helper functions
export function useToast() {
  const { addToast } = useNotificationStore();

  return {
    success: (title: string, message?: string) =>
      addToast({ title, message, type: 'success' }),
    error: (title: string, message?: string) =>
      addToast({ title, message, type: 'error' }),
    warning: (title: string, message?: string) =>
      addToast({ title, message, type: 'warning' }),
    info: (title: string, message?: string) =>
      addToast({ title, message, type: 'info' }),
  };
}

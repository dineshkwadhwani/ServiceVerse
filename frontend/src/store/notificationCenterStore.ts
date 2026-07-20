import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  createdAt: string | null;
}

interface NotificationCenterState {
  notifications: AppNotification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useNotificationCenterStore = create<NotificationCenterState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.getNotifications();
      set({ notifications: response?.data?.notifications || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const previous = get().notifications;
    set({ notifications: previous.filter((notification) => notification.id !== id) });
    try {
      await apiClient.markNotificationRead(id);
    } catch (error) {
      set({ notifications: previous });
    }
  },
}));

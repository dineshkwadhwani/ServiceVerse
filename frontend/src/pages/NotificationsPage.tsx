import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationCenterStore } from '@/store/notificationCenterStore';
import { COLORS } from '@/utils/theme';
import { EmptyState } from '@/components/Shared/EmptyState';

function formatTime(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotificationCenterStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5" style={{ color: COLORS.text.primary }} />
        <h1 className="text-xl font-semibold" style={{ color: COLORS.text.primary }}>
          Notifications
        </h1>
      </div>

      {isLoading && notifications.length === 0 ? (
        <p style={{ color: COLORS.text.secondary }}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <EmptyState message="You're all caught up. No new notifications today." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className="w-full text-left rounded-lg p-4 border transition hover:opacity-80"
              style={{
                backgroundColor: COLORS.bg.surface,
                borderColor: COLORS.border.light,
                boxShadow: COLORS.shadow.sm,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    {notification.title}
                  </p>
                  <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                    {notification.body}
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: COLORS.text.tertiary }}>
                  {formatTime(notification.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

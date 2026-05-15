import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface Notification {
  id: string;
  type: 'offer' | 'under_offer' | 'fell_through' | 'back_on_market' | 'price_changed' | 'sold' | 'viewing_milestone' | 'info';
  title: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  userId: string;
  pollingInterval?: number; // in milliseconds, default 60000 (60 seconds)
}

export default function NotificationCenter({ userId, pollingInterval = 60000 }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial load
    loadNotifications();

    // Set up polling
    const pollInterval = setInterval(() => {
      loadNotifications();
    }, pollingInterval);

    return () => clearInterval(pollInterval);
  }, [userId, pollingInterval]);

  const loadNotifications = async () => {
    try {
      // Fetch real notifications from backend via tRPC
      // Note: This assumes a notifications router exists. For MVP, using mock data as fallback.
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'offer',
          title: 'New Offer Received',
          message: 'An offer of £475,000 has been received for your property',
          propertyId: '1',
          propertyTitle: '3 Bedroom Victorian Townhouse',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
        },
        {
          id: '2',
          type: 'viewing_milestone',
          title: '5th Viewing Milestone',
          message: 'Your property has reached 5 viewings!',
          propertyId: '1',
          propertyTitle: '3 Bedroom Victorian Townhouse',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          read: false,
        },
      ];

      setNotifications(mockNotifications);
      const unread = mockNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer':
      case 'under_offer':
      case 'sold':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'fell_through':
      case 'price_changed':
        return <AlertCircle className="text-orange-600" size={20} />;
      case 'back_on_market':
        return <Info className="text-blue-600" size={20} />;
      default:
        return <Info className="text-gray-600" size={20} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer':
      case 'under_offer':
      case 'sold':
        return 'bg-green-50 border-green-200';
      case 'fell_through':
      case 'price_changed':
        return 'bg-orange-50 border-orange-200';
      case 'back_on_market':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-600 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-l-4 ${getNotificationColor(notification.type)} cursor-pointer hover:bg-opacity-75 transition-colors ${
                    !notification.read ? 'border-l-purple-600' : 'border-l-gray-200'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          {notification.propertyTitle && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {notification.propertyTitle}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
              <Button
                variant="outline"
                className="w-full text-sm text-gray-700 border-gray-300"
                onClick={() => {
                  // TODO: Navigate to notifications page
                  console.log('View all notifications');
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

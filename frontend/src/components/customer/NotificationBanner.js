/**
 * Notification Banner Component
 * Displays important notifications at the top of the dashboard
 */

'use client';

import { useState } from 'react';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotificationBanner({ notifications }) {
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  const handleDismiss = (notificationId) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
      default:
        return InformationCircleIcon;
    }
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.has(notification.id) && !notification.read,
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleNotifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        const styles = getNotificationStyles(notification.type);

        return (
          <div
            key={notification.id}
            className={`rounded-lg border p-4 ${styles}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">{notification.title}</h3>
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                <p className="mt-2 text-xs opacity-75">
                  {new Date(notification.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDismiss(notification.id)}
                  className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
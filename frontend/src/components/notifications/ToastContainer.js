/**
 * Toast Container Component
 * Manages multiple toast notifications with positioning and stacking
 */

'use client';

import { useState, useEffect } from 'react';
import NotificationToast from './NotificationToast';
import useNotificationStore from '@/stores/notificationStore';

const MAX_TOASTS = 5;

export default function ToastContainer({ 
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000,
  maxToasts = MAX_TOASTS,
}) {
  const { notifications } = useNotificationStore();
  const [toastNotifications, setToastNotifications] = useState([]);

  // Filter notifications that should show as toasts
  useEffect(() => {
    const toastableNotifications = notifications
      .filter(n => !n.read && n.autoHide !== false) // Show unread notifications that aren't persistent
      .slice(0, maxToasts); // Limit number of toasts

    setToastNotifications(toastableNotifications);
  }, [notifications, maxToasts]);

  const handleCloseToast = (notificationId) => {
    setToastNotifications(prev => 
      prev.filter(n => n.id !== notificationId),
    );
  };

  // Calculate position offset for stacked toasts
  const getToastStyle = (index) => {
    const offset = index * 80; // 80px spacing between toasts
    
    switch (position) {
      case 'top-left':
      case 'top-center':
      case 'top-right':
        return { top: `${16 + offset}px` };
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        return { bottom: `${16 + offset}px` };
      default:
        return { top: `${16 + offset}px` };
    }
  };

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toastNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={getToastStyle(index)}
          className="absolute pointer-events-auto"
        >
          <NotificationToast
            notification={notification}
            onClose={handleCloseToast}
            position={position}
            autoHide={autoHide}
            hideDelay={hideDelay}
          />
        </div>
      ))}
    </div>
  );
}
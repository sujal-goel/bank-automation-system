/**
 * Notification Bell Component
 * Bell icon with unread count badge for header/navigation
 */

'use client';

import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import useNotificationStore from '@/stores/notificationStore';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell({ 
  className = '',
  showLabel = false,
  position = 'right',
}) {
  const { unreadCount } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const closeNotifications = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={toggleNotifications}
        className={`
          relative p-2 text-gray-600 hover:text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          rounded-lg transition-colors
          ${className}
        `}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        {unreadCount > 0 ? (
          <BellIconSolid className="w-6 h-6" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex rounded-full h-3 w-3 bg-red-400 opacity-75 animate-ping"></span>
        )}

        {/* Label */}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            Notifications
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={closeNotifications}
        position={position}
      />
    </>
  );
}
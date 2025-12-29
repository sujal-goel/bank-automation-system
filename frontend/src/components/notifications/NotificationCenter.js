/**
 * Notification Center Component
 * Main notification panel with filtering and management
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import useNotificationStore from '@/stores/notificationStore';
import NotificationItem from './NotificationItem';

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Notifications' },
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warnings' },
  { value: 'error', label: 'Errors' },
];

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  position = 'right',
  maxHeight = '500px', 
}) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Filter notifications based on current filter settings
  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all' && notification.type !== filter) {
      return false;
    }
    
    if (showOnlyUnread && notification.read) {
      return false;
    }
    
    return true;
  });

  // Handle action URL clicks
  const handleAction = (url) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle clear all notifications
  const handleClearAll = () => {
    clearAll();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className={`
        fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} 
        h-full w-96 bg-white shadow-xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {unreadCount > 0 ? (
              <BellIconSolid className="w-6 h-6 text-blue-500" />
            ) : (
              <BellIcon className="w-6 h-6 text-gray-500" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NOTIFICATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unread Filter */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOnlyUnread}
                onChange={(e) => setShowOnlyUnread(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show only unread</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <CheckIcon className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BellIcon className="w-12 h-12 mb-4" />
              <p className="text-sm">
                {notifications.length === 0 
                  ? 'No notifications yet' 
                  : 'No notifications match your filters'
                }
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                  onAction={handleAction}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </>
  );
}
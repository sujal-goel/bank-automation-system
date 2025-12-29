/**
 * Individual Notification Item Component
 * Displays a single notification with actions
 */

'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @param {boolean} solid - Whether to use solid icon
 * @returns {JSX.Element} Icon component
 */
const getNotificationIcon = (type, solid = false) => {
  const iconClass = 'w-5 h-5';
  
  switch (type) {
    case 'success':
      return solid ? 
        <CheckCircleIconSolid className={`${iconClass} text-green-500`} /> :
        <CheckCircleIcon className={`${iconClass} text-green-500`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />;
    case 'error':
      return <XCircleIcon className={`${iconClass} text-red-500`} />;
    case 'info':
    default:
      return <InformationCircleIcon className={`${iconClass} text-blue-500`} />;
  }
};

/**
 * Get background color for notification type
 * @param {string} type - Notification type
 * @param {boolean} read - Whether notification is read
 * @returns {string} CSS classes
 */
const getNotificationBg = (type, read) => {
  const baseClasses = read ? 'bg-gray-50' : 'bg-white';
  const borderClasses = read ? 'border-gray-200' : 'border-l-4';
  
  if (read) {
    return `${baseClasses} ${borderClasses}`;
  }
  
  switch (type) {
    case 'success':
      return `${baseClasses} ${borderClasses} border-l-green-500`;
    case 'warning':
      return `${baseClasses} ${borderClasses} border-l-yellow-500`;
    case 'error':
      return `${baseClasses} ${borderClasses} border-l-red-500`;
    case 'info':
    default:
      return `${baseClasses} ${borderClasses} border-l-blue-500`;
  }
};

/**
 * Format timestamp for display
 * @param {Date} timestamp - Notification timestamp
 * @returns {string} Formatted time
 */
const formatTimestamp = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
};

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onRemove, 
  onAction,
  compact = false, 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(notification.id);
    }
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
  };

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
  };

  return (
    <div
      className={`
        ${getNotificationBg(notification.type, notification.read)}
        border rounded-lg p-4 transition-all duration-200 cursor-pointer
        ${isHovered ? 'shadow-md' : 'shadow-sm'}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type, !notification.read)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notification.read ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {notification.title}
                {!notification.read && (
                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </h4>
              
              <p className={`mt-1 text-sm ${
                notification.read ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {notification.message}
              </p>

              {/* Metadata */}
              {notification.metadata && (
                <div className="mt-2 text-xs text-gray-500">
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <span key={key} className="mr-3">
                      <strong>{key}:</strong> {value}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className="mt-2 text-xs text-gray-400">
                {formatTimestamp(notification.timestamp)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-3">
              {/* Action URL Button */}
              {notification.actionUrl && (
                <button
                  onClick={handleAction}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Open link"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </button>
              )}

              {/* Mark as Read Button */}
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="Mark as read"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              )}

              {/* Remove Button */}
              <button
                onClick={handleRemove}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove notification"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
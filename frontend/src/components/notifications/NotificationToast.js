/**
 * Toast Notification Component
 * Temporary notifications that appear and auto-dismiss
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/**
 * Get icon and colors for notification type
 */
const getNotificationStyle = (type) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-500',
        titleColor: 'text-green-800',
        messageColor: 'text-green-700',
      };
    case 'warning':
      return {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-800',
        messageColor: 'text-yellow-700',
      };
    case 'error':
      return {
        icon: XCircleIcon,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-500',
        titleColor: 'text-red-800',
        messageColor: 'text-red-700',
      };
    case 'info':
    default:
      return {
        icon: InformationCircleIcon,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-800',
        messageColor: 'text-blue-700',
      };
  }
};

export default function NotificationToast({ 
  notification, 
  onClose,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const style = getNotificationStyle(notification.type);
  const IconComponent = style.icon;

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onClose) {
        onClose(notification.id);
      }
    }, 300); // Match animation duration
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Animation classes
  const getAnimationClasses = () => {
    if (isLeaving) {
      return 'opacity-0 scale-95 translate-x-2';
    }
    if (isVisible) {
      return 'opacity-100 scale-100 translate-x-0';
    }
    return 'opacity-0 scale-95 translate-x-2';
  };

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full pointer-events-auto
        ${getPositionClasses()}
        transition-all duration-300 ease-in-out
        ${getAnimationClasses()}
      `}
    >
      <div className={`
        ${style.bgColor} ${style.borderColor}
        border rounded-lg shadow-lg p-4
      `}>
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            {notification.title && (
              <h4 className={`text-sm font-medium ${style.titleColor}`}>
                {notification.title}
              </h4>
            )}
            
            <p className={`text-sm ${style.messageColor} ${notification.title ? 'mt-1' : ''}`}>
              {notification.message}
            </p>

            {/* Action Button */}
            {notification.actionUrl && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    if (notification.actionUrl.startsWith('http')) {
                      window.open(notification.actionUrl, '_blank');
                    } else {
                      window.location.href = notification.actionUrl;
                    }
                    handleClose();
                  }}
                  className={`
                    text-sm font-medium underline hover:no-underline
                    ${style.titleColor}
                  `}
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`
                inline-flex text-gray-400 hover:text-gray-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                rounded-md p-1
              `}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar for Auto-hide */}
        {autoHide && hideDelay > 0 && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full ${
                notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                animation: `shrink ${hideDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
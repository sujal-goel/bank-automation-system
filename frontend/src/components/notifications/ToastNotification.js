/**
 * Toast Notification Component
 * Displays temporary toast notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid';

const toastTypeConfig = {
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
  },
  error: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
  },
};

export default function ToastNotification({ 
  notification, 
  onDismiss,
  duration = 5000,
  position = 'top-right',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = toastTypeConfig[notification.type] || toastTypeConfig.info;
  const Icon = config.icon;

  // Animation classes based on position
  const positionClasses = {
    'top-right': {
      container: 'top-4 right-4',
      enter: 'translate-x-0',
      exit: 'translate-x-full',
    },
    'top-left': {
      container: 'top-4 left-4',
      enter: 'translate-x-0',
      exit: '-translate-x-full',
    },
    'bottom-right': {
      container: 'bottom-4 right-4',
      enter: 'translate-x-0',
      exit: 'translate-x-full',
    },
    'bottom-left': {
      container: 'bottom-4 left-4',
      enter: 'translate-x-0',
      exit: '-translate-x-full',
    },
    'top-center': {
      container: 'top-4 left-1/2 transform -translate-x-1/2',
      enter: 'translate-y-0',
      exit: '-translate-y-full',
    },
    'bottom-center': {
      container: 'bottom-4 left-1/2 transform -translate-x-1/2',
      enter: 'translate-y-0',
      exit: 'translate-y-full',
    },
  };

  const positionClass = positionClasses[position] || positionClasses['top-right'];

  // Handle dismiss
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match transition duration
  };

  // Auto-dismiss after duration
  useEffect(() => {
    setIsVisible(true);

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  return (
    <div
      className={`
        fixed z-50 ${positionClass.container}
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? positionClass.enter : positionClass.exit}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className={`
        max-w-sm w-full ${config.bgColor} border ${config.borderColor} 
        rounded-lg shadow-lg pointer-events-auto overflow-hidden
      `}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            
            <div className="ml-3 w-0 flex-1">
              {notification.title && (
                <p className={`text-sm font-medium ${config.textColor}`}>
                  {notification.title}
                </p>
              )}
              {notification.message && (
                <p className={`text-sm ${config.textColor} ${notification.title ? 'mt-1' : ''}`}>
                  {notification.message}
                </p>
              )}
              
              {notification.actionUrl && (
                <div className="mt-2">
                  <a
                    href={notification.actionUrl}
                    className={`text-sm font-medium ${config.textColor} hover:underline`}
                  >
                    View Details →
                  </a>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className={`
                  inline-flex ${config.textColor} hover:${config.textColor} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${config.bgColor} 
                  focus:ring-indigo-500 rounded-md
                `}
              >
                <span className="sr-only">Close</span>
                <XMarkIconSolid className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={`h-full ${config.iconColor.replace('text-', 'bg-')} transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`,
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
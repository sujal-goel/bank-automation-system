/**
 * Responsive Button Component
 * Touch-friendly button with proper sizing and haptic feedback
 */

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import useHapticFeedback from '@/hooks/useHapticFeedback';
import useLongPress from '@/hooks/useLongPress';

// LoadingSpinner component defined outside to avoid recreation during render
const LoadingSpinner = () => (
  <svg 
    className="animate-spin h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ResponsiveButton = forwardRef(({ 
  children,
  className,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  onClick,
  onLongPress,
  hapticFeedback = true,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props 
}, ref) => {
  const { triggerTapFeedback, triggerErrorFeedback } = useHapticFeedback();

  const handleClick = (event) => {
    if (disabled || loading) {
      if (hapticFeedback) {
        triggerErrorFeedback();
      }
      return;
    }

    if (hapticFeedback) {
      triggerTapFeedback();
    }
    
    onClick?.(event);
  };

  const handleLongPress = (event) => {
    if (disabled || loading) return;
    onLongPress?.(event);
  };

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    onClick: handleClick,
    hapticFeedback,
  });

  const baseClasses = cn(
    // Touch target requirements
    'touch-target min-h-[44px] min-w-[44px]',
    // Base styling
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'active:scale-[0.98] transform',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed',
    // Loading state
    loading && 'cursor-wait',
    // Full width
    fullWidth && 'w-full',
  );

  const variantClasses = {
    primary: cn(
      'bg-primary-600 text-white shadow-sm',
      'hover:bg-primary-700 focus:ring-primary-500',
      'active:bg-primary-800',
    ),
    secondary: cn(
      'bg-white text-gray-900 border border-gray-300 shadow-sm',
      'hover:bg-gray-50 focus:ring-primary-500',
      'active:bg-gray-100',
    ),
    outline: cn(
      'bg-transparent text-primary-600 border border-primary-600',
      'hover:bg-primary-50 focus:ring-primary-500',
      'active:bg-primary-100',
    ),
    ghost: cn(
      'bg-transparent text-gray-600',
      'hover:bg-gray-100 focus:ring-gray-500',
      'active:bg-gray-200',
    ),
    danger: cn(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 focus:ring-red-500',
      'active:bg-red-800',
    ),
    success: cn(
      'bg-green-600 text-white shadow-sm',
      'hover:bg-green-700 focus:ring-green-500',
      'active:bg-green-800',
    ),
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    default: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
    icon: 'p-2.5', // Square button for icons
  };

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...longPressHandlers}
      {...props}
    >
      {loading && <LoadingSpinner />}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      
      {!loading && children && (
        <span className={cn(
          size === 'icon' && 'sr-only', // Hide text in icon-only buttons for screen readers
        )}>
          {children}
        </span>
      )}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
});

ResponsiveButton.displayName = 'ResponsiveButton';

export default ResponsiveButton;
/**
 * Mobile-Optimized Input Component
 * Touch-friendly input with proper mobile keyboard support
 */

'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';

const MobileInput = forwardRef(({ 
  className,
  type = 'text',
  label,
  error,
  helperText,
  fullWidth = true,
  ...props 
}, ref) => {
  const inputId = props.id || useId();

  // Mobile-specific input types for better keyboard
  const getMobileInputType = (type) => {
    switch (type) {
      case 'phone':
        return 'tel';
      case 'currency':
        return 'number';
      default:
        return type;
    }
  };

  // Mobile-specific input modes
  const getInputMode = (type) => {
    switch (type) {
      case 'phone':
        return 'tel';
      case 'currency':
      case 'number':
        return 'numeric';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      default:
        return undefined;
    }
  };

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        type={getMobileInputType(type)}
        inputMode={getInputMode(type)}
        className={cn(
          'mobile-input',
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500',
          'text-base', // Prevent zoom on iOS
          'transition-colors duration-200',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;
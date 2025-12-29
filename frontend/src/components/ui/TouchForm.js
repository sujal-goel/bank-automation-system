/**
 * Touch-Friendly Form Component
 * Ensures all form elements meet 44x44px minimum touch target size
 */

'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import useHapticFeedback from '@/hooks/useHapticFeedback';

const TouchForm = forwardRef(({ 
  children, 
  className, 
  onSubmit,
  hapticFeedback = true,
  ...props 
}, ref) => {
  const { triggerSuccessFeedback, triggerErrorFeedback } = useHapticFeedback();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      await onSubmit?.(event);
      if (hapticFeedback) {
        triggerSuccessFeedback();
      }
    } catch (error) {
      if (hapticFeedback) {
        triggerErrorFeedback();
      }
      throw error;
    }
  };

  return (
    <form
      ref={ref}
      className={cn('space-y-4', className)}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  );
});

TouchForm.displayName = 'TouchForm';

// Touch-friendly input component
const TouchInput = forwardRef(({ 
  className,
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  ...props 
}, ref) => {
  const inputId = props.id || useId();

  // Mobile-specific input configurations
  const getMobileConfig = (type) => {
    const configs = {
      email: {
        type: 'email',
        inputMode: 'email',
        autoComplete: 'email',
        autoCapitalize: 'none',
      },
      phone: {
        type: 'tel',
        inputMode: 'tel',
        autoComplete: 'tel',
      },
      number: {
        type: 'number',
        inputMode: 'numeric',
        pattern: '[0-9]*',
      },
      currency: {
        type: 'number',
        inputMode: 'decimal',
        step: '0.01',
      },
      password: {
        type: 'password',
        autoComplete: 'current-password',
        autoCapitalize: 'none',
      },
      search: {
        type: 'search',
        inputMode: 'search',
        autoComplete: 'off',
      },
      url: {
        type: 'url',
        inputMode: 'url',
        autoComplete: 'url',
        autoCapitalize: 'none',
      },
      default: {
        type: 'text',
        autoComplete: 'off',
      },
    };

    return configs[type] || configs.default;
  };

  const mobileConfig = getMobileConfig(type);

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            'touch-target cursor-pointer',
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">{icon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Touch target requirements
            'touch-target min-h-[44px]',
            // Base styling
            'block w-full rounded-lg border-gray-300 shadow-sm',
            'focus:border-primary-500 focus:ring-primary-500',
            // Mobile optimizations
            'text-base leading-6', // Prevent zoom on iOS
            'transition-colors duration-200',
            // Icon spacing
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            // Error state
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          required={required}
          {...mobileConfig}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">{icon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
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

TouchInput.displayName = 'TouchInput';

// Touch-friendly select component
const TouchSelect = forwardRef(({ 
  className,
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  options = [],
  placeholder = 'Select an option',
  ...props 
}, ref) => {
  const selectId = props.id || useId();

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            'touch-target cursor-pointer',
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={cn(
          // Touch target requirements
          'touch-target min-h-[44px]',
          // Base styling
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500',
          // Mobile optimizations
          'text-base leading-6', // Prevent zoom on iOS
          'transition-colors duration-200',
          'bg-white cursor-pointer',
          // Error state
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
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

TouchSelect.displayName = 'TouchSelect';

// Touch-friendly textarea component
const TouchTextarea = forwardRef(({ 
  className,
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  rows = 4,
  ...props 
}, ref) => {
  const textareaId = props.id || useId();

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={textareaId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            'touch-target cursor-pointer',
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          // Touch target requirements (height handled by rows)
          'min-h-[44px]',
          // Base styling
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500',
          // Mobile optimizations
          'text-base leading-6', // Prevent zoom on iOS
          'transition-colors duration-200',
          'resize-vertical',
          // Error state
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        required={required}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
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

TouchTextarea.displayName = 'TouchTextarea';

// Touch-friendly checkbox component
const TouchCheckbox = forwardRef(({ 
  className,
  label,
  error,
  helperText,
  required = false,
  ...props 
}, ref) => {
  const checkboxId = props.id || useId();

  return (
    <div className="space-y-2">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              // Touch target requirements
              'touch-target min-h-[20px] min-w-[20px]',
              // Base styling
              'rounded border-gray-300 text-primary-600',
              'focus:ring-primary-500 focus:ring-offset-0',
              'transition-colors duration-200',
              // Error state
              error && 'border-red-300 focus:ring-red-500',
              className,
            )}
            required={required}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label 
              htmlFor={checkboxId}
              className={cn(
                'font-medium text-gray-700 cursor-pointer',
                'touch-target inline-block',
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
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

TouchCheckbox.displayName = 'TouchCheckbox';

export { TouchForm, TouchInput, TouchSelect, TouchTextarea, TouchCheckbox };
export default TouchForm;
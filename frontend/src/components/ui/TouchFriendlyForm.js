/**
 * Touch-Friendly Form Component
 * Ensures all form elements meet 44x44px minimum touch targets
 */

'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import useHapticFeedback from '@/hooks/useHapticFeedback';

// Touch-friendly input component
export const TouchInput = forwardRef(({ 
  className,
  type = 'text',
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  hapticFeedback = true,
  ...props 
}, ref) => {
  const { triggerTapFeedback, triggerErrorFeedback } = useHapticFeedback();
  const inputId = props.id || useId();

  const handleFocus = (event) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    props.onFocus?.(event);
  };

  const handleInvalid = (event) => {
    if (hapticFeedback) {
      triggerErrorFeedback();
    }
    props.onInvalid?.(event);
  };

  // Mobile-specific input types and modes
  const getMobileInputType = (type) => {
    switch (type) {
      case 'phone': return 'tel';
      case 'currency': return 'number';
      default: return type;
    }
  };

  const getInputMode = (type) => {
    switch (type) {
      case 'phone': return 'tel';
      case 'currency':
      case 'number': return 'numeric';
      case 'email': return 'email';
      case 'url': return 'url';
      default: return undefined;
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 touch-target"
        >
          {label}
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
          type={getMobileInputType(type)}
          inputMode={getInputMode(type)}
          className={cn(
            // Touch target requirements
            'touch-target min-h-[44px]',
            // Base styling
            'block w-full rounded-lg border-gray-300 shadow-sm',
            'focus:border-primary-500 focus:ring-primary-500',
            'text-base leading-6', // Prevent zoom on iOS
            'transition-colors duration-200',
            'placeholder-gray-400',
            // Icon padding
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            // Error state
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className,
          )}
          onFocus={handleFocus}
          onInvalid={handleInvalid}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">{icon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 touch-target">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1 touch-target">
          {helperText}
        </p>
      )}
    </div>
  );
});

TouchInput.displayName = 'TouchInput';

// Touch-friendly select component
export const TouchSelect = forwardRef(({ 
  className,
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  hapticFeedback = true,
  ...props 
}, ref) => {
  const { triggerTapFeedback } = useHapticFeedback();
  const selectId = props.id || useId();

  const handleFocus = (event) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    props.onFocus?.(event);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 touch-target"
        >
          {label}
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
          'text-base leading-6', // Prevent zoom on iOS
          'transition-colors duration-200',
          'bg-white',
          // Error state
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        onFocus={handleFocus}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 touch-target">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1 touch-target">
          {helperText}
        </p>
      )}
    </div>
  );
});

TouchSelect.displayName = 'TouchSelect';

// Touch-friendly textarea component
export const TouchTextarea = forwardRef(({ 
  className,
  label,
  error,
  helperText,
  rows = 4,
  hapticFeedback = true,
  ...props 
}, ref) => {
  const { triggerTapFeedback } = useHapticFeedback();
  const textareaId = props.id || useId();

  const handleFocus = (event) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    props.onFocus?.(event);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 touch-target"
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          // Touch target requirements (minimum height handled by rows)
          'touch-target',
          // Base styling
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500',
          'text-base leading-6', // Prevent zoom on iOS
          'transition-colors duration-200',
          'placeholder-gray-400',
          'resize-vertical',
          // Error state
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        onFocus={handleFocus}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 mt-1 touch-target">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1 touch-target">
          {helperText}
        </p>
      )}
    </div>
  );
});

TouchTextarea.displayName = 'TouchTextarea';

// Touch-friendly checkbox component
export const TouchCheckbox = forwardRef(({ 
  className,
  label,
  description,
  hapticFeedback = true,
  ...props 
}, ref) => {
  const { triggerTapFeedback } = useHapticFeedback();
  const checkboxId = props.id || useId();

  const handleChange = (event) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    props.onChange?.(event);
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-11"> {/* Ensure 44px height */}
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
            className,
          )}
          onChange={handleChange}
          {...props}
        />
      </div>
      
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label 
              htmlFor={checkboxId}
              className="block text-sm font-medium text-gray-700 touch-target cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

TouchCheckbox.displayName = 'TouchCheckbox';

// Touch-friendly radio group component
export const TouchRadioGroup = ({ 
  name,
  options = [],
  value,
  onChange,
  label,
  error,
  hapticFeedback = true,
  className, 
}) => {
  const { triggerTapFeedback } = useHapticFeedback();

  const handleChange = (optionValue) => {
    if (hapticFeedback) {
      triggerTapFeedback();
    }
    onChange?.(optionValue);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 touch-target">
          {label}
        </legend>
      )}
      
      <div className="space-y-3">
        {options.map((option, index) => {
          const radioId = `${name}-${index}`;
          return (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex items-center h-11"> {/* Ensure 44px height */}
                <input
                  id={radioId}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleChange(option.value)}
                  className={cn(
                    // Touch target requirements
                    'touch-target min-h-[20px] min-w-[20px]',
                    // Base styling
                    'border-gray-300 text-primary-600',
                    'focus:ring-primary-500 focus:ring-offset-0',
                    'transition-colors duration-200',
                  )}
                />
              </div>
              
              <div className="flex-1">
                <label 
                  htmlFor={radioId}
                  className="block text-sm font-medium text-gray-700 touch-target cursor-pointer"
                >
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 touch-target">
          {error}
        </p>
      )}
    </div>
  );
};

// Main form container
const TouchFriendlyForm = forwardRef(({ 
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
      className={cn(
        'space-y-6',
        // Ensure proper spacing for touch targets
        '[&>*]:min-h-[44px]',
        className,
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  );
});

TouchFriendlyForm.displayName = 'TouchFriendlyForm';

export default TouchFriendlyForm;
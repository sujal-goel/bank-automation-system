/**
 * Form Textarea Component
 * Reusable textarea component with validation and styling
 */
import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * FormTextarea Component
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.name - Textarea name
 * @param {string} [props.placeholder] - Textarea placeholder
 * @param {number} [props.rows=4] - Number of rows
 * @param {boolean} [props.required=false] - Whether textarea is required
 * @param {string} [props.error] - Error message
 * @param {string} [props.value] - Textarea value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {boolean} [props.disabled=false] - Whether textarea is disabled
 * @param {number} [props.maxLength] - Maximum character length
 * @param {string} [props.className] - Additional CSS classes
 */
const FormTextarea = ({
  label,
  name,
  placeholder,
  rows = 4,
  required = false,
  error,
  value,
  onChange,
  onBlur,
  disabled = false,
  maxLength,
  className = '',
  ...props
}) => {
  const characterCount = value ? value.length : 0;
  const showCharacterCount = maxLength && maxLength > 0;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            resize-vertical
            ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400'
    }
            bg-white dark:bg-gray-700
          `}
          {...props}
        />
        
        {error && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        
        {showCharacterCount && (
          <p className={`text-xs ${
            characterCount > maxLength * 0.9 
              ? 'text-red-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormTextarea;
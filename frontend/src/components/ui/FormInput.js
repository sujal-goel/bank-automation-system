/**
 * Form Input Component
 * Reusable input component with validation and styling
 */
import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * FormInput Component
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.name - Input name
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.placeholder] - Input placeholder
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {string} [props.error] - Error message
 * @param {string} [props.value] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {string} [props.className] - Additional CSS classes
 */
const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error,
  value,
  onChange,
  onBlur,
  disabled = false,
  className = '',
  ...props
}) => {
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
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400'
    }
            bg-white dark:bg-gray-700
          `}
          {...props}
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
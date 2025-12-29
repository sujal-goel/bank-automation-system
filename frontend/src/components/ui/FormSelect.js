/**
 * Form Select Component
 * Reusable select component with validation and styling
 */
import React from 'react';
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * FormSelect Component
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {string} props.name - Select name
 * @param {Array} props.options - Select options
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.required=false] - Whether select is required
 * @param {string} [props.error] - Error message
 * @param {string} [props.value] - Selected value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {boolean} [props.disabled=false] - Whether select is disabled
 * @param {string} [props.className] - Additional CSS classes
 */
const FormSelect = ({
  label,
  name,
  options = [],
  placeholder = 'Select an option',
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
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            appearance-none pr-10
            ${error 
      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
    }
            bg-white dark:bg-gray-700
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {error ? (
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
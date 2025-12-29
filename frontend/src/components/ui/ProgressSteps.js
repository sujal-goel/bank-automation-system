/**
 * Progress Steps Component
 * Shows progress through a multi-step process
 */
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * ProgressSteps Component
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects
 * @param {number} props.currentStep - Current active step (0-based)
 * @param {string} [props.className] - Additional CSS classes
 */
const ProgressSteps = ({
  steps = [],
  currentStep = 0,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                    ${isCompleted 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : isCurrent 
                ? 'bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-white border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
            }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-3 min-w-0">
                  <p
                    className={`
                      text-sm font-medium
                      ${isCompleted || isCurrent 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
            }
                    `}
                  >
                    {step.title || step.name || `Step ${index + 1}`}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4
                    ${isCompleted 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600'
                }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps;
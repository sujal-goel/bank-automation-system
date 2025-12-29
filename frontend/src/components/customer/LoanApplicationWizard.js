/**
 * Loan Application Wizard Component
 * Multi-step form for loan applications with validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PersonalInfoStep from './loan-steps/PersonalInfoStep';
import LoanDetailsStep from './loan-steps/LoanDetailsStep';
import FinancialInfoStep from './loan-steps/FinancialInfoStep';
import DocumentsStep from './loan-steps/DocumentsStep';
import ReviewStep from './loan-steps/ReviewStep';

const steps = [
  { id: 'personal', name: 'Personal Information', component: PersonalInfoStep },
  { id: 'loan', name: 'Loan Details', component: LoanDetailsStep },
  { id: 'financial', name: 'Financial Information', component: FinancialInfoStep },
  { id: 'documents', name: 'Documents', component: DocumentsStep },
  { id: 'review', name: 'Review & Submit', component: ReviewStep },
];

export default function LoanApplicationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personal: {},
    loan: {},
    financial: {},
    documents: [],
  });
  const [stepValidation, setStepValidation] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const updateFormData = (stepKey, data) => {
    setFormData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data },
    }));
  };

  const updateStepValidation = (stepIndex, isValid, errors = {}) => {
    setStepValidation(prev => ({
      ...prev,
      [stepIndex]: { isValid, errors },
    }));
  };

  const canProceedToNext = () => {
    const currentStepValidation = stepValidation[currentStep];
    return currentStepValidation?.isValid !== false;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, submit to backend
      console.log('Submitting loan application:', formData);
      
      // Redirect to success page
      router.push('/applications/loan/success');
    } catch (error) {
      console.error('Error submitting application:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, index) => (
              <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {/* Step connector line */}
                {index !== steps.length - 1 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                )}
                
                {/* Step circle and content */}
                <div className="relative flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index < currentStep
                      ? 'bg-blue-600 border-blue-600'
                      : index === currentStep
                        ? 'border-blue-600 bg-white'
                        : 'border-gray-300 bg-white'
                  }`}>
                    {index < currentStep ? (
                      <CheckIcon className="h-4 w-4 text-white" />
                    ) : (
                      <span className={`text-sm font-medium ${
                        index === currentStep ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <span className={`ml-3 text-sm font-medium hidden sm:block ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="px-6 py-8">
        <CurrentStepComponent
          data={formData}
          updateData={updateFormData}
          updateValidation={(isValid, errors) => updateStepValidation(currentStep, isValid, errors)}
          errors={stepValidation[currentStep]?.errors || {}}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceedToNext() || isSubmitting}
            className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              !canProceedToNext() || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !canProceedToNext()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
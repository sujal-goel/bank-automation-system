/**
 * Account Application Form Component
 * Multi-step form for new account applications
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import ProgressSteps from '@/components/ui/ProgressSteps';

// Account types configuration
const accountTypes = [
  {
    value: 'checking',
    label: 'Checking Account',
    description: 'For everyday transactions and bill payments',
    minimumDeposit: 100,
  },
  {
    value: 'savings',
    label: 'Savings Account',
    description: 'Earn interest on your deposits',
    minimumDeposit: 500,
  },
  {
    value: 'business',
    label: 'Business Account',
    description: 'For business banking needs',
    minimumDeposit: 1000,
  },
];

// Form steps configuration
const steps = [
  { title: 'Account Type', description: 'Choose your account type' },
  { title: 'Personal Info', description: 'Your personal details' },
  { title: 'Financial Info', description: 'Income and employment' },
  { title: 'Review', description: 'Review and submit' },
];

/**
 * Account Application Form Component
 * @param {Object} props
 * @param {function} [props.onSubmit] - Form submission handler
 * @param {function} [props.onCancel] - Form cancellation handler
 * @param {string} [props.className] - Additional CSS classes
 */
const AccountApplicationForm = ({
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
  } = useForm({
    mode: 'onChange',
  });

  // Watch form values for validation
  const watchedValues = watch();

  // Handle next step
  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Get fields to validate for current step
  const getFieldsForStep = (step) => {
    switch (step) {
      case 0:
        return ['accountType'];
      case 1:
        return ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'ssn'];
      case 2:
        return ['employmentStatus', 'employer', 'annualIncome', 'initialDeposit'];
      default:
        return [];
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const applicationData = {
        ...data,
        accountType: selectedAccountType,
        applicationDate: new Date().toISOString(),
        status: 'pending',
      };

      if (onSubmit) {
        await onSubmit(applicationData);
      }
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Choose Your Account Type
              </h3>
              <div className="grid gap-4">
                {accountTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`
                      border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${selectedAccountType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                    `}
                    onClick={() => setSelectedAccountType(type.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {type.label}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {type.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          Minimum deposit: ${type.minimumDeposit.toLocaleString()}
                        </p>
                      </div>
                      {selectedAccountType === type.value && (
                        <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <input
                type="hidden"
                {...register('accountType', { required: 'Please select an account type' })}
                value={selectedAccountType || ''}
              />
              {errors.accountType && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {errors.accountType.message}
                </p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="First Name"
                name="firstName"
                required
                {...register('firstName', { required: 'First name is required' })}
                error={errors.firstName?.message}
              />
              
              <FormInput
                label="Last Name"
                name="lastName"
                required
                {...register('lastName', { required: 'Last name is required' })}
                error={errors.lastName?.message}
              />
              
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                required
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={errors.email?.message}
              />
              
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                required
                {...register('phone', { required: 'Phone number is required' })}
                error={errors.phone?.message}
              />
              
              <FormInput
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                required
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                error={errors.dateOfBirth?.message}
              />
              
              <FormInput
                label="Social Security Number"
                name="ssn"
                type="password"
                placeholder="XXX-XX-XXXX"
                required
                {...register('ssn', { 
                  required: 'SSN is required',
                  pattern: {
                    value: /^\d{3}-?\d{2}-?\d{4}$/,
                    message: 'Invalid SSN format',
                  },
                })}
                error={errors.ssn?.message}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Financial Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="Employment Status"
                name="employmentStatus"
                required
                options={[
                  { value: 'employed', label: 'Employed' },
                  { value: 'self-employed', label: 'Self-Employed' },
                  { value: 'unemployed', label: 'Unemployed' },
                  { value: 'retired', label: 'Retired' },
                  { value: 'student', label: 'Student' },
                ]}
                {...register('employmentStatus', { required: 'Employment status is required' })}
                error={errors.employmentStatus?.message}
              />
              
              <FormInput
                label="Employer"
                name="employer"
                {...register('employer')}
                error={errors.employer?.message}
              />
              
              <FormInput
                label="Annual Income"
                name="annualIncome"
                type="number"
                placeholder="50000"
                required
                {...register('annualIncome', { 
                  required: 'Annual income is required',
                  min: { value: 0, message: 'Income must be positive' },
                })}
                error={errors.annualIncome?.message}
              />
              
              <FormInput
                label="Initial Deposit"
                name="initialDeposit"
                type="number"
                placeholder={selectedAccountType ? accountTypes.find(t => t.value === selectedAccountType)?.minimumDeposit : '100'}
                required
                {...register('initialDeposit', { 
                  required: 'Initial deposit is required',
                  min: { 
                    value: selectedAccountType ? accountTypes.find(t => t.value === selectedAccountType)?.minimumDeposit : 100,
                    message: `Minimum deposit is $${selectedAccountType ? accountTypes.find(t => t.value === selectedAccountType)?.minimumDeposit : 100}`,
                  },
                })}
                error={errors.initialDeposit?.message}
              />
            </div>
            
            <FormTextarea
              label="Additional Information"
              name="additionalInfo"
              placeholder="Any additional information you'd like to provide..."
              rows={4}
              {...register('additionalInfo')}
              error={errors.additionalInfo?.message}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Review Your Application
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Account Type</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {accountTypes.find(t => t.value === selectedAccountType)?.label}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Personal Information</h4>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <p>{watchedValues.firstName} {watchedValues.lastName}</p>
                  <p>{watchedValues.email}</p>
                  <p>{watchedValues.phone}</p>
                  <p>DOB: {watchedValues.dateOfBirth}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Financial Information</h4>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Employment: {watchedValues.employmentStatus}</p>
                  {watchedValues.employer && <p>Employer: {watchedValues.employer}</p>}
                  <p>Annual Income: ${parseInt(watchedValues.annualIncome || 0).toLocaleString()}</p>
                  <p>Initial Deposit: ${parseInt(watchedValues.initialDeposit || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                By submitting this application, you agree to our terms and conditions and authorize us to verify the information provided.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountApplicationForm;
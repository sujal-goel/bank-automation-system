/**
 * Loan Application Form Component
 * Multi-step wizard for loan applications with real-time validation
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import ProgressSteps from '@/components/ui/ProgressSteps';

const loanTypes = [
  { value: 'personal', label: 'Personal Loan' },
  { value: 'auto', label: 'Auto Loan' },
  { value: 'home', label: 'Home Loan' },
  { value: 'business', label: 'Business Loan' },
];

const employmentTypes = [
  { value: 'full-time', label: 'Full-time Employee' },
  { value: 'part-time', label: 'Part-time Employee' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'contractor', label: 'Independent Contractor' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' },
];

const incomeFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'annually', label: 'Annually' },
];

const steps = [
  { id: 1, name: 'Loan Details', description: 'Basic loan information' },
  { id: 2, name: 'Personal Info', description: 'Your personal details' },
  { id: 3, name: 'Employment', description: 'Employment and income' },
  { id: 4, name: 'Financial Info', description: 'Assets and liabilities' },
  { id: 5, name: 'Review', description: 'Review and submit' },
];

export default function LoanApplicationForm({ currentStep, onStepChange, onBack }) {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid },
    watch,
    trigger,
    getValues,
  } = useForm({
    mode: 'onChange',
    defaultValues: formData,
  });

  const watchedValues = watch();

  // Update form data when values change
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...watchedValues }));
  }, [watchedValues]);

  const validateStep = async () => {
    const fieldsToValidate = getStepFields(currentStep);
    return await trigger(fieldsToValidate);
  };

  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return ['loanType', 'loanAmount', 'loanPurpose', 'loanTerm'];
      case 2:
        return ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'ssn'];
      case 3:
        return ['employmentType', 'employerName', 'jobTitle', 'monthlyIncome', 'incomeFrequency'];
      case 4:
        return ['monthlyExpenses', 'assets', 'liabilities'];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isStepValid = await validateStep();
    if (isStepValid && currentStep < steps.length) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    } else {
      onBack();
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/applications/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Handle successful submission
        alert('Application submitted successfully!');
        onBack();
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Loan Details</h2>
            
            <FormSelect
              label="Loan Type"
              name="loanType"
              register={register}
              options={loanTypes}
              error={errors.loanType}
              rules={{ required: 'Please select a loan type' }}
            />

            <FormInput
              label="Loan Amount"
              name="loanAmount"
              type="number"
              register={register}
              error={errors.loanAmount}
              rules={{ 
                required: 'Loan amount is required',
                min: { value: 1000, message: 'Minimum loan amount is $1,000' },
                max: { value: 500000, message: 'Maximum loan amount is $500,000' },
              }}
              placeholder="Enter loan amount"
            />

            <FormTextarea
              label="Loan Purpose"
              name="loanPurpose"
              register={register}
              error={errors.loanPurpose}
              rules={{ required: 'Please describe the purpose of the loan' }}
              placeholder="Describe what you'll use the loan for"
              rows={3}
            />

            <FormSelect
              label="Loan Term (months)"
              name="loanTerm"
              register={register}
              options={[
                { value: '12', label: '12 months' },
                { value: '24', label: '24 months' },
                { value: '36', label: '36 months' },
                { value: '48', label: '48 months' },
                { value: '60', label: '60 months' },
              ]}
              error={errors.loanTerm}
              rules={{ required: 'Please select a loan term' }}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="First Name"
                name="firstName"
                register={register}
                error={errors.firstName}
                rules={{ required: 'First name is required' }}
              />

              <FormInput
                label="Last Name"
                name="lastName"
                register={register}
                error={errors.lastName}
                rules={{ required: 'Last name is required' }}
              />
            </div>

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              register={register}
              error={errors.phone}
              rules={{ 
                required: 'Phone number is required',
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Invalid phone number',
                },
              }}
            />

            <FormInput
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              register={register}
              error={errors.dateOfBirth}
              rules={{ required: 'Date of birth is required' }}
            />

            <FormInput
              label="Social Security Number"
              name="ssn"
              register={register}
              error={errors.ssn}
              rules={{ 
                required: 'SSN is required',
                pattern: {
                  value: /^\d{3}-?\d{2}-?\d{4}$/,
                  message: 'Invalid SSN format',
                },
              }}
              placeholder="XXX-XX-XXXX"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Employment Information</h2>
            
            <FormSelect
              label="Employment Type"
              name="employmentType"
              register={register}
              options={employmentTypes}
              error={errors.employmentType}
              rules={{ required: 'Please select employment type' }}
            />

            <FormInput
              label="Employer Name"
              name="employerName"
              register={register}
              error={errors.employerName}
              rules={{ required: 'Employer name is required' }}
            />

            <FormInput
              label="Job Title"
              name="jobTitle"
              register={register}
              error={errors.jobTitle}
              rules={{ required: 'Job title is required' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Monthly Income"
                name="monthlyIncome"
                type="number"
                register={register}
                error={errors.monthlyIncome}
                rules={{ 
                  required: 'Monthly income is required',
                  min: { value: 0, message: 'Income must be positive' },
                }}
                placeholder="Enter monthly income"
              />

              <FormSelect
                label="Income Frequency"
                name="incomeFrequency"
                register={register}
                options={incomeFrequencies}
                error={errors.incomeFrequency}
                rules={{ required: 'Please select income frequency' }}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Financial Information</h2>
            
            <FormInput
              label="Monthly Expenses"
              name="monthlyExpenses"
              type="number"
              register={register}
              error={errors.monthlyExpenses}
              rules={{ 
                required: 'Monthly expenses are required',
                min: { value: 0, message: 'Expenses must be positive' },
              }}
              placeholder="Enter total monthly expenses"
            />

            <FormInput
              label="Total Assets"
              name="assets"
              type="number"
              register={register}
              error={errors.assets}
              rules={{ 
                min: { value: 0, message: 'Assets must be positive' },
              }}
              placeholder="Enter total assets (savings, investments, etc.)"
            />

            <FormInput
              label="Total Liabilities"
              name="liabilities"
              type="number"
              register={register}
              error={errors.liabilities}
              rules={{ 
                min: { value: 0, message: 'Liabilities must be positive' },
              }}
              placeholder="Enter total liabilities (debts, loans, etc.)"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review Your Application</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Loan Details</h3>
                  <p>Type: {formData.loanType}</p>
                  <p>Amount: ${formData.loanAmount?.toLocaleString()}</p>
                  <p>Term: {formData.loanTerm} months</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Personal Info</h3>
                  <p>Name: {formData.firstName} {formData.lastName}</p>
                  <p>Email: {formData.email}</p>
                  <p>Phone: {formData.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-900">Ready to Submit</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    By submitting this application, you agree to our terms and conditions 
                    and authorize us to verify the information provided.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <ProgressSteps steps={steps} currentStep={currentStep} />

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Back to Selection' : 'Previous'}
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary flex items-center"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="btn btn-primary flex items-center disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
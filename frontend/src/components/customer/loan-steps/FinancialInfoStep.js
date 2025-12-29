/**
 * Financial Information Step
 * Third step of loan application wizard
 */

'use client';

import { useState, useEffect } from 'react';

export default function FinancialInfoStep({ data, updateData, updateValidation, errors }) {
  const [formData, setFormData] = useState({
    employmentStatus: '',
    employer: '',
    jobTitle: '',
    employmentLength: '',
    annualIncome: '',
    additionalIncome: '',
    monthlyRent: '',
    monthlyDebt: '',
    creditScore: '',
    bankingHistory: '',
    ...data.financial,
  });

  const [formErrors, setFormErrors] = useState({});

  const employmentStatuses = [
    { value: 'employed', label: 'Employed Full-Time' },
    { value: 'part_time', label: 'Employed Part-Time' },
    { value: 'self_employed', label: 'Self-Employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
    { value: 'student', label: 'Student' },
  ];

  const employmentLengths = [
    { value: 'less_than_1', label: 'Less than 1 year' },
    { value: '1_2', label: '1-2 years' },
    { value: '2_5', label: '2-5 years' },
    { value: '5_10', label: '5-10 years' },
    { value: 'more_than_10', label: 'More than 10 years' },
  ];

  const creditScoreRanges = [
    { value: 'excellent', label: 'Excellent (750+)' },
    { value: 'good', label: 'Good (700-749)' },
    { value: 'fair', label: 'Fair (650-699)' },
    { value: 'poor', label: 'Poor (600-649)' },
    { value: 'very_poor', label: 'Very Poor (Below 600)' },
    { value: 'unknown', label: 'I don\'t know' },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Employment status validation
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
    }

    // Employer validation (required if employed)
    if (['employed', 'part_time'].includes(formData.employmentStatus) && !formData.employer.trim()) {
      newErrors.employer = 'Employer name is required';
    }

    // Job title validation (required if employed or self-employed)
    if (['employed', 'part_time', 'self_employed'].includes(formData.employmentStatus) && !formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    // Employment length validation (required if employed)
    if (['employed', 'part_time', 'self_employed'].includes(formData.employmentStatus) && !formData.employmentLength) {
      newErrors.employmentLength = 'Employment length is required';
    }

    // Annual income validation
    if (!formData.annualIncome) {
      newErrors.annualIncome = 'Annual income is required';
    } else {
      const income = parseFloat(formData.annualIncome.replace(/[^0-9]/g, ''));
      if (isNaN(income) || income <= 0) {
        newErrors.annualIncome = 'Please enter a valid annual income';
      } else if (income < 10000) {
        newErrors.annualIncome = 'Minimum annual income is $10,000';
      }
    }

    // Additional income validation (optional but must be valid if provided)
    if (formData.additionalIncome) {
      const additionalIncome = parseFloat(formData.additionalIncome.replace(/[^0-9]/g, ''));
      if (isNaN(additionalIncome) || additionalIncome < 0) {
        newErrors.additionalIncome = 'Please enter a valid additional income amount';
      }
    }

    // Monthly rent/mortgage validation
    if (!formData.monthlyRent) {
      newErrors.monthlyRent = 'Monthly housing payment is required';
    } else {
      const rent = parseFloat(formData.monthlyRent.replace(/[^0-9]/g, ''));
      if (isNaN(rent) || rent < 0) {
        newErrors.monthlyRent = 'Please enter a valid monthly housing payment';
      }
    }

    // Monthly debt validation
    if (!formData.monthlyDebt) {
      newErrors.monthlyDebt = 'Monthly debt payment is required (enter 0 if none)';
    } else {
      const debt = parseFloat(formData.monthlyDebt.replace(/[^0-9]/g, ''));
      if (isNaN(debt) || debt < 0) {
        newErrors.monthlyDebt = 'Please enter a valid monthly debt payment';
      }
    }

    // Credit score validation
    if (!formData.creditScore) {
      newErrors.creditScore = 'Credit score range is required';
    }

    // Banking history validation
    if (!formData.bankingHistory) {
      newErrors.bankingHistory = 'Banking history is required';
    }

    setFormErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    updateValidation(isValid, newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    updateData('financial', newFormData);

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const formatCurrency = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue).toLocaleString() : '';
  };

  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatCurrency(value);
    const newFormData = { ...formData, [name]: formattedValue };
    setFormData(newFormData);
    updateData('financial', newFormData);

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate on mount and when form data changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  const requiresEmploymentDetails = ['employed', 'part_time'].includes(formData.employmentStatus);
  const requiresJobTitle = ['employed', 'part_time', 'self_employed'].includes(formData.employmentStatus);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Financial Information</h2>
        <p className="text-gray-600">Please provide your financial details to help us assess your loan application.</p>
      </div>

      {/* Employment Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employment Status */}
          <div>
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Employment Status *
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              required
              value={formData.employmentStatus}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.employmentStatus ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select employment status</option>
              {employmentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {formErrors.employmentStatus && (
              <p className="mt-1 text-sm text-red-600">{formErrors.employmentStatus}</p>
            )}
          </div>

          {/* Employer */}
          {requiresEmploymentDetails && (
            <div>
              <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-1">
                Employer Name *
              </label>
              <input
                id="employer"
                name="employer"
                type="text"
                required
                value={formData.employer}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.employer ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your employer name"
              />
              {formErrors.employer && (
                <p className="mt-1 text-sm text-red-600">{formErrors.employer}</p>
              )}
            </div>
          )}

          {/* Job Title */}
          {requiresJobTitle && (
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                required
                value={formData.jobTitle}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.jobTitle ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your job title"
              />
              {formErrors.jobTitle && (
                <p className="mt-1 text-sm text-red-600">{formErrors.jobTitle}</p>
              )}
            </div>
          )}

          {/* Employment Length */}
          {requiresJobTitle && (
            <div>
              <label htmlFor="employmentLength" className="block text-sm font-medium text-gray-700 mb-1">
                Length of Employment *
              </label>
              <select
                id="employmentLength"
                name="employmentLength"
                required
                value={formData.employmentLength}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.employmentLength ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select employment length</option>
                {employmentLengths.map((length) => (
                  <option key={length.value} value={length.value}>
                    {length.label}
                  </option>
                ))}
              </select>
              {formErrors.employmentLength && (
                <p className="mt-1 text-sm text-red-600">{formErrors.employmentLength}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Income Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Income Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Income */}
          <div>
            <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="annualIncome"
                name="annualIncome"
                type="text"
                required
                value={formData.annualIncome}
                onChange={handleAmountChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.annualIncome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="75,000"
              />
            </div>
            {formErrors.annualIncome && (
              <p className="mt-1 text-sm text-red-600">{formErrors.annualIncome}</p>
            )}
          </div>

          {/* Additional Income */}
          <div>
            <label htmlFor="additionalIncome" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Annual Income (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="additionalIncome"
                name="additionalIncome"
                type="text"
                value={formData.additionalIncome}
                onChange={handleAmountChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.additionalIncome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="10,000"
              />
            </div>
            {formErrors.additionalIncome && (
              <p className="mt-1 text-sm text-red-600">{formErrors.additionalIncome}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Include rental income, investments, etc.</p>
          </div>
        </div>
      </div>

      {/* Expenses and Credit Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses & Credit Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Rent/Mortgage */}
          <div>
            <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Housing Payment *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="monthlyRent"
                name="monthlyRent"
                type="text"
                required
                value={formData.monthlyRent}
                onChange={handleAmountChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.monthlyRent ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1,500"
              />
            </div>
            {formErrors.monthlyRent && (
              <p className="mt-1 text-sm text-red-600">{formErrors.monthlyRent}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Rent or mortgage payment</p>
          </div>

          {/* Monthly Debt */}
          <div>
            <label htmlFor="monthlyDebt" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Debt Payments *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                id="monthlyDebt"
                name="monthlyDebt"
                type="text"
                required
                value={formData.monthlyDebt}
                onChange={handleAmountChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.monthlyDebt ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="500"
              />
            </div>
            {formErrors.monthlyDebt && (
              <p className="mt-1 text-sm text-red-600">{formErrors.monthlyDebt}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Credit cards, loans, etc. (Enter 0 if none)</p>
          </div>

          {/* Credit Score */}
          <div>
            <label htmlFor="creditScore" className="block text-sm font-medium text-gray-700 mb-1">
              Credit Score Range *
            </label>
            <select
              id="creditScore"
              name="creditScore"
              required
              value={formData.creditScore}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.creditScore ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select credit score range</option>
              {creditScoreRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            {formErrors.creditScore && (
              <p className="mt-1 text-sm text-red-600">{formErrors.creditScore}</p>
            )}
          </div>

          {/* Banking History */}
          <div>
            <label htmlFor="bankingHistory" className="block text-sm font-medium text-gray-700 mb-1">
              Banking History *
            </label>
            <select
              id="bankingHistory"
              name="bankingHistory"
              required
              value={formData.bankingHistory}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.bankingHistory ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select banking history</option>
              <option value="less_than_1">Less than 1 year</option>
              <option value="1_3">1-3 years</option>
              <option value="3_5">3-5 years</option>
              <option value="more_than_5">More than 5 years</option>
            </select>
            {formErrors.bankingHistory && (
              <p className="mt-1 text-sm text-red-600">{formErrors.bankingHistory}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
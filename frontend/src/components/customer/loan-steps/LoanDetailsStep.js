/**
 * Loan Details Step
 * Second step of loan application wizard
 */

'use client';

import { useState, useEffect } from 'react';

export default function LoanDetailsStep({ data, updateData, updateValidation, errors }) {
  const [formData, setFormData] = useState({
    loanType: '',
    loanAmount: '',
    loanPurpose: '',
    loanTerm: '',
    preferredPaymentDate: '',
    collateral: '',
    collateralValue: '',
    ...data.loan,
  });

  const [formErrors, setFormErrors] = useState({});

  const loanTypes = [
    { value: 'personal', label: 'Personal Loan' },
    { value: 'auto', label: 'Auto Loan' },
    { value: 'home', label: 'Home Loan/Mortgage' },
    { value: 'business', label: 'Business Loan' },
    { value: 'student', label: 'Student Loan' },
  ];

  const loanPurposes = [
    { value: 'debt_consolidation', label: 'Debt Consolidation' },
    { value: 'home_improvement', label: 'Home Improvement' },
    { value: 'major_purchase', label: 'Major Purchase' },
    { value: 'medical_expenses', label: 'Medical Expenses' },
    { value: 'education', label: 'Education' },
    { value: 'business_expansion', label: 'Business Expansion' },
    { value: 'other', label: 'Other' },
  ];

  const loanTerms = [
    { value: '12', label: '12 months' },
    { value: '24', label: '24 months' },
    { value: '36', label: '36 months' },
    { value: '48', label: '48 months' },
    { value: '60', label: '60 months' },
    { value: '72', label: '72 months' },
    { value: '84', label: '84 months' },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Loan type validation
    if (!formData.loanType) {
      newErrors.loanType = 'Loan type is required';
    }

    // Loan amount validation
    if (!formData.loanAmount) {
      newErrors.loanAmount = 'Loan amount is required';
    } else {
      const amount = parseFloat(formData.loanAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.loanAmount = 'Please enter a valid loan amount';
      } else if (amount < 1000) {
        newErrors.loanAmount = 'Minimum loan amount is $1,000';
      } else if (amount > 1000000) {
        newErrors.loanAmount = 'Maximum loan amount is $1,000,000';
      }
    }

    // Loan purpose validation
    if (!formData.loanPurpose) {
      newErrors.loanPurpose = 'Loan purpose is required';
    }

    // Loan term validation
    if (!formData.loanTerm) {
      newErrors.loanTerm = 'Loan term is required';
    }

    // Preferred payment date validation
    if (!formData.preferredPaymentDate) {
      newErrors.preferredPaymentDate = 'Preferred payment date is required';
    } else {
      const paymentDate = parseInt(formData.preferredPaymentDate);
      if (paymentDate < 1 || paymentDate > 28) {
        newErrors.preferredPaymentDate = 'Payment date must be between 1 and 28';
      }
    }

    // Collateral validation (required for certain loan types)
    if (['auto', 'home'].includes(formData.loanType)) {
      if (!formData.collateral) {
        newErrors.collateral = 'Collateral description is required for this loan type';
      }
      if (!formData.collateralValue) {
        newErrors.collateralValue = 'Collateral value is required for this loan type';
      } else {
        const value = parseFloat(formData.collateralValue);
        if (isNaN(value) || value <= 0) {
          newErrors.collateralValue = 'Please enter a valid collateral value';
        }
      }
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
    updateData('loan', newFormData);

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
    updateData('loan', newFormData);

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

  const requiresCollateral = ['auto', 'home'].includes(formData.loanType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loan Details</h2>
        <p className="text-gray-600">Please specify the details of your loan request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan Type */}
        <div>
          <label htmlFor="loanType" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Type *
          </label>
          <select
            id="loanType"
            name="loanType"
            required
            value={formData.loanType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.loanType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select loan type</option>
            {loanTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {formErrors.loanType && (
            <p className="mt-1 text-sm text-red-600">{formErrors.loanType}</p>
          )}
        </div>

        {/* Loan Amount */}
        <div>
          <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              id="loanAmount"
              name="loanAmount"
              type="text"
              required
              value={formData.loanAmount}
              onChange={handleAmountChange}
              className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.loanAmount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="50,000"
            />
          </div>
          {formErrors.loanAmount && (
            <p className="mt-1 text-sm text-red-600">{formErrors.loanAmount}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Minimum: $1,000 | Maximum: $1,000,000</p>
        </div>

        {/* Loan Purpose */}
        <div>
          <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Purpose *
          </label>
          <select
            id="loanPurpose"
            name="loanPurpose"
            required
            value={formData.loanPurpose}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.loanPurpose ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select loan purpose</option>
            {loanPurposes.map((purpose) => (
              <option key={purpose.value} value={purpose.value}>
                {purpose.label}
              </option>
            ))}
          </select>
          {formErrors.loanPurpose && (
            <p className="mt-1 text-sm text-red-600">{formErrors.loanPurpose}</p>
          )}
        </div>

        {/* Loan Term */}
        <div>
          <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Term *
          </label>
          <select
            id="loanTerm"
            name="loanTerm"
            required
            value={formData.loanTerm}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.loanTerm ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select loan term</option>
            {loanTerms.map((term) => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>
          {formErrors.loanTerm && (
            <p className="mt-1 text-sm text-red-600">{formErrors.loanTerm}</p>
          )}
        </div>

        {/* Preferred Payment Date */}
        <div>
          <label htmlFor="preferredPaymentDate" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Payment Date *
          </label>
          <select
            id="preferredPaymentDate"
            name="preferredPaymentDate"
            required
            value={formData.preferredPaymentDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.preferredPaymentDate ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select payment date</option>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
              </option>
            ))}
          </select>
          {formErrors.preferredPaymentDate && (
            <p className="mt-1 text-sm text-red-600">{formErrors.preferredPaymentDate}</p>
          )}
        </div>
      </div>

      {/* Collateral Section (conditional) */}
      {requiresCollateral && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Collateral Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collateral Description */}
            <div>
              <label htmlFor="collateral" className="block text-sm font-medium text-gray-700 mb-1">
                Collateral Description *
              </label>
              <textarea
                id="collateral"
                name="collateral"
                rows={3}
                required={requiresCollateral}
                value={formData.collateral}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.collateral ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the collateral (e.g., 2020 Honda Civic, Property at 123 Main St)"
              />
              {formErrors.collateral && (
                <p className="mt-1 text-sm text-red-600">{formErrors.collateral}</p>
              )}
            </div>

            {/* Collateral Value */}
            <div>
              <label htmlFor="collateralValue" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Collateral Value *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="collateralValue"
                  name="collateralValue"
                  type="text"
                  required={requiresCollateral}
                  value={formData.collateralValue}
                  onChange={handleAmountChange}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.collateralValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="25,000"
                />
              </div>
              {formErrors.collateralValue && (
                <p className="mt-1 text-sm text-red-600">{formErrors.collateralValue}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
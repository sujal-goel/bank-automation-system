/**
 * Review Step
 * Final step of loan application wizard
 */

'use client';

import { useState, useEffect } from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

export default function ReviewStep({ data, updateData, updateValidation, errors }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCredit, setAgreedToCredit] = useState(false);

  const validateReview = () => {
    const isValid = agreedToTerms && agreedToCredit;
    const errors = {};
    
    if (!agreedToTerms) {
      errors.terms = 'You must agree to the terms and conditions';
    }
    if (!agreedToCredit) {
      errors.credit = 'You must authorize the credit check';
    }
    
    updateValidation(isValid, errors);
    return isValid;
  };

  useEffect(() => {
    validateReview();
  }, [agreedToTerms, agreedToCredit]);

  const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[^0-9]/g, '')) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount || 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLoanTypeLabel = (type) => {
    const types = {
      personal: 'Personal Loan',
      auto: 'Auto Loan',
      home: 'Home Loan/Mortgage',
      business: 'Business Loan',
      student: 'Student Loan',
    };
    return types[type] || type;
  };

  const getLoanPurposeLabel = (purpose) => {
    const purposes = {
      debt_consolidation: 'Debt Consolidation',
      home_improvement: 'Home Improvement',
      major_purchase: 'Major Purchase',
      medical_expenses: 'Medical Expenses',
      education: 'Education',
      business_expansion: 'Business Expansion',
      other: 'Other',
    };
    return purposes[purpose] || purpose;
  };

  const getEmploymentStatusLabel = (status) => {
    const statuses = {
      employed: 'Employed Full-Time',
      part_time: 'Employed Part-Time',
      self_employed: 'Self-Employed',
      unemployed: 'Unemployed',
      retired: 'Retired',
      student: 'Student',
    };
    return statuses[status] || status;
  };

  const getCreditScoreLabel = (score) => {
    const scores = {
      excellent: 'Excellent (750+)',
      good: 'Good (700-749)',
      fair: 'Fair (650-699)',
      poor: 'Poor (600-649)',
      very_poor: 'Very Poor (Below 600)',
      unknown: 'I don\'t know',
    };
    return scores[score] || score;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Application</h2>
        <p className="text-gray-600">
          Please review all the information below before submitting your loan application.
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <span className="ml-2 text-gray-900">
              {data.personal?.firstName} {data.personal?.lastName}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-900">{data.personal?.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="ml-2 text-gray-900">{data.personal?.phone}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date of Birth:</span>
            <span className="ml-2 text-gray-900">
              {data.personal?.dateOfBirth ? new Date(data.personal.dateOfBirth).toLocaleDateString() : ''}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Marital Status:</span>
            <span className="ml-2 text-gray-900 capitalize">{data.personal?.maritalStatus}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Dependents:</span>
            <span className="ml-2 text-gray-900">{data.personal?.dependents}</span>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Loan Type:</span>
            <span className="ml-2 text-gray-900">{getLoanTypeLabel(data.loan?.loanType)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Loan Amount:</span>
            <span className="ml-2 text-gray-900">{formatCurrency(data.loan?.loanAmount)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Purpose:</span>
            <span className="ml-2 text-gray-900">{getLoanPurposeLabel(data.loan?.loanPurpose)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Term:</span>
            <span className="ml-2 text-gray-900">{data.loan?.loanTerm} months</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Payment Date:</span>
            <span className="ml-2 text-gray-900">
              {data.loan?.preferredPaymentDate}
              {data.loan?.preferredPaymentDate === '1' ? 'st' : 
                data.loan?.preferredPaymentDate === '2' ? 'nd' : 
                  data.loan?.preferredPaymentDate === '3' ? 'rd' : 'th'} of each month
            </span>
          </div>
          {data.loan?.collateral && (
            <>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Collateral:</span>
                <span className="ml-2 text-gray-900">{data.loan.collateral}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Collateral Value:</span>
                <span className="ml-2 text-gray-900">{formatCurrency(data.loan.collateralValue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Employment:</span>
            <span className="ml-2 text-gray-900">{getEmploymentStatusLabel(data.financial?.employmentStatus)}</span>
          </div>
          {data.financial?.employer && (
            <div>
              <span className="font-medium text-gray-700">Employer:</span>
              <span className="ml-2 text-gray-900">{data.financial.employer}</span>
            </div>
          )}
          {data.financial?.jobTitle && (
            <div>
              <span className="font-medium text-gray-700">Job Title:</span>
              <span className="ml-2 text-gray-900">{data.financial.jobTitle}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Annual Income:</span>
            <span className="ml-2 text-gray-900">{formatCurrency(data.financial?.annualIncome)}</span>
          </div>
          {data.financial?.additionalIncome && (
            <div>
              <span className="font-medium text-gray-700">Additional Income:</span>
              <span className="ml-2 text-gray-900">{formatCurrency(data.financial.additionalIncome)}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Monthly Housing:</span>
            <span className="ml-2 text-gray-900">{formatCurrency(data.financial?.monthlyRent)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Monthly Debt:</span>
            <span className="ml-2 text-gray-900">{formatCurrency(data.financial?.monthlyDebt)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Credit Score:</span>
            <span className="ml-2 text-gray-900">{getCreditScoreLabel(data.financial?.creditScore)}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
        {data.documents && data.documents.length > 0 ? (
          <div className="space-y-2">
            {data.documents.map((doc) => (
              <div key={doc.id} className="flex items-center p-3 bg-white rounded-md border">
                <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Terms and Conditions</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                Privacy Policy
              </a>
              . I understand that this application does not guarantee loan approval and that additional 
              documentation may be required.
            </label>
          </div>

          <div className="flex items-start">
            <input
              id="credit"
              type="checkbox"
              checked={agreedToCredit}
              onChange={(e) => setAgreedToCredit(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="credit" className="ml-3 text-sm text-gray-700">
              I authorize SecureBank to obtain my credit report and verify the information provided 
              in this application. I understand that this may result in a hard inquiry on my credit report.
            </label>
          </div>
        </div>

        {(errors.terms || errors.credit) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
            {errors.credit && <p className="text-sm text-red-600">{errors.credit}</p>}
          </div>
        )}
      </div>

      {/* Application Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Application Summary</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Loan Amount: {formatCurrency(data.loan?.loanAmount)}</p>
          <p>• Loan Type: {getLoanTypeLabel(data.loan?.loanType)}</p>
          <p>• Term: {data.loan?.loanTerm} months</p>
          <p>• Estimated Processing Time: 3-5 business days</p>
          <p>• You will receive email updates on your application status</p>
        </div>
      </div>
    </div>
  );
}
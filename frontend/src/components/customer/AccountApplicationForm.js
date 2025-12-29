/**
 * Account Application Form Component
 * Form for opening new bank accounts with KYC validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BankingDocumentUpload } from '../forms';

const accountTypes = [
  {
    id: 'checking',
    name: 'Checking Account',
    description: 'For everyday banking with unlimited transactions',
    features: ['No minimum balance', 'Free online banking', 'Debit card included'],
    monthlyFee: 0,
  },
  {
    id: 'savings',
    name: 'Savings Account', 
    description: 'Earn interest on your deposits',
    features: ['4% APY', '₹1,000 minimum balance', 'Mobile banking'],
    monthlyFee: 0,
  },
  {
    id: 'premium_checking',
    name: 'Premium Checking',
    description: 'Enhanced features for active banking',
    features: ['Premium debit card', 'ATM fee reimbursement', 'Priority support'],
    monthlyFee: 500,
  },
];

export default function AccountApplicationForm() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    // Address Information  
    street: '',
    city: '',
    state: '',
    zipCode: '',
    // Employment Information
    employmentStatus: '',
    employer: '',
    annualIncome: '',
    // Initial Deposit
    initialDeposit: '',
    fundingSource: '',
    // KYC Information
    citizenship: '',
    taxResident: '',
    politicallyExposed: false,
    // Agreements
    agreeToTerms: false,
    agreeToElectronic: false,
  });

  const [documents, setDocuments] = useState({});

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setDocuments(updatedDocuments);
    
    // Clear document-related errors when documents are uploaded
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('documents_')) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};

    // Account type validation
    if (!selectedAccount) {
      newErrors.accountType = 'Please select an account type';
    }

    // Personal information validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.ssn.trim()) {
      newErrors.ssn = 'PAN number is required';
    } else if (!validatePAN(formData.ssn)) {
      newErrors.ssn = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }

    // Address validation
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required';
    }

    // Employment validation
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
    }

    if (formData.employmentStatus === 'employed' && !formData.employer.trim()) {
      newErrors.employer = 'Employer is required';
    }

    if (!formData.annualIncome.trim()) {
      newErrors.annualIncome = 'Annual income is required';
    }

    // Initial deposit validation
    if (!formData.initialDeposit.trim()) {
      newErrors.initialDeposit = 'Initial deposit amount is required';
    }

    if (!formData.fundingSource) {
      newErrors.fundingSource = 'Funding source is required';
    }

    // KYC validation
    if (!formData.citizenship) {
      newErrors.citizenship = 'Citizenship status is required';
    }

    if (!formData.taxResident) {
      newErrors.taxResident = 'Tax residency status is required';
    }

    // Agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (!formData.agreeToElectronic) {
      newErrors.agreeToElectronic = 'You must agree to electronic communications';
    }

    // Document validation
    const requiredDocTypes = ['identity', 'address', 'photo', 'signature'];
    requiredDocTypes.forEach(docType => {
      const docFiles = documents[docType] || [];
      const uploadedFiles = docFiles.filter(f => f.status === 'success');
      
      if (uploadedFiles.length === 0) {
        newErrors[`documents_${docType}`] = `${docType.charAt(0).toUpperCase() + docType.slice(1)} document is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Integrate with backend API
      const applicationData = {
        accountType: selectedAccount,
        ...formData,
        documents: documents,
      };

      console.log('Submitting application:', applicationData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to success page
      router.push('/applications/success');
    } catch (error) {
      console.error('Application submission failed:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Open a New Account</h1>
        <p className="text-gray-600">
          Complete this application to open your new bank account. All fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Account Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountTypes.map((account) => (
              <div
                key={account.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAccount === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAccount(account.id)}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={account.id}
                    name="accountType"
                    value={account.id}
                    checked={selectedAccount === account.id}
                    onChange={() => setSelectedAccount(account.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={account.id} className="ml-2 font-medium text-gray-900">
                    {account.name}
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">{account.description}</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {account.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
                <div className="mt-3 text-sm font-medium text-gray-900">
                  Monthly Fee: {account.monthlyFee === 0 ? 'Free' : `₹${account.monthlyFee}`}
                </div>
              </div>
            ))}
          </div>
          {errors.accountType && (
            <p className="mt-2 text-sm text-red-600">{errors.accountType}</p>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+91 9876543210"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number *
              </label>
              <input
                type="text"
                id="ssn"
                value={formData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ssn ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ABCDE1234F"
                maxLength="10"
              />
              {errors.ssn && (
                <p className="mt-1 text-sm text-red-600">{errors.ssn}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Address Information</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.street ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your street address"
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-600">{errors.street}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  <option value="AP">Andhra Pradesh</option>
                  <option value="AR">Arunachal Pradesh</option>
                  <option value="AS">Assam</option>
                  <option value="BR">Bihar</option>
                  <option value="CG">Chhattisgarh</option>
                  <option value="GA">Goa</option>
                  <option value="GJ">Gujarat</option>
                  <option value="HR">Haryana</option>
                  <option value="HP">Himachal Pradesh</option>
                  <option value="JH">Jharkhand</option>
                  <option value="KA">Karnataka</option>
                  <option value="KL">Kerala</option>
                  <option value="MP">Madhya Pradesh</option>
                  <option value="MH">Maharashtra</option>
                  <option value="MN">Manipur</option>
                  <option value="ML">Meghalaya</option>
                  <option value="MZ">Mizoram</option>
                  <option value="NL">Nagaland</option>
                  <option value="OR">Odisha</option>
                  <option value="PB">Punjab</option>
                  <option value="RJ">Rajasthan</option>
                  <option value="SK">Sikkim</option>
                  <option value="TN">Tamil Nadu</option>
                  <option value="TS">Telangana</option>
                  <option value="TR">Tripura</option>
                  <option value="UP">Uttar Pradesh</option>
                  <option value="UK">Uttarakhand</option>
                  <option value="WB">West Bengal</option>
                  <option value="AN">Andaman and Nicobar Islands</option>
                  <option value="CH">Chandigarh</option>
                  <option value="DN">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="DL">Delhi</option>
                  <option value="JK">Jammu and Kashmir</option>
                  <option value="LA">Ladakh</option>
                  <option value="LD">Lakshadweep</option>
                  <option value="PY">Puducherry</option>
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="110001"
                  maxLength="6"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Employment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Employment Status *
              </label>
              <select
                id="employmentStatus"
                value={formData.employmentStatus}
                onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.employmentStatus ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Employment Status</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
              {errors.employmentStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.employmentStatus}</p>
              )}
            </div>

            {formData.employmentStatus === 'employed' && (
              <div>
                <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-1">
                  Employer *
                </label>
                <input
                  type="text"
                  id="employer"
                  value={formData.employer}
                  onChange={(e) => handleInputChange('employer', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.employer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your employer name"
                />
                {errors.employer && (
                  <p className="mt-1 text-sm text-red-600">{errors.employer}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income *
              </label>
              <input
                type="number"
                id="annualIncome"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.annualIncome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="500000"
                min="0"
              />
              {errors.annualIncome && (
                <p className="mt-1 text-sm text-red-600">{errors.annualIncome}</p>
              )}
            </div>
          </div>
        </div>

        {/* Initial Deposit */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Initial Deposit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="initialDeposit" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Deposit Amount *
              </label>
              <input
                type="number"
                id="initialDeposit"
                value={formData.initialDeposit}
                onChange={(e) => handleInputChange('initialDeposit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.initialDeposit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1000"
                min="0"
                step="0.01"
              />
              {errors.initialDeposit && (
                <p className="mt-1 text-sm text-red-600">{errors.initialDeposit}</p>
              )}
            </div>

            <div>
              <label htmlFor="fundingSource" className="block text-sm font-medium text-gray-700 mb-1">
                Funding Source *
              </label>
              <select
                id="fundingSource"
                value={formData.fundingSource}
                onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fundingSource ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Funding Source</option>
                <option value="checking">Existing Checking Account</option>
                <option value="savings">Existing Savings Account</option>
                <option value="external_bank">External Bank Account</option>
                <option value="cash">Cash Deposit</option>
                <option value="check">Check</option>
              </select>
              {errors.fundingSource && (
                <p className="mt-1 text-sm text-red-600">{errors.fundingSource}</p>
              )}
            </div>
          </div>
        </div>

        {/* KYC Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship Status *
              </label>
              <select
                id="citizenship"
                value={formData.citizenship}
                onChange={(e) => handleInputChange('citizenship', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.citizenship ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Citizenship Status</option>
                <option value="indian_citizen">Indian Citizen</option>
                <option value="nri">Non-Resident Indian (NRI)</option>
                <option value="pio">Person of Indian Origin (PIO)</option>
                <option value="oci">Overseas Citizen of India (OCI)</option>
                <option value="foreign_national">Foreign National</option>
              </select>
              {errors.citizenship && (
                <p className="mt-1 text-sm text-red-600">{errors.citizenship}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxResident" className="block text-sm font-medium text-gray-700 mb-1">
                Indian Tax Resident *
              </label>
              <select
                id="taxResident"
                value={formData.taxResident}
                onChange={(e) => handleInputChange('taxResident', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.taxResident ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Tax Residency</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {errors.taxResident && (
                <p className="mt-1 text-sm text-red-600">{errors.taxResident}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.politicallyExposed}
                onChange={(e) => handleInputChange('politicallyExposed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                I am a politically exposed person (PEP) or related to one
              </span>
            </label>
          </div>
        </div>

        {/* Agreements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Agreements</h2>
          
          <div className="space-y-3">
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</a> and <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a> *
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600 ml-6">{errors.agreeToTerms}</p>
              )}
            </div>

            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.agreeToElectronic}
                  onChange={(e) => handleInputChange('agreeToElectronic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to receive electronic communications and statements *
                </span>
              </label>
              {errors.agreeToElectronic && (
                <p className="mt-1 text-sm text-red-600 ml-6">{errors.agreeToElectronic}</p>
              )}
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="space-y-4">
          <BankingDocumentUpload
            documentTypes={['identity', 'address', 'photo', 'signature']}
            onDocumentsChange={handleDocumentsChange}
          />
          
          {/* Document Errors */}
          {Object.keys(errors).filter(key => key.startsWith('documents_')).map(key => (
            <div key={key} className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors[key]}</p>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
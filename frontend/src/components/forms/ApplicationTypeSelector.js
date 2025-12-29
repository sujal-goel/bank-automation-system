/**
 * Application Type Selector Component
 * Allows users to choose the type of application they want to submit
 */

'use client';

import { 
  BanknotesIcon, 
  CreditCardIcon, 
  PlusCircleIcon,
  HomeIcon,
  AcademicCapIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const applicationTypes = [
  {
    id: 'account',
    title: 'Open New Account',
    description: 'Open a new checking or savings account with competitive rates',
    icon: PlusCircleIcon,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    features: ['No minimum balance', 'Online banking', 'Mobile app access', 'Debit card included'],
  },
  {
    id: 'loan',
    title: 'Personal Loan',
    description: 'Get a personal loan for major purchases or debt consolidation',
    icon: BanknotesIcon,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    features: ['Competitive rates', 'Flexible terms', 'Quick approval', 'No collateral required'],
  },
  {
    id: 'credit',
    title: 'Credit Card',
    description: 'Apply for a credit card with rewards and benefits',
    icon: CreditCardIcon,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    features: ['Cashback rewards', 'No annual fee', 'Fraud protection', 'Mobile payments'],
  },
  {
    id: 'mortgage',
    title: 'Home Mortgage',
    description: 'Finance your dream home with our mortgage solutions',
    icon: HomeIcon,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    features: ['Low interest rates', 'First-time buyer programs', 'Expert guidance', 'Fast processing'],
  },
  {
    id: 'student',
    title: 'Student Loan',
    description: 'Fund your education with flexible student loan options',
    icon: AcademicCapIcon,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    features: ['Deferred payments', 'Competitive rates', 'No origination fees', 'Flexible repayment'],
  },
  {
    id: 'auto',
    title: 'Auto Loan',
    description: 'Get financing for your new or used vehicle purchase',
    icon: TruckIcon,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    features: ['Pre-approval available', 'New & used cars', 'Competitive rates', 'Quick decisions'],
  },
];

function ApplicationTypeCard({ type, onSelect }) {
  const Icon = type.icon;

  return (
    <div 
      onClick={() => onSelect(type.id)}
      className="group cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${type.bgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-8 w-8 ${type.textColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
            {type.title}
          </h3>
          <p className="text-gray-600 mt-2 mb-4">
            {type.description}
          </p>
          
          <ul className="space-y-2">
            {type.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-500">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          
          <div className="mt-6">
            <span className="inline-flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
              Get Started
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationTypeSelector({ onSelect }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Application Type
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the type of application you'd like to submit. Our streamlined process 
          makes it easy to apply for the financial products you need.
        </p>
      </div>

      {/* Application types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {applicationTypes.map((type) => (
          <ApplicationTypeCard
            key={type.id}
            type={type}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Need Help Choosing?
        </h3>
        <p className="text-gray-600 mb-4">
          Our customer service team is here to help you find the right financial product for your needs.
        </p>
        <button className="btn btn-outline">
          Contact Support
        </button>
      </div>
    </div>
  );
}
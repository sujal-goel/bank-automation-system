/**
 * Quick Actions Component
 * Common banking actions for customers
 */

'use client';

import Link from 'next/link';
import {
  ArrowsRightLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const quickActions = [
  {
    name: 'Transfer Money',
    description: 'Transfer between accounts',
    href: '/transfer',
    icon: ArrowsRightLeftIcon,
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    name: 'Apply for Loan',
    description: 'Personal or business loans',
    href: '/applications/loan',
    icon: BanknotesIcon,
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
  },
  {
    name: 'Open Account',
    description: 'Savings or checking account',
    href: '/applications/account',
    icon: PlusIcon,
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  },
  {
    name: 'Apply for Credit Card',
    description: 'Personal or business cards',
    href: '/applications/credit-card',
    icon: CreditCardIcon,
    color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  },
  {
    name: 'Upload Documents',
    description: 'Submit required documents',
    href: '/documents/upload',
    icon: CloudArrowUpIcon,
    color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  },
  {
    name: 'View Statements',
    description: 'Download account statements',
    href: '/statements',
    icon: DocumentTextIcon,
    color: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={`group flex items-center p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md ${action.color}`}
          >
            <div className="flex-shrink-0">
              <action.icon className="h-6 w-6" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{action.name}</p>
              <p className="text-xs opacity-75">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
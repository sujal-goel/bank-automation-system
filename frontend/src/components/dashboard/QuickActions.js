/**
 * Quick Actions Component
 * Common action buttons for customer dashboard
 */

'use client';

import Link from 'next/link';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  CreditCardIcon,
  BanknotesIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

const quickActions = [
  {
    id: 'new-application',
    title: 'New Application',
    description: 'Apply for loans, credit cards, or new accounts',
    icon: DocumentTextIcon,
    href: '/applications/new',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'upload-documents',
    title: 'Upload Documents',
    description: 'Submit required documents for your applications',
    icon: ArrowUpTrayIcon,
    href: '/documents/upload',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'open-account',
    title: 'Open Account',
    description: 'Open a new checking or savings account',
    icon: PlusIcon,
    href: '/applications/account',
    color: 'bg-purple-500 hover:bg-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'apply-credit',
    title: 'Apply for Credit',
    description: 'Apply for credit cards or personal loans',
    icon: CreditCardIcon,
    href: '/applications/credit',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'transfer-funds',
    title: 'Transfer Funds',
    description: 'Transfer money between your accounts',
    icon: BanknotesIcon,
    href: '/transfer',
    color: 'bg-orange-500 hover:bg-orange-600',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    description: 'Get help from our customer service team',
    icon: PhoneIcon,
    href: '/support',
    color: 'bg-gray-500 hover:bg-gray-600',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

function QuickActionCard({ action }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-6 w-6 ${action.textColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
            {action.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {action.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action) => (
        <QuickActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}
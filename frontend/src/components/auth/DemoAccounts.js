/**
 * Demo Accounts Component
 * Displays demo account credentials for testing
 */

'use client';

import { useState } from 'react';

const demoAccounts = {
  customer: {
    email: 'john.doe@example.com',
    password: 'Customer123!',
    description: 'Customer account with active applications',
  },
  employee: {
    email: 'jane.smith@bank.com',
    password: 'Employee123!',
    description: 'Employee account with pending tasks',
  },
  admin: {
    email: 'admin@bank.com',
    password: 'Admin123!',
    description: 'Administrator account with full access',
  },
};

export default function DemoAccounts({ userType }) {
  const [copied, setCopied] = useState(null);
  const account = demoAccounts[userType];

  const copyToClipboard = (text, field) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="bg-blue-50 rounded-md p-4">
      <h3 className="text-sm font-medium text-blue-900 mb-2">
        Demo Account
      </h3>
      <p className="text-xs text-blue-700 mb-3">
        {account.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-mono text-gray-900">{account.email}</p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(account.email, 'email')}
            className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {copied === 'email' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="flex items-center justify-between bg-white rounded px-3 py-2">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Password</p>
            <p className="text-sm font-mono text-gray-900">{account.password}</p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(account.password, 'password')}
            className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {copied === 'password' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
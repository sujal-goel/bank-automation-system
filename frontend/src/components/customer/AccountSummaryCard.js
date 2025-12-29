/**
 * Account Summary Card Component
 * Displays account information with balance and quick actions
 */

'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function AccountSummaryCard({ account }) {
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'USD',
    }).format(Math.abs(amount));
  };

  const getAccountTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'savings':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'credit card':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const isNegativeBalance = account.balance < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Account Type Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAccountTypeColor(account.type)}`}>
          {account.type}
        </span>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Account Number */}
      <div className="mb-3">
        <p className="text-sm text-gray-500">Account Number</p>
        <p className="font-mono text-sm text-gray-900">{account.accountNumber}</p>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">
          {account.type === 'Credit Card' ? 'Current Balance' : 'Available Balance'}
        </p>
        <div className="flex items-center">
          {showBalance ? (
            <p className={`text-2xl font-bold ${isNegativeBalance ? 'text-red-600' : 'text-gray-900'}`}>
              {isNegativeBalance && account.type === 'Credit Card' ? '' : isNegativeBalance ? '-' : ''}
              {formatCurrency(account.balance)}
            </p>
          ) : (
            <p className="text-2xl font-bold text-gray-400">••••••</p>
          )}
        </div>
        
        {/* Credit Card specific info */}
        {account.type === 'Credit Card' && account.creditLimit && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Available Credit: {showBalance ? formatCurrency(account.creditLimit + account.balance) : '••••••'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (Math.abs(account.balance) / account.creditLimit) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            account.status === 'active' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-sm text-gray-600 capitalize">{account.status}</span>
        </div>
        
        {/* Quick Action Button */}
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}
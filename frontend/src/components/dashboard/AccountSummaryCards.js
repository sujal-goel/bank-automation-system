/**
 * Account Summary Cards Component
 * Displays customer account balances and information in card format
 */

'use client';

import { CreditCardIcon, BanknotesIcon, TrendingUpIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const accountTypeConfig = {
  checking: {
    icon: BanknotesIcon,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    name: 'Checking Account',
  },
  savings: {
    icon: TrendingUpIcon,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    name: 'Savings Account',
  },
  credit: {
    icon: CreditCardIcon,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    name: 'Credit Card',
  },
  loan: {
    icon: BanknotesIcon,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    name: 'Loan Account',
  },
};

function AccountCard({ account }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const config = accountTypeConfig[account.type] || accountTypeConfig.checking;
  const Icon = config.icon;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'USD',
    }).format(amount);
  };

  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    return `****${accountNumber.slice(-4)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'frozen':
        return 'text-yellow-600 bg-yellow-100';
      case 'closed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.textColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {config.name}
            </h3>
            <p className="text-sm text-gray-500">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(account.status)}`}>
          {account.status}
        </span>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            {account.type === 'credit' ? 'Available Credit' : 'Current Balance'}
          </span>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {balanceVisible ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {balanceVisible ? formatCurrency(account.balance) : '••••••'}
        </p>
        
        {account.type === 'credit' && account.availableBalance && (
          <p className="text-sm text-gray-500 mt-1">
            Available: {balanceVisible ? formatCurrency(account.availableBalance) : '••••••'}
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>Last Activity</span>
        <span>
          {account.lastActivity 
            ? new Date(account.lastActivity).toLocaleDateString()
            : 'No recent activity'
          }
        </span>
      </div>
    </div>
  );
}

export default function AccountSummaryCards({ accounts = [] }) {
  if (!accounts.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Accounts Found
        </h3>
        <p className="text-gray-500 mb-4">
          You don't have any accounts set up yet.
        </p>
        <button className="btn btn-primary">
          Open New Account
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
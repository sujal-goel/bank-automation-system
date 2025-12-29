/**
 * Recent Transactions Component
 * Displays recent account transactions
 */

'use client';

import Link from 'next/link';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function RecentTransactions({ transactions }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {/* Transaction Type Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.type === 'credit' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {transaction.type === 'credit' ? (
                  <ArrowDownIcon className="h-5 w-5" />
                ) : (
                  <ArrowUpIcon className="h-5 w-5" />
                )}
              </div>

              {/* Transaction Details */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {transaction.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatDate(transaction.date)}</span>
                  <span>•</span>
                  <span>{transaction.account}</span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`text-sm font-semibold ${
                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
}
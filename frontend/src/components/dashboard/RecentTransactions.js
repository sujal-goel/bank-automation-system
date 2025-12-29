/**
 * Recent Transactions Component
 * Displays recent transaction history for customer dashboard
 */

'use client';

import { ArrowUpIcon, ArrowDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

function TransactionItem({ transaction }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: transaction.currency || 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isDebit = transaction.type === 'debit' || transaction.amount < 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        {/* Transaction type icon */}
        <div className={`p-2 rounded-full ${isDebit ? 'bg-red-50' : 'bg-green-50'}`}>
          {isDebit ? (
            <ArrowUpIcon className="h-4 w-4 text-red-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-green-500" />
          )}
        </div>
        
        {/* Transaction details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {transaction.description || 'Transaction'}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-500">
              {formatDate(transaction.date)}
            </p>
            {transaction.merchantName && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <p className="text-xs text-gray-500 truncate">
                  {transaction.merchantName}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount and status */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className={`text-sm font-semibold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
            {isDebit ? '-' : '+'}{formatCurrency(transaction.amount)}
          </p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RecentTransactions({ transactions = [] }) {
  if (!transactions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Recent Transactions
          </h3>
          <p className="text-gray-500">
            Your recent transactions will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h3>
          <Link 
            href="/transactions"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </Link>
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-6 py-2">
        {transactions.slice(0, 5).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {/* Footer */}
      {transactions.length > 5 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link 
            href="/transactions"
            className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View {transactions.length - 5} more transactions
          </Link>
        </div>
      )}
    </div>
  );
}
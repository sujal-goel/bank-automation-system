/**
 * Customer Dashboard Page
 * Main dashboard for customer users with account summaries and quick actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRequireRole } from '@/lib/auth/auth-hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountSummaryCard from '@/components/customer/AccountSummaryCard';
import QuickActions from '@/components/customer/QuickActions';
import RecentTransactions from '@/components/customer/RecentTransactions';
import NotificationBanner from '@/components/customer/NotificationBanner';

export default function CustomerDashboard() {
  const { hasAccess, isLoading } = useRequireRole('customer');
  const [accountData, setAccountData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const fetchAccountData = async () => {
      // Simulate API call
      setTimeout(() => {
        setAccountData({
          accounts: [
            {
              id: '1',
              type: 'Checking',
              accountNumber: '****1234',
              balance: 2450.75,
              currency: 'USD',
              status: 'active',
            },
            {
              id: '2',
              type: 'Savings',
              accountNumber: '****5678',
              balance: 15750.00,
              currency: 'USD',
              status: 'active',
            },
            {
              id: '3',
              type: 'Credit Card',
              accountNumber: '****9012',
              balance: -1250.30,
              currency: 'USD',
              status: 'active',
              creditLimit: 5000,
            },
          ],
          recentTransactions: [
            {
              id: '1',
              date: '2024-01-15',
              description: 'Online Purchase - Amazon',
              amount: -89.99,
              type: 'debit',
              account: 'Checking',
            },
            {
              id: '2',
              date: '2024-01-14',
              description: 'Salary Deposit',
              amount: 3500.00,
              type: 'credit',
              account: 'Checking',
            },
            {
              id: '3',
              date: '2024-01-13',
              description: 'ATM Withdrawal',
              amount: -200.00,
              type: 'debit',
              account: 'Checking',
            },
          ],
          notifications: [
            {
              id: '1',
              type: 'info',
              title: 'New Feature Available',
              message: 'Mobile check deposit is now available in your mobile app.',
              date: '2024-01-15',
              read: false,
            },
            {
              id: '2',
              type: 'warning',
              title: 'Low Balance Alert',
              message: 'Your checking account balance is below $500.',
              date: '2024-01-14',
              read: false,
            },
          ],
        });
        setIsLoadingData(false);
      }, 1000);
    };

    if (hasAccess) {
      fetchAccountData();
    }
  }, [hasAccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect to unauthorized page
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, John!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your accounts and recent activity.
          </p>
        </div>

        {/* Notifications */}
        {accountData?.notifications && accountData.notifications.length > 0 && (
          <NotificationBanner notifications={accountData.notifications} />
        )}

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingData ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : (
            accountData?.accounts.map((account) => (
              <AccountSummaryCard key={account.id} account={account} />
            ))
          )}
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Transactions */}
        {accountData?.recentTransactions && (
          <RecentTransactions transactions={accountData.recentTransactions} />
        )}
      </div>
    </DashboardLayout>
  );
}
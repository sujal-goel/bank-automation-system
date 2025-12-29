/**
 * Notification System Demo Page
 * Test page for notification functionality
 */

'use client';

import { useState } from 'react';
import { useRequireRole } from '@/lib/auth/auth-hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { NotificationBell, ToastContainer } from '@/components/notifications';
import useNotifications from '@/hooks/useNotifications';

export default function NotificationDemoPage() {
  const { hasAccess, isLoading } = useRequireRole('customer');
  const {
    notifications,
    unreadCount,
    connected,
    connecting,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDocumentStatus,
    showApplicationStatus,
    showTransactionNotification,
    clearAll,
  } = useNotifications();

  const [counter, setCounter] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const createTestNotification = (type) => {
    const messages = {
      success: {
        title: `Success Notification ${counter}`,
        message: 'This is a success message that will auto-hide in 5 seconds.',
      },
      error: {
        title: `Error Notification ${counter}`,
        message: 'This is an error message that will persist until manually dismissed.',
      },
      warning: {
        title: `Warning Notification ${counter}`,
        message: 'This is a warning message that will auto-hide in 8 seconds.',
      },
      info: {
        title: `Info Notification ${counter}`,
        message: 'This is an info message that will auto-hide in 6 seconds.',
      },
    };

    const config = messages[type];
    if (config) {
      switch (type) {
        case 'success':
          showSuccess(config.title, config.message);
          break;
        case 'error':
          showError(config.title, config.message);
          break;
        case 'warning':
          showWarning(config.title, config.message);
          break;
        case 'info':
          showInfo(config.title, config.message);
          break;
      }
      setCounter(counter + 1);
    }
  };

  const createDocumentNotification = (status) => {
    showDocumentStatus('Aadhaar Card', status, {
      actionUrl: '/documents/upload',
    });
  };

  const createApplicationNotification = (status) => {
    showApplicationStatus('APP-2024-001', status, {
      actionUrl: '/applications/APP-2024-001',
    });
  };

  const createTransactionNotification = () => {
    const transactions = [
      {
        id: 'TXN-001',
        type: 'credit',
        amount: 5000,
        description: 'Salary Credit',
        status: 'completed',
      },
      {
        id: 'TXN-002',
        type: 'debit',
        amount: 1200,
        description: 'Online Purchase',
        status: 'completed',
      },
      {
        id: 'TXN-003',
        type: 'debit',
        amount: 500,
        description: 'ATM Withdrawal',
        status: 'failed',
      },
    ];

    const randomTransaction = transactions[Math.floor(Math.random() * transactions.length)];
    showTransactionNotification(randomTransaction);
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Notification Bell */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification System Demo
            </h1>
            <p className="text-gray-600">
              Test the notification system with various notification types and scenarios.
            </p>
          </div>
          
          <NotificationBell showLabel />
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Status</h2>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              connected ? 'text-green-600' : connecting ? 'text-yellow-600' : 'text-red-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : connecting ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Unread: <span className="font-medium">{unreadCount}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{notifications.length}</span>
            </div>
          </div>
        </div>

        {/* Basic Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => createTestNotification('success')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Success
            </button>
            
            <button
              onClick={() => createTestNotification('error')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Error
            </button>
            
            <button
              onClick={() => createTestNotification('warning')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Warning
            </button>
            
            <button
              onClick={() => createTestNotification('info')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Info
            </button>
          </div>
        </div>

        {/* Document Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Status Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => createDocumentNotification('uploaded')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Uploaded
            </button>
            
            <button
              onClick={() => createDocumentNotification('processing')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Processing
            </button>
            
            <button
              onClick={() => createDocumentNotification('verified')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Verified
            </button>
            
            <button
              onClick={() => createDocumentNotification('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Application Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => createApplicationNotification('submitted')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submitted
            </button>
            
            <button
              onClick={() => createApplicationNotification('under_review')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Under Review
            </button>
            
            <button
              onClick={() => createApplicationNotification('approved')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approved
            </button>
            
            <button
              onClick={() => createApplicationNotification('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Rejected
            </button>
            
            <button
              onClick={() => createApplicationNotification('more_info_required')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              More Info Required
            </button>
          </div>
        </div>

        {/* Transaction Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Notifications</h2>
          <button
            onClick={createTransactionNotification}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Random Transaction
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <button
            onClick={clearAll}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear All Notifications
          </button>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Info</h3>
            <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-64">
              {JSON.stringify({ 
                connected, 
                connecting, 
                unreadCount, 
                notificationCount: notifications.length,
                recentNotifications: notifications.slice(0, 3),
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-right" />
    </DashboardLayout>
  );
}
/**
 * Custom hook for notification management
 * Provides easy-to-use notification functions
 */

import { useEffect } from 'react';
import useNotificationStore from '@/stores/notificationStore';
import useAuthStore from '@/lib/auth/auth-store';

export default function useNotifications() {
  const {
    notifications,
    unreadCount,
    connected,
    connecting,
    connect,
    disconnect,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
  } = useNotificationStore();

  const { user, token } = useAuthStore();

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && token && !connected && !connecting) {
      connect(user.id, token);
    }

    return () => {
      if (connected) {
        disconnect();
      }
    };
  }, [user, token, connected, connecting, connect, disconnect]);

  // Request browser notification permission on first use
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [user, requestPermission]);

  /**
   * Show a success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  const showSuccess = (title, message, options = {}) => {
    addNotification({
      type: 'success',
      title,
      message,
      autoHide: 5000,
      ...options,
    });
  };

  /**
   * Show an error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  const showError = (title, message, options = {}) => {
    addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options,
    });
  };

  /**
   * Show a warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  const showWarning = (title, message, options = {}) => {
    addNotification({
      type: 'warning',
      title,
      message,
      autoHide: 8000,
      ...options,
    });
  };

  /**
   * Show an info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   */
  const showInfo = (title, message, options = {}) => {
    addNotification({
      type: 'info',
      title,
      message,
      autoHide: 6000,
      ...options,
    });
  };

  /**
   * Show a document processing notification
   * @param {string} documentName - Name of the document
   * @param {string} status - Processing status
   * @param {Object} options - Additional options
   */
  const showDocumentStatus = (documentName, status, options = {}) => {
    const statusMessages = {
      uploaded: {
        type: 'success',
        title: 'Document Uploaded',
        message: `${documentName} has been uploaded successfully`,
      },
      processing: {
        type: 'info',
        title: 'Document Processing',
        message: `${documentName} is being processed`,
      },
      verified: {
        type: 'success',
        title: 'Document Verified',
        message: `${documentName} has been verified successfully`,
      },
      rejected: {
        type: 'error',
        title: 'Document Rejected',
        message: `${documentName} was rejected. Please upload a new document`,
      },
    };

    const statusConfig = statusMessages[status];
    if (statusConfig) {
      addNotification({
        ...statusConfig,
        metadata: {
          documentName,
          status,
        },
        ...options,
      });
    }
  };

  /**
   * Show an application status notification
   * @param {string} applicationId - Application ID
   * @param {string} status - Application status
   * @param {Object} options - Additional options
   */
  const showApplicationStatus = (applicationId, status, options = {}) => {
    const statusMessages = {
      submitted: {
        type: 'success',
        title: 'Application Submitted',
        message: 'Your application has been submitted successfully',
      },
      under_review: {
        type: 'info',
        title: 'Application Under Review',
        message: 'Your application is being reviewed by our team',
      },
      approved: {
        type: 'success',
        title: 'Application Approved',
        message: 'Congratulations! Your application has been approved',
      },
      rejected: {
        type: 'error',
        title: 'Application Rejected',
        message: 'Your application has been rejected. Please contact support for details',
      },
      more_info_required: {
        type: 'warning',
        title: 'Additional Information Required',
        message: 'Please provide additional information to complete your application',
      },
    };

    const statusConfig = statusMessages[status];
    if (statusConfig) {
      addNotification({
        ...statusConfig,
        actionUrl: `/applications/${applicationId}`,
        metadata: {
          applicationId,
          status,
        },
        persistent: true,
        ...options,
      });
    }
  };

  /**
   * Show a banking transaction notification
   * @param {Object} transaction - Transaction details
   * @param {Object} options - Additional options
   */
  const showTransactionNotification = (transaction, options = {}) => {
    const { type, amount, description, status } = transaction;
    
    let notificationType = 'info';
    let title = 'Transaction Update';
    
    if (status === 'completed') {
      notificationType = 'success';
      title = type === 'credit' ? 'Money Received' : 'Payment Sent';
    } else if (status === 'failed') {
      notificationType = 'error';
      title = 'Transaction Failed';
    }

    addNotification({
      type: notificationType,
      title,
      message: `₹${amount.toLocaleString()} - ${description}`,
      metadata: {
        transactionId: transaction.id,
        amount,
        type,
        status,
      },
      autoHide: notificationType === 'success' ? 5000 : false,
      ...options,
    });
  };

  return {
    // State
    notifications,
    unreadCount,
    connected,
    connecting,

    // Actions
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,

    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDocumentStatus,
    showApplicationStatus,
    showTransactionNotification,

    // Raw methods
    addNotification,
    connect,
    disconnect,
    requestPermission,
  };
}
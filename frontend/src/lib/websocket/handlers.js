/**
 * WebSocket Message Handlers
 * Handles different types of WebSocket messages
 */

import useNotificationStore from '@/stores/notificationStore';

/**
 * Handle notification messages
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const handleNotificationMessage = (data, endpoint) => {
  const notificationStore = useNotificationStore.getState();
  
  switch (data.action) {
    case 'notification':
      notificationStore.addNotification(data.payload);
      break;
      
    case 'mark_read':
      notificationStore.markAsRead(data.payload.notificationId);
      break;
      
    case 'clear_all':
      notificationStore.clearAll();
      break;
      
    default:
      // Treat as regular notification if no action specified
      if (data.type && data.title) {
        notificationStore.addNotification(data);
      }
      break;
  }
};

/**
 * Handle application status messages
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const handleApplicationStatusMessage = (data, endpoint) => {
  const { applicationId, status, message, type = 'info' } = data;
  
  const notificationStore = useNotificationStore.getState();
  
  // Create notification for application status change
  const notification = {
    id: `app-${applicationId}-${Date.now()}`,
    type: type,
    title: getApplicationStatusTitle(status),
    message: message || getApplicationStatusMessage(status, applicationId),
    actionUrl: `/applications/${applicationId}`,
    metadata: {
      applicationId,
      status,
      category: 'application',
    },
    persistent: true,
  };
  
  notificationStore.addNotification(notification);
};

/**
 * Handle document processing messages
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const handleDocumentProcessingMessage = (data, endpoint) => {
  const { documentId, status, documentType, message, applicationId } = data;
  
  const notificationStore = useNotificationStore.getState();
  
  let notificationType = 'info';
  let title = 'Document Processing Update';
  
  switch (status) {
    case 'processing':
      notificationType = 'info';
      title = 'Document Processing Started';
      break;
    case 'verified':
      notificationType = 'success';
      title = 'Document Verified';
      break;
    case 'rejected':
      notificationType = 'error';
      title = 'Document Rejected';
      break;
    case 'requires_action':
      notificationType = 'warning';
      title = 'Document Requires Action';
      break;
  }
  
  const notification = {
    id: `doc-${documentId}-${Date.now()}`,
    type: notificationType,
    title: title,
    message: message || `Your ${documentType} document has been ${status}`,
    actionUrl: applicationId ? `/applications/${applicationId}` : `/documents/${documentId}`,
    metadata: {
      documentId,
      documentType,
      status,
      applicationId,
      category: 'document',
    },
    persistent: true,
  };
  
  notificationStore.addNotification(notification);
};

/**
 * Handle system messages
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const handleSystemMessage = (data, endpoint) => {
  const { type, title, message, priority = 'normal', actionUrl } = data;
  
  const notificationStore = useNotificationStore.getState();
  
  const notification = {
    id: `system-${Date.now()}`,
    type: type || 'info',
    title: title || 'System Notification',
    message: message,
    actionUrl: actionUrl,
    metadata: {
      priority,
      category: 'system',
    },
    persistent: priority === 'high',
  };
  
  notificationStore.addNotification(notification);
};

/**
 * Handle account activity messages
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const handleAccountActivityMessage = (data, endpoint) => {
  const { activityType, accountId, amount, description, timestamp } = data;
  
  const notificationStore = useNotificationStore.getState();
  
  let notificationType = 'info';
  let title = 'Account Activity';
  
  switch (activityType) {
    case 'deposit':
      notificationType = 'success';
      title = 'Deposit Received';
      break;
    case 'withdrawal':
      notificationType = 'info';
      title = 'Withdrawal Processed';
      break;
    case 'transfer':
      notificationType = 'info';
      title = 'Transfer Completed';
      break;
    case 'payment':
      notificationType = 'info';
      title = 'Payment Processed';
      break;
    case 'low_balance':
      notificationType = 'warning';
      title = 'Low Balance Alert';
      break;
    case 'suspicious_activity':
      notificationType = 'error';
      title = 'Security Alert';
      break;
  }
  
  const notification = {
    id: `activity-${accountId}-${Date.now()}`,
    type: notificationType,
    title: title,
    message: description || `${activityType} of ₹${amount} on account ${accountId}`,
    actionUrl: `/accounts/${accountId}`,
    metadata: {
      accountId,
      activityType,
      amount,
      timestamp,
      category: 'account',
    },
    persistent: ['suspicious_activity', 'low_balance'].includes(activityType),
  };
  
  notificationStore.addNotification(notification);
};

/**
 * Get application status title
 * @param {string} status - Application status
 * @returns {string} Status title
 */
function getApplicationStatusTitle(status) {
  const titles = {
    submitted: 'Application Submitted',
    under_review: 'Application Under Review',
    approved: 'Application Approved',
    rejected: 'Application Rejected',
    completed: 'Application Completed',
    requires_documents: 'Documents Required',
    requires_verification: 'Verification Required',
  };
  
  return titles[status] || 'Application Update';
}

/**
 * Get application status message
 * @param {string} status - Application status
 * @param {string} applicationId - Application ID
 * @returns {string} Status message
 */
function getApplicationStatusMessage(status, applicationId) {
  const messages = {
    submitted: `Your application ${applicationId} has been submitted successfully`,
    under_review: `Your application ${applicationId} is now under review`,
    approved: `Congratulations! Your application ${applicationId} has been approved`,
    rejected: `Your application ${applicationId} has been rejected`,
    completed: `Your application ${applicationId} has been completed`,
    requires_documents: `Additional documents are required for application ${applicationId}`,
    requires_verification: `Verification is required for application ${applicationId}`,
  };
  
  return messages[status] || `Application ${applicationId} status updated to ${status}`;
}

/**
 * Message router - routes messages to appropriate handlers
 * @param {Object} data - Message data
 * @param {string} endpoint - WebSocket endpoint
 */
export const routeMessage = (data, endpoint) => {
  const { messageType, category } = data;
  
  switch (messageType || category) {
    case 'notification':
      handleNotificationMessage(data, endpoint);
      break;
      
    case 'application':
    case 'application_status':
      handleApplicationStatusMessage(data, endpoint);
      break;
      
    case 'document':
    case 'document_processing':
      handleDocumentProcessingMessage(data, endpoint);
      break;
      
    case 'system':
      handleSystemMessage(data, endpoint);
      break;
      
    case 'account':
    case 'account_activity':
      handleAccountActivityMessage(data, endpoint);
      break;
      
    default:
      // Default to notification handler
      handleNotificationMessage(data, endpoint);
      break;
  }
};
// Notification Service - Multi-channel customer notification system

const { v4: uuidv4 } = require('uuid');

/**
 * Notification Service - Handles customer notifications across multiple channels
 */
class NotificationService {
  constructor(config = {}) {
    this.config = {
      enableEmail: config.enableEmail !== false,
      enableSMS: config.enableSMS !== false,
      enablePush: config.enablePush !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      defaultTimeout: config.defaultTimeout || 30000,
      ...config
    };

    // Initialize notification channels
    this.channels = {
      email: new EmailChannel(this.config),
      sms: new SMSChannel(this.config),
      push: new PushChannel(this.config)
    };

    // Template manager
    this.templateManager = new NotificationTemplateManager();
    
    // Delivery tracking
    this.deliveryTracker = new DeliveryTracker();
    
    // Metrics
    this.metrics = {
      totalNotifications: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      channelStats: {
        email: { sent: 0, delivered: 0, failed: 0 },
        sms: { sent: 0, delivered: 0, failed: 0 },
        push: { sent: 0, delivered: 0, failed: 0 }
      }
    };
  }

  /**
   * Send account activation notification
   * @param {Object} customer - Customer object
   * @param {Object} account - Account object
   * @param {Array} channels - Preferred notification channels
   * @returns {Promise<Object>} Notification result
   */
  async sendAccountActivationNotification(customer, account, channels = ['email']) {
    const notificationId = uuidv4();
    const startTime = Date.now();

    try {
      // Prepare notification data
      const notificationData = {
        notificationId,
        type: 'ACCOUNT_ACTIVATION',
        customer,
        account,
        timestamp: new Date(),
        channels: this.filterEnabledChannels(channels)
      };

      // Get template for account activation
      const template = this.templateManager.getTemplate('ACCOUNT_ACTIVATION');
      
      // Send notifications across all requested channels
      const deliveryResults = await this.sendMultiChannelNotification(notificationData, template);
      
      // Track delivery
      const deliveryRecord = this.deliveryTracker.createDeliveryRecord(
        notificationId,
        'ACCOUNT_ACTIVATION',
        customer.customerId,
        deliveryResults
      );

      // Update metrics
      this.updateMetrics(deliveryResults, Date.now() - startTime);

      return {
        success: deliveryResults.some(result => result.success),
        notificationId,
        deliveryResults,
        deliveryRecord,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        notificationId,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send loan decision notification
   * @param {Object} customer - Customer object
   * @param {Object} loanApplication - Loan application object
   * @param {Array} channels - Preferred notification channels
   * @returns {Promise<Object>} Notification result
   */
  async sendLoanDecisionNotification(customer, loanApplication, channels = ['email', 'sms']) {
    const notificationId = uuidv4();
    const startTime = Date.now();

    try {
      const notificationData = {
        notificationId,
        type: 'LOAN_DECISION',
        customer,
        loanApplication,
        timestamp: new Date(),
        channels: this.filterEnabledChannels(channels)
      };

      const templateType = loanApplication.decision?.approved ? 'LOAN_APPROVED' : 'LOAN_REJECTED';
      const template = this.templateManager.getTemplate(templateType);
      
      const deliveryResults = await this.sendMultiChannelNotification(notificationData, template);
      
      const deliveryRecord = this.deliveryTracker.createDeliveryRecord(
        notificationId,
        templateType,
        customer.customerId,
        deliveryResults
      );

      this.updateMetrics(deliveryResults, Date.now() - startTime);

      return {
        success: deliveryResults.some(result => result.success),
        notificationId,
        deliveryResults,
        deliveryRecord,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        notificationId,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send payment confirmation notification
   * @param {Object} customer - Customer object
   * @param {Object} transaction - Transaction object
   * @param {Array} channels - Preferred notification channels
   * @returns {Promise<Object>} Notification result
   */
  async sendPaymentConfirmationNotification(customer, transaction, channels = ['email', 'sms']) {
    const notificationId = uuidv4();
    const startTime = Date.now();

    try {
      const notificationData = {
        notificationId,
        type: 'PAYMENT_CONFIRMATION',
        customer,
        transaction,
        timestamp: new Date(),
        channels: this.filterEnabledChannels(channels)
      };

      const template = this.templateManager.getTemplate('PAYMENT_CONFIRMATION');
      
      const deliveryResults = await this.sendMultiChannelNotification(notificationData, template);
      
      const deliveryRecord = this.deliveryTracker.createDeliveryRecord(
        notificationId,
        'PAYMENT_CONFIRMATION',
        customer.customerId,
        deliveryResults
      );

      this.updateMetrics(deliveryResults, Date.now() - startTime);

      return {
        success: deliveryResults.some(result => result.success),
        notificationId,
        deliveryResults,
        deliveryRecord,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        notificationId,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send account rejection notification
   * @param {Object} customer - Customer object
   * @param {string} rejectionReason - Reason for rejection
   * @param {Array} channels - Preferred notification channels
   * @returns {Promise<Object>} Notification result
   */
  async sendAccountRejectionNotification(customer, rejectionReason, channels = ['email']) {
    const notificationId = uuidv4();
    const startTime = Date.now();

    try {
      const notificationData = {
        notificationId,
        type: 'ACCOUNT_REJECTION',
        customer,
        rejectionReason,
        timestamp: new Date(),
        channels: this.filterEnabledChannels(channels)
      };

      const template = this.templateManager.getTemplate('ACCOUNT_REJECTION');
      
      const deliveryResults = await this.sendMultiChannelNotification(notificationData, template);
      
      const deliveryRecord = this.deliveryTracker.createDeliveryRecord(
        notificationId,
        'ACCOUNT_REJECTION',
        customer.customerId,
        deliveryResults
      );

      this.updateMetrics(deliveryResults, Date.now() - startTime);

      return {
        success: deliveryResults.some(result => result.success),
        notificationId,
        deliveryResults,
        deliveryRecord,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.metrics.failedDeliveries++;
      return {
        success: false,
        notificationId,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send notifications across multiple channels
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Notification template
   * @returns {Promise<Array>} Array of delivery results
   */
  async sendMultiChannelNotification(notificationData, template) {
    const deliveryPromises = notificationData.channels.map(async (channelName) => {
      const channel = this.channels[channelName];
      if (!channel) {
        return {
          channel: channelName,
          success: false,
          error: `Channel ${channelName} not available`,
          timestamp: new Date()
        };
      }

      try {
        const result = await this.sendWithRetry(channel, notificationData, template);
        this.metrics.channelStats[channelName].sent++;
        
        if (result.success) {
          this.metrics.channelStats[channelName].delivered++;
        } else {
          this.metrics.channelStats[channelName].failed++;
        }

        return {
          channel: channelName,
          ...result,
          timestamp: new Date()
        };
      } catch (error) {
        this.metrics.channelStats[channelName].failed++;
        return {
          channel: channelName,
          success: false,
          error: error.message,
          timestamp: new Date()
        };
      }
    });

    return Promise.all(deliveryPromises);
  }

  /**
   * Send notification with retry logic
   * @param {Object} channel - Notification channel
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Notification template
   * @param {number} retryCount - Current retry count
   * @returns {Promise<Object>} Delivery result
   */
  async sendWithRetry(channel, notificationData, template, retryCount = 0) {
    try {
      return await channel.send(notificationData, template);
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
        return this.sendWithRetry(channel, notificationData, template, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Send generic email notification
   * @param {string} email - Email address
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(email, subject, body) {
    try {
      const result = await this.channels.email.send(
        {
          customer: {
            personalInfo: {
              contactInfo: { email }
            }
          }
        },
        {
          email: {
            subject,
            body,
            isHtml: false
          }
        }
      );

      this.metrics.channelStats.email.sent++;
      if (result.success) {
        this.metrics.channelStats.email.delivered++;
      } else {
        this.metrics.channelStats.email.failed++;
      }

      return result;
    } catch (error) {
      this.metrics.channelStats.email.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send generic SMS notification
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phone, message) {
    try {
      const result = await this.channels.sms.send(
        {
          customer: {
            personalInfo: {
              contactInfo: { phone }
            }
          }
        },
        {
          sms: {
            body: message
          }
        }
      );

      this.metrics.channelStats.sms.sent++;
      if (result.success) {
        this.metrics.channelStats.sms.delivered++;
      } else {
        this.metrics.channelStats.sms.failed++;
      }

      return result;
    } catch (error) {
      this.metrics.channelStats.sms.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get delivery status for a notification
   * @param {string} notificationId - Notification ID
   * @returns {Object} Delivery status
   */
  getDeliveryStatus(notificationId) {
    return this.deliveryTracker.getDeliveryStatus(notificationId);
  }

  /**
   * Get notification statistics
   * @returns {Object} Notification statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      enabledChannels: Object.keys(this.channels).filter(
        channel => this.config[`enable${channel.charAt(0).toUpperCase() + channel.slice(1)}`]
      ),
      totalTemplates: this.templateManager.getTemplateCount(),
      trackedDeliveries: this.deliveryTracker.getTrackedCount()
    };
  }

  /**
   * Filter enabled channels based on configuration
   * @param {Array} channels - Requested channels
   * @returns {Array} Enabled channels
   */
  filterEnabledChannels(channels) {
    return channels.filter(channel => {
      const configKey = channel === 'sms' ? 'enableSMS' : 
                       channel === 'push' ? 'enablePush' : 
                       `enable${channel.charAt(0).toUpperCase() + channel.slice(1)}`;
      return this.config[configKey];
    });
  }

  /**
   * Update notification metrics
   * @param {Array} deliveryResults - Array of delivery results
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateMetrics(deliveryResults, processingTime) {
    this.metrics.totalNotifications++;
    
    const successfulDeliveries = deliveryResults.filter(result => result.success).length;
    if (successfulDeliveries > 0) {
      this.metrics.successfulDeliveries++;
    } else {
      this.metrics.failedDeliveries++;
    }

    // Update average delivery time
    const totalTime = this.metrics.averageDeliveryTime * (this.metrics.totalNotifications - 1) + processingTime;
    this.metrics.averageDeliveryTime = Math.round(totalTime / this.metrics.totalNotifications);
  }

  /**
   * Delay utility for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Notification Template Manager - Manages notification templates
 */
class NotificationTemplateManager {
  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default notification templates
   */
  initializeDefaultTemplates() {
    // Account Activation Template
    this.templates.set('ACCOUNT_ACTIVATION', {
      type: 'ACCOUNT_ACTIVATION',
      email: {
        subject: 'Welcome to {{bankName}} - Your Account is Now Active!',
        body: `
Dear {{customerName}},

Congratulations! Your {{accountType}} account has been successfully created and activated.

Account Details:
- Account Number: {{accountNumber}}
- Account Type: {{accountType}}
- Opening Date: {{openingDate}}

You can now start using your account for all your banking needs. 

Thank you for choosing {{bankName}}.

Best regards,
{{bankName}} Team
        `.trim(),
        isHtml: false
      },
      sms: {
        body: 'Welcome to {{bankName}}! Your {{accountType}} account {{accountNumber}} is now active. Thank you for banking with us!'
      },
      push: {
        title: 'Account Activated',
        body: 'Your {{accountType}} account is now ready to use!'
      }
    });

    // Loan Approved Template
    this.templates.set('LOAN_APPROVED', {
      type: 'LOAN_APPROVED',
      email: {
        subject: 'Loan Approved - {{bankName}}',
        body: `
Dear {{customerName}},

Great news! Your loan application has been approved.

Loan Details:
- Loan Amount: {{approvedAmount}}
- Interest Rate: {{interestRate}}%
- Loan Term: {{loanTerm}}
- Application ID: {{applicationId}}

The funds will be disbursed to your account within 2-3 business days.

Best regards,
{{bankName}} Team
        `.trim(),
        isHtml: false
      },
      sms: {
        body: 'Congratulations! Your loan of {{approvedAmount}} has been approved. Funds will be disbursed soon. - {{bankName}}'
      },
      push: {
        title: 'Loan Approved!',
        body: 'Your loan application has been approved. Check your email for details.'
      }
    });

    // Loan Rejected Template
    this.templates.set('LOAN_REJECTED', {
      type: 'LOAN_REJECTED',
      email: {
        subject: 'Loan Application Update - {{bankName}}',
        body: `
Dear {{customerName}},

Thank you for your interest in our loan products. After careful review, we are unable to approve your loan application at this time.

Application ID: {{applicationId}}
Reason: {{rejectionReason}}

We encourage you to reapply in the future when your financial situation may have changed.

Best regards,
{{bankName}} Team
        `.trim(),
        isHtml: false
      },
      sms: {
        body: 'Your loan application {{applicationId}} could not be approved at this time. Please check your email for details. - {{bankName}}'
      },
      push: {
        title: 'Loan Application Update',
        body: 'Please check your email for important information about your loan application.'
      }
    });

    // Payment Confirmation Template
    this.templates.set('PAYMENT_CONFIRMATION', {
      type: 'PAYMENT_CONFIRMATION',
      email: {
        subject: 'Payment Confirmation - {{bankName}}',
        body: `
Dear {{customerName}},

Your payment has been processed successfully.

Transaction Details:
- Amount: {{amount}} {{currency}}
- Transaction ID: {{transactionId}}
- Date: {{transactionDate}}
- Description: {{description}}

Thank you for using {{bankName}}.

Best regards,
{{bankName}} Team
        `.trim(),
        isHtml: false
      },
      sms: {
        body: 'Payment confirmed: {{amount}} {{currency}} - Transaction ID: {{transactionId}}. Thank you! - {{bankName}}'
      },
      push: {
        title: 'Payment Confirmed',
        body: 'Your payment of {{amount}} {{currency}} has been processed successfully.'
      }
    });

    // Account Rejection Template
    this.templates.set('ACCOUNT_REJECTION', {
      type: 'ACCOUNT_REJECTION',
      email: {
        subject: 'Account Application Update - {{bankName}}',
        body: `
Dear {{customerName}},

Thank you for your interest in opening an account with {{bankName}}.

After careful review of your application, we are unable to approve your account opening request at this time.

Reason: {{rejectionReason}}

We encourage you to reapply in the future when your circumstances may have changed. If you have any questions, please contact our customer service team.

Best regards,
{{bankName}} Team
        `.trim(),
        isHtml: false
      },
      sms: {
        body: 'Your account application with {{bankName}} could not be approved at this time. Please check your email for details.'
      },
      push: {
        title: 'Account Application Update',
        body: 'Please check your email for important information about your account application.'
      }
    });
  }

  /**
   * Get notification template
   * @param {string} templateType - Template type
   * @returns {Object} Template object
   */
  getTemplate(templateType) {
    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }
    return template;
  }

  /**
   * Add custom template
   * @param {string} templateType - Template type
   * @param {Object} template - Template object
   */
  addTemplate(templateType, template) {
    this.templates.set(templateType, template);
  }

  /**
   * Get template count
   * @returns {number} Number of templates
   */
  getTemplateCount() {
    return this.templates.size;
  }

  /**
   * Render template with data
   * @param {Object} template - Template object
   * @param {string} channel - Channel (email, sms, push)
   * @param {Object} data - Data to render
   * @returns {Object} Rendered template
   */
  renderTemplate(template, channel, data) {
    const channelTemplate = template[channel];
    if (!channelTemplate) {
      throw new Error(`Template for channel ${channel} not found`);
    }

    const rendered = {};
    
    // Render each field in the template
    Object.keys(channelTemplate).forEach(key => {
      if (typeof channelTemplate[key] === 'string') {
        rendered[key] = this.replaceVariables(channelTemplate[key], data);
      } else {
        rendered[key] = channelTemplate[key];
      }
    });

    return rendered;
  }

  /**
   * Replace template variables with actual data
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Rendered string
   */
  replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] || match;
    });
  }
}

/**
 * Delivery Tracker - Tracks notification delivery status
 */
class DeliveryTracker {
  constructor() {
    this.deliveryRecords = new Map();
  }

  /**
   * Create delivery record
   * @param {string} notificationId - Notification ID
   * @param {string} type - Notification type
   * @param {string} customerId - Customer ID
   * @param {Array} deliveryResults - Delivery results
   * @returns {Object} Delivery record
   */
  createDeliveryRecord(notificationId, type, customerId, deliveryResults) {
    const record = {
      notificationId,
      type,
      customerId,
      timestamp: new Date(),
      deliveryResults,
      status: deliveryResults.some(result => result.success) ? 'DELIVERED' : 'FAILED',
      channels: deliveryResults.map(result => ({
        channel: result.channel,
        success: result.success,
        error: result.error,
        timestamp: result.timestamp
      }))
    };

    this.deliveryRecords.set(notificationId, record);
    return record;
  }

  /**
   * Get delivery status
   * @param {string} notificationId - Notification ID
   * @returns {Object} Delivery status
   */
  getDeliveryStatus(notificationId) {
    const record = this.deliveryRecords.get(notificationId);
    if (!record) {
      return { found: false };
    }

    return {
      found: true,
      ...record
    };
  }

  /**
   * Get tracked count
   * @returns {number} Number of tracked deliveries
   */
  getTrackedCount() {
    return this.deliveryRecords.size;
  }
}

// Notification Channels

/**
 * Base Notification Channel
 */
class BaseNotificationChannel {
  constructor(config = {}) {
    this.config = config;
  }

  async send(notificationData, template) {
    throw new Error('send method must be implemented by subclass');
  }

  async simulateDelay(min = 500, max = 2000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Email Notification Channel
 */
class EmailChannel extends BaseNotificationChannel {
  async send(notificationData, template) {
    if (!this.config.enableEmail) {
      throw new Error('Email channel is disabled');
    }

    // Simulate email sending delay
    await this.simulateDelay(1000, 3000);

    const { customer } = notificationData;
    const emailAddress = customer.personalInfo?.contactInfo?.email;
    
    if (!emailAddress) {
      throw new Error('Customer email address not available');
    }

    // Prepare template data
    const templateData = this.prepareTemplateData(notificationData);
    
    // Render email template
    const templateManager = new NotificationTemplateManager();
    const renderedTemplate = templateManager.renderTemplate(template, 'email', templateData);

    // Mock email sending (in real implementation, would use email service)
    const mockEmailResult = {
      success: true,
      messageId: `email_${Date.now()}`,
      recipient: emailAddress,
      subject: renderedTemplate.subject,
      deliveryTime: Date.now()
    };

    return mockEmailResult;
  }

  prepareTemplateData(notificationData) {
    const { customer, account, loanApplication, transaction, rejectionReason } = notificationData;
    
    const data = {
      bankName: 'SecureBank',
      customerName: `${customer.personalInfo?.firstName} ${customer.personalInfo?.lastName}`.trim()
    };

    if (account) {
      data.accountNumber = account.accountNumber;
      data.accountType = account.accountType;
      data.openingDate = account.openingDate?.toLocaleDateString();
    }

    if (loanApplication) {
      data.applicationId = loanApplication.applicationId;
      data.approvedAmount = loanApplication.decision?.approvedAmount;
      data.interestRate = loanApplication.decision?.interestRate;
      data.loanTerm = loanApplication.decision?.terms;
      data.rejectionReason = loanApplication.decision?.decisionReason;
    }

    if (transaction) {
      data.amount = transaction.amount;
      data.currency = transaction.currency;
      data.transactionId = transaction.transactionId;
      data.transactionDate = transaction.processedAt?.toLocaleDateString();
      data.description = transaction.description;
    }

    if (rejectionReason) {
      data.rejectionReason = rejectionReason;
    }

    return data;
  }
}

/**
 * SMS Notification Channel
 */
class SMSChannel extends BaseNotificationChannel {
  async send(notificationData, template) {
    if (!this.config.enableSMS) {
      throw new Error('SMS channel is disabled');
    }

    // Simulate SMS sending delay
    await this.simulateDelay(500, 1500);

    const { customer } = notificationData;
    const phoneNumber = customer.personalInfo?.contactInfo?.phone;
    
    if (!phoneNumber) {
      throw new Error('Customer phone number not available');
    }

    // Prepare template data
    const templateData = this.prepareTemplateData(notificationData);
    
    // Render SMS template
    const templateManager = new NotificationTemplateManager();
    const renderedTemplate = templateManager.renderTemplate(template, 'sms', templateData);

    // Mock SMS sending
    const mockSMSResult = {
      success: true,
      messageId: `sms_${Date.now()}`,
      recipient: phoneNumber,
      message: renderedTemplate.body,
      deliveryTime: Date.now()
    };

    return mockSMSResult;
  }

  prepareTemplateData(notificationData) {
    // Reuse email template data preparation
    const emailChannel = new EmailChannel();
    return emailChannel.prepareTemplateData(notificationData);
  }
}

/**
 * Push Notification Channel
 */
class PushChannel extends BaseNotificationChannel {
  async send(notificationData, template) {
    if (!this.config.enablePush) {
      throw new Error('Push channel is disabled');
    }

    // Simulate push notification delay
    await this.simulateDelay(200, 800);

    const { customer } = notificationData;
    
    // In real implementation, would need device tokens
    const deviceToken = `device_${customer.customerId}`;

    // Prepare template data
    const templateData = this.prepareTemplateData(notificationData);
    
    // Render push template
    const templateManager = new NotificationTemplateManager();
    const renderedTemplate = templateManager.renderTemplate(template, 'push', templateData);

    // Mock push notification sending
    const mockPushResult = {
      success: true,
      messageId: `push_${Date.now()}`,
      deviceToken,
      title: renderedTemplate.title,
      body: renderedTemplate.body,
      deliveryTime: Date.now()
    };

    return mockPushResult;
  }

  prepareTemplateData(notificationData) {
    // Reuse email template data preparation
    const emailChannel = new EmailChannel();
    return emailChannel.prepareTemplateData(notificationData);
  }
}

module.exports = {
  NotificationService,
  NotificationTemplateManager,
  DeliveryTracker,
  EmailChannel,
  SMSChannel,
  PushChannel
};
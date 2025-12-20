// Notification Service Tests

const { 
  NotificationService, 
  NotificationTemplateManager, 
  DeliveryTracker,
  EmailChannel,
  SMSChannel,
  PushChannel
} = require('../services/notification-service');
const { AccountType, KYCStatus } = require('../shared/types');
const { v4: uuidv4 } = require('uuid');

describe('Notification Service', () => {
  let notificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(notificationService).toBeDefined();
      expect(notificationService.config.enableEmail).toBe(true);
      expect(notificationService.config.enableSMS).toBe(true);
      expect(notificationService.config.enablePush).toBe(true);
      expect(notificationService.config.maxRetries).toBe(3);
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        enableEmail: true,
        enableSMS: false,
        enablePush: false,
        maxRetries: 5
      };
      
      const service = new NotificationService(customConfig);
      expect(service.config.enableEmail).toBe(true);
      expect(service.config.enableSMS).toBe(false);
      expect(service.config.enablePush).toBe(false);
      expect(service.config.maxRetries).toBe(5);
    });
  });

  describe('Account Activation Notifications', () => {
    test('should send account activation notification successfully', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '+1234567890'
          }
        }
      };

      const account = {
        accountId: uuidv4(),
        accountNumber: '1000123456789',
        accountType: AccountType.SAVINGS,
        openingDate: new Date()
      };

      const result = await notificationService.sendAccountActivationNotification(
        customer,
        account,
        ['email', 'sms']
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      expect(result.deliveryResults).toHaveLength(2);
      expect(result.deliveryResults[0].channel).toBe('email');
      expect(result.deliveryResults[1].channel).toBe('sms');
      expect(result.deliveryResults[0].success).toBe(true);
      expect(result.deliveryResults[1].success).toBe(true); // SMS succeeds with phone number
      expect(result.deliveryRecord).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle missing customer contact information', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE'
          // Missing contactInfo
        }
      };

      const account = {
        accountId: uuidv4(),
        accountNumber: '1000123456789',
        accountType: AccountType.SAVINGS,
        openingDate: new Date()
      };

      const result = await notificationService.sendAccountActivationNotification(
        customer,
        account,
        ['email']
      );

      expect(result.success).toBe(false);
      expect(result.deliveryResults[0].success).toBe(false);
      expect(result.deliveryResults[0].error).toContain('email address not available');
    }, 30000); // Increase timeout

    test('should filter disabled channels', async () => {
      const service = new NotificationService({
        enableEmail: true,
        enableSMS: false,
        enablePush: false
      });

      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '+8448501684'
          }
        }
      };

      const account = {
        accountId: uuidv4(),
        accountNumber: '1000123456789',
        accountType: AccountType.SAVINGS,
        openingDate: new Date()
      };

      const result = await service.sendAccountActivationNotification(
        customer,
        account,
        ['email', 'sms', 'push']
      );

      expect(result.deliveryResults).toHaveLength(1);
      expect(result.deliveryResults[0].channel).toBe('email');
    });
  });

  describe('Account Rejection Notifications', () => {
    test('should send account rejection notification', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com'
          }
        }
      };

      const rejectionReason = 'Insufficient documentation provided';

      const result = await notificationService.sendAccountRejectionNotification(
        customer,
        rejectionReason,
        ['email']
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      expect(result.deliveryResults).toHaveLength(1);
      expect(result.deliveryResults[0].channel).toBe('email');
      expect(result.deliveryResults[0].success).toBe(true);
    });
  });

  describe('Loan Decision Notifications', () => {
    test('should send loan approval notification', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '+918448501684'
          }
        }
      };

      const loanApplication = {
        applicationId: uuidv4(),
        decision: {
          approved: true,
          approvedAmount: 50000,
          interestRate: 5.5,
          terms: '5 years'
        }
      };

      const result = await notificationService.sendLoanDecisionNotification(
        customer,
        loanApplication,
        ['email', 'sms']
      );

      expect(result.success).toBe(true);
      expect(result.deliveryResults).toHaveLength(2);
      expect(result.deliveryResults[0].success).toBe(true); // Email succeeds
      expect(result.deliveryResults[1].success).toBe(true); // SMS succeeds with phone number
    });

    test('should send loan rejection notification', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com'
          }
        }
      };

      const loanApplication = {
        applicationId: uuidv4(),
        decision: {
          approved: false,
          decisionReason: 'Credit score below minimum requirement'
        }
      };

      const result = await notificationService.sendLoanDecisionNotification(
        customer,
        loanApplication,
        ['email']
      );

      expect(result.success).toBe(true);
      expect(result.deliveryResults[0].success).toBe(true);
    });
  });

  describe('Payment Confirmation Notifications', () => {
    test('should send payment confirmation notification', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '+1234567890'
          }
        }
      };

      const transaction = {
        transactionId: uuidv4(),
        amount: 1000,
        currency: 'USD',
        description: 'Online payment',
        processedAt: new Date()
      };

      const result = await notificationService.sendPaymentConfirmationNotification(
        customer,
        transaction,
        ['email', 'sms']
      );

      expect(result.success).toBe(true);
      expect(result.deliveryResults).toHaveLength(2);
      expect(result.deliveryResults[0].success).toBe(true); // Email succeeds
      expect(result.deliveryResults[1].success).toBe(true); // SMS succeeds with phone number
    });
  });

  describe('Delivery Tracking', () => {
    test('should track delivery status', async () => {
      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com'
          }
        }
      };

      const account = {
        accountId: uuidv4(),
        accountNumber: '1000123456789',
        accountType: AccountType.SAVINGS,
        openingDate: new Date()
      };

      const result = await notificationService.sendAccountActivationNotification(
        customer,
        account,
        ['email']
      );

      const deliveryStatus = notificationService.getDeliveryStatus(result.notificationId);
      
      expect(deliveryStatus.found).toBe(true);
      expect(deliveryStatus.notificationId).toBe(result.notificationId);
      expect(deliveryStatus.type).toBe('ACCOUNT_ACTIVATION');
      expect(deliveryStatus.customerId).toBe(customer.customerId);
      expect(deliveryStatus.status).toBe('DELIVERED');
    });

    test('should return not found for non-existent notification', () => {
      const deliveryStatus = notificationService.getDeliveryStatus('non-existent-id');
      expect(deliveryStatus.found).toBe(false);
    });
  });

  describe('Statistics and Metrics', () => {
    test('should track notification statistics', async () => {
      const initialStats = notificationService.getStatistics();
      expect(initialStats.totalNotifications).toBe(0);
      expect(initialStats.successfulDeliveries).toBe(0);

      const customer = {
        customerId: uuidv4(),
        personalInfo: {
          firstName: 'JOHN',
          lastName: 'DOE',
          contactInfo: {
            email: 'john.doe@example.com'
          }
        }
      };

      const account = {
        accountId: uuidv4(),
        accountNumber: '1000123456789',
        accountType: AccountType.SAVINGS,
        openingDate: new Date()
      };

      await notificationService.sendAccountActivationNotification(customer, account, ['email']);

      const updatedStats = notificationService.getStatistics();
      expect(updatedStats.totalNotifications).toBe(1);
      expect(updatedStats.successfulDeliveries).toBe(1);
      expect(updatedStats.averageDeliveryTime).toBeGreaterThan(0);
      expect(updatedStats.channelStats.email.sent).toBe(1);
      expect(updatedStats.channelStats.email.delivered).toBe(1);
    });

    test('should return enabled channels in statistics', () => {
      const service = new NotificationService({
        enableEmail: true,
        enableSMS: false,
        enablePush: true
      });

      const stats = service.getStatistics();
      expect(stats.enabledChannels).toContain('email');
      expect(stats.enabledChannels).toContain('push');
      expect(stats.enabledChannels).not.toContain('sms');
    });
  });
});

describe('Notification Template Manager', () => {
  let templateManager;

  beforeEach(() => {
    templateManager = new NotificationTemplateManager();
  });

  test('should initialize with default templates', () => {
    expect(templateManager.getTemplateCount()).toBeGreaterThan(0);
    
    const accountActivationTemplate = templateManager.getTemplate('ACCOUNT_ACTIVATION');
    expect(accountActivationTemplate).toBeDefined();
    expect(accountActivationTemplate.email).toBeDefined();
    expect(accountActivationTemplate.sms).toBeDefined();
    expect(accountActivationTemplate.push).toBeDefined();
  });

  test('should render email template with data', () => {
    const template = templateManager.getTemplate('ACCOUNT_ACTIVATION');
    const data = {
      bankName: 'TestBank',
      customerName: 'John Doe',
      accountType: 'SAVINGS',
      accountNumber: '1000123456789',
      openingDate: '2024-01-15'
    };

    const rendered = templateManager.renderTemplate(template, 'email', data);
    
    expect(rendered.subject).toContain('TestBank');
    expect(rendered.body).toContain('John Doe');
    expect(rendered.body).toContain('SAVINGS');
    expect(rendered.body).toContain('1000123456789');
  });

  test('should render SMS template with data', () => {
    const template = templateManager.getTemplate('ACCOUNT_ACTIVATION');
    const data = {
      bankName: 'TestBank',
      accountType: 'SAVINGS',
      accountNumber: '1000123456789'
    };

    const rendered = templateManager.renderTemplate(template, 'sms', data);
    
    expect(rendered.body).toContain('TestBank');
    expect(rendered.body).toContain('SAVINGS');
    expect(rendered.body).toContain('1000123456789');
  });

  test('should add custom template', () => {
    const customTemplate = {
      type: 'CUSTOM_NOTIFICATION',
      email: {
        subject: 'Custom Subject',
        body: 'Custom body with {{variable}}'
      }
    };

    templateManager.addTemplate('CUSTOM_NOTIFICATION', customTemplate);
    
    const retrieved = templateManager.getTemplate('CUSTOM_NOTIFICATION');
    expect(retrieved).toEqual(customTemplate);
  });

  test('should throw error for non-existent template', () => {
    expect(() => {
      templateManager.getTemplate('NON_EXISTENT');
    }).toThrow('Template not found: NON_EXISTENT');
  });

  test('should throw error for non-existent channel in template', () => {
    const template = templateManager.getTemplate('ACCOUNT_ACTIVATION');
    
    expect(() => {
      templateManager.renderTemplate(template, 'nonexistent', {});
    }).toThrow('Template for channel nonexistent not found');
  });
});

describe('Delivery Tracker', () => {
  let deliveryTracker;

  beforeEach(() => {
    deliveryTracker = new DeliveryTracker();
  });

  test('should create and track delivery record', () => {
    const notificationId = uuidv4();
    const deliveryResults = [
      { channel: 'email', success: true, timestamp: new Date() },
      { channel: 'sms', success: false, error: 'Phone not available', timestamp: new Date() }
    ];

    const record = deliveryTracker.createDeliveryRecord(
      notificationId,
      'ACCOUNT_ACTIVATION',
      'customer-123',
      deliveryResults
    );

    expect(record.notificationId).toBe(notificationId);
    expect(record.type).toBe('ACCOUNT_ACTIVATION');
    expect(record.customerId).toBe('customer-123');
    expect(record.status).toBe('DELIVERED'); // At least one channel succeeded
    expect(record.channels).toHaveLength(2);
  });

  test('should mark as failed when all channels fail', () => {
    const deliveryResults = [
      { channel: 'email', success: false, error: 'Email failed', timestamp: new Date() },
      { channel: 'sms', success: false, error: 'SMS failed', timestamp: new Date() }
    ];

    const record = deliveryTracker.createDeliveryRecord(
      uuidv4(),
      'ACCOUNT_ACTIVATION',
      'customer-123',
      deliveryResults
    );

    expect(record.status).toBe('FAILED');
  });

  test('should get delivery status', () => {
    const notificationId = uuidv4();
    const deliveryResults = [
      { channel: 'email', success: true, timestamp: new Date() }
    ];

    deliveryTracker.createDeliveryRecord(
      notificationId,
      'ACCOUNT_ACTIVATION',
      'customer-123',
      deliveryResults
    );

    const status = deliveryTracker.getDeliveryStatus(notificationId);
    expect(status.found).toBe(true);
    expect(status.notificationId).toBe(notificationId);
  });

  test('should return not found for non-existent notification', () => {
    const status = deliveryTracker.getDeliveryStatus('non-existent');
    expect(status.found).toBe(false);
  });
});

describe('Notification Channels', () => {
  describe('Email Channel', () => {
    test('should send email successfully', async () => {
      const emailChannel = new EmailChannel({ enableEmail: true });
      
      const notificationData = {
        customer: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            contactInfo: {
              email: 'john.doe@example.com'
            }
          }
        },
        account: {
          accountNumber: '1000123456789',
          accountType: 'SAVINGS',
          openingDate: new Date()
        }
      };

      const template = {
        email: {
          subject: 'Test Subject',
          body: 'Test body'
        }
      };

      const result = await emailChannel.send(notificationData, template);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.recipient).toBe('john.doe@example.com');
    });

    test('should fail when email is disabled', async () => {
      const emailChannel = new EmailChannel({ enableEmail: false });
      
      await expect(emailChannel.send({}, {})).rejects.toThrow('Email channel is disabled');
    });

    test('should fail when email address is not available', async () => {
      const emailChannel = new EmailChannel({ enableEmail: true });
      
      const notificationData = {
        customer: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe'
            // Missing contactInfo
          }
        }
      };

      await expect(emailChannel.send(notificationData, {})).rejects.toThrow('Customer email address not available');
    });
  });

  describe('SMS Channel', () => {
    test('should send SMS successfully', async () => {
      const smsChannel = new SMSChannel({ enableSMS: true });
      
      const notificationData = {
        customer: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            contactInfo: {
              phone: '+1234567890'
            }
          }
        }
      };

      const template = {
        sms: {
          body: 'Test SMS message'
        }
      };

      const result = await smsChannel.send(notificationData, template);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.recipient).toBe('+1234567890');
    });

    test('should fail when SMS is disabled', async () => {
      const smsChannel = new SMSChannel({ enableSMS: false });
      
      await expect(smsChannel.send({}, {})).rejects.toThrow('SMS channel is disabled');
    });
  });

  describe('Push Channel', () => {
    test('should send push notification successfully', async () => {
      const pushChannel = new PushChannel({ enablePush: true });
      
      const notificationData = {
        customer: {
          customerId: uuidv4(),
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const template = {
        push: {
          title: 'Test Title',
          body: 'Test push message'
        }
      };

      const result = await pushChannel.send(notificationData, template);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.deviceToken).toBeDefined();
    });

    test('should fail when push is disabled', async () => {
      const pushChannel = new PushChannel({ enablePush: false });
      
      await expect(pushChannel.send({}, {})).rejects.toThrow('Push channel is disabled');
    });
  });
});
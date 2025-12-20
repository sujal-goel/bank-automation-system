const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email Service for sending verification and notification emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      const emailConfig = this.getEmailConfig();
      
      if (emailConfig.provider === 'mock' || config.isDevelopment()) {
        // Use mock transporter for development
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
        console.log('Email service initialized with mock transporter (development mode)');
      } else if (emailConfig.provider === 'smtp') {
        // Use SMTP for production
        this.transporter = nodemailer.createTransport({
          host: emailConfig.smtp.host,
          port: emailConfig.smtp.port,
          secure: emailConfig.smtp.secure,
          auth: {
            user: emailConfig.smtp.user,
            pass: emailConfig.smtp.password
          }
        });
        console.log('Email service initialized with SMTP transporter');
      } else if (emailConfig.provider === 'gmail') {
        // Use Gmail for production
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: emailConfig.gmail.user,
            pass: emailConfig.gmail.password
          }
        });
        console.log('Email service initialized with Gmail transporter');
      } else {
        // Fallback to console logging
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log('=== EMAIL WOULD BE SENT ===');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('Content:', mailOptions.html || mailOptions.text);
            console.log('========================');
            return { messageId: 'mock-' + Date.now() };
          }
        };
        console.log('Email service initialized with console logger (fallback)');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      // Fallback to console logging
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('=== EMAIL FALLBACK ===');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('Content:', mailOptions.html || mailOptions.text);
          console.log('==================');
          return { messageId: 'fallback-' + Date.now() };
        }
      };
      this.isInitialized = true;
    }
  }

  /**
   * Get email configuration
   */
  getEmailConfig() {
    return {
      provider: process.env.EMAIL_PROVIDER || 'mock',
      fromAddress: process.env.EMAIL_FROM || 'noreply@bankingsystem.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Banking System',
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD
      },
      gmail: {
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_PASSWORD
      }
    };
  }

  /**
   * Send email verification for customer
   */
  async sendCustomerVerification(user, verificationToken) {
    const emailConfig = this.getEmailConfig();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: user.email,
      subject: 'Verify Your Banking Account Email',
      html: this.generateCustomerVerificationHTML(user, verificationUrl),
      text: this.generateCustomerVerificationText(user, verificationUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Customer verification email sent to ${user.email}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Failed to send customer verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send email verification for employee
   */
  async sendEmployeeVerification(user, verificationToken) {
    const emailConfig = this.getEmailConfig();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: user.email,
      subject: 'Employee Account Email Verification',
      html: this.generateEmployeeVerificationHTML(user, verificationUrl),
      text: this.generateEmployeeVerificationText(user, verificationUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Employee verification email sent to ${user.email}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Failed to send employee verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send admin approval notification to employee
   */
  async sendEmployeeApprovalNotification(user) {
    const emailConfig = this.getEmailConfig();
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: user.email,
      subject: 'Employee Account Approved',
      html: this.generateEmployeeApprovalHTML(user, loginUrl),
      text: this.generateEmployeeApprovalText(user, loginUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Employee approval email sent to ${user.email}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Approval notification sent successfully'
      };
    } catch (error) {
      console.error('Failed to send employee approval email:', error);
      throw new Error('Failed to send approval notification');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const emailConfig = this.getEmailConfig();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: this.generatePasswordResetHTML(user, resetUrl),
      text: this.generatePasswordResetText(user, resetUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(user) {
    const emailConfig = this.getEmailConfig();
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: user.email,
      subject: 'Welcome to Banking System',
      html: this.generateWelcomeHTML(user, loginUrl),
      text: this.generateWelcomeText(user, loginUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Welcome email sent successfully'
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email as it's not critical
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate customer verification HTML email
   */
  generateCustomerVerificationHTML(user, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 Banking System</h1>
                <h2>Email Verification Required</h2>
            </div>
            <div class="content">
                <h3>Hello ${user.firstName} ${user.lastName},</h3>
                <p>Thank you for registering with our Banking System. To complete your account setup and start using our services, please verify your email address.</p>
                
                <p><strong>Account Details:</strong></p>
                <ul>
                    <li>Email: ${user.email}</li>
                    <li>Account Type: Customer</li>
                    <li>Registration Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <p>Click the button below to verify your email address:</p>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This verification link will expire in 24 hours</li>
                    <li>Once verified, you can access all banking services</li>
                    <li>Your account will remain inactive until email verification</li>
                </ul>
                
                <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 Banking System. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate customer verification text email
   */
  generateCustomerVerificationText(user, verificationUrl) {
    return `
Banking System - Email Verification Required

Hello ${user.firstName} ${user.lastName},

Thank you for registering with our Banking System. To complete your account setup, please verify your email address.

Account Details:
- Email: ${user.email}
- Account Type: Customer
- Registration Date: ${new Date().toLocaleDateString()}

Verification Link: ${verificationUrl}

Important:
- This verification link will expire in 24 hours
- Once verified, you can access all banking services
- Your account will remain inactive until email verification

If you didn't create this account, please ignore this email.

© 2024 Banking System. All rights reserved.
    `;
  }

  /**
   * Generate employee verification HTML email
   */
  generateEmployeeVerificationHTML(user, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Employee Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #34495e; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 Banking System</h1>
                <h2>Employee Email Verification</h2>
            </div>
            <div class="content">
                <h3>Hello ${user.firstName} ${user.lastName},</h3>
                <p>Your employee account has been created and is pending approval. Please verify your email address to complete the registration process.</p>
                
                <p><strong>Employee Details:</strong></p>
                <ul>
                    <li>Email: ${user.email}</li>
                    <li>Employee ID: ${user.employeeId}</li>
                    <li>Department: ${user.department}</li>
                    <li>Position: ${user.position}</li>
                    <li>Registration Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <div class="warning">
                    <strong>⚠️ Admin Approval Required</strong><br>
                    After email verification, your account will need to be approved by an administrator before you can access the system.
                </div>
                
                <p>Click the button below to verify your email address:</p>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Verify your email address using the link above</li>
                    <li>Wait for admin approval (you'll receive another email)</li>
                    <li>Once approved, you can log in and access the system</li>
                </ol>
                
                <p>If you didn't request this account, please contact your system administrator.</p>
            </div>
            <div class="footer">
                <p>© 2024 Banking System. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate employee verification text email
   */
  generateEmployeeVerificationText(user, verificationUrl) {
    return `
Banking System - Employee Email Verification

Hello ${user.firstName} ${user.lastName},

Your employee account has been created and is pending approval. Please verify your email address to complete the registration process.

Employee Details:
- Email: ${user.email}
- Employee ID: ${user.employeeId}
- Department: ${user.department}
- Position: ${user.position}
- Registration Date: ${new Date().toLocaleDateString()}

⚠️ ADMIN APPROVAL REQUIRED
After email verification, your account will need to be approved by an administrator before you can access the system.

Verification Link: ${verificationUrl}

Next Steps:
1. Verify your email address using the link above
2. Wait for admin approval (you'll receive another email)
3. Once approved, you can log in and access the system

If you didn't request this account, please contact your system administrator.

© 2024 Banking System. All rights reserved.
    `;
  }

  /**
   * Generate employee approval HTML email
   */
  generateEmployeeApprovalHTML(user, loginUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Employee Account Approved</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; color: #155724; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 Banking System</h1>
                <h2>Account Approved!</h2>
            </div>
            <div class="content">
                <div class="success">
                    <strong>✅ Congratulations!</strong><br>
                    Your employee account has been approved and is now active.
                </div>
                
                <h3>Hello ${user.firstName} ${user.lastName},</h3>
                <p>Great news! Your employee account has been approved by the administrator and you can now access the Banking System.</p>
                
                <p><strong>Your Account Details:</strong></p>
                <ul>
                    <li>Email: ${user.email}</li>
                    <li>Employee ID: ${user.employeeId}</li>
                    <li>Department: ${user.department}</li>
                    <li>Position: ${user.position}</li>
                    <li>Role: ${user.role}</li>
                    <li>Status: Active</li>
                </ul>
                
                <p>You can now log in to the system using your email and password:</p>
                <a href="${loginUrl}" class="button">Login to Banking System</a>
                
                <p><strong>What you can do now:</strong></p>
                <ul>
                    <li>Access your assigned modules and features</li>
                    <li>Process customer requests</li>
                    <li>Use banking tools and services</li>
                    <li>Collaborate with your team</li>
                </ul>
                
                <p>If you have any questions or need assistance, please contact your supervisor or the IT department.</p>
            </div>
            <div class="footer">
                <p>© 2024 Banking System. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate employee approval text email
   */
  generateEmployeeApprovalText(user, loginUrl) {
    return `
Banking System - Account Approved!

✅ Congratulations! Your employee account has been approved and is now active.

Hello ${user.firstName} ${user.lastName},

Great news! Your employee account has been approved by the administrator and you can now access the Banking System.

Your Account Details:
- Email: ${user.email}
- Employee ID: ${user.employeeId}
- Department: ${user.department}
- Position: ${user.position}
- Role: ${user.role}
- Status: Active

Login URL: ${loginUrl}

What you can do now:
- Access your assigned modules and features
- Process customer requests
- Use banking tools and services
- Collaborate with your team

If you have any questions or need assistance, please contact your supervisor or the IT department.

© 2024 Banking System. All rights reserved.
    `;
  }

  /**
   * Generate password reset HTML email
   */
  generatePasswordResetHTML(user, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 Banking System</h1>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <h3>Hello ${user.firstName} ${user.lastName},</h3>
                <p>We received a request to reset the password for your Banking System account.</p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice</strong><br>
                    If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <p>To reset your password, click the button below:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${resetUrl}</p>
                
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This reset link will expire in 1 hour</li>
                    <li>You can only use this link once</li>
                    <li>After resetting, you'll need to log in with your new password</li>
                </ul>
                
                <p>For security reasons, please choose a strong password that includes:</p>
                <ul>
                    <li>At least 8 characters</li>
                    <li>Uppercase and lowercase letters</li>
                    <li>Numbers and special characters</li>
                </ul>
            </div>
            <div class="footer">
                <p>© 2024 Banking System. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate password reset text email
   */
  generatePasswordResetText(user, resetUrl) {
    return `
Banking System - Password Reset Request

Hello ${user.firstName} ${user.lastName},

We received a request to reset the password for your Banking System account.

⚠️ SECURITY NOTICE
If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Reset Link: ${resetUrl}

Important:
- This reset link will expire in 1 hour
- You can only use this link once
- After resetting, you'll need to log in with your new password

For security reasons, please choose a strong password that includes:
- At least 8 characters
- Uppercase and lowercase letters
- Numbers and special characters

© 2024 Banking System. All rights reserved.
    `;
  }

  /**
   * Generate welcome HTML email
   */
  generateWelcomeHTML(user, loginUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to Banking System</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3498db; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏦 Banking System</h1>
                <h2>Welcome!</h2>
            </div>
            <div class="content">
                <h3>Welcome ${user.firstName} ${user.lastName}!</h3>
                <p>Your email has been successfully verified and your account is now active. Welcome to the Banking System!</p>
                
                <p>You can now access all available features and services:</p>
                <ul>
                    <li>Secure account management</li>
                    <li>Transaction processing</li>
                    <li>Customer support</li>
                    <li>Real-time notifications</li>
                </ul>
                
                <p>Ready to get started?</p>
                <a href="${loginUrl}" class="button">Login to Your Account</a>
                
                <p>If you have any questions or need assistance, our support team is here to help.</p>
            </div>
            <div class="footer">
                <p>© 2024 Banking System. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate welcome text email
   */
  generateWelcomeText(user, loginUrl) {
    return `
Banking System - Welcome!

Welcome ${user.firstName} ${user.lastName}!

Your email has been successfully verified and your account is now active. Welcome to the Banking System!

You can now access all available features and services:
- Secure account management
- Transaction processing
- Customer support
- Real-time notifications

Login URL: ${loginUrl}

If you have any questions or need assistance, our support team is here to help.

© 2024 Banking System. All rights reserved.
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (this.transporter.verify) {
        await this.transporter.verify();
        return { success: true, message: 'Email service connection verified' };
      } else {
        return { success: true, message: 'Email service ready (mock mode)' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../../database/connection');
const emailService = require('../../services/email-service');
const { fail } = require('assert');

class AuthModule {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';
    this.initializeDatabase();
  }

  // Initialize database connection and run migrations
  async initializeDatabase() {
    try {
      if (!db.isConnected) {
        console.log('Auth module: Initializing database connection...');
        await db.initialize();
        console.log('Auth module: Running database migrations...');
        await db.runMigrations();
        console.log('Auth module: Database initialization complete');
      }
    } catch (error) {
      console.error('Failed to initialize database for auth module:', error);
      throw error;
    }
  }

  // Validation schemas
  getSignupValidationSchema(userType) {
    const baseSchema = {
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        }),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      phoneNumber: Joi.string().pattern(/^[+]?[1-9]\d{1,14}$/).required(),
      dateOfBirth: Joi.date().max('now').required()
    };

    switch (userType) {
      case 'employee':
        return Joi.object({
          ...baseSchema,
          employeeId: Joi.string().required(),
          department: Joi.string().required(),
          position: Joi.string().required(),
          managerId: Joi.string().optional(),
          startDate: Joi.date().required()
        });

      case 'admin':
        return Joi.object({
          ...baseSchema,
          employeeId: Joi.string().required(),
          department: Joi.string().required(),
          adminLevel: Joi.string().valid('super_admin', 'admin', 'department_admin').required(),
          permissions: Joi.array().items(Joi.string()).optional()
        });

      case 'customer':
        return Joi.object({
          ...baseSchema,
          address: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            zipCode: Joi.string().required(),
            country: Joi.string().required()
          }).required(),
          occupation: Joi.string().required(),
          annualIncome: Joi.number().positive().required(),
          identificationNumber: Joi.string().required(),
          identificationType: Joi.string().valid('ssn', 'passport', 'driver_license', 'national_id').required()
        });

      default:
        return Joi.object(baseSchema);
    }
  }

  // Employee signup
  async signupEmployee(userData) {
    await this.initializeDatabase();
    
    const schema = this.getSignupValidationSchema('employee');
    const { error, value } = schema.validate(userData);
    
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
      [value.email, value.employeeId]
    );

    if (existingUser) {
      throw new Error('User with this email or employee ID already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10);
    
    // Insert user into database
    const user = await db.queryOne(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number, date_of_birth,
        role, status, email_verified, employee_id, department, position, 
        manager_id, start_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [
      value.email,
      hashedPassword,
      value.firstName,
      value.lastName,
      value.phoneNumber,
      value.dateOfBirth,
      'employee',
      'pending_approval',
      false,
      value.employeeId,
      value.department,
      value.position,
      value.managerId || null,
      value.startDate
    ]);

    // Create verification token
    const verificationToken = await this.generateVerificationToken(user.id);
    
    // Send verification email
    try {
      await emailService.sendEmployeeVerification(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return {
      success: true,
      message: 'Employee registration submitted successfully. Please wait for admin approval and check your email for verification.',
      userId: user.id,
      verificationToken, // In production, this would not be returned
      status: 'pending_approval'
    };
  }

  // Admin signup (requires super admin approval)
  async signupAdmin(userData, requestingAdminId) {
    await this.initializeDatabase();
    
    const schema = this.getSignupValidationSchema('admin');
    const { error, value } = schema.validate(userData);
    
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Verify requesting admin has permission
    const requestingAdmin = await db.queryOne(
      'SELECT id, role FROM users WHERE id = $1',
      [requestingAdminId]
    );
    
    if (!requestingAdmin || !['super_admin', 'admin'].includes(requestingAdmin.role)) {
      throw new Error('Insufficient permissions to create admin account');
    }

    // Check if user already exists
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = $1 OR employee_id = $2',
      [value.email, value.employeeId]
    );

    if (existingUser) {
      throw new Error('User with this email or employee ID already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10);
    
    // Determine role based on admin level
    const roleMapping = {
      'super_admin': 'super_admin',
      'admin': 'admin',
      'department_admin': 'department_admin'
    };

    // Insert user into database
    const user = await db.queryOne(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number, date_of_birth,
        role, status, email_verified, employee_id, department, admin_level,
        permissions, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [
      value.email,
      hashedPassword,
      value.firstName,
      value.lastName,
      value.phoneNumber,
      value.dateOfBirth,
      roleMapping[value.adminLevel] || 'admin',
      'pending_approval',
      false,
      value.employeeId,
      value.department,
      value.adminLevel,
      JSON.stringify(value.permissions || []),
      requestingAdminId
    ]);

    // Create verification token
    const verificationToken = await this.generateVerificationToken(user.id);
    
    return {
      success: true,
      message: 'Admin registration submitted successfully. Please check your email for verification.',
      userId: user.id,
      verificationToken,
      status: 'pending_approval'
    };
  }

  // Customer signup
  async signupCustomer(userData) {
    await this.initializeDatabase();
    
    const schema = this.getSignupValidationSchema('customer');
    const { error, value } = schema.validate(userData);
    
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = $1 OR identification_number = $2',
      [value.email, value.identificationNumber]
    );

    if (existingUser) {
      throw new Error('User with this email or identification number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10);
    
    // Insert user into database
    const user = await db.queryOne(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number, date_of_birth,
        role, status, email_verified, address, occupation, annual_income,
        identification_number, identification_type, kyc_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [
      value.email,
      hashedPassword,
      value.firstName,
      value.lastName,
      value.phoneNumber,
      value.dateOfBirth,
      'customer',
      'pending_verification',
      false,
      JSON.stringify(value.address),
      value.occupation,
      value.annualIncome,
      value.identificationNumber,
      value.identificationType,
      'pending'
    ]);

    // Create verification token
    const verificationToken = await this.generateVerificationToken(user.id);
    
    // Send verification email
    try {
      await emailService.sendCustomerVerification(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return {
      success: true,
      message: 'Customer registration successful. Please check your email for verification.',
      userId: user.id,
      verificationToken, // In production, this would not be returned
      status: 'pending_verification'
    };
  }

  // Generate verification token
  async generateVerificationToken(userId, tokenType = 'email_verification') {
    await this.initializeDatabase();
    
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store token in database
    await db.query(`
      INSERT INTO email_verification_tokens (user_id, token, token_type, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [userId, token, tokenType, expiresAt]);
    
    return token;
  }

  // Verify email
  async verifyEmail(token) {
    await this.initializeDatabase();
    
    // Find the verification token
    const verification = await db.queryOne(`
      SELECT vt.*, u.role, u.status 
      FROM email_verification_tokens vt
      JOIN users u ON vt.user_id = u.id
      WHERE vt.token = $1 AND vt.used_at IS NULL
    `, [token]);
    
    if (!verification) {
      throw new Error('Invalid verification token');
    }

    if (new Date() > verification.expires_at) {
      throw new Error('Verification token has expired');
    }

    // Update user and mark token as used in a transaction
    const user = await db.transaction(async (tx) => {
      // Mark token as used
      await tx.query(
        'UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
      );

      // Update user email verification status
      let newStatus = verification.status;
      if (verification.role === 'customer') {
        newStatus = 'active'; // Customers become active after email verification
      }

      const updatedUser = await tx.queryOne(`
        UPDATE users 
        SET email_verified = TRUE, status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, first_name, last_name, role, status, email_verified, created_at
      `, [newStatus, verification.user_id]);

      return updatedUser;
    });

    // Send welcome email for customers who become active
    if (user.role === 'customer' && user.status === 'active') {
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the verification if welcome email fails
      }
    }

    return {
      success: true,
      message: 'Email verified successfully',
      user: this.sanitizeUser(user)
    };
  }

  // Approve user (for employees and admins)
  async approveUser(userId, approvingAdminId) {
    await this.initializeDatabase();
    
    // Verify approving admin has permission
    const approvingAdmin = await db.queryOne(
      'SELECT id, role FROM users WHERE id = $1',
      [approvingAdminId]
    );
    
    if (!approvingAdmin || !['super_admin', 'admin'].includes(approvingAdmin.role)) {
      throw new Error('Insufficient permissions to approve users');
    }

    // Get user to approve
    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'pending_approval') {
      throw new Error('User is not in pending approval status');
    }

    // Determine new status and role
    let newStatus = user.email_verified ? 'active' : 'pending_verification';
    let newRole = user.role;
    
    if (user.role === 'employee') {
      // Determine specific role based on department/position
      newRole = this.determineEmployeeRole(user.department, user.position);
    }

    // Update user
    const updatedUser = await db.queryOne(`
      UPDATE users 
      SET status = $1, role = $2, approved_by = $3, approved_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP, updated_by = $3
      WHERE id = $4
      RETURNING id, email, first_name, last_name, role, status, email_verified, 
                employee_id, department, position, approved_at
    `, [newStatus, newRole, approvingAdminId, userId]);

    // Send approval notification email for employees
    if (updatedUser.role !== 'customer' && updatedUser.status === 'active') {
      try {
        await emailService.sendEmployeeApprovalNotification(updatedUser);
      } catch (emailError) {
        console.error('Failed to send approval notification email:', emailError);
        // Don't fail the approval if email fails
      }
    }

    return {
      success: true,
      message: 'User approved successfully',
      user: this.sanitizeUser(updatedUser)
    };
  }

  // Determine employee role based on department and position
  determineEmployeeRole(department, position) {
    const roleMapping = {
      'Operations': {
        'Bank Officer': 'bank_officer',
        'Senior Bank Officer': 'senior_bank_officer',
        'Branch Manager': 'branch_manager'
      },
      'Compliance': {
        'Compliance Officer': 'compliance_officer',
        'Senior Compliance Officer': 'senior_compliance_officer',
        'Compliance Manager': 'compliance_manager'
      },
      'Risk Management': {
        'Risk Analyst': 'risk_analyst',
        'Risk Manager': 'risk_manager'
      },
      'IT': {
        'System Administrator': 'system_admin',
        'Developer': 'developer',
        'IT Manager': 'it_manager'
      }
    };

    return roleMapping[department]?.[position] || 'employee';
  }

  // Login
  async login(email, password) {
    await this.initializeDatabase();
    
    // Find user by email
    const user = await db.queryOne(`
      SELECT id, email, password_hash, first_name, last_name, role, status, email_verified
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}. Please contact administrator.`);
    }
    console.log(user);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login and create session record
    await db.transaction(async (tx) => {
      // Update last login time
      await tx.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Create session record
      const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
      await tx.query(`
        INSERT INTO user_sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, tokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000)]);
    });

    // Get full user data for response (user.id is already the UUID from the first query)
    const fullUser = user;

    return {
      success: true,
      token,
      user: this.sanitizeUser(fullUser),
      expiresIn: '24h'
    };
  }

  // Get user by ID
  async getUserById(userId) {
    await this.initializeDatabase();
    
    const user = await db.queryOne(`
      SELECT id, email, username, first_name, last_name, role, status, email_verified,
             employee_id, department, position, created_at, updated_at, last_login_at,
             address, occupation, annual_income, kyc_status, account_number
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    return user ? this.sanitizeUser(user) : null;
  }

  // Get users (admin only)
  async getUsers(filters = {}, requestingUserId) {
    await this.initializeDatabase();
    
    // Verify requesting user has permission
    const requestingUser = await db.queryOne(
      'SELECT id, role FROM users WHERE id = $1',
      [requestingUserId]
    );
    
    if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
      throw new Error('Insufficient permissions');
    }

    // Build query with filters
    let query = `
      SELECT id, email, username, first_name, last_name, role, status, email_verified,
             employee_id, department, position, created_at, updated_at, last_login_at,
             address, occupation, annual_income, kyc_status, account_number
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(filters.department);
    }

    query += ' ORDER BY created_at DESC';

    const users = await db.queryMany(query, params);
    return users.map(u => this.sanitizeUser(u));
  }

  // Update user status
  async updateUserStatus(userId, newStatus, requestingUserId) {
    await this.initializeDatabase();
    
    // Verify requesting user has permission
    const requestingUser = await db.queryOne(
      'SELECT id, role FROM users WHERE id = $1',
      [requestingUserId]
    );
    
    if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
      throw new Error('Insufficient permissions');
    }

    const validStatuses = ['active', 'inactive', 'suspended', 'pending_approval', 'pending_verification'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    // Update user status
    const updatedUser = await db.queryOne(`
      UPDATE users 
      SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE id = $3
      RETURNING id, email, first_name, last_name, role, status, email_verified, 
                employee_id, department, position, updated_at
    `, [newStatus, requestingUserId, userId]);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: `User status updated to ${newStatus}`,
      user: this.sanitizeUser(updatedUser)
    };
  }

  // Sanitize user data (remove sensitive information)
  sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, password, ...sanitizedUser } = user;
    
    // Convert snake_case to camelCase for consistency
    if (sanitizedUser.first_name) {
      sanitizedUser.firstName = sanitizedUser.first_name;
      delete sanitizedUser.first_name;
    }
    if (sanitizedUser.last_name) {
      sanitizedUser.lastName = sanitizedUser.last_name;
      delete sanitizedUser.last_name;
    }
    if (sanitizedUser.phone_number) {
      sanitizedUser.phoneNumber = sanitizedUser.phone_number;
      delete sanitizedUser.phone_number;
    }
    if (sanitizedUser.date_of_birth) {
      sanitizedUser.dateOfBirth = sanitizedUser.date_of_birth;
      delete sanitizedUser.date_of_birth;
    }
    if (sanitizedUser.email_verified !== undefined) {
      sanitizedUser.emailVerified = sanitizedUser.email_verified;
      delete sanitizedUser.email_verified;
    }
    if (sanitizedUser.employee_id) {
      sanitizedUser.employeeId = sanitizedUser.employee_id;
      delete sanitizedUser.employee_id;
    }
    if (sanitizedUser.start_date) {
      sanitizedUser.startDate = sanitizedUser.start_date;
      delete sanitizedUser.start_date;
    }
    if (sanitizedUser.annual_income) {
      sanitizedUser.annualIncome = sanitizedUser.annual_income;
      delete sanitizedUser.annual_income;
    }
    if (sanitizedUser.identification_number) {
      sanitizedUser.identificationNumber = sanitizedUser.identification_number;
      delete sanitizedUser.identification_number;
    }
    if (sanitizedUser.identification_type) {
      sanitizedUser.identificationType = sanitizedUser.identification_type;
      delete sanitizedUser.identification_type;
    }
    if (sanitizedUser.kyc_status) {
      sanitizedUser.kycStatus = sanitizedUser.kyc_status;
      delete sanitizedUser.kyc_status;
    }
    if (sanitizedUser.account_number) {
      sanitizedUser.accountNumber = sanitizedUser.account_number;
      delete sanitizedUser.account_number;
    }
    if (sanitizedUser.admin_level) {
      sanitizedUser.adminLevel = sanitizedUser.admin_level;
      delete sanitizedUser.admin_level;
    }
    if (sanitizedUser.created_at) {
      sanitizedUser.createdAt = sanitizedUser.created_at;
      delete sanitizedUser.created_at;
    }
    if (sanitizedUser.updated_at) {
      sanitizedUser.updatedAt = sanitizedUser.updated_at;
      delete sanitizedUser.updated_at;
    }
    if (sanitizedUser.last_login_at) {
      sanitizedUser.lastLoginAt = sanitizedUser.last_login_at;
      delete sanitizedUser.last_login_at;
    }
    if (sanitizedUser.approved_at) {
      sanitizedUser.approvedAt = sanitizedUser.approved_at;
      delete sanitizedUser.approved_at;
    }
    if (sanitizedUser.created_by) {
      sanitizedUser.createdBy = sanitizedUser.created_by;
      delete sanitizedUser.created_by;
    }
    if (sanitizedUser.updated_by) {
      sanitizedUser.updatedBy = sanitizedUser.updated_by;
      delete sanitizedUser.updated_by;
    }
    if (sanitizedUser.approved_by) {
      sanitizedUser.approvedBy = sanitizedUser.approved_by;
      delete sanitizedUser.approved_by;
    }
    
    // Parse JSON fields
    if (typeof sanitizedUser.address === 'string') {
      try {
        sanitizedUser.address = JSON.parse(sanitizedUser.address);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    if (typeof sanitizedUser.permissions === 'string') {
      try {
        sanitizedUser.permissions = JSON.parse(sanitizedUser.permissions);
      } catch (e) {
        sanitizedUser.permissions = [];
      }
    }
    
    return sanitizedUser;
  }

  // Reset password request
  async requestPasswordReset(email) {
    await this.initializeDatabase();
    
    // Find user by email (don't reveal if email exists)
    const user = await db.queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (user) {
      // Generate reset token
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      await db.query(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, token, expiresAt]);
      
      // Get full user data for email
      const fullUser = await db.queryOne(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [user.id]
      );
      
      // Send password reset email
      try {
        await emailService.sendPasswordReset(fullUser, token);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
        return{
          success: false,
          message: 'Email service error'
        }
      }
      
      return {
        success: true,
        message: 'Password reset link has been sent to your email.',
        resetToken: token // In production, this would not be returned
      };
    }
    
    // Don't reveal if email exists
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    await this.initializeDatabase();
    
    // Find the reset token
    const resetToken = await db.queryOne(`
      SELECT rt.*, u.id as user_id, u.email
      FROM password_reset_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.used_at IS NULL
    `, [token]);
    
    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    if (new Date() > resetToken.expires_at) {
      throw new Error('Reset token has expired');
    }

    // Validate new password
    const passwordSchema = Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required();

    const { error } = passwordSchema.validate(newPassword);
    if (error) {
      throw new Error('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and mark token as used in a transaction
    await db.transaction(async (tx) => {
      // Update user password
      await tx.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, resetToken.user_id]
      );

      // Mark token as used
      await tx.query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
      );

      // Invalidate all user sessions (force re-login)
      await tx.query(
        'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1',
        [resetToken.user_id]
      );
    });

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }
}

module.exports = { AuthModule };
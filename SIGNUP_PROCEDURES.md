# Banking System Signup Procedures

This document outlines the comprehensive signup procedures for employees, admins, and customers in the Banking Process Automation System.

## Overview

The system supports three types of user registrations with comprehensive email verification:
1. **Customer Signup** - For bank customers (email verification → active)
2. **Employee Signup** - For bank employees (email verification → admin approval → active)
3. **Admin Signup** - For system administrators (requires existing admin privileges)

Each user type has different validation requirements, approval processes, and access levels. All signups include automated email notifications for verification and status updates.

## Current Implementation Status

✅ **Implemented Features:**
- Complete authentication system with PostgreSQL database
- Multi-tier user registration (customer, employee, admin)
- Email verification system with token management
- Password reset functionality
- Admin approval workflow for employees
- Role-based access control
- Comprehensive input validation
- Rate limiting and security measures
- Audit logging for all authentication events

✅ **Database Schema:**
- Users table with comprehensive fields
- Email verification tokens table
- Password reset tokens table
- User sessions table for JWT management
- Proper indexing and constraints

✅ **Email System:**
- Development mode (console logging)
- Production SMTP support
- Gmail integration
- Professional email templates
- Token expiration handling

## API Endpoints

### Base URL
```
POST /api/auth/signup/{userType}
```

### Available Endpoints
- `POST /api/auth/signup/customer` - Customer registration
- `POST /api/auth/signup/employee` - Employee registration  
- `POST /api/auth/signup/admin` - Admin registration (requires admin privileges)
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/users/:userId/approve` - Approve user (admin only)
- `GET /api/auth/pending-approvals` - Get pending approvals (admin only)

## 1. Customer Signup

### Endpoint
```
POST /api/auth/signup/customer
```

### Request Body
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "occupation": "Software Engineer",
  "annualIncome": 75000,
  "identificationNumber": "123-45-6789",
  "identificationType": "ssn"
}
```

### Validation Rules
- **Email**: Valid email format, unique
- **Password**: Minimum 8 characters, must contain:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character (!@#$%^&*)
- **Phone**: Valid international format
- **Date of Birth**: Must be in the past
- **Annual Income**: Positive number
- **Identification Type**: One of: `ssn`, `passport`, `driver_license`, `national_id`

### Process Flow
1. **Registration** → Customer submits signup form
2. **Validation** → System validates all required fields
3. **Database Storage** → User data stored with `pending_verification` status
4. **Email Verification** → Automated verification email sent to customer
5. **Email Confirmation** → Customer clicks verification link
6. **Account Activation** → Status changes to `active`, welcome email sent
7. **KYC Process** → Customer completes Know Your Customer verification
8. **Account Opening** → Bank account created after KYC approval

### Email Notifications
- **Verification Email**: Sent immediately after registration with 24-hour expiry
- **Welcome Email**: Sent after successful email verification
- **Password Reset**: Available for account recovery

### Response
```json
{
  "success": true,
  "message": "Customer registration successful. Please check your email for verification.",
  "userId": "uuid-here",
  "verificationToken": "verification-token",
  "status": "pending_verification"
}
```

## 2. Employee Signup

### Endpoint
```
POST /api/auth/signup/employee
```

### Request Body
```json
{
  "email": "employee@bank.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1985-03-20",
  "employeeId": "EMP001",
  "department": "Operations",
  "position": "Bank Officer",
  "managerId": "9b7d088b-0f76-499f-94cc-15611ab400ec",
  "startDate": "2024-01-15"
}
```

**Note:** The `managerId` field is optional and should be a valid UUID of an existing user if provided. You can omit this field or set it to `null` if the employee doesn't have a manager yet.

### Validation Rules
- All basic validation rules apply
- **Employee ID**: Required, unique
- **Department**: Required
- **Position**: Required
- **Manager ID**: Optional, must be a valid UUID of an existing user if provided
- **Start Date**: Required

### Process Flow
1. **Registration** → Employee submits signup form
2. **Validation** → System validates all required fields
3. **Database Storage** → User data stored with `pending_approval` status
4. **Email Verification** → Automated verification email sent to employee
5. **Email Confirmation** → Employee clicks verification link (email verified but still pending approval)
6. **Admin Approval** → Admin reviews and approves the employee account
7. **Role Assignment** → System assigns role based on department/position
8. **Approval Notification** → Automated email sent confirming account activation
9. **Account Activation** → Employee can access system

### Email Notifications
- **Verification Email**: Sent immediately after registration with admin approval notice
- **Approval Notification**: Sent after admin approves the account with login instructions
- **Password Reset**: Available for account recovery

### Role Assignment Logic
Based on department and position:

**Operations Department:**
- Bank Officer → `bank_officer`
- Senior Bank Officer → `senior_bank_officer`
- Branch Manager → `branch_manager`

**Compliance Department:**
- Compliance Officer → `compliance_officer`
- Senior Compliance Officer → `senior_compliance_officer`
- Compliance Manager → `compliance_manager`

**Risk Management:**
- Risk Analyst → `risk_analyst`
- Risk Manager → `risk_manager`

**IT Department:**
- System Administrator → `system_admin`
- Developer → `developer`
- IT Manager → `it_manager`

### Response
```json
{
  "success": true,
  "message": "Employee registration submitted successfully. Please wait for admin approval and check your email for verification.",
  "userId": "uuid-here",
  "verificationToken": "verification-token",
  "status": "pending_approval"
}
```

## 3. Admin Signup

### Endpoint
```
POST /api/auth/signup/admin
```

### Authentication Required
- Must be authenticated as `super_admin` or `admin`
- Include JWT token in Authorization header: `Bearer <token>`

### Request Body
```json
{
  "email": "admin@bank.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Admin",
  "lastName": "User",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1980-05-10",
  "employeeId": "ADM001",
  "department": "IT",
  "adminLevel": "admin",
  "permissions": ["user_management", "system_config"]
}
```

### Admin Levels
- `super_admin`: Full system access
- `admin`: General administrative access
- `department_admin`: Department-specific admin access

### Process Flow
1. **Authorization Check** → Verify requesting user has admin privileges
2. **Registration** → Admin submits signup form for new admin
3. **Validation** → System validates all required fields
4. **Database Storage** → User data stored with `pending_approval` status
5. **Email Verification** → Automated verification email sent to new admin
6. **Email Confirmation** → New admin clicks verification link
7. **Account Activation** → New admin can access system

### Email Notifications
- **Verification Email**: Sent immediately after registration by existing admin
- **Welcome Email**: Sent after successful email verification
- **Password Reset**: Available for account recovery

### Response
```json
{
  "success": true,
  "message": "Admin registration submitted successfully. Please check your email for verification.",
  "userId": "uuid-here",
  "verificationToken": "verification-token",
  "status": "pending_approval"
}
```

## Email Verification System

### Email Service Configuration

The system includes a comprehensive email service that supports multiple providers:

#### Development Mode (Default)
- Emails are logged to console for testing
- No external email service required
- All email content is displayed in server logs

#### Production SMTP Configuration
Add these environment variables to `.env`:

```bash
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourbank.com
EMAIL_FROM_NAME=Your Bank Name
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

#### Gmail Configuration
```bash
# Gmail Configuration
EMAIL_PROVIDER=gmail
EMAIL_FROM=noreply@yourbank.com
EMAIL_FROM_NAME=Your Bank Name
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASSWORD=your-app-password
```

### Email Templates

The system includes professionally designed email templates for:

1. **Customer Verification Email**
   - Welcome message with account details
   - Verification button and backup link
   - 24-hour expiry notice
   - Security information

2. **Employee Verification Email**
   - Employee details and department info
   - Admin approval requirement notice
   - Verification button and backup link
   - Next steps instructions

3. **Employee Approval Notification**
   - Congratulations message
   - Account activation confirmation
   - Login instructions and capabilities
   - Support contact information

4. **Password Reset Email**
   - Security notice and instructions
   - Reset button and backup link
   - 1-hour expiry notice
   - Password requirements

5. **Welcome Email**
   - Account activation confirmation
   - Available features overview
   - Login button and instructions
   - Support information

### Login Interface

The system includes a comprehensive login interface that provides:

**Features:**
- **User Type Tabs**: Switch between Customer, Employee, and Admin login modes
- **Demo Accounts**: Pre-filled demo credentials for easy testing in development
- **Password Visibility Toggle**: Show/hide password functionality
- **Remember Me**: Persistent login sessions using localStorage
- **Forgot Password**: Direct link to password reset functionality
- **Real-time Validation**: Client-side form validation with user feedback
- **Role-based Redirects**: Automatic redirection based on user role after login
- **Account Status Handling**: Contextual messages for pending verification/approval

**Demo Accounts (Development Mode):**
- **Admin**: admin@bank.com / Admin@123
- **Customer**: customer@example.com / Customer@123  
- **Employee**: employee@bank.com / Employee@123

**Login Flow:**
1. User selects account type (Customer/Employee/Admin)
2. User enters credentials or clicks demo account to auto-fill
3. System validates credentials and account status
4. JWT token generated and stored (localStorage or sessionStorage)
5. User redirected to appropriate dashboard based on role
6. Session management handles token expiration and refresh

### Email Verification URLs

- **Login Page**: `http://localhost:3000/login`
- **Verification Page**: `http://localhost:3000/verify-email?token=<TOKEN>`
- **Password Reset Page**: `http://localhost:3000/reset-password?token=<TOKEN>`

### Password Reset Interface

The system includes a user-friendly password reset interface that:
- Validates the reset token from the URL
- Provides real-time password strength validation
- Shows password requirements with visual feedback
- Confirms password match before submission
- Handles expired tokens gracefully
- Redirects to login after successful reset

**Password Requirements:**
- Minimum 8 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- Passwords must match

### Testing Login Functionality

Use the test script to verify login functionality:

```bash
npm run test:login
```

This comprehensive test will:
- Test admin login with valid credentials
- Test login with invalid credentials
- Test login with non-existent user
- Test token validation with protected endpoints
- Test different user types (customer, employee, admin)
- Test missing field validation
- Test account status handling

### Testing Email Verification

Use the test script to verify email functionality:

```bash
npm run test:email
```

This comprehensive test will:
- Test customer signup with email verification
- Test employee signup with email verification
- Test admin login and employee approval process
- Test password reset email flow
- Test email template rendering
- Test invalid token handling

### Test Results

The test script provides detailed output showing:
- ✅ Successful operations
- 📧 Email notifications that would be sent
- 🔗 Verification tokens (in development mode)
- ⏳ Status updates and workflow progression
- ❌ Error handling for invalid inputs

## Database Schema

### Users Table

The system uses a comprehensive PostgreSQL schema with the following key tables:

**users** - Main user table with:
- UUID primary key
- Personal information (name, phone, date of birth)
- Authentication data (email, password hash)
- Role and status management
- Employee-specific fields (employee ID, department, position)
- Customer-specific fields (address, occupation, income, KYC status)
- Admin-specific fields (admin level, permissions)
- Audit fields (created/updated timestamps, approval tracking)

**email_verification_tokens** - Email verification management:
- Token generation and expiration
- Token type support (email verification, password reset)
- Usage tracking

**password_reset_tokens** - Password reset functionality:
- Secure token generation
- Expiration handling
- One-time use enforcement

**user_sessions** - JWT session management:
- Token hash storage
- Session tracking
- IP and user agent logging

### User Roles and Statuses

**User Roles:**
- `customer` - Bank customers
- `employee` - General employees
- `bank_officer` - Bank officers
- `senior_bank_officer` - Senior bank officers
- `branch_manager` - Branch managers
- `compliance_officer` - Compliance officers
- `senior_compliance_officer` - Senior compliance officers
- `compliance_manager` - Compliance managers
- `risk_analyst` - Risk analysts
- `risk_manager` - Risk managers
- `system_admin` - System administrators
- `developer` - Developers
- `it_manager` - IT managers
- `department_admin` - Department administrators
- `admin` - General administrators
- `super_admin` - Super administrators

**User Statuses:**
- `pending_verification` - Email verification required
- `pending_approval` - Admin approval required
- `active` - User can access the system
- `inactive` - User account disabled
- `suspended` - User account temporarily suspended
- `locked` - User account locked

## Additional Authentication Endpoints

### Login
```
POST /api/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Email Verification
```
POST /api/auth/verify-email
```

```json
{
  "token": "verification-token"
}
```

### Password Reset Request
```
POST /api/auth/password-reset/request
```

```json
{
  "email": "user@example.com"
}
```

### Password Reset Confirmation
```
POST /api/auth/password-reset/confirm
```

```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!"
}
```

## Admin Management Endpoints

### Get All Users (Admin Only)
```
GET /api/auth/users?role=customer&status=active&department=Operations
```

### Approve User (Admin Only)
```
POST /api/auth/users/{userId}/approve
```

### Update User Status (Admin Only)
```
PUT /api/auth/users/{userId}/status
```

```json
{
  "status": "active"
}
```

### Get Pending Approvals (Admin Only)
```
GET /api/auth/pending-approvals
```

## User Statuses

- `pending_verification`: Email verification required
- `pending_approval`: Admin approval required
- `active`: User can access the system
- `inactive`: User account disabled
- `suspended`: User account temporarily suspended

## Security Features

### Rate Limiting
- **Signup**: 3 attempts per hour
- **Login**: 5 attempts per 15 minutes
- **Password Reset**: 5 attempts per 15 minutes

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

### Token Security
- JWT tokens with 24-hour expiration
- Secure token refresh mechanism
- Role-based access control

## Error Handling

### Common Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "error": "Validation error: Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

**User Already Exists (400)**
```json
{
  "success": false,
  "error": "User with this email already exists",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

**Insufficient Permissions (403)**
```json
{
  "success": false,
  "error": "Insufficient permissions to create admin account",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

**Rate Limit Exceeded (429)**
```json
{
  "error": "Too many signup attempts, please try again later"
}
```

## Testing the Signup Procedures

### 1. Test Customer Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "firstName": "Test",
    "lastName": "Customer",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-15",
    "address": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345",
      "country": "USA"
    },
    "occupation": "Tester",
    "annualIncome": 50000,
    "identificationNumber": "123-45-6789",
    "identificationType": "ssn"
  }'
```

### 2. Test Employee Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup/employee \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testemployee@bank.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "firstName": "Test",
    "lastName": "Employee",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1985-03-20",
    "employeeId": "EMP999",
    "department": "Operations",
    "position": "Bank Officer",
    "startDate": "2024-01-15"
  }'
```

### 3. Test Admin Login and Admin Creation
```bash
# First login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bank.com",
    "password": "Admin@123"
  }'

# Then create new admin (use token from login response)
curl -X POST http://localhost:3000/api/auth/signup/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newadmin@bank.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "firstName": "New",
    "lastName": "Admin",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1980-05-10",
    "employeeId": "ADM999",
    "department": "IT",
    "adminLevel": "admin"
  }'
```

## Integration with Existing Modules

The authentication system integrates with:
- **KYC Module**: Customer verification process
- **Account Opening Module**: Account creation after KYC
- **Audit Service**: All authentication events are logged
- **Health Monitor**: Authentication service health monitoring

## Next Steps

1. **Database Integration**: Replace in-memory storage with PostgreSQL
2. **Email Service**: Implement actual email sending for verification
3. **SMS Verification**: Add phone number verification
4. **Two-Factor Authentication**: Implement 2FA for enhanced security
5. **LDAP Integration**: Connect with corporate directory services
6. **Audit Logging**: Enhanced audit trails for compliance
# Banking Process Automation System

A comprehensive banking process automation platform that automates critical banking operations including account opening, loan processing, KYC/AML compliance, transaction processing, payment handling, and user authentication with email verification.

## Features

### Core Banking Modules
- **Account Opening Module**: Automates customer onboarding and account creation
- **Loan Processing Module**: Handles automated loan application processing and credit assessment
- **KYC Module**: Customer identity verification and due diligence with document processing
- **AML Module**: Anti-money laundering monitoring and reporting
- **Transaction Processing Module**: Automated transaction validation and processing
- **Payment Processing Module**: Automated payment order processing and settlement with multi-currency support
- **Audit Module**: Comprehensive audit trails and regulatory reporting

### Authentication & User Management
- **Multi-tier User System**: Support for customers, employees, and administrators
- **Email Verification**: Automated email verification for all user types
- **Role-Based Access Control**: Granular permissions based on user roles
- **Password Reset**: Secure password reset flow with email notifications
- **Admin Approval Workflow**: Employee and admin accounts require approval

### Infrastructure & Services
- **PostgreSQL Database**: Robust data persistence with migrations
- **Email Service**: Comprehensive email notifications (development and production modes)
- **Health Monitoring**: Real-time health checks and service discovery
- **Circuit Breaker Pattern**: Resilient external service integration
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete audit trail for compliance

## Architecture

The system follows a microservices architecture with:
- **API Gateway**: Centralized routing with authentication and rate limiting
- **Service Registry**: Dynamic service discovery and health monitoring
- **Database Layer**: PostgreSQL with connection pooling
- **External Service Integration**: Credit bureaus, payment networks, government databases
- **Document Processing**: OCR and document authentication

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v15 or higher (or use Docker)
- **Redis**: v7 or higher (optional, for caching)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd banking-process-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example .env file
   cp .env.example .env
   
   # Edit .env with your configuration
   # Minimum required:
   # - DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
   # - JWT_SECRET (for production)
   ```

4. **Start with Docker (Recommended)**
   ```bash
   # Start all services (PostgreSQL, Redis, Mock Services, Application)
   docker-compose up -d
   
   # View logs
   docker-compose logs -f banking-app
   ```

5. **Or start manually**
   ```bash
   # Make sure PostgreSQL is running
   # The application will automatically run migrations on startup
   
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health
   - Signup Demo: http://localhost:3000/signup-demo

### Default Users

The system creates default users on first run:

**Admin Account**
- Email: `admin@bank.com`
- Password: `Admin@123`
- Role: Administrator

**Bank Officer Account**
- Email: `officer@bank.com`
- Password: `Officer@123`
- Role: Bank Officer

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test email verification flow
npm run test:email

# Test signup procedures
npm run test:signup
```

## API Endpoints

### Authentication
- `POST /api/auth/signup/customer` - Customer registration
- `POST /api/auth/signup/employee` - Employee registration
- `POST /api/auth/signup/admin` - Admin registration (requires admin token)
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/users/:userId/approve` - Approve user (admin only)
- `GET /api/auth/pending-approvals` - Get pending approvals (admin only)

### Banking Operations
- `POST /api/accounts/open` - Open new account
- `GET /api/accounts/status/:applicationId` - Get account status
- `POST /api/loans/apply` - Submit loan application
- `GET /api/loans/status/:applicationId` - Get loan status
- `POST /api/kyc/verify` - Perform KYC verification
- `POST /api/aml/screen` - Screen transaction for AML
- `POST /api/transactions/process` - Process transaction
- `POST /api/payments/process` - Process payment
- `GET /api/audit/logs` - Get audit logs (admin only)

### Monitoring
- `GET /health` - Simple health check
- `GET /health/detailed` - Detailed health report
- `GET /services` - Service discovery
- `GET /circuit-breakers` - Circuit breaker status

## Project Structure

```
banking-process-automation/
├── src/
│   ├── config/                 # Configuration management
│   │   ├── business-rules/     # Business rule configurations
│   │   ├── environments/       # Environment-specific configs
│   │   ├── database.js
│   │   ├── env-loader.js
│   │   └── index.js
│   ├── database/               # Database layer
│   │   └── connection.js       # PostgreSQL connection pool
│   ├── gateway/                # API Gateway
│   │   └── api-gateway.js      # Routing, auth, rate limiting
│   ├── modules/                # Business modules
│   │   ├── account-opening/
│   │   ├── aml/
│   │   ├── audit/
│   │   ├── auth/               # Authentication module
│   │   ├── kyc/
│   │   ├── loan-processing/
│   │   ├── payment-processing/
│ 
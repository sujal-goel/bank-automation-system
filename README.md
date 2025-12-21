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
   - Signup Demo: http://localhost:3000/api/auth/signup
   - Email Verification: http://localhost:3000/api/auth/verify-email?token=TOKEN
   - Password Reset: http://localhost:3000/api/auth/reset-password?token=TOKEN

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

# Test password reset flow
npm run test:password-reset
```

## API Endpoints

### Authentication
- `POST /api/auth/api/auth/signup/customer` - Customer registration
- `POST /api/auth/api/auth/signup/employee` - Employee registration
- `POST /api/auth/api/auth/signup/admin` - Admin registration (requires admin token)
- `POST /api/auth/login` - User login
- `POST /api/auth/api/auth/verify-email` - Email verification
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
│   │   └── transaction-processing/
│   ├── services/               # Shared services
│   │   ├── audit-service.js
│   │   ├── circuit-breaker.js
│   │   ├── credit-bureau-*.js
│   │   ├── document-*.js
│   │   ├── email-service.js
│   │   ├── health-monitor.js
│   │   ├── identity-validator.js
│   │   ├── notification-service.js
│   │   ├── ocr-engine.js
│   │   ├── payment-*.js
│   │   └── regulatory-reporting.js
│   ├── shared/                 # Shared utilities
│   │   ├── interfaces.js
│   │   ├── types.js
│   │   └── validation.js
│   ├── __tests__/              # Test files
│   └── index.js                # Application entry point
├── database/
│   └── migrations/             # Database migrations
│       └── 001_create_users_table.sql
├── k8s/                        # Kubernetes manifests
├── public/                     # Static files
│   ├── signup.html
│   └── verify-email.html
├── scripts/                    # Utility scripts
│   ├── deploy.sh
│   ├── setup-dev.ps1
│   └── setup-dev.sh
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Application container
├── package.json
└── README.md
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_automation
DB_USERNAME=banking_user
DB_PASSWORD=your_password
DB_SSL=false

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-secret-key-change-in-production
BCRYPT_ROUNDS=12

# Email Configuration (optional for development)
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourbank.com
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Email Service

The system supports multiple email configurations:

**Development Mode** (default)
- Emails are logged to console
- No external service required

**Production SMTP**
- Configure SMTP settings in `.env`
- Supports any SMTP provider

**Gmail**
- Set `EMAIL_PROVIDER=gmail`
- Use app-specific password

See [SIGNUP_PROCEDURES.md](SIGNUP_PROCEDURES.md) for detailed email configuration.

## Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n banking-automation

# View logs
kubectl logs -f deployment/banking-app-deployment -n banking-automation
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

## Security

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **JWT Authentication**: 24-hour token expiration
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Access Control**: Granular permissions
- **Email Verification**: Required for all accounts
- **Admin Approval**: Required for employee and admin accounts
- **Audit Logging**: Complete audit trail for compliance

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide
- [SIGNUP_PROCEDURES.md](SIGNUP_PROCEDURES.md) - Authentication and signup procedures
- API Documentation: http://localhost:3000/api-docs

## Development

### Running in Development Mode

```bash
# Start with auto-reload
npm run dev

# Run tests in watch mode
npm run test:watch
```

### Database Migrations

Migrations run automatically on application startup. To run manually:

```bash
# Migrations are in database/migrations/
# They execute in order based on filename
```

### Adding New Modules

1. Create module directory in `src/modules/`
2. Implement module class with required methods
3. Register routes in `src/gateway/api-gateway.js`
4. Add tests in `src/__tests__/`

## Monitoring

### Health Checks

```bash
# Simple health check
curl http://localhost:3000/health

# Detailed health report
curl http://localhost:3000/health/detailed

# Service discovery
curl http://localhost:3000/services

# Circuit breaker status
curl http://localhost:3000/circuit-breakers
```

### Logs

Application logs include:
- Request/response logging
- Authentication events
- Database queries (in development)
- Email notifications
- Error tracking
- Audit events

## License

MIT

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Review the API documentation
- Check the deployment guide
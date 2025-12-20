# Banking Process Automation System

A comprehensive banking process automation platform that automates critical banking operations including account opening, loan processing, KYC/AML compliance, transaction processing, and payment handling.

## Architecture

The system follows a microservices architecture with the following modules:

- **Account Opening Module**: Automates customer onboarding and account creation
- **Loan Processing Module**: Handles automated loan application processing and credit assessment
- **KYC Module**: Customer identity verification and due diligence
- **AML Module**: Anti-money laundering monitoring and reporting
- **Transaction Processing Module**: Automated transaction validation and processing
- **Payment Processing Module**: Automated payment order processing and settlement
- **Audit Module**: Comprehensive audit trails and regulatory reporting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

The system exposes REST APIs through an API Gateway:

- `/api/accounts` - Account Opening operations
- `/api/loans` - Loan Processing operations
- `/api/kyc` - KYC verification operations
- `/api/aml` - AML screening operations
- `/api/transactions` - Transaction processing operations
- `/api/payments` - Payment processing operations
- `/api/audit` - Audit and compliance operations

## Project Structure

```
src/
├── gateway/           # API Gateway
├── modules/           # Business modules
│   ├── account-opening/
│   ├── loan-processing/
│   ├── kyc/
│   ├── aml/
│   ├── transaction-processing/
│   ├── payment-processing/
│   └── audit/
├── services/          # Shared services
├── shared/            # Shared types and interfaces
└── test-setup.js      # Test configuration
```

## Development Status

This project is currently under development. Modules will be implemented incrementally following the implementation plan in `.kiro/specs/banking-process-automation/tasks.md`.
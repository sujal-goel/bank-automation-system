# PowerShell Development Startup Script for Banking Process Automation System

Write-Host "=== Banking Process Automation System - Development Setup ===" -ForegroundColor Cyan
Write-Host "Starting development environment..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    # Check if Node.js is installed
    Write-Host "`n1. Checking Node.js installation..." -ForegroundColor Yellow
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    }
    Write-Host "   ✅ Node.js version: $nodeVersion" -ForegroundColor Green

    # Check if npm is available
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "npm is not available"
    }
    Write-Host "   ✅ npm version: $npmVersion" -ForegroundColor Green

    # Install dependencies if node_modules doesn't exist
    if (!(Test-Path "node_modules")) {
        Write-Host "`n2. Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
        Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "`n2. Dependencies already installed" -ForegroundColor Green
    }

    # Check if .env file exists
    Write-Host "`n3. Checking environment configuration..." -ForegroundColor Yellow
    if (!(Test-Path ".env")) {
        Write-Host "   ⚠️  .env file not found. Creating default .env file..." -ForegroundColor Yellow
        
        $defaultEnv = @"
# Banking Process Automation System - Development Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_automation_dev
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=development-jwt-secret-change-in-production

# Email Configuration (Development Mode)
EMAIL_PROVIDER=development
EMAIL_FROM=noreply@bankingsystem.dev
EMAIL_FROM_NAME=Banking System

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=development-session-secret

# Logging
LOG_LEVEL=debug
"@
        
        $defaultEnv | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "   ✅ Default .env file created" -ForegroundColor Green
    } else {
        Write-Host "   ✅ .env file found" -ForegroundColor Green
    }

    # Validate configuration
    Write-Host "`n4. Validating configuration..." -ForegroundColor Yellow
    npm run config:validate
    if ($LASTEXITCODE -ne 0) {
        throw "Configuration validation failed"
    }
    Write-Host "   ✅ Configuration is valid" -ForegroundColor Green

    # Display available commands
    Write-Host "`n=== Development Environment Ready ===" -ForegroundColor Green
    Write-Host "`nAvailable Commands:" -ForegroundColor Cyan
    Write-Host "  npm run dev              - Start development server with auto-reload" -ForegroundColor White
    Write-Host "  npm start                - Start production server" -ForegroundColor White
    Write-Host "  npm test                 - Run test suite" -ForegroundColor White
    Write-Host "  npm run test:login       - Test login functionality" -ForegroundColor White
    Write-Host "  npm run test:signup      - Test signup procedures" -ForegroundColor White
    Write-Host "  npm run test:email       - Test email verification" -ForegroundColor White
    Write-Host "  npm run test:password-reset - Test password reset" -ForegroundColor White
    Write-Host "  npm run health:check     - Check application health" -ForegroundColor White

    Write-Host "`nApplication URLs:" -ForegroundColor Cyan
    Write-Host "  Main Application: http://localhost:3000" -ForegroundColor White
    Write-Host "  Login Page:       http://localhost:3000/login" -ForegroundColor White
    Write-Host "  Signup Demo:      http://localhost:3000/signup-demo" -ForegroundColor White
    Write-Host "  Health Check:     http://localhost:3000/health" -ForegroundColor White
    Write-Host "  API Docs:         http://localhost:3000/api-docs" -ForegroundColor White

    Write-Host "`nDemo Accounts:" -ForegroundColor Cyan
    Write-Host "  Admin:    admin@bank.com / Admin@123" -ForegroundColor White
    Write-Host "  Customer: customer@example.com / Customer@123" -ForegroundColor White
    Write-Host "  Employee: employee@bank.com / Employee@123" -ForegroundColor White

    Write-Host "`n🚀 Ready to start development!" -ForegroundColor Green
    Write-Host "Run 'npm run dev' to start the development server" -ForegroundColor Yellow

} catch {
    Write-Host "`n❌ Setup Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease resolve the error and run the setup again." -ForegroundColor Yellow
    exit 1
}
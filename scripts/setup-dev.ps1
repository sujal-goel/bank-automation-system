# Banking Process Automation System - Development Environment Setup (Windows)
# This script sets up the development environment on Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipDb,
    [switch]$SkipDeps,
    [switch]$Reset,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Help function
function Show-Help {
    Write-Host @"
Banking Process Automation System - Development Setup (Windows)

This script sets up the development environment including:
- Node.js dependencies
- Environment configuration
- Database setup
- Docker containers for external services
- Development tools

Usage: .\setup-dev.ps1 [OPTIONS]

OPTIONS:
    -Help           Show this help message
    -SkipDocker     Skip Docker container setup
    -SkipDb         Skip database setup
    -SkipDeps       Skip dependency installation
    -Reset          Reset all data and start fresh

"@
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Info "Setting up Banking Process Automation System development environment"

# Change to project root
Set-Location $ProjectRoot

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Error "Node.js version 18 or later is required (current: $nodeVersion)"
        exit 1
    }
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Error "Node.js is required but not installed"
    Write-Info "Please install Node.js 18 or later from https://nodejs.org/"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm $npmVersion found"
} catch {
    Write-Error "npm is required but not installed"
    exit 1
}

# Check Docker (optional)
if (-not $SkipDocker) {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
        Write-Success "Docker and Docker Compose found"
    } catch {
        Write-Warning "Docker or Docker Compose not found. Skipping Docker setup."
        $SkipDocker = $true
    }
}

Write-Success "Prerequisites check completed"

# Reset if requested
if ($Reset) {
    Write-Info "Resetting development environment..."
    
    # Stop and remove Docker containers
    if (-not $SkipDocker) {
        try {
            docker-compose down -v
        } catch {
            Write-Warning "Failed to stop Docker containers"
        }
    }
    
    # Remove node_modules
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
    }
    
    # Remove logs and temp files
    @("logs", "temp", "uploads") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item -Recurse -Force $_
        }
    }
    
    Write-Success "Environment reset completed"
}

# Install dependencies
if (-not $SkipDeps) {
    Write-Info "Installing Node.js dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Create environment file
Write-Info "Setting up environment configuration..."

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.sample") {
        Copy-Item ".env.sample" ".env"
        Write-Success "Created .env file from .env.sample"
    } else {
        # Create basic .env file
        $envContent = @"
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_automation_dev
DB_USERNAME=banking_user
DB_PASSWORD=banking_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=development-jwt-secret-change-in-production

# Postman API (if available)
POSTMAN_API_KEY=$env:POSTMAN_API_KEY
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Success "Created basic .env file"
    }
} else {
    Write-Info ".env file already exists"
}

# Create necessary directories
Write-Info "Creating necessary directories..."
@("logs", "temp", "uploads", "mock-services\mappings", "mock-services\files") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Success "Directories created"

# Setup Docker containers
if (-not $SkipDocker) {
    Write-Info "Setting up Docker containers for external services..."
    
    # Create docker-compose override for development
    if (-not (Test-Path "docker-compose.override.yml")) {
        $overrideContent = @"
version: '3.8'
services:
  banking-app:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
"@
        Set-Content -Path "docker-compose.override.yml" -Value $overrideContent
        Write-Success "Created docker-compose.override.yml"
    }
    
    # Start containers
    Write-Info "Starting Docker containers..."
    docker-compose up -d postgres redis mock-services
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker containers started successfully"
        
        # Wait for services to be ready
        Write-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 10
    } else {
        Write-Warning "Some Docker containers may not have started properly"
    }
}

# Setup database
if (-not $SkipDb) {
    Write-Info "Setting up database..."
    
    # Wait for PostgreSQL to be ready
    if (-not $SkipDocker) {
        Write-Info "Waiting for PostgreSQL to be ready..."
        for ($i = 1; $i -le 30; $i++) {
            try {
                docker-compose exec -T postgres pg_isready -U banking_user -d banking_automation_dev | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    break
                }
            } catch {
                # Continue waiting
            }
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Success "Database setup completed"
}

# Setup mock services
Write-Info "Setting up mock external services..."

# Create basic mock service mappings
if (-not (Test-Path "mock-services\mappings")) {
    New-Item -ItemType Directory -Path "mock-services\mappings" -Force | Out-Null
}

# CIBIL Mock
$cibilMock = @"
{
  "request": {
    "method": "POST",
    "urlPath": "/cibil/credit-score"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "creditScore": 750,
      "status": "success",
      "reportDate": "{{now format='yyyy-MM-dd'}}"
    }
  }
}
"@
Set-Content -Path "mock-services\mappings\cibil.json" -Value $cibilMock

# Government Database Mock
$aadhaarMock = @"
{
  "request": {
    "method": "POST",
    "urlPath": "/aadhaar/verify"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "verified": true,
      "status": "success",
      "timestamp": "{{now}}"
    }
  }
}
"@
Set-Content -Path "mock-services\mappings\aadhaar.json" -Value $aadhaarMock

Write-Success "Mock services configured"

# Create development scripts
Write-Info "Creating development scripts..."

# Create start script
$startScript = @"
# Banking Process Automation System - Start Development
Write-Host "Starting Banking Process Automation System in development mode..." -ForegroundColor Green

# Start external services
docker-compose up -d postgres redis mock-services

# Wait for services
Start-Sleep -Seconds 5

# Start the application
npm run dev
"@
Set-Content -Path "scripts\start-dev.ps1" -Value $startScript

# Create test script
$testScript = @"
# Banking Process Automation System - Run Tests
Write-Host "Running tests in development environment..." -ForegroundColor Green

# Ensure test database is ready
`$env:NODE_ENV = "test"

# Run tests
npm test
"@
Set-Content -Path "scripts\test-dev.ps1" -Value $testScript

Write-Success "Development scripts created"

# Display final information
Write-Success "Development environment setup completed!"

Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Review and update .env file with your configuration"
Write-Host "  2. Start the development server:"
Write-Host "     npm run dev"
Write-Host "     OR"
Write-Host "     .\scripts\start-dev.ps1"
Write-Host ""
Write-Host "  3. Run tests:"
Write-Host "     npm test"
Write-Host "     OR"
Write-Host "     .\scripts\test-dev.ps1"
Write-Host ""
Write-Host "  4. Access the application:"
Write-Host "     - API: http://localhost:3000"
Write-Host "     - Health: http://localhost:3000/health"
Write-Host "     - API Docs: http://localhost:3000/api-docs"

if (-not $SkipDocker) {
    Write-Host ""
    Write-Host "  Docker services:"
    Write-Host "     - PostgreSQL: localhost:5432"
    Write-Host "     - Redis: localhost:6379"
    Write-Host "     - Mock Services: localhost:4001-4023"
}

Write-Host ""
Write-Info "Happy coding! 🚀"
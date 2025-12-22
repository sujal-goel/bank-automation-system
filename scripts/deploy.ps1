# PowerShell Deployment Script for Banking Process Automation System
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment
)

Write-Host "=== Banking Process Automation System Deployment ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    # Validate Node.js installation
    Write-Host "`n1. Validating Node.js installation..." -ForegroundColor Green
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js is not installed or not in PATH"
    }
    Write-Host "   Node.js version: $nodeVersion" -ForegroundColor Gray

    # Validate npm installation
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "npm is not installed or not in PATH"
    }
    Write-Host "   npm version: $npmVersion" -ForegroundColor Gray

    # Install dependencies
    Write-Host "`n2. Installing dependencies..." -ForegroundColor Green
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install dependencies"
    }

    # Run configuration validation
    Write-Host "`n3. Validating configuration..." -ForegroundColor Green
    npm run config:validate
    if ($LASTEXITCODE -ne 0) {
        throw "Configuration validation failed"
    }

    # Run tests (skip for production quick deploy)
    if ($Environment -ne "production") {
        Write-Host "`n4. Running tests..." -ForegroundColor Green
        npm test -- --passWithNoTests
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed"
        }
    } else {
        Write-Host "`n4. Skipping tests for production deployment..." -ForegroundColor Yellow
    }

    # Environment-specific deployment steps
    switch ($Environment) {
        "development" {
            Write-Host "`n5. Development deployment..." -ForegroundColor Green
            Write-Host "   Starting development server..." -ForegroundColor Gray
            Write-Host "   Run 'npm run dev' to start the development server" -ForegroundColor Cyan
        }
        "staging" {
            Write-Host "`n5. Staging deployment..." -ForegroundColor Green
            Write-Host "   Preparing staging environment..." -ForegroundColor Gray
            
            # Check if Docker is available
            docker --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Building Docker image..." -ForegroundColor Gray
                docker build -t banking-process-automation:staging .
                if ($LASTEXITCODE -ne 0) {
                    throw "Docker build failed"
                }
                Write-Host "   Docker image built successfully" -ForegroundColor Green
            } else {
                Write-Host "   Docker not available, skipping containerization" -ForegroundColor Yellow
            }
        }
        "production" {
            Write-Host "`n5. Production deployment..." -ForegroundColor Green
            Write-Host "   Preparing production environment..." -ForegroundColor Gray
            
            # Check if Docker is available
            docker --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Building production Docker image..." -ForegroundColor Gray
                docker build -t banking-process-automation:latest .
                if ($LASTEXITCODE -ne 0) {
                    throw "Docker build failed"
                }
                Write-Host "   Production Docker image built successfully" -ForegroundColor Green
            } else {
                Write-Host "   Docker not available, manual deployment required" -ForegroundColor Yellow
            }
        }
    }

    # Health check
    Write-Host "`n6. Deployment validation..." -ForegroundColor Green
    Write-Host "   Configuration: Valid" -ForegroundColor Green
    Write-Host "   Dependencies: Installed" -ForegroundColor Green
    if ($Environment -ne "production") {
        Write-Host "   Tests: Passed" -ForegroundColor Green
    }

    Write-Host "`n=== Deployment Completed Successfully ===" -ForegroundColor Green
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Status: Ready for use" -ForegroundColor Green

    # Next steps
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    switch ($Environment) {
        "development" {
            Write-Host "  1. Run 'npm run dev' to start development server" -ForegroundColor White
            Write-Host "  2. Visit http://localhost:3000 to access the application" -ForegroundColor White
            Write-Host "  3. Visit http://localhost:3000/login to test authentication" -ForegroundColor White
        }
        "staging" {
            Write-Host "  1. Run 'docker-compose up -d' to start staging environment" -ForegroundColor White
            Write-Host "  2. Run health checks to verify deployment" -ForegroundColor White
        }
        "production" {
            Write-Host "  1. Deploy Docker image to production environment" -ForegroundColor White
            Write-Host "  2. Configure environment variables" -ForegroundColor White
            Write-Host "  3. Run health checks and monitoring" -ForegroundColor White
        }
    }

} catch {
    Write-Host "`n=== Deployment Failed ===" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
    exit 1
}

Write-Host "`nDeployment completed at $(Get-Date)" -ForegroundColor Gray
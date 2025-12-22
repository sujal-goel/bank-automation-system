# PowerShell System Test Script for Banking Process Automation

Write-Host "=== Banking System Test Suite ===" -ForegroundColor Cyan
Write-Host "Running comprehensive system tests..." -ForegroundColor Green

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

function Test-Command {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PASSED: $Name" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "❌ FAILED: $Name (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            $script:testsFailed++
        }
    } catch {
        Write-Host "❌ FAILED: $Name (Exception: $($_.Exception.Message))" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Test Node.js and npm
Test-Command -Name "Node.js Installation" -Command "node --version" -Description "Check if Node.js is installed"
Test-Command -Name "npm Installation" -Command "npm --version" -Description "Check if npm is available"

# Test configuration
Test-Command -Name "Configuration Validation" -Command "npm run config:validate" -Description "Validate application configuration"

# Test authentication system
Test-Command -Name "Login System Test" -Command "npm run test:login" -Description "Test login functionality and authentication"
Test-Command -Name "Signup System Test" -Command "npm run test:signup" -Description "Test user registration system"
Test-Command -Name "Email Verification Test" -Command "npm run test:email" -Description "Test email verification system"
Test-Command -Name "Password Reset Test" -Command "npm run test:password-reset" -Description "Test password reset functionality"

# Test application health (if server is running)
Write-Host "`nTesting Application Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    if ($response) {
        Write-Host "✅ PASSED: Application Health Check" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Gray
        $testsPassed++
    }
} catch {
    Write-Host "⚠️  SKIPPED: Application Health Check (Server not running)" -ForegroundColor Yellow
    Write-Host "   Start server with 'npm run dev' to test health endpoint" -ForegroundColor Gray
}

# Summary
Write-Host "`n=== Test Results Summary ===" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 All tests passed! System is ready for use." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run setup:quick' for development setup" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Visit http://localhost:3000/login to test the application" -ForegroundColor White
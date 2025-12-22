# Banking Process Automation System - Run Tests
Write-Host "Running tests in development environment..." -ForegroundColor Green

# Ensure test database is ready
$env:NODE_ENV = "test"

# Run tests
npm test

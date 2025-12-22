# Banking Process Automation System - Start Development
Write-Host "Starting Banking Process Automation System in development mode..." -ForegroundColor Green

# Start external services
docker-compose up -d postgres redis mock-services

# Wait for services
Start-Sleep -Seconds 5

# Start the application
npm run dev

#!/bin/bash

# Banking Process Automation System - Development Environment Setup
# This script sets up the development environment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Banking Process Automation System - Development Setup

This script sets up the development environment including:
- Node.js dependencies
- Environment configuration
- Database setup
- Docker containers for external services
- Development tools

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    --skip-docker       Skip Docker container setup
    --skip-db           Skip database setup
    --skip-deps         Skip dependency installation
    --reset             Reset all data and start fresh

EOF
}

# Parse command line arguments
SKIP_DOCKER=false
SKIP_DB=false
SKIP_DEPS=false
RESET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --reset)
            RESET=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

log_info "Setting up Banking Process Automation System development environment"

# Change to project root
cd "$PROJECT_ROOT"

# Check prerequisites
log_info "Checking prerequisites..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is required but not installed"
    log_info "Please install Node.js 18 or later from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    log_error "Node.js version 18 or later is required (current: $(node --version))"
    exit 1
fi

# Check npm
if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is required but not installed"
    exit 1
fi

# Check Docker (optional)
if [[ "$SKIP_DOCKER" == false ]]; then
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found. Skipping Docker setup."
        SKIP_DOCKER=true
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_warning "Docker Compose not found. Skipping Docker setup."
        SKIP_DOCKER=true
    fi
fi

log_success "Prerequisites check completed"

# Reset if requested
if [[ "$RESET" == true ]]; then
    log_info "Resetting development environment..."
    
    # Stop and remove Docker containers
    if [[ "$SKIP_DOCKER" == false ]]; then
        docker-compose down -v || true
    fi
    
    # Remove node_modules
    rm -rf node_modules
    
    # Remove logs and temp files
    rm -rf logs temp uploads
    
    log_success "Environment reset completed"
fi

# Install dependencies
if [[ "$SKIP_DEPS" == false ]]; then
    log_info "Installing Node.js dependencies..."
    npm install
    log_success "Dependencies installed"
fi

# Create environment file
log_info "Setting up environment configuration..."

if [[ ! -f ".env" ]]; then
    if [[ -f ".env.sample" ]]; then
        cp .env.sample .env
        log_success "Created .env file from .env.sample"
    else
        # Create basic .env file
        cat > .env << EOF
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
POSTMAN_API_KEY=${POSTMAN_API_KEY:-}
EOF
        log_success "Created basic .env file"
    fi
else
    log_info ".env file already exists"
fi

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p logs temp uploads mock-services/mappings mock-services/files
log_success "Directories created"

# Setup Docker containers
if [[ "$SKIP_DOCKER" == false ]]; then
    log_info "Setting up Docker containers for external services..."
    
    # Create docker-compose override for development
    if [[ ! -f "docker-compose.override.yml" ]]; then
        cat > docker-compose.override.yml << EOF
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
EOF
        log_success "Created docker-compose.override.yml"
    fi
    
    # Start containers
    log_info "Starting Docker containers..."
    docker-compose up -d postgres redis mock-services
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker containers started successfully"
    else
        log_warning "Some Docker containers may not have started properly"
    fi
fi

# Setup database
if [[ "$SKIP_DB" == false ]]; then
    log_info "Setting up database..."
    
    # Wait for PostgreSQL to be ready
    if [[ "$SKIP_DOCKER" == false ]]; then
        log_info "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if docker-compose exec -T postgres pg_isready -U banking_user -d banking_automation_dev >/dev/null 2>&1; then
                break
            fi
            sleep 2
        done
    fi
    
    # Run database migrations (if they exist)
    if [[ -d "database/migrations" ]]; then
        log_info "Running database migrations..."
        # Add migration command here when available
        # npm run migrate
    fi
    
    log_success "Database setup completed"
fi

# Setup mock services
log_info "Setting up mock external services..."

# Create basic mock service mappings
mkdir -p mock-services/mappings

# CIBIL Mock
cat > mock-services/mappings/cibil.json << 'EOF'
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
EOF

# Government Database Mock
cat > mock-services/mappings/aadhaar.json << 'EOF'
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
EOF

log_success "Mock services configured"

# Create development scripts
log_info "Creating development scripts..."

# Create start script
cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Banking Process Automation System in development mode..."

# Start external services
docker-compose up -d postgres redis mock-services

# Wait for services
sleep 5

# Start the application
npm run dev
EOF

chmod +x scripts/start-dev.sh

# Create test script
cat > scripts/test-dev.sh << 'EOF'
#!/bin/bash
echo "Running tests in development environment..."

# Ensure test database is ready
export NODE_ENV=test

# Run tests
npm test
EOF

chmod +x scripts/test-dev.sh

log_success "Development scripts created"

# Final setup
log_info "Performing final setup..."

# Install git hooks (if .git exists)
if [[ -d ".git" ]]; then
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Run linting
npm run lint 2>/dev/null || echo "Linting not configured"

# Run tests
npm test

echo "Pre-commit checks completed"
EOF
    chmod +x .git/hooks/pre-commit
    log_success "Git hooks installed"
fi

# Display final information
log_success "Development environment setup completed!"

echo ""
log_info "Next steps:"
echo "  1. Review and update .env file with your configuration"
echo "  2. Start the development server:"
echo "     npm run dev"
echo "     OR"
echo "     ./scripts/start-dev.sh"
echo ""
echo "  3. Run tests:"
echo "     npm test"
echo "     OR"
echo "     ./scripts/test-dev.sh"
echo ""
echo "  4. Access the application:"
echo "     - API: http://localhost:3000"
echo "     - Health: http://localhost:3000/health"
echo "     - API Docs: http://localhost:3000/api-docs"

if [[ "$SKIP_DOCKER" == false ]]; then
    echo ""
    echo "  Docker services:"
    echo "     - PostgreSQL: localhost:5432"
    echo "     - Redis: localhost:6379"
    echo "     - Mock Services: localhost:4001-4023"
fi

echo ""
log_info "Happy coding! 🚀"
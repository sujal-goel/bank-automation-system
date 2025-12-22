#!/bin/bash

# Banking Process Automation System Deployment Script
# This script handles deployment to different environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="banking-process-automation"
REGISTRY_URL="${REGISTRY_URL:-localhost:5000}"

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
Banking Process Automation System Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment
    production      Deploy to production environment

OPTIONS:
    -h, --help      Show this help message
    -v, --version   Specify image version (default: latest)
    -r, --registry  Specify container registry URL
    -n, --namespace Specify Kubernetes namespace
    --skip-build    Skip Docker image build
    --skip-tests    Skip running tests before deployment
    --dry-run       Show what would be deployed without actually deploying

EXAMPLES:
    $0 development
    $0 production --version v1.2.3
    $0 staging --registry myregistry.com --namespace banking-staging
    $0 production --dry-run

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERSION="latest"
NAMESPACE=""
SKIP_BUILD=false
SKIP_TESTS=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY_URL="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

# Set default namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    case $ENVIRONMENT in
        development)
            NAMESPACE="banking-automation-dev"
            ;;
        staging)
            NAMESPACE="banking-automation-staging"
            ;;
        production)
            NAMESPACE="banking-automation"
            ;;
    esac
fi

# Full image name
FULL_IMAGE_NAME="${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"

log_info "Starting deployment to $ENVIRONMENT environment"
log_info "Image: $FULL_IMAGE_NAME"
log_info "Namespace: $NAMESPACE"

# Change to project root
cd "$PROJECT_ROOT"

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed"; exit 1; }

# Check if environment configuration exists
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" && "$ENVIRONMENT" != "development" ]]; then
    log_warning "Environment file $ENV_FILE not found"
fi

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" == false ]]; then
    log_info "Running tests..."
    npm test || {
        log_error "Tests failed"
        exit 1
    }
    log_success "Tests passed"
fi

# Build Docker image (unless skipped)
if [[ "$SKIP_BUILD" == false ]]; then
    log_info "Building Docker image..."
    docker build -t "$FULL_IMAGE_NAME" . || {
        log_error "Docker build failed"
        exit 1
    }
    log_success "Docker image built successfully"
    
    # Push to registry (except for development)
    if [[ "$ENVIRONMENT" != "development" ]]; then
        log_info "Pushing image to registry..."
        docker push "$FULL_IMAGE_NAME" || {
            log_error "Failed to push image to registry"
            exit 1
        }
        log_success "Image pushed to registry"
    fi
fi

# Deploy based on environment
case $ENVIRONMENT in
    development)
        deploy_development
        ;;
    staging|production)
        deploy_kubernetes
        ;;
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

log_success "Deployment to $ENVIRONMENT completed successfully!"

# Deployment functions
deploy_development() {
    log_info "Deploying to development environment using Docker Compose..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute: docker-compose up -d"
        return
    fi
    
    # Use docker-compose for development
    docker-compose down || true
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log_success "Application is healthy"
    else
        log_warning "Application health check failed"
    fi
}

deploy_kubernetes() {
    log_info "Deploying to Kubernetes environment..."
    
    # Create namespace if it doesn't exist
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_info "Creating namespace: $NAMESPACE"
        if [[ "$DRY_RUN" == false ]]; then
            kubectl create namespace "$NAMESPACE"
        fi
    fi
    
    # Apply Kubernetes manifests
    K8S_FILES=(
        "k8s/namespace.yaml"
        "k8s/configmap.yaml"
        "k8s/secrets.yaml"
        "k8s/pvc.yaml"
        "k8s/statefulset.yaml"
        "k8s/deployment.yaml"
        "k8s/service.yaml"
    )
    
    for file in "${K8S_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            log_info "Applying $file..."
            if [[ "$DRY_RUN" == true ]]; then
                kubectl apply -f "$file" --namespace="$NAMESPACE" --dry-run=client
            else
                kubectl apply -f "$file" --namespace="$NAMESPACE"
            fi
        else
            log_warning "Kubernetes manifest not found: $file"
        fi
    done
    
    if [[ "$DRY_RUN" == false ]]; then
        # Wait for deployment to be ready
        log_info "Waiting for deployment to be ready..."
        kubectl rollout status deployment/banking-app-deployment --namespace="$NAMESPACE" --timeout=300s
        
        # Health check
        log_info "Performing health check..."
        kubectl wait --for=condition=ready pod -l app=banking-process-automation --namespace="$NAMESPACE" --timeout=300s
        
        log_success "Kubernetes deployment completed"
    else
        log_info "DRY RUN: Kubernetes manifests validated successfully"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Set trap for cleanup on exit
trap cleanup EXIT
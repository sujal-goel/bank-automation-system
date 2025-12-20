# Banking Process Automation System - Deployment Guide

This guide provides comprehensive instructions for deploying the Banking Process Automation System across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Development Deployment](#development-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18 or later
- **npm**: Version 9 or later
- **Docker**: Version 20.10 or later (for containerized deployment)
- **Docker Compose**: Version 2.0 or later (for local development)
- **kubectl**: Version 1.25 or later (for Kubernetes deployment)
- **PostgreSQL**: Version 15 or later (if not using Docker)
- **Redis**: Version 7 or later (if not using Docker)

### System Requirements

#### Development Environment
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Disk: 10GB free space

#### Production Environment
- CPU: 4 cores minimum (8 cores recommended)
- RAM: 8GB minimum (16GB recommended)
- Disk: 100GB free space (SSD recommended)

## Configuration

### Environment Variables

The system uses environment-based configuration. Create appropriate `.env` files for each environment:

#### Development (.env or .env.development)
```bash
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
JWT_SECRET=development-jwt-secret
```

#### Production (.env.production)
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database (use actual production values)
DB_HOST=prod-postgres.example.com
DB_PORT=5432
DB_NAME=banking_automation
DB_USERNAME=banking_prod_user
DB_PASSWORD=<secure-password>
DB_SSL=true

# Redis
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# Security
JWT_SECRET=<generate-secure-secret>
BCRYPT_ROUNDS=14

# External Services
CIBIL_API_URL=https://api.cibil.com
CIBIL_API_KEY=<your-api-key>
# ... (add all external service configurations)
```

### Configuration Validation

Validate your configuration before deployment:

```bash
npm run config:validate
```

## Development Deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd banking-process-automation
   ```

2. **Run setup script**
   ```bash
   npm run setup:dev
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

### Manual Setup

If you prefer manual setup:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.sample .env
   # Edit .env with your configuration
   ```

3. **Start external services (Docker)**
   ```bash
   docker-compose up -d postgres redis mock-services
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

### Accessing the Application

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs
- **Service Discovery**: http://localhost:3000/services

## Docker Deployment

### Building the Docker Image

```bash
# Build the image
npm run docker:build

# Or manually
docker build -t banking-process-automation:latest .
```

### Running with Docker Compose

#### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f banking-app

# Stop services
docker-compose down
```

#### Production Environment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale banking-app=3

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Rebuild and restart
docker-compose up -d --build
```

## Kubernetes Deployment

### Prerequisites

1. **Kubernetes cluster** (v1.25+)
2. **kubectl** configured to access your cluster
3. **Container registry** access (Docker Hub, ECR, GCR, etc.)

### Deployment Steps

#### 1. Build and Push Image

```bash
# Build image
docker build -t <registry>/banking-process-automation:v1.0.0 .

# Push to registry
docker push <registry>/banking-process-automation:v1.0.0
```

#### 2. Update Kubernetes Manifests

Edit `k8s/deployment.yaml` to use your image:

```yaml
spec:
  containers:
  - name: banking-app
    image: <registry>/banking-process-automation:v1.0.0
```

#### 3. Configure Secrets

Update `k8s/secrets.yaml` with base64-encoded values:

```bash
# Encode secrets
echo -n "your-secret" | base64

# Update secrets.yaml with encoded values
```

#### 4. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply all manifests
kubectl apply -f k8s/

# Or use npm script
npm run k8s:deploy
```

#### 5. Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n banking-automation

# Check pods
kubectl get pods -n banking-automation

# Check services
kubectl get services -n banking-automation

# View logs
kubectl logs -f deployment/banking-app-deployment -n banking-automation
```

### Using Deployment Script

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Deploy with specific version
bash scripts/deploy.sh production --version v1.2.3

# Dry run (validate without deploying)
bash scripts/deploy.sh production --dry-run
```

### Scaling

```bash
# Scale deployment
kubectl scale deployment banking-app-deployment --replicas=5 -n banking-automation

# Auto-scaling (HPA)
kubectl autoscale deployment banking-app-deployment \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n banking-automation
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/banking-app-deployment \
  banking-app=<registry>/banking-process-automation:v1.1.0 \
  -n banking-automation

# Check rollout status
kubectl rollout status deployment/banking-app-deployment -n banking-automation

# Rollback if needed
kubectl rollout undo deployment/banking-app-deployment -n banking-automation
```

## Monitoring and Logging

### Health Checks

```bash
# Simple health check
curl http://localhost:3000/health

# Detailed health report
curl http://localhost:3000/health/detailed

# Using npm script
npm run health:check
```

### Prometheus Metrics

Access Prometheus at:
- Development: http://localhost:9090
- Production: Configure ingress/load balancer

### Grafana Dashboards

Access Grafana at:
- Development: http://localhost:3001
- Default credentials: admin/admin123

### Viewing Logs

#### Docker
```bash
# View application logs
docker-compose logs -f banking-app

# View all logs
docker-compose logs -f
```

#### Kubernetes
```bash
# View pod logs
kubectl logs -f deployment/banking-app-deployment -n banking-automation

# View logs from specific pod
kubectl logs -f <pod-name> -n banking-automation

# View logs from all pods
kubectl logs -f -l app=banking-process-automation -n banking-automation
```

### Log Aggregation

Logs are structured in JSON format for easy aggregation:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/accounts/open",
  "statusCode": 200,
  "duration": "125ms"
}
```

## Troubleshooting

### Common Issues

#### Application Won't Start

1. **Check configuration**
   ```bash
   npm run config:validate
   ```

2. **Check logs**
   ```bash
   docker-compose logs banking-app
   # or
   kubectl logs deployment/banking-app-deployment -n banking-automation
   ```

3. **Verify environment variables**
   ```bash
   # In container
   docker-compose exec banking-app env | grep NODE_ENV
   ```

#### Database Connection Issues

1. **Check database is running**
   ```bash
   docker-compose ps postgres
   # or
   kubectl get pods -l component=database -n banking-automation
   ```

2. **Test connection**
   ```bash
   docker-compose exec postgres pg_isready -U banking_user
   ```

3. **Check credentials**
   - Verify DB_USERNAME and DB_PASSWORD in .env or secrets

#### External Service Failures

1. **Check circuit breaker status**
   ```bash
   curl http://localhost:3000/circuit-breakers
   ```

2. **Verify service configuration**
   - Check external service URLs and API keys
   - Test connectivity to external services

#### Performance Issues

1. **Check resource usage**
   ```bash
   # Docker
   docker stats

   # Kubernetes
   kubectl top pods -n banking-automation
   ```

2. **Review metrics**
   - Access Prometheus: http://localhost:9090
   - Check CPU, memory, and request latency

3. **Scale if needed**
   ```bash
   # Kubernetes
   kubectl scale deployment banking-app-deployment --replicas=5 -n banking-automation
   ```

### Getting Help

For additional support:
1. Check application logs
2. Review health check endpoints
3. Consult API documentation at `/api-docs`
4. Contact the development team

## Security Considerations

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Enable SSL/TLS for all connections
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Review and update security headers
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use secrets management (Vault, AWS Secrets Manager, etc.)

### Secrets Management

Never commit secrets to version control. Use:
- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Environment variables (for development only)

## Backup and Recovery

### Database Backup

```bash
# Docker
docker-compose exec postgres pg_dump -U banking_user banking_automation > backup.sql

# Kubernetes
kubectl exec -it postgres-statefulset-0 -n banking-automation -- \
  pg_dump -U banking_user banking_automation > backup.sql
```

### Restore Database

```bash
# Docker
docker-compose exec -T postgres psql -U banking_user banking_automation < backup.sql

# Kubernetes
kubectl exec -i postgres-statefulset-0 -n banking-automation -- \
  psql -U banking_user banking_automation < backup.sql
```

## Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update to latest versions
npm install <package>@latest
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback
```

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Contact the development team
- Review the API documentation
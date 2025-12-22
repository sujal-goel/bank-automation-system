# PowerShell Commands for Banking Process Automation System

This document provides PowerShell-native commands to avoid WSL path translation errors on Windows systems.

## 🚀 **Quick Start Commands**

### **Setup and Development**
```powershell
# Quick development setup (recommended)
npm run setup:quick

# Full development setup
npm run setup:dev

# Start development server
npm run dev

# Start production server
npm run start:prod
```

### **Testing Commands**
```powershell
# Run all system tests
npm run test:system

# Individual test suites
npm run test:login          # Test login functionality
npm run test:signup         # Test signup procedures  
npm run test:email          # Test email verification
npm run test:password-reset # Test password reset

# Standard Jest tests
npm test                    # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
```

### **Deployment Commands**
```powershell
# Deploy to different environments
npm run deploy:dev          # Development deployment
npm run deploy:staging      # Staging deployment
npm run deploy:prod         # Production deployment
```

### **Utility Commands**
```powershell
# Health and monitoring
npm run health:check        # Check application health
npm run config:validate     # Validate configuration

# Maintenance
npm run clean              # Clean node_modules and logs
npm run logs               # View application logs

# Docker operations
npm run docker:build       # Build Docker image
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers
npm run docker:logs        # View Docker logs
```

## 🔧 **Troubleshooting WSL Errors**

If you encounter WSL path translation errors like:
```
WSL (20) ERROR: CreateProcessParseCommon:711: Failed to translate C:\Users\...
```

**Solution**: Use the PowerShell commands instead of bash commands:

### **Before (WSL/Bash - causes errors)**
```bash
bash scripts/deploy.sh production
curl -f http://localhost:3000/health
```

### **After (PowerShell - works correctly)**
```powershell
npm run deploy:prod
npm run health:check
```

## 📋 **Available Scripts Overview**

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm run setup:quick` | Quick development setup | Development |
| `npm run setup:dev` | Full development setup | Development |
| `npm run dev` | Start development server | Development |
| `npm start` | Start production server | Production |
| `npm run start:dev` | Start dev server with banner | Development |
| `npm run start:prod` | Start prod server with banner | Production |
| `npm run deploy:dev` | Deploy to development | Development |
| `npm run deploy:staging` | Deploy to staging | Staging |
| `npm run deploy:prod` | Deploy to production | Production |
| `npm run test:system` | Run comprehensive system tests | All |
| `npm run test:login` | Test authentication system | All |
| `npm run test:signup` | Test user registration | All |
| `npm run test:email` | Test email verification | All |
| `npm run test:password-reset` | Test password reset | All |
| `npm run health:check` | Check application health | All |
| `npm run config:validate` | Validate configuration | All |
| `npm run clean` | Clean dependencies and logs | All |
| `npm run logs` | View application logs | All |

## 🌐 **Application URLs**

After starting the server, access these URLs:

- **Main Application**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Signup Demo**: http://localhost:3000/signup-demo
- **Password Reset**: http://localhost:3000/reset-password
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs

## 👤 **Demo Accounts**

Use these accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bank.com | Admin@123 |
| Customer | customer@example.com | Customer@123 |
| Employee | employee@bank.com | Employee@123 |

## 🔐 **Security Notes**

- All PowerShell scripts use `-ExecutionPolicy Bypass` for development convenience
- Change default passwords and secrets before production deployment
- Review `.env` file configuration for your environment
- Enable proper authentication and authorization in production

## 📝 **Development Workflow**

1. **Initial Setup**:
   ```powershell
   npm run setup:quick
   ```

2. **Start Development**:
   ```powershell
   npm run dev
   ```

3. **Run Tests**:
   ```powershell
   npm run test:system
   ```

4. **Deploy**:
   ```powershell
   npm run deploy:dev
   ```

## 🆘 **Getting Help**

If you encounter issues:

1. **Check System Requirements**:
   ```powershell
   node --version  # Should be v16+ 
   npm --version   # Should be v8+
   ```

2. **Validate Configuration**:
   ```powershell
   npm run config:validate
   ```

3. **Run System Tests**:
   ```powershell
   npm run test:system
   ```

4. **Check Application Health**:
   ```powershell
   npm run health:check
   ```

This PowerShell-native approach eliminates WSL path translation issues and provides a smooth development experience on Windows systems.
# Vercel + Supabase Deployment Guide

This guide will help you deploy the Banking Process Automation System to Vercel using Supabase as the PostgreSQL database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **Node.js 18+**: For local development and testing

## Step 1: Set up Supabase Database

### 1.1 Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `banking-automation`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Database Connection Details

Once your project is created:

1. Go to **Settings** → **Database**
2. Copy the connection details:
   - **Host**: `db.[your-project-ref].supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: The password you set during project creation

3. Copy the **Connection string** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 1.3 Configure Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL to create the initial schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Insert initial admin user (optional)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@yourdomain.com',
    crypt('admin123', gen_salt('bf')),
    'System',
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave empty if code is in root)
   - **Build Command**: `npm run build` (or leave empty)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### 2.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Alternative Supabase variables
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Security
JWT_SECRET=[GENERATE-A-STRONG-SECRET-32-CHARS-MIN]
BCRYPT_ROUNDS=12

# CORS (add your frontend domains)
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
```

#### Optional Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
AUDIT_LOGGING=true

# Email (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Banking System <your-email@gmail.com>

# External Services
GOOGLE_TRANSLATE_API_KEY=[YOUR-API-KEY]
AWS_ACCESS_KEY_ID=[YOUR-ACCESS-KEY]
AWS_SECRET_ACCESS_KEY=[YOUR-SECRET-KEY]
```

### 2.3 Deploy

1. Click "Deploy" in Vercel
2. Wait for the deployment to complete
3. Your API will be available at `https://your-project.vercel.app`

## Step 3: Test the Deployment

### 3.1 Health Check

Test the health endpoint:

```bash
curl https://your-project.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "status": "healthy",
    "provider": "Supabase PostgreSQL"
  }
}
```

### 3.2 Database Connection Test

```bash
curl https://your-project.vercel.app/api/test/db
```

### 3.3 Run Migrations

If you have migration files, run them:

```bash
# Using Vercel CLI (install with: npm i -g vercel)
vercel env pull .env.local
npm run migrate
```

## Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update CORS_ORIGINS environment variable

## Step 5: Set up Monitoring

### 5.1 Vercel Analytics

1. Go to your project in Vercel dashboard
2. Click "Analytics" tab
3. Enable analytics to monitor performance

### 5.2 Supabase Monitoring

1. In Supabase dashboard, go to "Settings" → "API"
2. Monitor API usage and database performance
3. Set up alerts for high usage

## Troubleshooting

### Common Issues

#### 1. Database Connection Timeout

**Error**: `Connection timeout`

**Solution**:
- Check if DATABASE_URL is correct
- Ensure Supabase project is not paused
- Verify SSL settings (should be enabled)

#### 2. JWT Secret Error

**Error**: `JWT_SECRET must be set in production`

**Solution**:
- Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add it to Vercel environment variables

#### 3. CORS Errors

**Error**: `CORS policy blocked`

**Solution**:
- Add your frontend domain to CORS_ORIGINS
- Redeploy the application

#### 4. Cold Start Issues

**Issue**: First request is slow

**Solution**:
- This is normal for serverless functions
- Consider using Vercel's "Keep Warm" feature
- Optimize database connection pooling

### Debugging

#### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View function logs
vercel logs [deployment-url]
```

#### Local Testing with Production Environment

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Start local development
npm run dev
```

## Performance Optimization

### 1. Database Optimization

- Use connection pooling (already configured)
- Add database indexes for frequently queried fields
- Use read replicas for read-heavy operations

### 2. Vercel Optimization

- Enable Edge Functions for static content
- Use Vercel's Image Optimization
- Configure proper caching headers

### 3. Code Optimization

- Minimize cold start time
- Use lazy loading for heavy modules
- Implement proper error handling

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Database password is secure
- [ ] CORS origins are properly configured
- [ ] SSL is enabled for database connections
- [ ] Environment variables are not exposed in client-side code
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] Audit logging is enabled

## Maintenance

### Regular Tasks

1. **Monitor Performance**: Check Vercel Analytics weekly
2. **Database Maintenance**: Monitor Supabase usage and performance
3. **Security Updates**: Keep dependencies updated
4. **Backup**: Supabase handles backups, but consider additional backups for critical data
5. **Log Review**: Review application logs for errors and performance issues

### Scaling Considerations

- **Database**: Supabase scales automatically, but monitor connection limits
- **Vercel**: Functions scale automatically, but monitor usage limits
- **External Services**: Monitor API rate limits and costs

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Documentation**: 
  - [Vercel Docs](https://vercel.com/docs)
  - [Supabase Docs](https://supabase.com/docs)

---

## Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema initialized
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables configured in Vercel
- [ ] Application deployed successfully
- [ ] Health check passes
- [ ] Database connection verified
- [ ] Custom domain configured (if needed)
- [ ] Monitoring set up
- [ ] Security checklist completed

Your Banking Process Automation System is now ready for production on Vercel with Supabase! 🚀
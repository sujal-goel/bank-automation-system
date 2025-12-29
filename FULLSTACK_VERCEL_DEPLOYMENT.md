# Full-Stack Banking App - Vercel Deployment Guide

This guide explains how to deploy the complete Banking Process Automation System (Next.js frontend + Node.js backend) to Vercel with Supabase.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Deployment                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)           │  Backend (Node.js)          │
│  ├── Pages & Components       │  ├── API Routes             │
│  ├── Static Assets           │  ├── Database Connection    │
│  ├── API Routes (optional)   │  ├── Authentication        │
│  └── Client-side Logic       │  └── Business Logic        │
├─────────────────────────────────────────────────────────────┤
│                    Supabase PostgreSQL                      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
banking-process-automation/
├── frontend/                 # Next.js frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── src/                     # Node.js backend
│   ├── index.js            # Main server file
│   ├── config/
│   ├── database/
│   └── ...
├── vercel.json             # Vercel configuration
├── package.json            # Root package.json
└── .env.vercel.example     # Environment variables template
```

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure your project structure matches the above**
2. **Commit all changes to your main branch**
3. **Push to GitHub**

### Step 2: Set up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your database credentials:**
   - Go to Settings → Database
   - Copy the connection string: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
3. **Initialize the database schema:**

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Other (Vercel will auto-detect Next.js and Node.js)
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: Leave empty (handled by vercel.json)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### Step 4: Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

#### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Frontend URLs (replace with your actual Vercel URL)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Security
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
BCRYPT_ROUNDS=12

# CORS (use your Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app
```

#### Optional Variables

```bash
# Supabase API Keys (for advanced features)
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Banking System <your-email@gmail.com>

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
AUDIT_LOGGING=true
```

### Step 5: Deploy

1. **Click "Deploy" in Vercel**
2. **Wait for the build to complete**
3. **Your app will be available at `https://your-project.vercel.app`**

## 🔗 URL Structure

After deployment, your app will have the following URL structure:

### Frontend (Next.js)
- **Homepage**: `https://your-app.vercel.app/`
- **Dashboard**: `https://your-app.vercel.app/dashboard`
- **Login**: `https://your-app.vercel.app/login`
- **Other pages**: `https://your-app.vercel.app/[page]`

### Backend API (Node.js)
- **Health Check**: `https://your-app.vercel.app/health`
- **API Documentation**: `https://your-app.vercel.app/api-docs`
- **Backend APIs**: `https://your-app.vercel.app/api/backend/[endpoint]`
- **Services**: `https://your-app.vercel.app/services`

### Frontend API Routes (if any)
- **Next.js API Routes**: `https://your-app.vercel.app/api/[route]`

## 🧪 Testing the Deployment

### 1. Test Frontend
```bash
curl https://your-app.vercel.app/
```

### 2. Test Backend Health
```bash
curl https://your-app.vercel.app/health
```

### 3. Test Backend API
```bash
curl https://your-app.vercel.app/api-docs
```

### 4. Test Database Connection
```bash
curl https://your-app.vercel.app/health/database
```

## 🔧 Local Development

### Setup for Local Development

1. **Clone the repository**
```bash
git clone <your-repo>
cd banking-process-automation
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Set up environment variables**
```bash
cp .env.vercel.example .env.local
# Edit .env.local with your local settings
```

4. **Start development servers**

**Option 1: Start both servers separately**
```bash
# Terminal 1: Start backend (port 3000)
npm run dev

# Terminal 2: Start frontend (port 3001)
cd frontend
npm run dev
```

**Option 2: Use concurrently (if configured)**
```bash
npm run dev:all
```

### Local URLs
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Backend Health**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api-docs

## 🔄 API Communication

### Frontend to Backend Communication

The frontend communicates with the backend through:

1. **Direct API calls** to `/api/backend/*` endpoints
2. **Health checks** to `/health`
3. **Service discovery** to `/services`

### Example API Call from Frontend

```javascript
// In your React components
const response = await fetch('/api/backend/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
});
```

## 🛠️ Configuration Details

### vercel.json Explanation

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"          // Builds Next.js frontend
    },
    {
      "src": "src/index.js",
      "use": "@vercel/node"          // Builds Node.js backend
    }
  ],
  "routes": [
    {
      "src": "/api/backend/(.*)",
      "dest": "/src/index.js"        // Route backend APIs to Node.js
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"         // Route everything else to Next.js
    }
  ]
}
```

### Next.js Configuration

The `frontend/next.config.js` handles:
- **API proxying** in development
- **Environment variables** for client-side
- **Security headers**
- **Image optimization**

## 🔒 Security Considerations

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets (32+ characters)
- ✅ Set proper CORS origins
- ✅ Use HTTPS in production (automatic with Vercel)

### Headers
- ✅ Security headers configured in Next.js
- ✅ CORS headers for API endpoints
- ✅ Content Security Policy

### Database
- ✅ SSL connections to Supabase
- ✅ Connection string security
- ✅ Proper authentication

## 📊 Monitoring & Debugging

### Vercel Analytics
1. Go to your project dashboard
2. Click "Analytics" tab
3. Monitor performance and usage

### Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View function logs
vercel logs https://your-app.vercel.app

# View specific function logs
vercel logs --since=1h
```

### Health Monitoring
- **Frontend Health**: Check if the homepage loads
- **Backend Health**: `GET /health`
- **Database Health**: `GET /health/database`
- **Detailed Health**: `GET /health/detailed`

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
**Error**: Build fails during deployment

**Solutions**:
- Check that both `package.json` files are valid
- Ensure all dependencies are listed
- Verify Next.js and Node.js versions are compatible

#### 2. API Routes Not Working
**Error**: 404 on `/api/backend/*` routes

**Solutions**:
- Verify `vercel.json` routing configuration
- Check that `src/index.js` exists and exports the Express app
- Ensure environment variables are set

#### 3. Database Connection Issues
**Error**: Database connection timeout

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure SSL is enabled

#### 4. CORS Errors
**Error**: CORS policy blocks requests

**Solutions**:
- Add your Vercel URL to `CORS_ORIGINS`
- Update Next.js configuration
- Redeploy after changes

### Debug Mode

Enable debug mode by setting:
```bash
DEBUG=true
VERBOSE_LOGGING=true
```

## 🔄 Updates and Redeployment

### Automatic Deployment
- **Push to main branch** → Automatic deployment
- **Pull request** → Preview deployment

### Manual Deployment
```bash
# Using Vercel CLI
vercel --prod

# Or trigger from GitHub
# Push to main branch
```

### Environment Variable Updates
1. Update in Vercel dashboard
2. Redeploy (automatic or manual)
3. Variables take effect immediately

## 📈 Performance Optimization

### Frontend Optimization
- ✅ Next.js automatic optimization
- ✅ Image optimization
- ✅ Code splitting
- ✅ Static generation where possible

### Backend Optimization
- ✅ Serverless function optimization
- ✅ Database connection pooling
- ✅ Response compression
- ✅ Caching headers

### Database Optimization
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Proper indexing
- ✅ Connection limits

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure monitoring** and alerts
3. **Set up CI/CD** for automated testing
4. **Implement backup** strategies
5. **Monitor performance** and optimize

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

Your full-stack Banking Process Automation System is now ready for production on Vercel! 🎉

**Frontend**: Next.js with React, Tailwind CSS, and modern UI components
**Backend**: Node.js with Express, JWT authentication, and comprehensive APIs
**Database**: Supabase PostgreSQL with automatic scaling
**Deployment**: Vercel with automatic deployments and global CDN
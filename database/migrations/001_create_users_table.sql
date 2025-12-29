-- Create users table for authentication system
-- Check if uuid-ossp extension exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
END $$;

-- Create enum types for user roles and statuses
CREATE TYPE user_role AS ENUM (
    'customer',
    'employee', 
    'bank_officer',
    'senior_bank_officer',
    'branch_manager',
    'compliance_officer',
    'senior_compliance_officer',
    'compliance_manager',
    'risk_analyst',
    'risk_manager',
    'system_admin',
    'developer',
    'it_manager',
    'department_admin',
    'admin',
    'super_admin'
);

CREATE TYPE user_status AS ENUM (
    'pending_verification',
    'pending_approval', 
    'active',
    'inactive',
    'suspended',
    'locked'
);

CREATE TYPE identification_type AS ENUM (
    'ssn',
    'passport',
    'driver_license',
    'national_id'
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    
    -- User Management
    role user_role NOT NULL DEFAULT 'customer',
    status user_status NOT NULL DEFAULT 'pending_verification',
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Employee specific fields
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES users(id),
    start_date DATE,
    
    -- Customer specific fields
    address JSONB,
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    identification_number VARCHAR(100),
    identification_type identification_type,
    kyc_status VARCHAR(50) DEFAULT 'pending',
    account_number VARCHAR(50) UNIQUE,
    
    -- Admin specific fields
    admin_level VARCHAR(50),
    permissions JSONB,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone_number ~* '^\+?[1-9]\d{1,14}$')
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    token_type VARCHAR(50) NOT NULL DEFAULT 'email_verification',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_token UNIQUE (user_id, token_type, token) DEFERRABLE INITIALLY DEFERRED
);

-- Create password reset tokens table  
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_reset_token UNIQUE (user_id, token) DEFERRABLE INITIALLY DEFERRED
);

-- Create user sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (only if not exists)
INSERT INTO users (
    email,
    username,
    password_hash,
    first_name,
    last_name,
    phone_number,
    date_of_birth,
    role,
    status,
    email_verified,
    employee_id,
    department,
    position
) 
SELECT 
    'admin@bank.com',
    'admin',
    '$2b$10$NgBFk85bNNrFBip3FfMkAOI7o4hcmgS6kyfvEmjem4Le.BEMERHk2', -- password: Admin@123
    'System',
    'Administrator',
    '+1234567890',
    '1980-01-01',
    'admin',
    'active',
    TRUE,
    'EMP001',
    'IT',
    'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@bank.com');

-- Insert default bank officer (only if not exists)
INSERT INTO users (
    email,
    username,
    password_hash,
    first_name,
    last_name,
    phone_number,
    date_of_birth,
    role,
    status,
    email_verified,
    employee_id,
    department,
    position
) 
SELECT 
    'officer@bank.com',
    'bank_officer',
    '$2b$10$Ep9ucX55VKod1jooeKvL2eY8uyh9JvYeWuaCH9XMxvtJsTgpnygjS', -- password: Officer@123
    'John',
    'Officer',
    '+1234567891',
    '1985-01-01',
    'bank_officer',
    'active',
    TRUE,
    'EMP002',
    'Operations',
    'Bank Officer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'officer@bank.com');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { AuthModule } = require('./index');
// We'll define these middleware functions here to avoid circular dependency
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'banking-system-secret-key';

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const router = express.Router();
const authModule = new AuthModule();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signup attempts per hour
  message: { error: 'Too many signup attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)

// Customer signup
router.post('/signup/customer', signupRateLimit, async (req, res) => {
  try {
    const result = await authModule.signupCustomer(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Employee signup
router.post('/signup/employee', signupRateLimit, async (req, res) => {
  try {
    const result = await authModule.signupEmployee(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Login
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authModule.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Email verification
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    const result = await authModule.verifyEmail(token);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Password reset request
router.post('/password-reset/request', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await authModule.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Password reset
router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    const result = await authModule.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Protected routes (authentication required)

// Admin signup (requires admin privileges)
router.post('/signup/admin', authenticateToken, authorizeRoles('super_admin', 'admin'), signupRateLimit, async (req, res) => {
  try {
    const result = await authModule.signupAdmin(req.body, req.user.userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = authModule.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // This would be implemented to update user profile
    res.json({
      success: true,
      message: 'Profile update functionality to be implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      department: req.query.department
    };

    const users = authModule.getUsers(filters, req.user.userId);
    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:userId', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const user = authModule.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Approve user (admin only)
router.post('/users/:userId/approve', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await authModule.approveUser(req.params.userId, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update user status (admin only)
router.put('/users/:userId/status', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const result = await authModule.updateUserStatus(req.params.userId, status, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get pending approvals (admin only)
router.get('/pending-approvals', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const filters = { status: 'pending_approval' };
    const pendingUsers = await authModule.getUsers(filters, req.user.userId);
    
    res.json({
      success: true,
      pendingApprovals: pendingUsers,
      total: pendingUsers.length
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'banking-system-secret-key';
    
    const newToken = jwt.sign(
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        refreshedAt: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: newToken,
      expiresIn: '24h'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production system, you might want to maintain a blacklist of tokens
    // For now, we'll just return success and let the client handle token removal
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Auth Route Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
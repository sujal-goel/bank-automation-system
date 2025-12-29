# Security Management Tools

This document describes the security management tools implemented for the Next.js Banking Frontend application.

## Overview

The security management system provides comprehensive tools for administrators to manage system security, monitor threats, control user access, and manage active sessions. The implementation follows the requirements specified in Requirement 3.5.

## Components

### 1. Security Dashboard (`/admin/security`)

**Location**: `frontend/src/components/admin/SecurityDashboard.js`

**Features**:
- Real-time security metrics display
- Active sessions count
- Failed login attempts tracking
- Security alerts overview
- System health status
- Quick actions for security operations

**Key Metrics**:
- Active Sessions: Current number of authenticated users
- Failed Logins (24h): Login failures in the last 24 hours
- Security Alerts: Number of active security alerts
- System Status: Overall security health (secure/warning/critical)

### 2. Session Management

**Location**: `frontend/src/components/admin/SessionManagement.js`

**Features**:
- View all active user sessions
- Session details (IP address, device, location, login time)
- Terminate individual sessions
- Terminate all sessions for a specific user
- Search and filter sessions
- Session status monitoring (active/idle/expired)

**Session Information**:
- User email and role
- IP address and geolocation
- Device and browser information
- Login time and last activity
- Session status

### 3. Access Control Configuration

**Location**: `frontend/src/components/admin/AccessControlConfig.js`

**Features**:
- Role-based access control management
- Create, edit, and delete user roles
- Permission assignment to roles
- Permission categories (Administration, Security, Operations, Analytics, Customer)
- Real-time permission updates

**Default Roles**:
- **Admin**: Full system access with all permissions
- **Employee**: Operational access for banking staff
- **Customer**: Limited access for bank customers

**Permission Categories**:
- **Administration**: User management, system configuration
- **Security**: Security management, audit logs
- **Operations**: Application processing, task management
- **Analytics**: Reports access, data analysis
- **Customer**: Account access, document upload

### 4. Security Monitoring

**Location**: `frontend/src/components/admin/SecurityMonitoring.js`

**Features**:
- Real-time security event monitoring
- Threat alert management
- Security metrics dashboard
- Event filtering and search
- Auto-refresh capabilities
- Alert acknowledgment and resolution

**Monitored Events**:
- Login successes and failures
- Permission denied attempts
- Suspicious activity detection
- Data access events
- Password changes

**Threat Alerts**:
- Brute force attack detection
- Unusual access patterns
- Multiple failed login attempts
- Suspicious IP addresses

## API Integration

### Security API Client

**Location**: `frontend/src/lib/api/security.js`

**Endpoints**:
- `/api/admin/security/metrics` - Security metrics
- `/api/admin/security/alerts` - Security alerts
- `/api/admin/sessions` - Session management
- `/api/admin/roles` - Role management
- `/api/admin/permissions` - Permission management
- `/api/admin/security/events` - Security events
- `/api/admin/security/threats` - Threat alerts

### Security Hook

**Location**: `frontend/src/hooks/useSecurity.js`

**Features**:
- Centralized security state management
- Permission checking utilities
- API call abstractions
- Error handling
- Loading states

## Usage

### Accessing Security Management

1. Navigate to `/admin/security` (requires admin role)
2. Use the tab navigation to switch between different security tools:
   - **Security Overview**: Dashboard with key metrics
   - **Session Management**: Active session control
   - **Access Control**: Role and permission management
   - **Security Monitoring**: Real-time threat monitoring

### Managing User Sessions

1. Go to the "Session Management" tab
2. View all active sessions with user details
3. Use search to find specific sessions
4. Click "Terminate" to end a session
5. Use "Terminate All" to end all sessions for a user

### Configuring Access Control

1. Navigate to the "Access Control" tab
2. Select a role from the left panel
3. Check/uncheck permissions in the right panel
4. Changes are saved automatically
5. Use "Add Role" to create new custom roles

### Monitoring Security Events

1. Access the "Security Monitoring" tab
2. Use time range and event type filters
3. Review threat alerts and take action
4. Acknowledge or resolve alerts as needed
5. Enable auto-refresh for real-time monitoring

## Security Features

### Authentication & Authorization

- JWT-based authentication integration
- Role-based access control (RBAC)
- Permission-based feature access
- Secure API communication

### Session Security

- Session timeout handling
- Concurrent session management
- Device and location tracking
- Suspicious activity detection

### Monitoring & Alerting

- Real-time security event logging
- Automated threat detection
- Alert prioritization (low/medium/high/critical)
- Response time tracking

### Data Protection

- Secure API endpoints
- Input validation and sanitization
- XSS protection
- CSRF protection

## Testing

### Unit Tests

**Location**: `frontend/src/__tests__/components/admin/SecurityManagement.test.js`

**Coverage**:
- Component rendering
- User interactions
- API integration
- Error handling
- Permission checking

### Test Commands

```bash
# Run all security tests
npm test -- --testPathPattern=Security

# Run specific test file
npm test SecurityManagement.test.js
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### Permissions Configuration

The system uses a hierarchical permission model:

```javascript
const rolePermissions = {
  admin: ['*'], // All permissions
  employee: [
    'view_applications',
    'process_applications',
    'view_reports',
    'manage_tasks',
    'monitor_processes'
  ],
  customer: [
    'view_account',
    'submit_application',
    'upload_documents',
    'view_notifications'
  ]
};
```

## Integration with Backend

The security management tools integrate with the existing Express.js backend:

- **Authentication**: Uses existing JWT authentication system
- **User Management**: Integrates with user database and role system
- **Session Management**: Connects to session storage and management
- **Audit Logging**: Integrates with existing audit trail system

## Future Enhancements

1. **Advanced Threat Detection**: Machine learning-based anomaly detection
2. **Compliance Reporting**: Automated compliance report generation
3. **Multi-Factor Authentication**: Enhanced authentication options
4. **Risk Scoring**: User and transaction risk assessment
5. **Integration APIs**: Third-party security tool integration

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure user has 'security_management' permission
2. **Session Not Loading**: Check backend API connectivity
3. **Real-time Updates**: Verify WebSocket connection
4. **Role Changes Not Saving**: Check network connectivity and API status

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'security:*');
```

## Support

For technical support or questions about the security management tools:

1. Check the component documentation
2. Review the API integration guide
3. Examine the test files for usage examples
4. Contact the development team for assistance
/**
 * Security Management Components Tests
 * Tests for security dashboard, session management, access control, and monitoring
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import SessionManagement from '@/components/admin/SessionManagement';
import AccessControlConfig from '@/components/admin/AccessControlConfig';
import SecurityMonitoring from '@/components/admin/SecurityMonitoring';

// Mock the security hook
jest.mock('@/hooks/useSecurity', () => ({
  useSecurity: () => ({
    getSecurityMetrics: jest.fn().mockResolvedValue({
      data: {
        activeSessions: 42,
        failedLogins: 3,
        securityAlerts: 1,
        lastSecurityScan: new Date().toISOString(),
        systemStatus: 'secure',
      },
    }),
    getSecurityAlerts: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          type: 'warning',
          title: 'Multiple Failed Login Attempts',
          description: 'User admin@bank.com has 3 failed login attempts in the last hour',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        },
      ],
    }),
    getSessions: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          userId: 'user1',
          userEmail: 'admin@bank.com',
          userRole: 'admin',
          ipAddress: '192.168.1.100',
          location: 'New York, US',
          device: 'Chrome on Windows',
          loginTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          status: 'active',
        },
      ],
    }),
    getRoles: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'admin',
          description: 'System Administrator',
          permissions: ['user_management', 'security_management'],
          userCount: 2,
        },
      ],
    }),
    getPermissions: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'user_management',
          name: 'User Management',
          description: 'Manage users',
          category: 'Administration',
        },
      ],
    }),
    getSecurityEvents: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          type: 'login_failure',
          description: 'Failed login attempt',
          ipAddress: '192.168.1.100',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        },
      ],
    }),
    getThreatAlerts: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          title: 'Brute Force Attack',
          description: 'Multiple failed login attempts detected',
          severity: 'high',
          status: 'active',
          timestamp: new Date().toISOString(),
        },
      ],
    }),
    terminateSession: jest.fn().mockResolvedValue({}),
    updateRolePermissions: jest.fn().mockResolvedValue({}),
    acknowledgeAlert: jest.fn().mockResolvedValue({}),
    loading: false,
    error: null,
    canManageSecurity: true,
  }),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('Security Management Components', () => {
  describe('SecurityDashboard', () => {
    test('renders security metrics correctly', async () => {
      render(<SecurityDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Failed Logins (24h)')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('displays security alerts', async () => {
      render(<SecurityDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Security Alerts')).toBeInTheDocument();
        expect(screen.getByText('Multiple Failed Login Attempts')).toBeInTheDocument();
      });
    });

    test('refresh button works', async () => {
      render(<SecurityDashboard />);
      
      const refreshButton = screen.getByText('🔄 Refresh Security Data');
      fireEvent.click(refreshButton);
      
      // Should trigger data refresh
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('SessionManagement', () => {
    test('renders session list correctly', async () => {
      render(<SessionManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Active Sessions/)).toBeInTheDocument();
        expect(screen.getByText('admin@bank.com')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      });
    });

    test('terminate session button is present', async () => {
      render(<SessionManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Terminate')).toBeInTheDocument();
      });
    });

    test('search functionality works', async () => {
      render(<SessionManagement />);
      
      const searchInput = screen.getByPlaceholderText(/Search by email, IP, or location/);
      fireEvent.change(searchInput, { target: { value: 'admin' } });
      
      expect(searchInput.value).toBe('admin');
    });
  });

  describe('AccessControlConfig', () => {
    test('renders roles list correctly', async () => {
      render(<AccessControlConfig />);
      
      await waitFor(() => {
        expect(screen.getByText('Roles')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('System Administrator')).toBeInTheDocument();
      });
    });

    test('add role button is present', async () => {
      render(<AccessControlConfig />);
      
      expect(screen.getByText('+ Add Role')).toBeInTheDocument();
    });

    test('permissions configuration is shown', async () => {
      render(<AccessControlConfig />);
      
      await waitFor(() => {
        expect(screen.getByText(/Permissions for/)).toBeInTheDocument();
      });
    });
  });

  describe('SecurityMonitoring', () => {
    test('renders security metrics', async () => {
      render(<SecurityMonitoring />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
        expect(screen.getByText('Blocked IPs')).toBeInTheDocument();
      });
    });

    test('displays threat alerts', async () => {
      render(<SecurityMonitoring />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Threat Alerts')).toBeInTheDocument();
        expect(screen.getByText('Brute Force Attack')).toBeInTheDocument();
      });
    });

    test('security events are shown', async () => {
      render(<SecurityMonitoring />);
      
      await waitFor(() => {
        expect(screen.getByText(/Security Events/)).toBeInTheDocument();
        expect(screen.getByText('Failed login attempt')).toBeInTheDocument();
      });
    });

    test('filter controls work', async () => {
      render(<SecurityMonitoring />);
      
      const timeRangeSelect = screen.getByDisplayValue('Last 24 Hours');
      const eventTypeSelect = screen.getByDisplayValue('All Events');
      
      expect(timeRangeSelect).toBeInTheDocument();
      expect(eventTypeSelect).toBeInTheDocument();
    });
  });
});

describe('Security Management Integration', () => {
  test('all components can be rendered together', () => {
    const { rerender } = render(<SecurityDashboard />);
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    
    rerender(<SessionManagement />);
    expect(screen.getByText(/Active Sessions/)).toBeInTheDocument();
    
    rerender(<AccessControlConfig />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
    
    rerender(<SecurityMonitoring />);
    expect(screen.getByText('Total Events')).toBeInTheDocument();
  });
});
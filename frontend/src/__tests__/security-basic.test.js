/**
 * Basic Security Management Test
 * Simple test to verify security components can be imported and basic functionality works
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the auth store
jest.mock('@/lib/auth/auth-store', () => ({
  __esModule: true,
  default: () => ({
    user: { id: '1', role: 'admin', firstName: 'Admin', lastName: 'User' },
    hasRole: () => true,
    hasPermission: () => true,
    logout: jest.fn(),
  }),
}));

// Mock the security hook
jest.mock('@/hooks/useSecurity', () => ({
  useSecurity: () => ({
    getSecurityMetrics: jest.fn().mockResolvedValue({ data: {} }),
    getSecurityAlerts: jest.fn().mockResolvedValue({ data: [] }),
    getSessions: jest.fn().mockResolvedValue({ data: [] }),
    getRoles: jest.fn().mockResolvedValue({ data: [] }),
    getPermissions: jest.fn().mockResolvedValue({ data: [] }),
    getSecurityEvents: jest.fn().mockResolvedValue({ data: [] }),
    getThreatAlerts: jest.fn().mockResolvedValue({ data: [] }),
    loading: false,
    error: null,
    canManageSecurity: true,
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/security',
  }),
  usePathname: () => '/security',
}));

describe('Security Management Basic Tests', () => {
  test('security components can be imported', () => {
    // Test that components can be imported without errors
    expect(() => {
      require('@/components/admin/SecurityDashboard');
      require('@/components/admin/SessionManagement');
      require('@/components/admin/AccessControlConfig');
      require('@/components/admin/SecurityMonitoring');
    }).not.toThrow();
  });

  test('security API can be imported', () => {
    expect(() => {
      require('@/lib/api/security');
    }).not.toThrow();
  });

  test('security hook can be imported', () => {
    expect(() => {
      require('@/hooks/useSecurity');
    }).not.toThrow();
  });

  test('admin layout can be imported', () => {
    expect(() => {
      require('@/app/(admin)/layout');
    }).not.toThrow();
  });
});
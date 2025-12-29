/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */

import { useEffect } from 'react';
import useAuthStore from '@/lib/auth/auth-store';

export default function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    clearError,
    hasRole,
    hasPermission,
  } = useAuthStore();

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    // Check token expiration every 5 minutes
    const interval = setInterval(() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // Refresh token if it expires in the next 10 minutes
        if (timeUntilExpiry < 10 * 60 * 1000) {
          refreshToken();
        }
      } catch (error) {
        console.warn('Error checking token expiration:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [token, isAuthenticated, refreshToken]);

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  const checkPermission = (permission) => {
    return hasPermission(permission);
  };

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} Has role
   */
  const checkRole = (role) => {
    return hasRole(role);
  };

  /**
   * Get user's full name
   * @returns {string} Full name
   */
  const getFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''}`.trim();
  };

  /**
   * Get user's initials
   * @returns {string} Initials
   */
  const getInitials = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}`.toUpperCase();
  };

  /**
   * Check if user is admin
   * @returns {boolean} Is admin
   */
  const isAdmin = () => {
    return checkRole('admin');
  };

  /**
   * Check if user is employee
   * @returns {boolean} Is employee
   */
  const isEmployee = () => {
    return checkRole('employee');
  };

  /**
   * Check if user is customer
   * @returns {boolean} Is customer
   */
  const isCustomer = () => {
    return checkRole('customer');
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    logout,
    register,
    refreshToken,
    clearError,

    // Utility functions
    checkPermission,
    checkRole,
    getFullName,
    getInitials,
    isAdmin,
    isEmployee,
    isCustomer,
    hasRole,
    hasPermission,
  };
}

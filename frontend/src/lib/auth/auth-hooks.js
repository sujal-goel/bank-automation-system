/**
 * Authentication Hooks
 * Custom hooks for authentication functionality
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from './auth-store';

/**
 * Main authentication hook
 */
export const useAuth = () => {
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

  return {
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
  };
};

/**
 * Hook for protecting routes that require authentication
 */
export const useRequireAuth = (redirectTo = '/auth/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook for protecting routes that require specific roles
 */
export const useRequireRole = (requiredRole, redirectTo = '/unauthorized') => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRole(requiredRole)) {
      router.push(redirectTo);
    }
  }, [user, isAuthenticated, isLoading, hasRole, requiredRole, router, redirectTo]);

  return { hasAccess: hasRole(requiredRole), isLoading };
};

/**
 * Hook for protecting routes that require specific permissions
 */
export const useRequirePermission = (permission, redirectTo = '/unauthorized') => {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission(permission)) {
      router.push(redirectTo);
    }
  }, [user, isAuthenticated, isLoading, hasPermission, permission, router, redirectTo]);

  return { hasAccess: hasPermission(permission), isLoading };
};

/**
 * Hook for automatic token refresh
 */
export const useTokenRefresh = () => {
  const { token, refreshToken, logout } = useAuth();

  useEffect(() => {
    if (!token) return;

    const scheduleRefresh = (currentToken) => {
      try {
        // Decode JWT to get expiration time
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Refresh token 5 minutes before expiry
        const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

        if (refreshTime > 0) {
          setTimeout(async () => {
            const success = await refreshToken();
            if (success) {
              // Get the new token and schedule next refresh
              const newToken = useAuthStore.getState().token;
              if (newToken) {
                scheduleRefresh(newToken);
              }
            }
          }, refreshTime);
        } else {
          // Token is already expired or about to expire
          logout();
        }
      } catch (error) {
        console.warn('Error parsing token for refresh scheduling:', error);
        logout();
      }
    };

    scheduleRefresh(token);
  }, [token, refreshToken, logout]);
};

/**
 * Hook for handling login with redirect
 */
export const useLogin = () => {
  const { login } = useAuth();
  const router = useRouter();

  const loginWithRedirect = useCallback(async (credentials, redirectTo) => {
    const result = await login(credentials);
    
    if (result.success) {
      // Determine redirect based on user role
      const defaultRedirects = {
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
        department_admin: '/admin/dashboard',
        employee: '/employee/workspace',
        bank_officer: '/employee/workspace',
        senior_bank_officer: '/employee/workspace',
        branch_manager: '/employee/workspace',
        compliance_officer: '/employee/workspace',
        senior_compliance_officer: '/employee/workspace',
        compliance_manager: '/employee/workspace',
        risk_analyst: '/employee/workspace',
        risk_manager: '/employee/workspace',
        system_admin: '/admin/dashboard',
        developer: '/admin/dashboard',
        it_manager: '/admin/dashboard',
        customer: '/customer/dashboard',
      };
      
      const destination = redirectTo || defaultRedirects[result.user.role] || '/';
      router.push(destination);
    }
    
    return result;
  }, [login, router]);

  return { loginWithRedirect };
};

/**
 * Hook for handling logout with redirect
 */
export const useLogout = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const logoutWithRedirect = useCallback(async (redirectTo = '/') => {
    await logout();
    router.push(redirectTo);
  }, [logout, router]);

  return { logoutWithRedirect };
};

/**
 * Hook for session timeout warning
 */
export const useSessionTimeout = (warningMinutes = 5, onSessionWarning = null) => {
  const { token, logout } = useAuth();

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      const warningTime = Math.max(timeUntilExpiry - warningMinutes * 60 * 1000, 0);

      if (warningTime > 0) {
        const warningTimeout = setTimeout(() => {
          // Call custom warning handler or default behavior
          if (onSessionWarning) {
            onSessionWarning(warningMinutes, logout);
          } else {
            // Default: just logout after warning time
            setTimeout(() => {
              logout();
            }, warningMinutes * 60 * 1000);
          }
        }, warningTime);

        return () => clearTimeout(warningTimeout);
      }
    } catch (error) {
      console.warn('Error parsing token for session timeout:', error);
    }
  }, [token, logout, warningMinutes, onSessionWarning]);
};
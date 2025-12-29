/**
 * Authentication Store using Zustand
 * Manages authentication state, token storage, and user session
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Call logout endpoint to invalidate token on server
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().token}`,
            },
          });
        } catch (error) {
          console.warn('Logout request failed:', error);
        }

        // Clear local state regardless of server response
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
          }

          const data = await response.json();
          
          set({
            isLoading: false,
            error: null,
          });

          return { success: true, message: data.message };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) return false;

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          set({
            token: data.token,
            user: data.user,
          });

          return true;
        } catch (error) {
          console.warn('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),

      // Utility functions
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        
        // Define role-based permissions
        const rolePermissions = {
          admin: ['*'], // Admin has all permissions
          employee: [
            'view_applications',
            'process_applications',
            'view_reports',
            'manage_tasks',
            'monitor_processes',
          ],
          customer: [
            'view_account',
            'submit_application',
            'upload_documents',
            'view_notifications',
          ],
        };

        const userPermissions = rolePermissions[user.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
      storage: isBrowser ? createJSONStorage(() => localStorage) : createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: !isBrowser,
    },
  ),
);

// Hook to handle hydration
export const useAuthStoreHydration = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (isBrowser) {
      useAuthStore.persist.rehydrate();
      setHasHydrated(true);
    }
  }, []);

  return hasHydrated;
};

export default useAuthStore;
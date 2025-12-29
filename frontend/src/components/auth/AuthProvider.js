/**
 * Authentication Provider Component
 * Provides authentication context and handles token refresh
 */

'use client';

import { useTokenRefresh } from '@/lib/auth/auth-hooks';

export default function AuthProvider({ children }) {
  // Initialize token refresh mechanism
  useTokenRefresh();

  return <>{children}</>;
}
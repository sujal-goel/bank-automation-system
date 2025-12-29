'use client';

import { useState, useEffect } from 'react';
import UserManagementDashboard from '@/components/admin/UserManagementDashboard';
import  useAuth from '@/hooks/useAuth';

/**
 * Admin Users Management Page
 * Provides comprehensive user management interface for administrators
 */
export default function UsersPage() {
  const { user, checkPermission } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has admin permissions
    if (user && !checkPermission('admin.users.manage')) {
      window.location.href = '/admin/dashboard';
      return;
    }
    setLoading(false);
  }, [user, checkPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage user accounts, roles, and permissions across the banking system
        </p>
      </div>
      
      <UserManagementDashboard />
    </div>
  );
}
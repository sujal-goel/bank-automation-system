/**
 * Admin Audit Logs Page
 * Provides comprehensive audit log viewing with advanced filtering and search capabilities
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has admin permissions
    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasPermission('*') && user.role !== 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    setIsLoading(false);
  }, [user, hasPermission, router]);

  if (isLoading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor system activities and security events with advanced filtering and real-time updates.
          </p>
        </div>

        {/* Audit Log Viewer Component */}
        <AuditLogViewer />
      </div>
    </DashboardLayout>
  );
}
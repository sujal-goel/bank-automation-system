'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import { apiClient } from '@/lib/api/client';
import useNotifications from '@/hooks/useNotifications';

/**
 * Admin Dashboard Page
 * Main admin interface with overview and quick actions
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showError } = useNotifications();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeApplications: 0,
    systemHealth: 'healthy',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !['admin', 'super_admin', 'department_admin'].includes(user.role)) {
      router.push('/admin/dashboard');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const [usersResponse, healthResponse] = await Promise.all([
        apiClient.get('/api/auth/users').catch(() => ({ users: [] })),
        apiClient.get('/api/health').catch(() => ({ status: 'unknown' })),
      ]);

      const users = usersResponse.users || [];
      
      setStats({
        totalUsers: users.length,
        pendingApprovals: users.filter(u => u.status === 'pending_approval').length,
        activeApplications: 0, // This would come from applications API
        systemHealth: healthResponse.status || 'unknown',
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showError('Dashboard Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/users',
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'System Analytics',
      description: 'View system performance and usage analytics',
      href: '/analytics',
      icon: '📊',
      color: 'bg-green-500',
    },
    {
      title: 'Audit Logs',
      description: 'Review system audit logs and security events',
      href: '/audit',
      icon: '🔍',
      color: 'bg-yellow-500',
    },
    {
      title: 'Security Settings',
      description: 'Configure security policies and settings',
      href: '/security',
      icon: '🔒',
      color: 'bg-red-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.firstName}. Here's what's happening with your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  stats.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-sm font-medium">
                    {stats.systemHealth === 'healthy' ? '✅' : '❌'}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-2xl font-semibold text-gray-900 capitalize">
                  {stats.systemHealth}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white text-lg">{action.icon}</span>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity to display</p>
              <p className="text-sm mt-2">Activity logs will appear here as users interact with the system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
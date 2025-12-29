/**
 * Admin Security Management Page
 * Provides comprehensive security management tools including session management,
 * access control configuration, and security monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import SessionManagement from '@/components/admin/SessionManagement';
import AccessControlConfig from '@/components/admin/AccessControlConfig';
import SecurityMonitoring from '@/components/admin/SecurityMonitoring';

export default function SecurityPage() {
  const router = useRouter();
  const { user, hasRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!user || !hasRole('admin')) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, hasRole, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Security Overview', icon: '🛡️' },
    { id: 'sessions', label: 'Session Management', icon: '👥' },
    { id: 'access', label: 'Access Control', icon: '🔐' },
    { id: 'monitoring', label: 'Security Monitoring', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Management</h1>
          <p className="mt-2 text-gray-600">
            Manage system security, user sessions, and access controls
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'dashboard' && <SecurityDashboard />}
          {activeTab === 'sessions' && <SessionManagement />}
          {activeTab === 'access' && <AccessControlConfig />}
          {activeTab === 'monitoring' && <SecurityMonitoring />}
        </div>
      </div>
    </div>
  );
}
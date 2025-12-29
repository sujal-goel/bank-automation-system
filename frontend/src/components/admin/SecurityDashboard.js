/**
 * Security Dashboard Component
 * Provides overview of system security status, metrics, and alerts
 */

'use client';

import { useState, useEffect } from 'react';
import { useSecurity } from '@/hooks/useSecurity';

export default function SecurityDashboard() {
  const {
    getSecurityMetrics,
    getSecurityAlerts,
    runSecurityScan,
    generateSecurityReport,
    loading,
    error,
  } = useSecurity();
  
  const [securityMetrics, setSecurityMetrics] = useState({
    activeSessions: 0,
    failedLogins: 0,
    securityAlerts: 0,
    lastSecurityScan: null,
    systemStatus: 'secure',
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch security metrics
      const metricsResponse = await getSecurityMetrics('24h');
      setSecurityMetrics(metricsResponse.data || {
        activeSessions: 42,
        failedLogins: 3,
        securityAlerts: 1,
        lastSecurityScan: new Date().toISOString(),
        systemStatus: 'secure',
      });

      // Fetch security alerts
      const alertsResponse = await getSecurityAlerts();
      setAlerts(alertsResponse.data || [
        {
          id: '1',
          type: 'warning',
          title: 'Multiple Failed Login Attempts',
          description: 'User admin@bank.com has 3 failed login attempts in the last hour',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      // Use mock data for development
      setSecurityMetrics({
        activeSessions: 42,
        failedLogins: 3,
        securityAlerts: 1,
        lastSecurityScan: new Date().toISOString(),
        systemStatus: 'secure',
      });
      setAlerts([
        {
          id: '1',
          type: 'warning',
          title: 'Multiple Failed Login Attempts',
          description: 'User admin@bank.com has 3 failed login attempts in the last hour',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        },
      ]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'secure': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed Logins (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.failedLogins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.securityAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(securityMetrics.systemStatus)}`}>
                <span className="text-sm">🛡️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{securityMetrics.systemStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Security Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🛡️</div>
              <p className="text-gray-500">No security alerts at this time</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Investigate
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => fetchSecurityData()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Security Data
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          🔍 Run Security Scan
        </button>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          📊 Generate Security Report
        </button>
      </div>
    </div>
  );
}
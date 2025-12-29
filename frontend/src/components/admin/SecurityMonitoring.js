/**
 * Security Monitoring Component
 * Provides real-time security monitoring, threat detection alerts,
 * and security event tracking
 */

'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

export default function SecurityMonitoring() {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [securityMetrics, setSecurityMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, autoRefresh]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      const [eventsResponse, alertsResponse, metricsResponse] = await Promise.all([
        apiClient.get(`/api/admin/security/events?timeRange=${timeRange}`),
        apiClient.get('/api/admin/security/threats'),
        apiClient.get(`/api/admin/security/metrics?timeRange=${timeRange}`),
      ]);
      
      setSecurityEvents(eventsResponse.data || mockSecurityEvents);
      setThreatAlerts(alertsResponse.data || mockThreatAlerts);
      setSecurityMetrics(metricsResponse.data || mockSecurityMetrics);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      // Use mock data for development
      setSecurityEvents(mockSecurityEvents);
      setThreatAlerts(mockThreatAlerts);
      setSecurityMetrics(mockSecurityMetrics);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiClient.patch(`/api/admin/security/threats/${alertId}`, {
        status: 'acknowledged',
      });
      
      setThreatAlerts(threatAlerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert,
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert. Please try again.');
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await apiClient.patch(`/api/admin/security/threats/${alertId}`, {
        status: 'resolved',
      });
      
      setThreatAlerts(threatAlerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'login_success': return 'bg-green-100 text-green-800';
      case 'login_failure': return 'bg-red-100 text-red-800';
      case 'password_change': return 'bg-blue-100 text-blue-800';
      case 'permission_denied': return 'bg-yellow-100 text-yellow-800';
      case 'suspicious_activity': return 'bg-orange-100 text-orange-800';
      case 'data_access': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  // Mock data for development
  const mockSecurityEvents = [
    {
      id: '1',
      type: 'login_failure',
      description: 'Failed login attempt for admin@bank.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/91.0.4472.124',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      severity: 'medium',
    },
    {
      id: '2',
      type: 'login_success',
      description: 'Successful login for employee@bank.com',
      ipAddress: '192.168.1.101',
      userAgent: 'Safari/14.1.1',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      severity: 'low',
    },
    {
      id: '3',
      type: 'suspicious_activity',
      description: 'Multiple rapid API requests from single IP',
      ipAddress: '203.0.113.42',
      userAgent: 'curl/7.68.0',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      severity: 'high',
    },
    {
      id: '4',
      type: 'permission_denied',
      description: 'Unauthorized access attempt to admin panel',
      ipAddress: '192.168.1.102',
      userAgent: 'Firefox/89.0',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      severity: 'medium',
    },
  ];

  const mockThreatAlerts = [
    {
      id: '1',
      title: 'Brute Force Attack Detected',
      description: 'Multiple failed login attempts from IP 203.0.113.42',
      severity: 'high',
      status: 'active',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      affectedResource: 'Authentication System',
      recommendedAction: 'Block IP address and investigate source',
    },
    {
      id: '2',
      title: 'Unusual Data Access Pattern',
      description: 'Employee accessing customer data outside normal hours',
      severity: 'medium',
      status: 'investigating',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      affectedResource: 'Customer Database',
      recommendedAction: 'Review employee access logs and verify legitimacy',
    },
  ];

  const mockSecurityMetrics = {
    totalEvents: 1247,
    criticalAlerts: 2,
    blockedIPs: 15,
    suspiciousActivities: 8,
    averageResponseTime: '2.3 minutes',
    systemHealth: 'good',
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Events</option>
            <option value="login_failure">Login Failures</option>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="permission_denied">Permission Denied</option>
            <option value="data_access">Data Access</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          
          <button
            onClick={fetchSecurityData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.criticalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">🚫</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Blocked IPs</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.blockedIPs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suspicious Activities</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.suspiciousActivities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">⏱️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{securityMetrics.averageResponseTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">💚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Health</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{securityMetrics.systemHealth}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Threat Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {threatAlerts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🛡️</div>
                <p className="text-gray-500">No active threat alerts</p>
              </div>
            ) : (
              threatAlerts.map((alert) => (
                <div key={alert.id} className={`px-6 py-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Resource: {alert.affectedResource}</span>
                        <span>Status: {alert.status}</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-xs text-blue-600">{alert.recommendedAction}</p>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs text-yellow-600 hover:text-yellow-800"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Events */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Security Events ({filteredEvents.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-500">No security events found</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {event.type.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{event.description}</p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>IP: {event.ipAddress}</span>
                        <span>Agent: {event.userAgent}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
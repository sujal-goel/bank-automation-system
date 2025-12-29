'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/auth/auth-store';
import { apiClient } from '@/lib/api/client';
import useNotifications from '@/hooks/useNotifications';
import useWebSocket from '@/hooks/useWebSocket';

/**
 * System Monitoring Dashboard
 * Real-time system metrics, health indicators, and alerting
 * Requirements: 3.2
 */
export default function SystemMonitoring() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showError, showSuccess } = useNotifications();
  
  const [metrics, setMetrics] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { used: 0, total: 0, percentage: 0 },
    disk: { used: 0, total: 0, percentage: 0 },
    network: { inbound: 0, outbound: 0 },
    database: { connections: 0, queries: 0, responseTime: 0 },
    api: { requests: 0, errors: 0, responseTime: 0 },
    uptime: 0,
    lastUpdated: null,
  });
  
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // WebSocket connection for real-time updates
  const { connected, sendMessage } = useWebSocket('/admin/metrics', {
    onMessage: (data) => {
      if (data.type === 'metrics_update') {
        setMetrics(data.metrics);
        setSystemHealth(data.health);
      } else if (data.type === 'alert') {
        setAlerts(prev => [data.alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !['admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    loadSystemMetrics();
    loadSystemAlerts();

    // Set up auto-refresh interval
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadSystemMetrics, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user, router, autoRefresh]);

  const loadSystemMetrics = async () => {
    try {
      const response = await apiClient.get('/api/admin/system/metrics');
      
      if (response.success) {
        setMetrics(response.data.metrics);
        setSystemHealth(response.data.health);
      }
    } catch (error) {
      console.error('Failed to load system metrics:', error);
      showError('Metrics Error', 'Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const response = await apiClient.get('/api/admin/system/alerts?limit=10');
      
      if (response.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load system alerts:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiClient.post(`/api/admin/system/alerts/${alertId}/acknowledge`);
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert,
      ));
      
      showSuccess('Alert Acknowledged', 'Alert has been acknowledged');
    } catch (error) {
      showError('Error', 'Failed to acknowledge alert');
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="mt-2 text-gray-600">
              Real-time system metrics and health monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Auto Refresh</span>
            </label>
            
            {/* Manual Refresh */}
            <button
              onClick={loadSystemMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
                <p className="text-sm text-gray-600">Overall system status</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(systemHealth)}`}>
                {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatUptime(metrics.uptime)}</p>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{metrics.api.requests}</p>
                <p className="text-sm text-gray-600">API Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{metrics.database.connections}</p>
                <p className="text-sm text-gray-600">DB Connections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Last Updated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* CPU Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">CPU Usage</h3>
              <span className="text-sm text-gray-600">{metrics.cpu.cores} cores</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Usage</span>
                <span>{metrics.cpu.usage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getMetricColor(metrics.cpu.usage)}`}
                  style={{ width: `${Math.min(metrics.cpu.usage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
              <span className="text-sm text-gray-600">{formatBytes(metrics.memory.total)}</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Used: {formatBytes(metrics.memory.used)}</span>
                <span>{metrics.memory.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getMetricColor(metrics.memory.percentage)}`}
                  style={{ width: `${Math.min(metrics.memory.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Disk Usage</h3>
              <span className="text-sm text-gray-600">{formatBytes(metrics.disk.total)}</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Used: {formatBytes(metrics.disk.used)}</span>
                <span>{metrics.disk.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getMetricColor(metrics.disk.percentage)}`}
                  style={{ width: `${Math.min(metrics.disk.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Network Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inbound</span>
                <span className="text-sm font-medium">{formatBytes(metrics.network.inbound)}/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Outbound</span>
                <span className="text-sm font-medium">{formatBytes(metrics.network.outbound)}/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Database Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium">{metrics.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Queries/sec</span>
                <span className="text-sm font-medium">{metrics.database.queries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium">{metrics.database.responseTime}ms</span>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Requests/min</span>
                <span className="text-sm font-medium">{metrics.api.requests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="text-sm font-medium">{metrics.api.errors}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium">{metrics.api.responseTime}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="p-6">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No active alerts</p>
                <p className="text-sm mt-2">System is running normally</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="ml-4 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
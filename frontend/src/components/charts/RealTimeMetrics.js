/**
 * Real-Time Metrics Component
 * Displays live updating metrics with WebSocket integration
 */
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LineChart from './LineChart';
import KPICard from './KPICard';
import { formatChartValue } from './BaseChart';
import { apiClient } from '../../lib/api/client';
import { 
  SignalIcon, 
  PlayIcon, 
  PauseIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon, 
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} RealTimeData
 * @property {Object} metrics - Current metric values
 * @property {Object} timeSeries - Time series data for charts
 * @property {Object[]} alerts - Active alerts
 * @property {Date} timestamp - Last update timestamp
 */

/**
 * Real-Time Metrics Component
 * @param {Object} props
 * @param {string[]} props.metrics - Metrics to monitor
 * @param {number} [props.updateInterval] - Update interval in milliseconds
 * @param {number} [props.maxDataPoints] - Maximum data points to keep in memory
 * @param {function} [props.onDrillDown] - Drill-down handler
 * @param {function} [props.onAlert] - Alert handler
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 * @param {string} [props.className] - Additional CSS classes
 */
const RealTimeMetrics = ({
  metrics = ['applications', 'processing_time', 'approval_rate', 'system_load'],
  updateInterval = 5000, // 5 seconds
  maxDataPoints = 50,
  onDrillDown,
  onAlert,
  isDarkMode = false,
  className = '',
}) => {
  const [isLive, setIsLive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [historicalData, setHistoricalData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch initial data
  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ['real-time-metrics', metrics],
    queryFn: async () => {
      const response = await apiClient.request('/api/analytics/real-time/initial', {
        method: 'POST',
        body: { metrics },
      });
      return response.data;
    },
    enabled: metrics.length > 0,
  });

  // Initialize historical data when initial data loads
  useEffect(() => {
    if (initialData?.timeSeries) {
      setHistoricalData(initialData.timeSeries);
    }
  }, [initialData]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isLive) return;

    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
      const ws = new WebSocket(`${wsUrl}/analytics/real-time`);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        console.log('Real-time metrics WebSocket connected');
        
        // Subscribe to metrics
        ws.send(JSON.stringify({
          type: 'subscribe',
          metrics: metrics,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealTimeUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('Real-time metrics WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        if (isLive) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        setConnectionStatus('error');
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isLive, metrics]);

  // Handle real-time data updates
  const handleRealTimeUpdate = (data) => {
    const { type, payload, timestamp } = data;

    switch (type) {
      case 'metrics_update':
        updateHistoricalData(payload, timestamp);
        break;
      
      case 'alert':
        handleAlert(payload);
        break;
      
      case 'system_status':
        setConnectionStatus(payload.status);
        break;
      
      default:
        console.warn('Unknown real-time message type:', type);
    }
  };

  // Update historical data with new data point
  const updateHistoricalData = (newData, timestamp) => {
    setHistoricalData(prev => {
      const updated = { ...prev };
      
      Object.keys(newData).forEach(metric => {
        if (!updated[metric]) {
          updated[metric] = { labels: [], data: [] };
        }
        
        // Add new data point
        updated[metric].labels.push(new Date(timestamp).toLocaleTimeString());
        updated[metric].data.push(newData[metric]);
        
        // Keep only the last maxDataPoints
        if (updated[metric].labels.length > maxDataPoints) {
          updated[metric].labels = updated[metric].labels.slice(-maxDataPoints);
          updated[metric].data = updated[metric].data.slice(-maxDataPoints);
        }
      });
      
      return updated;
    });

    // Update React Query cache
    queryClient.setQueryData(['real-time-metrics', metrics], oldData => ({
      ...oldData,
      metrics: newData,
      timestamp: timestamp,
    }));
  };

  // Handle alerts
  const handleAlert = (alertData) => {
    setAlerts(prev => [alertData, ...prev.slice(0, 9)]); // Keep last 10 alerts
    
    if (onAlert) {
      onAlert(alertData);
    }
  };

  // Toggle live updates
  const toggleLive = () => {
    setIsLive(!isLive);
  };

  // Manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries(['real-time-metrics']);
  };

  // Get connection status indicator
  const getConnectionIndicator = () => {
    const indicators = {
      connecting: { color: 'text-yellow-500', icon: ArrowPathIcon, label: 'Connecting...' },
      connected: { color: 'text-green-500', icon: SignalIcon, label: 'Live' },
      disconnected: { color: 'text-red-500', icon: ExclamationTriangleIcon, label: 'Disconnected' },
      error: { color: 'text-red-500', icon: ExclamationTriangleIcon, label: 'Error' },
    };
    
    return indicators[connectionStatus] || indicators.connecting;
  };

  const indicator = getConnectionIndicator();

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load real-time metrics
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error.message || 'An error occurred while connecting to real-time data'}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <indicator.icon className={`h-5 w-5 ${indicator.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span className={`text-sm font-medium ${indicator.color}`}>
                {indicator.label}
              </span>
            </div>
            
            {connectionStatus === 'connected' && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Updates every {updateInterval / 1000}s
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleLive}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLive
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:bg-red-900/20'
                  : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 dark:border-green-600 dark:text-green-400 dark:bg-green-900/20'
              }`}
            >
              {isLive ? (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Active Alerts
            </h4>
            <div className="space-y-1">
              {alerts.slice(0, 3).map((alert, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md text-sm ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      : alert.severity === 'warning'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <span className="text-xs opacity-75">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-Time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(metric => {
          const currentValue = initialData?.metrics?.[metric] || 0;
          const previousValue = historicalData[metric]?.data?.slice(-2)?.[0];
          
          return (
            <KPICard
              key={metric}
              data={{
                title: metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: currentValue,
                previousValue: previousValue,
                format: metric.includes('rate') ? 'percentage' : 
                  metric.includes('time') ? 'number' : 'number',
                unit: metric.includes('time') ? 'ms' : 
                  metric.includes('rate') ? '' : 'count',
                description: 'Real-time',
                trendType: metric.includes('time') ? 'negative' : 'positive',
              }}
              loading={isLoading}
              onClick={() => onDrillDown && onDrillDown({ type: 'kpi', metric })}
            />
          );
        })}
      </div>

      {/* Real-Time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.map(metric => {
          const data = historicalData[metric];
          if (!data || data.data.length === 0) return null;

          return (
            <LineChart
              key={metric}
              data={{
                labels: data.labels,
                datasets: [{
                  label: metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  data: data.data,
                  borderColor: '#3b82f6',
                  backgroundColor: '#3b82f620',
                  fill: true,
                }],
              }}
              title={`${metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - Live`}
              valueFormat={metric.includes('rate') ? 'percentage' : 'number'}
              loading={isLoading}
              isDarkMode={isDarkMode}
              onPointClick={(data) => onDrillDown && onDrillDown({ 
                type: 'chart', 
                metric, 
                data, 
              })}
              smooth={true}
              showPoints={false}
            />
          );
        })}
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Connection:</span>
            <span className={`font-medium ${indicator.color}`}>
              {indicator.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Data Points:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Object.values(historicalData)[0]?.data?.length || 0} / {maxDataPoints}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Last Update:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {initialData?.timestamp ? new Date(initialData.timestamp).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
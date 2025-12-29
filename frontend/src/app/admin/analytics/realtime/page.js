/**
 * Real-Time Process Monitoring Page
 * Live monitoring dashboard for system processes and metrics
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RealTimeMetrics from '../../../../components/charts/RealTimeMetrics';
import ProcessMonitor from '../../../../components/charts/ProcessMonitor';
import { 
  SignalIcon, 
  ArrowLeftIcon,
  CogIcon,
  ChartBarIcon,
  BellIcon, 
} from '@heroicons/react/24/outline';

/**
 * Real-Time Monitoring Page Component
 */
export default function RealTimeMonitoringPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'metrics', 'processes'

  // Handle drill-down from metrics
  const handleMetricsDrillDown = (drillDownData) => {
    console.log('Metrics drill-down:', drillDownData);
    
    // Navigate to detailed metric view
    const params = new URLSearchParams({
      type: drillDownData.type,
      metric: drillDownData.metric || '',
      data: JSON.stringify(drillDownData.data || {}),
    });
    
    router.push(`/admin/analytics/metric-detail?${params}`);
  };

  // Handle process click
  const handleProcessClick = (process) => {
    console.log('Process clicked:', process);
    
    // Navigate to process detail view
    router.push(`/admin/analytics/process/${process.id}`);
  };

  // Handle process actions
  const handleProcessAction = (processId, action) => {
    console.log('Process action:', { processId, action });
    
    // Show notification or handle action result
    // This could trigger a toast notification
  };

  // Handle alert from real-time metrics
  const handleAlert = (alertData) => {
    console.log('Alert received:', alertData);
    
    // Handle alert - could show notification, play sound, etc.
    // For now, just log it
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <SignalIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Real-Time Monitoring
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Live system metrics and process monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Selector */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSelectedView('overview')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedView === 'overview'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setSelectedView('metrics')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedView === 'metrics'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-1 inline" />
                  Metrics
                </button>
                <button
                  onClick={() => setSelectedView('processes')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedView === 'processes'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <CogIcon className="h-4 w-4 mr-1 inline" />
                  Processes
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Real-Time Metrics */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Live Metrics
                </h2>
              </div>
              
              <RealTimeMetrics
                metrics={['applications', 'processing_time', 'approval_rate', 'system_load']}
                updateInterval={5000}
                maxDataPoints={50}
                onDrillDown={handleMetricsDrillDown}
                onAlert={handleAlert}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Process Monitor */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <CogIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Active Processes
                </h2>
              </div>
              
              <ProcessMonitor
                processTypes={['loan_processing', 'kyc_verification', 'document_processing']}
                onProcessClick={handleProcessClick}
                onProcessAction={handleProcessAction}
                showControls={true}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {selectedView === 'metrics' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Real-Time Metrics Dashboard
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Updates every 5 seconds
              </div>
            </div>
            
            <RealTimeMetrics
              metrics={[
                'applications', 
                'processing_time', 
                'approval_rate', 
                'system_load',
                'active_users',
                'error_rate',
                'response_time',
                'throughput',
              ]}
              updateInterval={5000}
              maxDataPoints={100}
              onDrillDown={handleMetricsDrillDown}
              onAlert={handleAlert}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {selectedView === 'processes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Process Monitoring Dashboard
              </h2>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Live monitoring active
                </span>
              </div>
            </div>
            
            <ProcessMonitor
              processTypes={[
                'loan_processing',
                'kyc_verification', 
                'document_processing',
                'payment_processing',
                'aml_screening',
                'credit_check',
                'risk_assessment',
              ]}
              onProcessClick={handleProcessClick}
              onProcessAction={handleProcessAction}
              showControls={true}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* System Status Footer */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  System Status: Operational
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                All systems running normally
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="font-medium">Uptime:</span> 99.9%
              </div>
              <div>
                <span className="font-medium">Response Time:</span> 45ms avg
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
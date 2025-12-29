/**
 * Analytics Dashboard Page
 * Main analytics and reporting interface for administrators
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '../../../components/charts/AnalyticsDashboard';
import { ChartBarIcon, ClockIcon, DocumentArrowDownIcon, BellIcon } from '@heroicons/react/24/outline';

/**
 * Time range options for analytics
 */
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

/**
 * Analytics Page Component
 */
export default function AnalyticsPage() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Handle drill-down navigation
  const handleDrillDown = ({ type, kpiType, chartType, data, timeRange }) => {
    console.log('Drill-down triggered:', { type, kpiType, chartType, data, timeRange });
    
    // Navigate to detailed view based on drill-down type
    if (type === 'kpi') {
      router.push(`/admin/analytics/kpi/${kpiType}?timeRange=${timeRange}`);
    } else if (type === 'chart') {
      router.push(`/admin/analytics/chart/${chartType}?timeRange=${timeRange}&filter=${encodeURIComponent(JSON.stringify(data))}`);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange) => {
    setSelectedTimeRange(newTimeRange);
  };

  // Handle export functionality (placeholder for now)
  const handleExport = () => {
    console.log('Export functionality will be implemented in task 6.7');
    // This will be implemented in the export functionality task
  };

  // Handle alert configuration (placeholder for now)
  const handleAlertConfig = () => {
    console.log('Alert configuration will be implemented in task 6.9');
    // This will be implemented in the alerting system task
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics & Reporting
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monitor performance metrics and operational insights
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedTimeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export
              </button>

              <button
                onClick={handleAlertConfig}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BellIcon className="h-4 w-4 mr-2" />
                Alerts
              </button>

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
        <AnalyticsDashboard
          timeRange={selectedTimeRange}
          onDrillDown={handleDrillDown}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
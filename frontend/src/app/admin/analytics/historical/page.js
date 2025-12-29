/**
 * Historical Data Analysis Page
 * Provides comprehensive historical data analysis with trend analysis and data aggregation
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TimeRangeSelector from '../../../../components/charts/TimeRangeSelector';
import TrendAnalysis from '../../../../components/charts/TrendAnalysis';
import DataAggregation from '../../../../components/charts/DataAggregation';
import { 
  ChartBarIcon, 
  ArrowLeftIcon,
  FunnelIcon,
  ArrowTrendingUpIcon, 
} from '@heroicons/react/24/outline';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Historical Analysis Page Component
 */
export default function HistoricalAnalysisPage() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    value: '30d',
    label: 'Last 30 days',
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
  });
  const [selectedMetric, setSelectedMetric] = useState('applications');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Available metrics for analysis
  const METRICS = [
    { value: 'applications', label: 'Applications', icon: '📋' },
    { value: 'revenue', label: 'Revenue', icon: '💰' },
    { value: 'processing_time', label: 'Processing Time', icon: '⏱️' },
    { value: 'approval_rate', label: 'Approval Rate', icon: '✅' },
  ];

  // Handle time range changes
  const handleTimeRangeChange = (newRange) => {
    setSelectedTimeRange(newRange);
  };

  // Handle metric selection
  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  // Handle drill-down navigation
  const handleDrillDown = (drillDownData) => {
    console.log('Historical drill-down:', drillDownData);
    
    // Navigate to detailed view based on drill-down data
    const params = new URLSearchParams({
      timeRange: selectedTimeRange.value,
      metric: selectedMetric,
      drillDown: JSON.stringify(drillDownData),
    });
    
    router.push(`/admin/analytics/detailed?${params}`);
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
              
              <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Historical Data Analysis
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Analyze trends and patterns in historical data
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <TimeRangeSelector
                selectedRange={selectedTimeRange.value}
                onRangeChange={handleTimeRangeChange}
                allowCustomRange={true}
              />

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
        <div className="space-y-8">
          {/* Metric Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Metric for Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {METRICS.map((metric) => (
                <button
                  key={metric.value}
                  onClick={() => handleMetricChange(metric.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedMetric === metric.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{metric.icon}</div>
                    <div className={`text-sm font-medium ${
                      selectedMetric === metric.value
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {metric.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trend Analysis Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trend Analysis
              </h2>
            </div>
            
            <TrendAnalysis
              metric={selectedMetric}
              timeRange={selectedTimeRange}
              showComparison={true}
              showInsights={true}
              onDrillDown={handleDrillDown}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Data Aggregation Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data Aggregation
              </h2>
            </div>
            
            <DataAggregation
              timeRange={selectedTimeRange}
              defaultConfig={{
                field: selectedMetric,
                operation: 'sum',
                groupBy: 'department',
                sortOrder: 'desc',
              }}
              onDrillDown={handleDrillDown}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Analysis Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Analysis Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedTimeRange.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Time Period
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {METRICS.find(m => m.value === selectedMetric)?.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Selected Metric
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  Live Data
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time Updates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
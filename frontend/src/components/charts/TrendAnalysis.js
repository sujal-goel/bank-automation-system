/**
 * Trend Analysis Component
 * Provides comparative trend analysis with multiple time periods
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LineChart from './LineChart';
import { formatChartValue } from './BaseChart';
import { apiClient } from '../../lib/api/client';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  MinusIcon,
  InformationCircleIcon, 
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} TrendData
 * @property {string[]} labels - Time period labels
 * @property {Object[]} datasets - Chart datasets
 * @property {Object} comparison - Comparison with previous period
 * @property {Object} insights - Trend insights and analysis
 */

/**
 * Trend Analysis Component
 * @param {Object} props
 * @param {string} props.metric - Metric to analyze (e.g., 'applications', 'revenue', 'processing_time')
 * @param {Object} props.timeRange - Time range object with startDate and endDate
 * @param {boolean} [props.showComparison] - Whether to show comparison with previous period
 * @param {boolean} [props.showInsights] - Whether to show trend insights
 * @param {function} [props.onDrillDown] - Drill-down handler
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 * @param {string} [props.className] - Additional CSS classes
 */
const TrendAnalysis = ({
  metric,
  timeRange,
  showComparison = true,
  showInsights = true,
  onDrillDown,
  isDarkMode = false,
  className = '',
}) => {
  const [selectedDataset, setSelectedDataset] = useState(null);

  // Fetch trend data
  const { data: trendData, isLoading, error } = useQuery({
    queryKey: ['trend-analysis', metric, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        metric,
        startDate: timeRange.startDate.toISOString(),
        endDate: timeRange.endDate.toISOString(),
        includeComparison: showComparison.toString(),
      });
      
      const response = await apiClient.request(`/api/analytics/trends?${params}`);
      return response.data;
    },
    enabled: !!metric && !!timeRange.startDate && !!timeRange.endDate,
  });

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (!trendData?.datasets?.[0]?.data) return null;

    const data = trendData.datasets[0].data;
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length;

    // Calculate trend direction
    const trendDirection = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'flat';
    const trendPercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Calculate volatility (coefficient of variation)
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);
    const volatility = avgValue !== 0 ? (standardDeviation / avgValue) * 100 : 0;

    return {
      firstValue,
      lastValue,
      maxValue,
      minValue,
      avgValue,
      trendDirection,
      trendPercentage,
      volatility,
    };
  }, [trendData]);

  // Handle chart point click
  const handlePointClick = (data) => {
    setSelectedDataset(data);
    if (onDrillDown) {
      onDrillDown({
        type: 'trend-point',
        metric,
        timeRange,
        data,
      });
    }
  };

  // Get metric configuration
  const getMetricConfig = (metricType) => {
    const configs = {
      applications: {
        title: 'Application Volume Trend',
        valueFormat: 'number',
        unit: 'applications',
        color: '#3b82f6',
      },
      revenue: {
        title: 'Revenue Trend',
        valueFormat: 'currency',
        unit: '',
        color: '#22c55e',
      },
      processing_time: {
        title: 'Processing Time Trend',
        valueFormat: 'number',
        unit: 'hours',
        color: '#f59e0b',
      },
      approval_rate: {
        title: 'Approval Rate Trend',
        valueFormat: 'percentage',
        unit: '',
        color: '#8b5cf6',
      },
    };
    
    return configs[metricType] || configs.applications;
  };

  const metricConfig = getMetricConfig(metric);

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <InformationCircleIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load trend data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {error.message || 'An error occurred while fetching trend analysis'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {metricConfig.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {timeRange.label || 'Custom Range'}
            </p>
          </div>
          
          {/* Trend Indicator */}
          {trendStats && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatChartValue(trendStats.lastValue, metricConfig.valueFormat)}
                  {metricConfig.unit && <span className="text-sm text-gray-500 ml-1">{metricConfig.unit}</span>}
                </div>
                <div className={`flex items-center text-sm ${
                  trendStats.trendDirection === 'up' ? 'text-green-600' :
                    trendStats.trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trendStats.trendDirection === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
                  {trendStats.trendDirection === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
                  {trendStats.trendDirection === 'flat' && <MinusIcon className="h-4 w-4 mr-1" />}
                  {Math.abs(trendStats.trendPercentage).toFixed(1)}% vs start
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <LineChart
          data={{
            labels: trendData?.labels || [],
            datasets: [
              {
                label: metricConfig.title,
                data: trendData?.datasets?.[0]?.data || [],
                borderColor: metricConfig.color,
                backgroundColor: `${metricConfig.color}20`,
                fill: true,
              },
              ...(showComparison && trendData?.comparison ? [{
                label: 'Previous Period',
                data: trendData.comparison.data || [],
                borderColor: '#9ca3af',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                fill: false,
              }] : []),
            ],
          }}
          valueFormat={metricConfig.valueFormat}
          loading={isLoading}
          isDarkMode={isDarkMode}
          onPointClick={handlePointClick}
          smooth={true}
          showPoints={true}
        />
      </div>

      {/* Statistics and Insights */}
      {(trendStats || showInsights) && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Statistics */}
            {trendStats && (
              <>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatChartValue(trendStats.avgValue, metricConfig.valueFormat)}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Peak</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatChartValue(trendStats.maxValue, metricConfig.valueFormat)}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Volatility</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {trendStats.volatility.toFixed(1)}%
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Insights */}
          {showInsights && trendData?.insights && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Trend Insights
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {trendData.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
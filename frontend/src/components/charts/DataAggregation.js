/**
 * Data Aggregation Component
 * Provides data grouping and aggregation options for analysis
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import BarChart from './BarChart';
import { formatChartValue } from './BaseChart';
import { apiClient } from '../../lib/api/client';
import { 
  FunnelIcon, 
  ChartBarIcon, 
  TableCellsIcon,
  ArrowsUpDownIcon, 
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} AggregationConfig
 * @property {string} field - Field to aggregate
 * @property {'sum'|'avg'|'count'|'min'|'max'} operation - Aggregation operation
 * @property {string} groupBy - Field to group by
 * @property {'asc'|'desc'} sortOrder - Sort order
 */

/**
 * Aggregation options
 */
const AGGREGATION_FIELDS = [
  { value: 'applications', label: 'Applications', format: 'number' },
  { value: 'revenue', label: 'Revenue', format: 'currency' },
  { value: 'processing_time', label: 'Processing Time', format: 'number' },
  { value: 'approval_rate', label: 'Approval Rate', format: 'percentage' },
];

const AGGREGATION_OPERATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

const GROUP_BY_OPTIONS = [
  { value: 'department', label: 'Department' },
  { value: 'application_type', label: 'Application Type' },
  { value: 'status', label: 'Status' },
  { value: 'employee', label: 'Employee' },
  { value: 'date', label: 'Date' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

/**
 * Data Aggregation Component
 * @param {Object} props
 * @param {Object} props.timeRange - Time range object
 * @param {AggregationConfig} [props.defaultConfig] - Default aggregation configuration
 * @param {function} [props.onDrillDown] - Drill-down handler
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 * @param {string} [props.className] - Additional CSS classes
 */
const DataAggregation = ({
  timeRange,
  defaultConfig = {
    field: 'applications',
    operation: 'sum',
    groupBy: 'department',
    sortOrder: 'desc',
  },
  onDrillDown,
  isDarkMode = false,
  className = '',
}) => {
  const [config, setConfig] = useState(defaultConfig);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  // Fetch aggregated data
  const { data: aggregatedData, isLoading, error } = useQuery({
    queryKey: ['data-aggregation', config, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        field: config.field,
        operation: config.operation,
        groupBy: config.groupBy,
        sortOrder: config.sortOrder,
        startDate: timeRange.startDate.toISOString(),
        endDate: timeRange.endDate.toISOString(),
      });
      
      const response = await apiClient.request(`/api/analytics/aggregation?${params}`);
      return response.data;
    },
    enabled: !!timeRange.startDate && !!timeRange.endDate,
  });

  // Process data for visualization
  const chartData = useMemo(() => {
    if (!aggregatedData?.results) return { labels: [], datasets: [] };

    const labels = aggregatedData.results.map(item => item.group);
    const data = aggregatedData.results.map(item => item.value);

    return {
      labels,
      datasets: [{
        label: `${AGGREGATION_OPERATIONS.find(op => op.value === config.operation)?.label} of ${AGGREGATION_FIELDS.find(f => f.value === config.field)?.label}`,
        data,
        backgroundColor: '#3b82f6',
      }],
    };
  }, [aggregatedData, config]);

  // Get value format for the selected field
  const getValueFormat = () => {
    const field = AGGREGATION_FIELDS.find(f => f.value === config.field);
    return field?.format || 'number';
  };

  // Handle configuration changes
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Handle chart drill-down
  const handleChartDrillDown = (data) => {
    if (onDrillDown) {
      onDrillDown({
        type: 'aggregation',
        config,
        data,
        timeRange,
      });
    }
  };

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <ChartBarIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load aggregated data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {error.message || 'An error occurred while aggregating data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Data Aggregation
            </h3>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`p-2 rounded-md ${
                viewMode === 'chart'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md ${
                viewMode === 'table'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field
            </label>
            <select
              value={config.field}
              onChange={(e) => handleConfigChange('field', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {AGGREGATION_FIELDS.map(field => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Operation
            </label>
            <select
              value={config.operation}
              onChange={(e) => handleConfigChange('operation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {AGGREGATION_OPERATIONS.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group By Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group By
            </label>
            <select
              value={config.groupBy}
              onChange={(e) => handleConfigChange('groupBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {GROUP_BY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Order
            </label>
            <select
              value={config.sortOrder}
              onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'chart' ? (
          <BarChart
            data={chartData}
            valueFormat={getValueFormat()}
            loading={isLoading}
            isDarkMode={isDarkMode}
            onBarClick={handleChartDrillDown}
          />
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                ))}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {GROUP_BY_OPTIONS.find(opt => opt.value === config.groupBy)?.label}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {AGGREGATION_OPERATIONS.find(op => op.value === config.operation)?.label} of {AGGREGATION_FIELDS.find(f => f.value === config.field)?.label}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {aggregatedData?.results?.map((item, index) => {
                    const total = aggregatedData.results.reduce((sum, r) => sum + r.value, 0);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    
                    return (
                      <tr 
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleChartDrillDown({ label: item.group, value: item.value })}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.group}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatChartValue(item.value, getValueFormat())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {aggregatedData?.summary && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Records:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {aggregatedData.summary.totalRecords}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Groups:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {aggregatedData.summary.groupCount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Value:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {formatChartValue(aggregatedData.summary.totalValue, getValueFormat())}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAggregation;
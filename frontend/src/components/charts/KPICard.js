/**
 * KPI Card Component
 * Displays key performance indicators with trend information
 */
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatChartValue } from './BaseChart';

/**
 * @typedef {Object} KPIData
 * @property {string} title - KPI title
 * @property {number} value - Current value
 * @property {number} [previousValue] - Previous period value for trend calculation
 * @property {'currency'|'percentage'|'number'|'compact'} [format] - Value format type
 * @property {string} [unit] - Unit suffix (e.g., 'applications', 'users')
 * @property {string} [description] - Additional description
 * @property {'positive'|'negative'|'neutral'} [trendType] - How to interpret trend direction
 */

/**
 * KPI Card Component
 * @param {Object} props
 * @param {KPIData} props.data - KPI data
 * @param {string} [props.className] - Additional CSS classes
 * @param {function} [props.onClick] - Click handler for drill-down
 * @param {boolean} [props.loading] - Loading state
 */
const KPICard = ({ 
  data, 
  className = '', 
  onClick, 
  loading = false, 
}) => {
  const {
    title,
    value,
    previousValue,
    format = 'number',
    unit = '',
    description,
    trendType = 'positive',
  } = data;

  // Calculate trend
  const trend = previousValue !== undefined && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : null;

  const isPositiveTrend = trend > 0;
  const isNegativeTrend = trend < 0;
  
  // Determine trend color based on trend type and direction
  const getTrendColor = () => {
    if (trend === null || trend === 0) return 'text-gray-500';
    
    if (trendType === 'positive') {
      return isPositiveTrend ? 'text-green-600' : 'text-red-600';
    } else if (trendType === 'negative') {
      return isPositiveTrend ? 'text-red-600' : 'text-green-600';
    }
    
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === null || trend === 0) return null;
    
    return isPositiveTrend ? (
      <ArrowUpIcon className="h-4 w-4" />
    ) : (
      <ArrowDownIcon className="h-4 w-4" />
    );
  };

  const formattedValue = formatChartValue(value, format);
  const formattedTrend = trend !== null ? Math.abs(trend).toFixed(1) : null;

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
        ${loading ? 'animate-pulse' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </h3>
            {onClick && (
              <div className="text-gray-400 dark:text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formattedValue}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {formattedTrend !== null && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {formattedTrend}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs previous
                </span>
              </div>
            )}
            
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
                {description}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KPICard;
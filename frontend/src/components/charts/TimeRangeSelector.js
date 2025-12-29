/**
 * Time Range Selector Component
 * Provides preset and custom time range selection for historical data analysis
 */
import React, { useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';

/**
 * @typedef {Object} TimeRange
 * @property {Date} startDate - Start date of the range
 * @property {Date} endDate - End date of the range
 * @property {string} label - Human-readable label
 * @property {string} value - Unique identifier
 */

/**
 * Preset time ranges
 */
const PRESET_RANGES = [
  {
    value: '7d',
    label: 'Last 7 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 7)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    value: '30d',
    label: 'Last 30 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    value: '90d',
    label: 'Last 90 days',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 90)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    value: '6m',
    label: 'Last 6 months',
    getRange: () => ({
      startDate: startOfDay(subMonths(new Date(), 6)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    value: '1y',
    label: 'Last year',
    getRange: () => ({
      startDate: startOfDay(subYears(new Date(), 1)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    value: 'ytd',
    label: 'Year to date',
    getRange: () => ({
      startDate: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
      endDate: endOfDay(new Date()),
    }),
  },
];

/**
 * Time Range Selector Component
 * @param {Object} props
 * @param {string} props.selectedRange - Currently selected range value
 * @param {function} props.onRangeChange - Callback when range changes
 * @param {boolean} [props.allowCustomRange] - Whether to allow custom date selection
 * @param {string} [props.className] - Additional CSS classes
 */
const TimeRangeSelector = ({
  selectedRange,
  onRangeChange,
  allowCustomRange = true,
  className = '',
}) => {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Handle preset range selection
  const handlePresetChange = (rangeValue) => {
    const preset = PRESET_RANGES.find(r => r.value === rangeValue);
    if (preset) {
      const range = preset.getRange();
      onRangeChange({
        value: rangeValue,
        label: preset.label,
        startDate: range.startDate,
        endDate: range.endDate,
      });
    }
    setShowCustomRange(false);
  };

  // Handle custom range application
  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      const startDate = startOfDay(new Date(customStartDate));
      const endDate = endOfDay(new Date(customEndDate));
      
      if (startDate <= endDate) {
        onRangeChange({
          value: 'custom',
          label: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
          startDate,
          endDate,
        });
        setShowCustomRange(false);
      }
    }
  };

  // Get current range info
  const getCurrentRange = () => {
    if (selectedRange === 'custom') {
      return { label: 'Custom Range' };
    }
    return PRESET_RANGES.find(r => r.value === selectedRange) || PRESET_RANGES[1];
  };

  const currentRange = getCurrentRange();

  return (
    <div className={`relative ${className}`}>
      {/* Main Selector */}
      <div className="flex items-center space-x-2">
        <ClockIcon className="h-5 w-5 text-gray-400" />
        
        {/* Preset Range Dropdown */}
        <select
          value={selectedRange}
          onChange={(e) => {
            if (e.target.value === 'custom') {
              setShowCustomRange(true);
            } else {
              handlePresetChange(e.target.value);
            }
          }}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
        >
          {PRESET_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
          {allowCustomRange && (
            <option value="custom">Custom Range</option>
          )}
        </select>

        {/* Custom Range Button */}
        {allowCustomRange && (
          <button
            onClick={() => setShowCustomRange(!showCustomRange)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Custom Range Picker */}
      {showCustomRange && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Select Custom Date Range
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowCustomRange(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangeSelector;
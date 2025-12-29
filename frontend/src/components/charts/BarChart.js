/**
 * Bar Chart Component
 * Displays data in vertical or horizontal bar format with drill-down capabilities
 */
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { getBaseChartOptions, generateColorPalette, formatChartValue } from './BaseChart';

/**
 * @typedef {Object} BarChartData
 * @property {string[]} labels - Chart labels
 * @property {Object[]} datasets - Chart datasets
 * @property {string} datasets[].label - Dataset label
 * @property {number[]} datasets[].data - Dataset values
 * @property {string} [datasets[].backgroundColor] - Bar background color
 * @property {string} [datasets[].borderColor] - Bar border color
 */

/**
 * Bar Chart Component
 * @param {Object} props
 * @param {BarChartData} props.data - Chart data
 * @param {string} [props.title] - Chart title
 * @param {boolean} [props.horizontal] - Whether to display horizontal bars
 * @param {boolean} [props.stacked] - Whether to stack bars
 * @param {'currency'|'percentage'|'number'|'compact'} [props.valueFormat] - Value format type
 * @param {function} [props.onBarClick] - Click handler for drill-down
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 */
const BarChart = ({
  data,
  title,
  horizontal = false,
  stacked = false,
  valueFormat = 'number',
  onBarClick,
  loading = false,
  className = '',
  isDarkMode = false,
}) => {
  // Prepare chart data with colors
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || generateColorPalette(data.datasets.length)[index],
      borderColor: dataset.borderColor || generateColorPalette(data.datasets.length)[index],
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    })),
  };

  // Chart options
  const options = {
    ...getBaseChartOptions(title, isDarkMode),
    indexAxis: horizontal ? 'y' : 'x',
    scales: {
      x: {
        ...getBaseChartOptions(title, isDarkMode).scales.x,
        stacked: stacked,
        ticks: {
          ...getBaseChartOptions(title, isDarkMode).scales.x.ticks,
          callback: function(value) {
            if (horizontal) {
              return formatChartValue(value, valueFormat);
            }
            return value;
          },
        },
      },
      y: {
        ...getBaseChartOptions(title, isDarkMode).scales.y,
        stacked: stacked,
        ticks: {
          ...getBaseChartOptions(title, isDarkMode).scales.y.ticks,
          callback: function(value) {
            if (!horizontal) {
              return formatChartValue(value, valueFormat);
            }
            return value;
          },
        },
      },
    },
    plugins: {
      ...getBaseChartOptions(title, isDarkMode).plugins,
      tooltip: {
        ...getBaseChartOptions(title, isDarkMode).plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = formatChartValue(context.parsed.y || context.parsed.x, valueFormat);
            return `${label}: ${value}`;
          },
        },
      },
    },
    onClick: onBarClick ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const label = data.labels[index];
        const dataset = data.datasets[datasetIndex];
        const value = dataset.data[index];
        
        onBarClick({
          label,
          value,
          datasetLabel: dataset.label,
          datasetIndex,
          index,
        });
      }
    } : undefined,
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="h-64 md:h-80">
        <Bar data={chartData} options={options} />
      </div>
      
      {onBarClick && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Click on bars to drill down for more details
        </div>
      )}
    </div>
  );
};

export default BarChart;
/**
 * Line Chart Component
 * Displays time series data with trend analysis capabilities
 */
import React from 'react';
import { Line } from 'react-chartjs-2';
import { getBaseChartOptions, generateColorPalette, formatChartValue } from './BaseChart';

/**
 * @typedef {Object} LineChartData
 * @property {string[]} labels - Chart labels (typically dates/times)
 * @property {Object[]} datasets - Chart datasets
 * @property {string} datasets[].label - Dataset label
 * @property {number[]} datasets[].data - Dataset values
 * @property {string} [datasets[].borderColor] - Line color
 * @property {string} [datasets[].backgroundColor] - Fill color
 * @property {boolean} [datasets[].fill] - Whether to fill area under line
 */

/**
 * Line Chart Component
 * @param {Object} props
 * @param {LineChartData} props.data - Chart data
 * @param {string} [props.title] - Chart title
 * @param {boolean} [props.smooth] - Whether to use smooth curves
 * @param {boolean} [props.showPoints] - Whether to show data points
 * @param {boolean} [props.fill] - Whether to fill area under lines
 * @param {'currency'|'percentage'|'number'|'compact'} [props.valueFormat] - Value format type
 * @param {function} [props.onPointClick] - Click handler for drill-down
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 */
const LineChart = ({
  data,
  title,
  smooth = true,
  showPoints = true,
  fill = false,
  valueFormat = 'number',
  onPointClick,
  loading = false,
  className = '',
  isDarkMode = false,
}) => {
  // Prepare chart data with colors and styling
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colors = generateColorPalette(data.datasets.length);
      const color = dataset.borderColor || colors[index];
      
      return {
        ...dataset,
        borderColor: color,
        backgroundColor: dataset.backgroundColor || (fill ? `${color}20` : 'transparent'),
        fill: dataset.fill !== undefined ? dataset.fill : fill,
        tension: smooth ? 0.4 : 0,
        pointRadius: showPoints ? 4 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      };
    }),
  };

  // Chart options
  const options = {
    ...getBaseChartOptions(title, isDarkMode),
    scales: {
      ...getBaseChartOptions(title, isDarkMode).scales,
      y: {
        ...getBaseChartOptions(title, isDarkMode).scales.y,
        ticks: {
          ...getBaseChartOptions(title, isDarkMode).scales.y.ticks,
          callback: function(value) {
            return formatChartValue(value, valueFormat);
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
            const value = formatChartValue(context.parsed.y, valueFormat);
            return `${label}: ${value}`;
          },
        },
      },
    },
    onClick: onPointClick ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const label = data.labels[index];
        const dataset = data.datasets[datasetIndex];
        const value = dataset.data[index];
        
        onPointClick({
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
        <Line data={chartData} options={options} />
      </div>
      
      {onPointClick && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Click on data points to drill down for more details
        </div>
      )}
    </div>
  );
};

export default LineChart;
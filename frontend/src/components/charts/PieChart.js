/**
 * Pie Chart Component
 * Displays data distribution with drill-down capabilities
 */
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { getBaseChartOptions, generateColorPalette, formatChartValue } from './BaseChart';

/**
 * @typedef {Object} PieChartData
 * @property {string[]} labels - Chart labels
 * @property {Object[]} datasets - Chart datasets (typically one for pie charts)
 * @property {string} datasets[].label - Dataset label
 * @property {number[]} datasets[].data - Dataset values
 * @property {string[]} [datasets[].backgroundColor] - Segment colors
 */

/**
 * Pie Chart Component
 * @param {Object} props
 * @param {PieChartData} props.data - Chart data
 * @param {string} [props.title] - Chart title
 * @param {boolean} [props.showLegend] - Whether to show legend
 * @param {boolean} [props.showPercentages] - Whether to show percentages in tooltips
 * @param {'currency'|'percentage'|'number'|'compact'} [props.valueFormat] - Value format type
 * @param {function} [props.onSegmentClick] - Click handler for drill-down
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 */
const PieChart = ({
  data,
  title,
  showLegend = true,
  showPercentages = true,
  valueFormat = 'number',
  onSegmentClick,
  loading = false,
  className = '',
  isDarkMode = false,
}) => {
  // Calculate total for percentage calculations
  const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;

  // Prepare chart data with colors
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || generateColorPalette(data.labels.length),
      borderColor: isDarkMode ? '#374151' : '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    })),
  };

  // Chart options
  const options = {
    ...getBaseChartOptions(title, isDarkMode),
    plugins: {
      ...getBaseChartOptions(title, isDarkMode).plugins,
      legend: {
        ...getBaseChartOptions(title, isDarkMode).plugins.legend,
        display: showLegend,
        position: 'right',
        labels: {
          ...getBaseChartOptions(title, isDarkMode).plugins.legend.labels,
          usePointStyle: true,
          padding: 20,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: showPercentages ? `${label} (${percentage}%)` : label,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        ...getBaseChartOptions(title, isDarkMode).plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatChartValue(context.parsed, valueFormat);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            
            if (showPercentages) {
              return `${label}: ${value} (${percentage}%)`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    onClick: onSegmentClick ? (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const label = data.labels[index];
        const value = data.datasets[0].data[index];
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        
        onSegmentClick({
          label,
          value,
          percentage: parseFloat(percentage),
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
          <div className="flex items-center justify-center">
            <div className="h-64 w-64 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="h-64 md:h-80 flex items-center justify-center">
        <Pie data={chartData} options={options} />
      </div>
      
      {onSegmentClick && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Click on segments to drill down for more details
        </div>
      )}
    </div>
  );
};

export default PieChart;
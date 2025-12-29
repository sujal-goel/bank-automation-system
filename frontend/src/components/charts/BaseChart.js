/**
 * Base Chart Component
 * Provides common chart functionality and styling for all chart types
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

/**
 * Common chart options for consistent styling
 */
export const getBaseChartOptions = (title, isDarkMode = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: isDarkMode ? '#e5e7eb' : '#374151',
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif',
        },
      },
    },
    title: {
      display: !!title,
      text: title,
      color: isDarkMode ? '#f9fafb' : '#111827',
      font: {
        size: 16,
        weight: 'bold',
        family: 'Inter, system-ui, sans-serif',
      },
    },
    tooltip: {
      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
      titleColor: isDarkMode ? '#f9fafb' : '#111827',
      bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
      borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      intersect: false,
      mode: 'index',
    },
  },
  scales: {
    x: {
      grid: {
        color: isDarkMode ? '#374151' : '#f3f4f6',
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
      },
      ticks: {
        color: isDarkMode ? '#d1d5db' : '#6b7280',
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif',
        },
      },
    },
    y: {
      grid: {
        color: isDarkMode ? '#374151' : '#f3f4f6',
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
      },
      ticks: {
        color: isDarkMode ? '#d1d5db' : '#6b7280',
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif',
        },
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart',
  },
});

/**
 * Color palette for charts
 */
export const chartColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

/**
 * Generate color palette for multiple data series
 */
export const generateColorPalette = (count) => {
  const colors = Object.values(chartColors);
  const palette = [];
  
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }
  
  return palette;
};

/**
 * Format numbers for display in charts
 */
export const formatChartValue = (value, type = 'number') => {
  if (typeof value !== 'number') return value;
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

export default ChartJS;
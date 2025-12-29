/**
 * Analytics Dashboard Component
 * Main dashboard for displaying KPIs and interactive visualizations
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import KPICard from './KPICard';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import { apiClient } from '../../lib/api/client';

/**
 * @typedef {Object} DashboardData
 * @property {Object} kpis - Key performance indicators
 * @property {Object} applicationTrends - Application trend data
 * @property {Object} processingMetrics - Processing time metrics
 * @property {Object} statusDistribution - Application status distribution
 * @property {Object} departmentWorkload - Department workload data
 */

/**
 * Analytics Dashboard Component
 * @param {Object} props
 * @param {string} [props.timeRange] - Time range for data ('7d', '30d', '90d', '1y')
 * @param {function} [props.onDrillDown] - Drill-down handler
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 * @param {string} [props.className] - Additional CSS classes
 */
const AnalyticsDashboard = ({
  timeRange = '30d',
  onDrillDown,
  isDarkMode = false,
  className = '',
}) => {
  const [selectedKPI, setSelectedKPI] = useState(null);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await apiClient.request(`/api/analytics/dashboard?timeRange=${timeRange}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  // Handle KPI card clicks for drill-down
  const handleKPIClick = (kpiType) => {
    setSelectedKPI(kpiType);
    if (onDrillDown) {
      onDrillDown({ type: 'kpi', kpiType, timeRange });
    }
  };

  // Handle chart drill-down
  const handleChartDrillDown = (chartType, data) => {
    if (onDrillDown) {
      onDrillDown({ type: 'chart', chartType, data, timeRange });
    }
  };

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load analytics data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error.message || 'An error occurred while fetching analytics data'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          data={{
            title: 'Total Applications',
            value: analyticsData?.kpis?.totalApplications || 0,
            previousValue: analyticsData?.kpis?.previousTotalApplications,
            format: 'number',
            unit: 'applications',
            description: `Last ${timeRange}`,
            trendType: 'positive',
          }}
          loading={isLoading}
          onClick={() => handleKPIClick('totalApplications')}
        />
        
        <KPICard
          data={{
            title: 'Approval Rate',
            value: analyticsData?.kpis?.approvalRate || 0,
            previousValue: analyticsData?.kpis?.previousApprovalRate,
            format: 'percentage',
            description: `Last ${timeRange}`,
            trendType: 'positive',
          }}
          loading={isLoading}
          onClick={() => handleKPIClick('approvalRate')}
        />
        
        <KPICard
          data={{
            title: 'Avg Processing Time',
            value: analyticsData?.kpis?.avgProcessingTime || 0,
            previousValue: analyticsData?.kpis?.previousAvgProcessingTime,
            format: 'number',
            unit: 'hours',
            description: `Last ${timeRange}`,
            trendType: 'negative', // Lower processing time is better
          }}
          loading={isLoading}
          onClick={() => handleKPIClick('avgProcessingTime')}
        />
        
        <KPICard
          data={{
            title: 'Revenue Impact',
            value: analyticsData?.kpis?.revenueImpact || 0,
            previousValue: analyticsData?.kpis?.previousRevenueImpact,
            format: 'currency',
            description: `Last ${timeRange}`,
            trendType: 'positive',
          }}
          loading={isLoading}
          onClick={() => handleKPIClick('revenueImpact')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trends Line Chart */}
        <LineChart
          data={{
            labels: analyticsData?.applicationTrends?.labels || [],
            datasets: [
              {
                label: 'Applications Submitted',
                data: analyticsData?.applicationTrends?.submitted || [],
                borderColor: '#3b82f6',
                fill: true,
              },
              {
                label: 'Applications Approved',
                data: analyticsData?.applicationTrends?.approved || [],
                borderColor: '#22c55e',
                fill: true,
              },
            ],
          }}
          title="Application Trends"
          valueFormat="number"
          loading={isLoading}
          isDarkMode={isDarkMode}
          onPointClick={(data) => handleChartDrillDown('applicationTrends', data)}
        />

        {/* Processing Time Bar Chart */}
        <BarChart
          data={{
            labels: analyticsData?.processingMetrics?.labels || [],
            datasets: [
              {
                label: 'Average Processing Time (hours)',
                data: analyticsData?.processingMetrics?.data || [],
                backgroundColor: '#f59e0b',
              },
            ],
          }}
          title="Processing Time by Application Type"
          valueFormat="number"
          loading={isLoading}
          isDarkMode={isDarkMode}
          onBarClick={(data) => handleChartDrillDown('processingMetrics', data)}
        />

        {/* Status Distribution Pie Chart */}
        <PieChart
          data={{
            labels: analyticsData?.statusDistribution?.labels || [],
            datasets: [
              {
                label: 'Applications',
                data: analyticsData?.statusDistribution?.data || [],
              },
            ],
          }}
          title="Application Status Distribution"
          valueFormat="number"
          loading={isLoading}
          isDarkMode={isDarkMode}
          onSegmentClick={(data) => handleChartDrillDown('statusDistribution', data)}
        />

        {/* Department Workload Bar Chart */}
        <BarChart
          data={{
            labels: analyticsData?.departmentWorkload?.labels || [],
            datasets: [
              {
                label: 'Pending Tasks',
                data: analyticsData?.departmentWorkload?.pending || [],
                backgroundColor: '#ef4444',
              },
              {
                label: 'Completed Tasks',
                data: analyticsData?.departmentWorkload?.completed || [],
                backgroundColor: '#22c55e',
              },
            ],
          }}
          title="Department Workload"
          stacked={true}
          valueFormat="number"
          loading={isLoading}
          isDarkMode={isDarkMode}
          onBarClick={(data) => handleChartDrillDown('departmentWorkload', data)}
        />
      </div>

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live data - Updates every 30 seconds</span>
        </div>
        <div>
          Last updated: {analyticsData?.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleTimeString() : 'Loading...'}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
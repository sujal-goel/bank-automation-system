/**
 * Employee Workspace Page
 * Main workspace for employees with role-based content and task overview
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  DocumentCheckIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Mock data - replace with actual API calls
const mockDashboardData = {
  pendingTasks: 12,
  completedToday: 8,
  urgentTasks: 3,
  totalApplications: 45,
  approvedApplications: 32,
  rejectedApplications: 8,
  pendingApplications: 5,
  averageProcessingTime: '2.5 hours',
  workloadScore: 75,
};

const mockRecentTasks = [
  {
    id: 1,
    type: 'Loan Application Review',
    applicantName: 'Rajesh Kumar',
    applicationId: 'LA-2024-001',
    priority: 'high',
    dueDate: '2024-01-15',
    status: 'pending',
  },
  {
    id: 2,
    type: 'Document Verification',
    applicantName: 'Priya Sharma',
    applicationId: 'DOC-2024-045',
    priority: 'medium',
    dueDate: '2024-01-16',
    status: 'in_progress',
  },
  {
    id: 3,
    type: 'Account Opening Review',
    applicantName: 'Amit Patel',
    applicationId: 'ACC-2024-023',
    priority: 'low',
    dueDate: '2024-01-17',
    status: 'pending',
  },
];

export default function EmployeeWorkspace() {
  const { user, hasPermission } = useAuthStore();
  const { showInfo } = useNotifications();
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [recentTasks, setRecentTasks] = useState(mockRecentTasks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        // In real implementation, make API calls here
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Employee'}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your tasks today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DocumentCheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.completedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.urgentTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workload Score</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.workloadScore}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{task.type}</h3>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Applicant: {task.applicantName}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>ID: {task.applicationId}</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    View All Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics & Quick Actions */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            {hasPermission('view_reports') && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applications Processed</span>
                    <span className="font-semibold">{dashboardData.totalApplications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">{dashboardData.approvedApplications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="font-semibold text-red-600">{dashboardData.rejectedApplications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Processing Time</span>
                    <span className="font-semibold">{dashboardData.averageProcessingTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                {hasPermission('process_applications') && (
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <DocumentCheckIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Review Applications
                  </button>
                )}
                
                {hasPermission('manage_tasks') && (
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Manage Tasks
                  </button>
                )}

                {hasPermission('view_reports') && (
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <ChartBarIcon className="w-5 h-5 mr-2 text-gray-600" />
                    View Reports
                  </button>
                )}

                <button 
                  onClick={() => showInfo('Feature Coming Soon', 'This feature will be available in the next update')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5 mr-2 text-gray-600" />
                  Customer Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
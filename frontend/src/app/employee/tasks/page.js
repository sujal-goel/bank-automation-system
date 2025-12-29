/**
 * Employee Tasks Page
 * Enhanced task management interface with filtering, sorting, and API integration
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Enhanced mock tasks data with more details
const mockTasks = [
  {
    id: 1,
    type: 'Loan Application Review',
    applicantName: 'Rajesh Kumar',
    applicationId: 'LA-2024-001',
    priority: 'high',
    dueDate: '2024-01-15',
    status: 'pending',
    assignedDate: '2024-01-10',
    description: 'Review personal loan application for ₹5,00,000',
    estimatedTime: 45,
    actualTime: 0,
    category: 'review',
    assignedBy: 'Priya Sharma',
    tags: ['loan', 'personal', 'urgent'],
  },
  {
    id: 2,
    type: 'Document Verification',
    applicantName: 'Priya Sharma',
    applicationId: 'DOC-2024-045',
    priority: 'medium',
    dueDate: '2024-01-16',
    status: 'in_progress',
    assignedDate: '2024-01-12',
    description: 'Verify KYC documents for account opening',
    estimatedTime: 30,
    actualTime: 15,
    category: 'verification',
    assignedBy: 'Amit Patel',
    tags: ['kyc', 'documents', 'account'],
  },
  {
    id: 3,
    type: 'Account Opening Review',
    applicantName: 'Amit Patel',
    applicationId: 'ACC-2024-023',
    priority: 'low',
    dueDate: '2024-01-17',
    status: 'pending',
    assignedDate: '2024-01-13',
    description: 'Review savings account opening application',
    estimatedTime: 20,
    actualTime: 0,
    category: 'review',
    assignedBy: 'Sunita Gupta',
    tags: ['account', 'savings'],
  },
  {
    id: 4,
    type: 'Credit Assessment',
    applicantName: 'Sunita Gupta',
    applicationId: 'CA-2024-012',
    priority: 'high',
    dueDate: '2024-01-14',
    status: 'completed',
    assignedDate: '2024-01-08',
    description: 'Assess creditworthiness for business loan',
    estimatedTime: 60,
    actualTime: 55,
    category: 'assessment',
    assignedBy: 'Rajesh Kumar',
    tags: ['credit', 'business', 'loan'],
  },
  {
    id: 5,
    type: 'Risk Analysis',
    applicantName: 'Neha Singh',
    applicationId: 'RA-2024-008',
    priority: 'medium',
    dueDate: '2024-01-18',
    status: 'pending',
    assignedDate: '2024-01-14',
    description: 'Conduct risk analysis for high-value loan application',
    estimatedTime: 90,
    actualTime: 0,
    category: 'analysis',
    assignedBy: 'Priya Sharma',
    tags: ['risk', 'analysis', 'high-value'],
  },
];

export default function TasksPage() {
  const { hasPermission } = useAuthStore();
  const { showSuccess, showError, showInfo } = useNotifications();
  const [tasks, setTasks] = useState(mockTasks);
  const [filteredTasks, setFilteredTasks] = useState(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'dueDate' || sortBy === 'assignedDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'in_progress': return <PlayIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'paused': return <PauseIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'verification': return 'bg-green-100 text-green-800';
      case 'assessment': return 'bg-purple-100 text-purple-800';
      case 'analysis': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskAction = async (taskId, action) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          switch (action) {
            case 'start':
              return { ...task, status: 'in_progress' };
            case 'pause':
              return { ...task, status: 'paused' };
            case 'resume':
              return { ...task, status: 'in_progress' };
            case 'complete':
              return { ...task, status: 'completed' };
            default:
              return task;
          }
        }
        return task;
      }));

      showSuccess('Task Updated', `Task has been ${action}ed successfully`);
    } catch (error) {
      showError('Action Failed', 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedTasks.length === 0) {
      showInfo('No Selection', 'Please select tasks to perform bulk actions');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTasks(prev => prev.map(task => {
        if (selectedTasks.includes(task.id)) {
          switch (action) {
            case 'start':
              return { ...task, status: 'in_progress' };
            case 'complete':
              return { ...task, status: 'completed' };
            default:
              return task;
          }
        }
        return task;
      }));

      setSelectedTasks([]);
      showSuccess('Bulk Action Completed', `${selectedTasks.length} tasks have been ${action}ed`);
    } catch (error) {
      showError('Bulk Action Failed', 'Failed to update selected tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId],
    );
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (!hasPermission('manage_tasks')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-2">Manage and track your assigned tasks with advanced filtering and sorting</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, applicants, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="review">Review</option>
              <option value="verification">Verification</option>
              <option value="assessment">Assessment</option>
              <option value="analysis">Analysis</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="assignedDate-desc">Recently Assigned</option>
              <option value="estimatedTime-asc">Time (Shortest)</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedTasks.length > 0 && (
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedTasks.length} task(s) selected
              </span>
              <button
                onClick={() => handleBulkAction('start')}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Start Selected
              </button>
              <button
                onClick={() => handleBulkAction('complete')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                Complete Selected
              </button>
              <button
                onClick={() => setSelectedTasks([])}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Tasks ({filteredTasks.length})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleSort('dueDate')}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowsUpDownIcon className="w-4 h-4 mr-1" />
                  Sort by Due Date
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No tasks found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {/* Checkbox for bulk selection */}
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="mt-1 mr-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">
                            {task.type}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1">{task.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-500 mb-3">
                          <div>
                            <span className="font-medium">Applicant:</span>
                            <br />
                            {task.applicantName}
                          </div>
                          <div>
                            <span className="font-medium">Application ID:</span>
                            <br />
                            {task.applicationId}
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span>
                            <br />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Estimated Time:</span>
                            <br />
                            {task.estimatedTime} min
                          </div>
                          <div>
                            <span className="font-medium">Assigned By:</span>
                            <br />
                            {task.assignedBy}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Link>

                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'start')}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Start Task
                        </button>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleTaskAction(task.id, 'pause')}
                            disabled={loading}
                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => handleTaskAction(task.id, 'complete')}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Complete
                          </button>
                        </>
                      )}

                      {task.status === 'paused' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'resume')}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
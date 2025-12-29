/**
 * Process Monitor Component
 * Displays real-time process status with drill-down capabilities
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  CogIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} ProcessStatus
 * @property {string} id - Process ID
 * @property {string} name - Process name
 * @property {'running'|'completed'|'failed'|'paused'|'pending'} status - Current status
 * @property {number} progress - Progress percentage (0-100)
 * @property {Date} startTime - Process start time
 * @property {Date} [endTime] - Process end time
 * @property {string} [error] - Error message if failed
 * @property {Object} metadata - Additional process metadata
 */

/**
 * Process Monitor Component
 * @param {Object} props
 * @param {string[]} [props.processTypes] - Types of processes to monitor
 * @param {function} [props.onProcessClick] - Process click handler for drill-down
 * @param {function} [props.onProcessAction] - Process action handler
 * @param {boolean} [props.showControls] - Whether to show process controls
 * @param {boolean} [props.isDarkMode] - Dark mode flag
 * @param {string} [props.className] - Additional CSS classes
 */
const ProcessMonitor = ({
  processTypes = ['loan_processing', 'kyc_verification', 'document_processing', 'payment_processing'],
  onProcessClick,
  onProcessAction,
  showControls = true,
  isDarkMode = false,
  className = '',
}) => {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch process data
  const { data: processData, isLoading, error } = useQuery({
    queryKey: ['process-monitor', processTypes, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        types: processTypes.join(','),
        filter: filter !== 'all' ? filter : '',
        search: searchTerm,
      });
      
      const response = await apiClient.request(`/api/analytics/processes?${params}`);
      return response.data;
    },
    refetchInterval: 3000, // Refresh every 3 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });

  // WebSocket for real-time process updates
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    const ws = new WebSocket(`${wsUrl}/processes/monitor`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'process_update') {
          // Update the query cache with new process data
          queryClient.setQueryData(['process-monitor', processTypes, filter], oldData => {
            if (!oldData) return oldData;
            
            const updatedProcesses = oldData.processes.map(process => 
              process.id === data.payload.id ? { ...process, ...data.payload } : process,
            );
            
            return { ...oldData, processes: updatedProcesses };
          });
        }
      } catch (error) {
        console.error('Error parsing process update:', error);
      }
    };

    return () => ws.close();
  }, [processTypes, filter, queryClient]);

  // Handle process action
  const handleProcessAction = async (processId, action) => {
    try {
      await apiClient.request(`/api/analytics/processes/${processId}/action`, {
        method: 'POST',
        body: { action },
      });
      
      // Refresh data
      queryClient.invalidateQueries(['process-monitor']);
      
      if (onProcessAction) {
        onProcessAction(processId, action);
      }
    } catch (error) {
      console.error('Process action failed:', error);
    }
  };

  // Handle process drill-down
  const handleProcessClick = (process) => {
    setSelectedProcess(process);
    if (onProcessClick) {
      onProcessClick(process);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    const displays = {
      running: { 
        icon: CogIcon, 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        label: 'Running', 
      },
      completed: { 
        icon: CheckCircleIcon, 
        color: 'text-green-500', 
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        label: 'Completed', 
      },
      failed: { 
        icon: ExclamationCircleIcon, 
        color: 'text-red-500', 
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        label: 'Failed', 
      },
      paused: { 
        icon: PauseIcon, 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        label: 'Paused', 
      },
      pending: { 
        icon: ClockIcon, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        label: 'Pending', 
      },
    };
    
    return displays[status] || displays.pending;
  };

  // Calculate process duration
  const getProcessDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000); // seconds
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  // Filter processes based on search and filter
  const filteredProcesses = processData?.processes?.filter(process => {
    const matchesSearch = !searchTerm || 
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || process.status === filter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <ExclamationCircleIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load process data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {error.message || 'An error occurred while fetching process information'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Process Monitor
          </h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Processes</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="paused">Paused</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search processes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="text-center py-8">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No processes found
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No processes are currently running'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProcesses.map((process) => {
              const statusDisplay = getStatusDisplay(process.status);
              const StatusIcon = statusDisplay.icon;
              
              return (
                <div
                  key={process.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleProcessClick(process)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${statusDisplay.bgColor}`}>
                      <StatusIcon className={`h-5 w-5 ${statusDisplay.color} ${process.status === 'running' ? 'animate-spin' : ''}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {process.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID: {process.id}</span>
                        <span>Duration: {getProcessDuration(process.startTime, process.endTime)}</span>
                        {process.progress !== undefined && (
                          <span>Progress: {process.progress}%</span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      {process.progress !== undefined && process.status === 'running' && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${process.progress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {/* Error Message */}
                      {process.error && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          Error: {process.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Process Controls */}
                  {showControls && (
                    <div className="flex items-center space-x-2">
                      {process.status === 'running' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessAction(process.id, 'pause');
                          }}
                          className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                          title="Pause Process"
                        >
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {process.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessAction(process.id, 'resume');
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Resume Process"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {(process.status === 'running' || process.status === 'paused') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessAction(process.id, 'stop');
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Stop Process"
                        >
                          <StopIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {process.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessAction(process.id, 'retry');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Retry Process"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {processData?.summary && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {processData.summary.running || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Running</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {processData.summary.completed || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {processData.summary.failed || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {processData.summary.paused || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Paused</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  {processData.summary.pending || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessMonitor;
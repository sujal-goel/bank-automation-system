/**
 * Process Monitoring Dashboard Page
 * Displays automated process status with intervention capabilities
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';
import ProcessHistoryModal from '@/components/employee/ProcessHistoryModal';

// Mock process data - in real app, this would come from API
const mockProcesses = [
  {
    id: 'kyc-automation-001',
    name: 'KYC Document Verification',
    type: 'kyc_verification',
    status: 'running',
    progress: 75,
    startTime: '2024-01-15T09:00:00Z',
    lastActivity: '2024-01-15T14:30:00Z',
    processedItems: 142,
    totalItems: 189,
    errorCount: 3,
    successRate: 98.2,
    canIntervene: true,
    description: 'Automated verification of customer identity documents using OCR and AI validation',
    currentStep: 'Document Analysis',
    estimatedCompletion: '2024-01-15T16:45:00Z',
  },
  {
    id: 'loan-processing-002',
    name: 'Loan Application Processing',
    type: 'loan_processing',
    status: 'paused',
    progress: 45,
    startTime: '2024-01-15T08:30:00Z',
    lastActivity: '2024-01-15T12:15:00Z',
    processedItems: 23,
    totalItems: 51,
    errorCount: 1,
    successRate: 95.7,
    canIntervene: true,
    description: 'Automated loan application review and credit scoring',
    currentStep: 'Credit Bureau Check',
    pauseReason: 'Manual intervention required for high-risk application',
  },
  {
    id: 'aml-screening-003',
    name: 'AML Compliance Screening',
    type: 'aml_screening',
    status: 'completed',
    progress: 100,
    startTime: '2024-01-15T06:00:00Z',
    lastActivity: '2024-01-15T14:00:00Z',
    processedItems: 87,
    totalItems: 87,
    errorCount: 0,
    successRate: 100,
    canIntervene: false,
    description: 'Anti-Money Laundering compliance checks for new accounts',
    currentStep: 'Completed',
    completedAt: '2024-01-15T14:00:00Z',
  },
  {
    id: 'account-opening-004',
    name: 'Account Opening Automation',
    type: 'account_opening',
    status: 'error',
    progress: 30,
    startTime: '2024-01-15T10:00:00Z',
    lastActivity: '2024-01-15T11:30:00Z',
    processedItems: 15,
    totalItems: 50,
    errorCount: 8,
    successRate: 70.0,
    canIntervene: true,
    description: 'Automated new account creation and setup',
    currentStep: 'Account Validation',
    errorMessage: 'Database connection timeout - multiple retries failed',
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'running': return 'text-green-600 bg-green-50';
    case 'paused': return 'text-yellow-600 bg-yellow-50';
    case 'completed': return 'text-blue-600 bg-blue-50';
    case 'error': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'running': return <PlayIcon className="w-5 h-5" />;
    case 'paused': return <PauseIcon className="w-5 h-5" />;
    case 'completed': return <CheckCircleIcon className="w-5 h-5" />;
    case 'error': return <ExclamationTriangleIcon className="w-5 h-5" />;
    default: return <ClockIcon className="w-5 h-5" />;
  }
};

export default function ProcessMonitoringPage() {
  const { hasPermission } = useAuthStore();
  const { showSuccess, showError, showInfo } = useNotifications();
  const [processes, setProcesses] = useState(mockProcesses);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProcessForHistory, setSelectedProcessForHistory] = useState(null);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh process data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // In real app, fetch updated process data from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate some process updates
      setProcesses(prev => prev.map(process => {
        if (process.status === 'running') {
          return {
            ...process,
            progress: Math.min(100, process.progress + Math.random() * 5),
            processedItems: process.processedItems + Math.floor(Math.random() * 3),
            lastActivity: new Date().toISOString(),
          };
        }
        return process;
      }));
      
    } catch (error) {
      showError('Failed to refresh process data', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProcessAction = async (processId, action) => {
    try {
      // In real app, make API call to control process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcesses(prev => prev.map(process => {
        if (process.id === processId) {
          switch (action) {
            case 'pause':
              return { ...process, status: 'paused', pauseReason: 'Manually paused by operator' };
            case 'resume':
              return { ...process, status: 'running', pauseReason: null };
            case 'stop':
              return { ...process, status: 'stopped', progress: process.progress };
            case 'restart':
              return { ...process, status: 'running', errorCount: 0, errorMessage: null };
            default:
              return process;
          }
        }
        return process;
      }));
      
      showSuccess(`Process ${action}d successfully`);
    } catch (error) {
      showError(`Failed to ${action} process`, error.message);
    }
  };

  const handleViewHistory = (process) => {
    setSelectedProcessForHistory(process);
    setHistoryModalOpen(true);
  };

  const formatDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000 / 60); // minutes
    
    if (duration < 60) {
      return `${duration}m`;
    } else if (duration < 1440) {
      return `${Math.floor(duration / 60)}h ${duration % 60}m`;
    } else {
      return `${Math.floor(duration / 1440)}d ${Math.floor((duration % 1440) / 60)}h`;
    }
  };

  if (!hasPermission('monitor_processes')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to monitor processes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Process Monitoring</h1>
            <p className="text-gray-600 mt-2">
              Monitor and control automated banking processes
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Process Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlayIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processes.filter(p => p.status === 'running').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <PauseIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processes.filter(p => p.status === 'paused').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processes.filter(p => p.status === 'error').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(processes.reduce((sum, p) => sum + p.successRate, 0) / processes.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Process List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Processes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {processes.map((process) => (
                <div key={process.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(process.status)}`}>
                        {getStatusIcon(process.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{process.name}</h3>
                        <p className="text-sm text-gray-600">{process.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(process.status)}`}>
                        {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                      </span>
                      <button
                        onClick={() => handleViewHistory(process)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View Process History"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                      {process.canIntervene && (
                        <div className="flex space-x-1">
                          {process.status === 'running' && (
                            <button
                              onClick={() => handleProcessAction(process.id, 'pause')}
                              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Pause Process"
                            >
                              <PauseIcon className="w-4 h-4" />
                            </button>
                          )}
                          {process.status === 'paused' && (
                            <button
                              onClick={() => handleProcessAction(process.id, 'resume')}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Resume Process"
                            >
                              <PlayIcon className="w-4 h-4" />
                            </button>
                          )}
                          {process.status === 'error' && (
                            <button
                              onClick={() => handleProcessAction(process.id, 'restart')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Restart Process"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          )}
                          {(process.status === 'running' || process.status === 'paused') && (
                            <button
                              onClick={() => handleProcessAction(process.id, 'stop')}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Stop Process"
                            >
                              <StopIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress: {process.processedItems}/{process.totalItems} items</span>
                      <span>{process.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          process.status === 'error' ? 'bg-red-500' :
                            process.status === 'completed' ? 'bg-green-500' :
                              process.status === 'paused' ? 'bg-yellow-500' :
                                'bg-blue-500'
                        }`}
                        style={{ width: `${process.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Process Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Current Step:</span>
                      <p className="text-gray-900">{process.currentStep}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">
                        {formatDuration(process.startTime, process.completedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Success Rate:</span>
                      <p className="text-gray-900">{process.successRate}%</p>
                    </div>
                  </div>

                  {/* Error Message or Pause Reason */}
                  {process.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {process.errorMessage}
                      </p>
                    </div>
                  )}
                  
                  {process.pauseReason && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Paused:</strong> {process.pauseReason}
                      </p>
                    </div>
                  )}

                  {/* Estimated Completion */}
                  {process.estimatedCompletion && process.status === 'running' && (
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">Estimated Completion:</span> {' '}
                      {new Date(process.estimatedCompletion).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Process History Modal */}
      <ProcessHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        processId={selectedProcessForHistory?.id}
        processName={selectedProcessForHistory?.name}
      />
    </div>
  );
}
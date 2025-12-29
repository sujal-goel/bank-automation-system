/**
 * Task Detail View Page
 * Detailed view for individual tasks with action buttons and progress tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '@/lib/auth/auth-store';
import useNotifications from '@/hooks/useNotifications';

// Mock detailed task data
const mockTaskDetail = {
  id: 1,
  type: 'Loan Application Review',
  applicantName: 'Rajesh Kumar',
  applicationId: 'LA-2024-001',
  priority: 'high',
  dueDate: '2024-01-15T17:00:00Z',
  status: 'in_progress',
  assignedDate: '2024-01-10T09:00:00Z',
  startedDate: '2024-01-11T10:30:00Z',
  description: 'Review personal loan application for ₹5,00,000 including credit assessment, document verification, and risk analysis.',
  estimatedTime: 45,
  actualTime: 25,
  category: 'review',
  assignedBy: 'Priya Sharma',
  tags: ['loan', 'personal', 'urgent', 'high-value'],
  
  // Detailed information
  instructions: [
    'Review all submitted documents for completeness and authenticity',
    'Verify applicant\'s employment and income details',
    'Conduct credit score analysis and risk assessment',
    'Check for any existing loans or financial obligations',
    'Prepare recommendation report with approval/rejection decision',
  ],
  
  checklist: [
    { id: 1, item: 'Verify PAN Card', completed: true },
    { id: 2, item: 'Verify Aadhaar Card', completed: true },
    { id: 3, item: 'Review salary slips (last 3 months)', completed: true },
    { id: 4, item: 'Analyze bank statements', completed: false },
    { id: 5, item: 'Check credit score', completed: false },
    { id: 6, item: 'Prepare recommendation report', completed: false },
  ],
  
  relatedDocuments: [
    { id: 1, name: 'Application Form', type: 'PDF', url: '/docs/app-form.pdf' },
    { id: 2, name: 'Income Documents', type: 'PDF', url: '/docs/income.pdf' },
    { id: 3, name: 'Identity Proofs', type: 'PDF', url: '/docs/identity.pdf' },
    { id: 4, name: 'Credit Report', type: 'PDF', url: '/docs/credit.pdf' },
  ],
  
  timeLog: [
    { id: 1, action: 'Task Started', timestamp: '2024-01-11T10:30:00Z', duration: 0 },
    { id: 2, action: 'Document Review', timestamp: '2024-01-11T10:35:00Z', duration: 15 },
    { id: 3, action: 'Break', timestamp: '2024-01-11T10:50:00Z', duration: 5 },
    { id: 4, action: 'Credit Analysis', timestamp: '2024-01-11T10:55:00Z', duration: 10 },
  ],
  
  notes: [
    {
      id: 1,
      author: 'Current User',
      message: 'All identity documents verified successfully. Proceeding with financial analysis.',
      timestamp: '2024-01-11T11:00:00Z',
    },
    {
      id: 2,
      author: 'Priya Sharma',
      message: 'Please pay special attention to the credit history. Customer has requested expedited processing.',
      timestamp: '2024-01-10T15:30:00Z',
    },
  ],
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const { showSuccess, showError } = useNotifications();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // Simulate API call to fetch task details
    const fetchTask = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTask(mockTaskDetail);
        setIsTimerRunning(mockTaskDetail.status === 'in_progress');
        setCurrentTime(mockTaskDetail.actualTime);
      } catch (error) {
        showError('Error', 'Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id, showError]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleTaskAction = async (action) => {
    setActionLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let newStatus = task.status;
      let timerState = isTimerRunning;
      
      switch (action) {
        case 'start':
          newStatus = 'in_progress';
          timerState = true;
          break;
        case 'pause':
          newStatus = 'paused';
          timerState = false;
          break;
        case 'resume':
          newStatus = 'in_progress';
          timerState = true;
          break;
        case 'complete':
          newStatus = 'completed';
          timerState = false;
          break;
      }
      
      setTask(prev => ({ ...prev, status: newStatus, actualTime: currentTime }));
      setIsTimerRunning(timerState);
      
      showSuccess('Task Updated', `Task has been ${action}ed successfully`);
      
      if (action === 'complete') {
        setTimeout(() => router.push('/tasks'), 2000);
      }
    } catch (error) {
      showError('Action Failed', 'Failed to update task status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChecklistToggle = (checklistId) => {
    setTask(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === checklistId ? { ...item, completed: !item.completed } : item,
      ),
    }));
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: task.notes.length + 1,
      author: 'Current User',
      message: newNote,
      timestamp: new Date().toISOString(),
    };

    setTask(prev => ({
      ...prev,
      notes: [note, ...prev.notes],
    }));

    setNewNote('');
    showSuccess('Note Added', 'Your note has been added successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'paused': return 'text-purple-600 bg-purple-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
          <p className="text-gray-600">The requested task could not be found.</p>
        </div>
      </div>
    );
  }

  const completedItems = task.checklist.filter(item => item.completed).length;
  const progressPercentage = (completedItems / task.checklist.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Tasks
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.type}</h1>
              <p className="text-gray-600 mt-2">Task ID: {task.id} • Application: {task.applicationId}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority} priority
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Overview</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Time Spent</p>
                  <p className="text-lg font-semibold">{formatTime(currentTime)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Assigned By</p>
                  <p className="text-lg font-semibold">{task.assignedBy}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CheckCircleIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">{Math.round(progressPercentage)}%</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{task.description}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2">
                {task.instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">{instruction}</li>
                ))}
              </ol>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Checklist</h2>
                <span className="text-sm text-gray-600">
                  {completedItems} of {task.checklist.length} completed
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Documents</h2>
              
              <div className="space-y-3">
                {task.relatedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timer and Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Control</h3>
              
              {/* Timer Display */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatTime(currentTime)}
                </div>
                <p className="text-sm text-gray-600">
                  Estimated: {formatTime(task.estimatedTime)}
                </p>
                {isTimerRunning && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-green-600">Timer Running</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleTaskAction('start')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Starting...' : 'Start Task'}
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleTaskAction('pause')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      <PauseIcon className="w-5 h-5 mr-2" />
                      {actionLoading ? 'Pausing...' : 'Pause Task'}
                    </button>
                    <button
                      onClick={() => handleTaskAction('complete')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      {actionLoading ? 'Completing...' : 'Complete Task'}
                    </button>
                  </>
                )}

                {task.status === 'paused' && (
                  <button
                    onClick={() => handleTaskAction('resume')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Resuming...' : 'Resume Task'}
                  </button>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Notes ({task.notes.length})
              </h3>
              
              {/* Add Note */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {task.notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{note.author}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(note.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{note.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
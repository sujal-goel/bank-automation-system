/**
 * Process History Modal Component
 * Displays process history and audit trail
 */

'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

const mockHistoryData = [
  {
    id: 1,
    timestamp: '2024-01-15T14:30:00Z',
    action: 'Process Started',
    user: 'System',
    details: 'Automated process initiated by scheduler',
    type: 'info',
  },
  {
    id: 2,
    timestamp: '2024-01-15T14:25:00Z',
    action: 'Manual Intervention',
    user: 'John Smith',
    details: 'Process paused for manual review of high-risk application',
    type: 'warning',
  },
  {
    id: 3,
    timestamp: '2024-01-15T14:20:00Z',
    action: 'Error Resolved',
    user: 'Jane Doe',
    details: 'Database connection issue resolved, process resumed',
    type: 'success',
  },
  {
    id: 4,
    timestamp: '2024-01-15T14:15:00Z',
    action: 'Error Detected',
    user: 'System',
    details: 'Database connection timeout after 3 retry attempts',
    type: 'error',
  },
  {
    id: 5,
    timestamp: '2024-01-15T14:10:00Z',
    action: 'Process Resumed',
    user: 'Mike Johnson',
    details: 'Process resumed after configuration update',
    type: 'info',
  },
];

const getActionIcon = (type) => {
  switch (type) {
    case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    default: return <ClockIcon className="w-5 h-5 text-blue-500" />;
  }
};

const getActionColor = (type) => {
  switch (type) {
    case 'success': return 'border-green-200 bg-green-50';
    case 'error': return 'border-red-200 bg-red-50';
    case 'warning': return 'border-yellow-200 bg-yellow-50';
    default: return 'border-blue-200 bg-blue-50';
  }
};

export default function ProcessHistoryModal({ isOpen, onClose, processId, processName }) {
  const [historyData] = useState(mockHistoryData);
  const [loading] = useState(false);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process History</h3>
              <p className="text-sm text-gray-600 mt-1">{processName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {historyData.map((entry, index) => (
                  <div key={entry.id} className="flex items-start space-x-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full border-2 ${getActionColor(entry.type)}`}>
                        {getActionIcon(entry.type)}
                      </div>
                      {index < historyData.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.action}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.details}
                      </p>
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <UserIcon className="w-3 h-3 mr-1" />
                        {entry.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                // In real app, export history data
                console.log('Exporting process history...');
              }}
            >
              Export History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

/**
 * User Bulk Operations Component
 * Provides bulk operations for selected users
 */
export default function UserBulkOperations({ 
  selectedCount, 
  onBulkOperation, 
  onClearSelection, 
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOperation, setPendingOperation] = useState(null);

  /**
   * Handle bulk operation with confirmation
   */
  const handleOperation = (operation) => {
    setPendingOperation(operation);
    setShowConfirmation(true);
  };

  /**
   * Confirm and execute bulk operation
   */
  const confirmOperation = () => {
    if (pendingOperation) {
      onBulkOperation(pendingOperation);
      setShowConfirmation(false);
      setPendingOperation(null);
    }
  };

  /**
   * Cancel bulk operation
   */
  const cancelOperation = () => {
    setShowConfirmation(false);
    setPendingOperation(null);
  };

  /**
   * Get operation display name
   */
  const getOperationName = (operation) => {
    const names = {
      activate: 'Activate',
      suspend: 'Suspend',
      delete: 'Delete',
      reset_password: 'Reset Password',
      send_verification: 'Send Verification Email',
    };
    return names[operation] || operation;
  };

  /**
   * Get operation description
   */
  const getOperationDescription = (operation) => {
    const descriptions = {
      activate: 'activate and enable login for',
      suspend: 'suspend and disable login for',
      delete: 'permanently delete',
      reset_password: 'reset passwords for',
      send_verification: 'send verification emails to',
    };
    return descriptions[operation] || `perform ${operation} on`;
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {selectedCount}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
              </h3>
              <p className="text-sm text-blue-700">
                Choose a bulk operation to apply to selected users
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Operation Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleOperation('activate')}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleOperation('suspend')}
                className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
              >
                Suspend
              </button>
              <button
                onClick={() => handleOperation('reset_password')}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                Reset Password
              </button>
              <button
                onClick={() => handleOperation('send_verification')}
                className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
              >
                Send Verification
              </button>
              <button
                onClick={() => handleOperation('delete')}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Confirm Bulk Operation
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to{' '}
                    <span className="font-medium">
                      {getOperationDescription(pendingOperation)}
                    </span>{' '}
                    <span className="font-medium text-gray-900">
                      {selectedCount} user{selectedCount !== 1 ? 's' : ''}
                    </span>?
                  </p>
                  {pendingOperation === 'delete' && (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      This action cannot be undone.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="items-center px-4 py-3">
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelOperation}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOperation}
                  className={`px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                    pendingOperation === 'delete'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300'
                  }`}
                >
                  {getOperationName(pendingOperation)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
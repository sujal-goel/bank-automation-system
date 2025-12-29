'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import useNotifications from '@/hooks/useNotifications';

export default function UserDeleteModal({ user, onClose, onUserDeleted }) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const { addNotification } = useNotifications();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      addNotification({
        type: 'error',
        title: 'Confirmation Required',
        message: 'Please type DELETE to confirm user deletion.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.request(`/api/auth/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        onUserDeleted(user.id);
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message:' User has been deleted successfully',
        });
        onClose();
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('User deletion failed:', error);
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete user. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
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
              Delete User Account
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the user account for{' '}
                <span className="font-medium text-gray-900">{user?.email}</span>?
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                This action cannot be undone. All user data will be permanently removed.
              </p>
              
              <div className="mt-4">
                <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Type DELETE here"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="items-center px-4 py-3">
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

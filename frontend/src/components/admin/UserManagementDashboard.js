'use client';

import { useState, useEffect } from 'react';
import UserList from './UserList';
import UserCreationModal from './UserCreationModal';
import UserBulkOperations from './UserBulkOperations';
import UserFilters from './UserFilters';
import { apiClient } from '@/lib/api/client';
import useNotifications  from '@/hooks/useNotifications';

/**
 * User Management Dashboard Component
 * Provides comprehensive user management interface with search, filtering, and bulk operations
 */
export default function UserManagementDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    department: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const { addNotification } = useNotifications();

  /**
   * Load users from API
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request('/api/auth/users', {
        method: 'GET',
      });
      
      if (response.success) {
        
        setUsers(response.users || []);
        setFilteredUsers(response.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.users?.length || 0,
        }));
      } else {
        throw new Error(response.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      // Set empty arrays to prevent filter errors
      setUsers([]);
      setFilteredUsers([]);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply filters to user list
   */
  const applyFilters = () => {
    // Ensure users is an array before filtering
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.employeeId?.toLowerCase().includes(searchTerm),
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Department filter (for employees)
    if (filters.department !== 'all') {
      filtered = filtered.filter(user => user.department === filters.department);
    }

    setFilteredUsers(filtered);
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: filtered.length,
    }));
  };

  /**
   * Handle user creation
   */
  const handleUserCreated = (newUser) => {
    setUsers(prev => {
      if (!Array.isArray(prev)) return [newUser];
      return [newUser, ...prev];
    });
    setShowCreateModal(false);
    addNotification({
      type: 'success',
      title: 'User Created',
      message: `User ${newUser.email} has been created successfully.`,
    });
  };

  /**
   * Handle user update
   */
  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => {
      if (!Array.isArray(prev)) return [updatedUser];
      return prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user,
      );
    });
    addNotification({
      type: 'success',
      title: 'User Updated',
      message: `User ${updatedUser.email} has been updated successfully.`,
    });
  };

  /**
   * Handle user deletion
   */
  const handleUserDeleted = (userId) => {
    setUsers(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(user => user.id !== userId);
    });
    setSelectedUsers(prev => prev.filter(id => id !== userId));
    addNotification({
      type: 'success',
      title: 'User Deleted',
      message: 'User has been deleted successfully.',
    });
  };

  /**
   * Handle bulk operations
   */
  const handleBulkOperation = async (operation, userIds) => {
    try {
      const response = await apiClient.request('/api/auth/users', {
        method: 'POST',
        body: {
          action: 'bulk',
          operation,
          userIds,
        },
      });

      if (response.success) {
        await loadUsers(); // Reload users after bulk operation
        setSelectedUsers([]);
        addNotification({
          type: 'success',
          title: 'Bulk Operation Complete',
          message: `${operation} operation completed for ${userIds.length} users.`,
        });
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      addNotification({
        type: 'error',
        title: 'Bulk Operation Failed',
        message: 'Failed to complete bulk operation. Please try again.',
      });
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  // Get paginated users
  const paginatedUsers = Array.isArray(filteredUsers) ? filteredUsers.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  ) : [];

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Users ({Array.isArray(filteredUsers) ? filteredUsers.length : 0})
          </h2>
          <p className="text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create User
        </button>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
      />

      {/* Bulk Operations */}
      {selectedUsers.length > 0 && (
        <UserBulkOperations
          selectedCount={selectedUsers.length}
          onBulkOperation={(operation) => handleBulkOperation(operation, selectedUsers)}
          onClearSelection={() => setSelectedUsers([])}
        />
      )}

      {/* User List */}
      <UserList
        users={paginatedUsers}
        loading={loading}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
        onUserUpdate={handleUserUpdated}
        onUserDelete={handleUserDeleted}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <UserCreationModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
}
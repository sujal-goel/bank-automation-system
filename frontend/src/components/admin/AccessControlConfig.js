/**
 * Access Control Configuration Component
 * Provides interface for managing role-based permissions, user access levels,
 * and system-wide access control settings
 */

'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

export default function AccessControlConfig() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });

  useEffect(() => {
    fetchAccessControlData();
  }, []);

  const fetchAccessControlData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles and permissions
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiClient.get('/api/admin/roles'),
        apiClient.get('/api/admin/permissions'),
      ]);
      
      setRoles(rolesResponse.data || mockRoles);
      setPermissions(permissionsResponse.data || mockPermissions);
      
      if (rolesResponse.data && rolesResponse.data.length > 0) {
        setSelectedRole(rolesResponse.data[0]);
      } else if (mockRoles.length > 0) {
        setSelectedRole(mockRoles[0]);
      }
    } catch (error) {
      console.error('Failed to fetch access control data:', error);
      // Use mock data for development
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setSelectedRole(mockRoles[0]);
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = async (roleId, permissionIds) => {
    try {
      setSaving(true);
      await apiClient.put(`/api/admin/roles/${roleId}/permissions`, {
        permissions: permissionIds,
      });
      
      // Update local state
      setRoles(roles.map(role => 
        role.id === roleId 
          ? { ...role, permissions: permissionIds }
          : role,
      ));
      
      if (selectedRole && selectedRole.id === roleId) {
        setSelectedRole({ ...selectedRole, permissions: permissionIds });
      }
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      alert('Failed to update permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    try {
      setSaving(true);
      const response = await apiClient.post('/api/admin/roles', newRole);
      
      const createdRole = response.data || {
        id: Date.now().toString(),
        ...newRole,
        userCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      setRoles([...roles, createdRole]);
      setNewRole({ name: '', description: '', permissions: [] });
      setShowCreateRole(false);
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('Failed to create role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/roles/${roleId}`);
      setRoles(roles.filter(role => role.id !== roleId));
      
      if (selectedRole && selectedRole.id === roleId) {
        setSelectedRole(roles.find(role => role.id !== roleId) || null);
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role. Please try again.');
    }
  };

  const togglePermission = (permissionId) => {
    if (!selectedRole) return;

    const currentPermissions = selectedRole.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(id => id !== permissionId)
      : [...currentPermissions, permissionId];

    updateRolePermissions(selectedRole.id, newPermissions);
  };

  // Mock data for development
  const mockRoles = [
    {
      id: '1',
      name: 'admin',
      description: 'System Administrator with full access',
      permissions: ['user_management', 'system_config', 'audit_logs', 'security_management', 'reports_access'],
      userCount: 2,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'employee',
      description: 'Bank Employee with operational access',
      permissions: ['view_applications', 'process_applications', 'reports_access', 'task_management'],
      userCount: 15,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'customer',
      description: 'Bank Customer with limited access',
      permissions: ['view_account', 'submit_application', 'upload_documents'],
      userCount: 150,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockPermissions = [
    { id: 'user_management', name: 'User Management', description: 'Create, edit, and delete users', category: 'Administration' },
    { id: 'system_config', name: 'System Configuration', description: 'Modify system settings and configurations', category: 'Administration' },
    { id: 'audit_logs', name: 'Audit Logs', description: 'View and export audit logs', category: 'Security' },
    { id: 'security_management', name: 'Security Management', description: 'Manage security settings and sessions', category: 'Security' },
    { id: 'view_applications', name: 'View Applications', description: 'View customer applications', category: 'Operations' },
    { id: 'process_applications', name: 'Process Applications', description: 'Approve or reject applications', category: 'Operations' },
    { id: 'reports_access', name: 'Reports Access', description: 'Generate and view reports', category: 'Analytics' },
    { id: 'task_management', name: 'Task Management', description: 'Manage and assign tasks', category: 'Operations' },
    { id: 'view_account', name: 'View Account', description: 'View own account information', category: 'Customer' },
    { id: 'submit_application', name: 'Submit Application', description: 'Submit loan and service applications', category: 'Customer' },
    { id: 'upload_documents', name: 'Upload Documents', description: 'Upload required documents', category: 'Customer' },
  ];

  const groupedPermissions = permissions.reduce((groups, permission) => {
    const category = permission.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="lg:col-span-2 bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Roles</h3>
            <button
              onClick={() => setShowCreateRole(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              + Add Role
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 capitalize">{role.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{role.userCount} users</p>
                  </div>
                  {role.name !== 'admin' && role.name !== 'customer' && role.name !== 'employee' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRole(role.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Configuration */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedRole ? `Permissions for ${selectedRole.name}` : 'Select a role'}
            </h3>
            {selectedRole && (
              <p className="text-sm text-gray-500 mt-1">{selectedRole.description}</p>
            )}
          </div>
          
          {selectedRole ? (
            <div className="p-6">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{category}</h4>
                  <div className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={permission.id}
                            type="checkbox"
                            checked={selectedRole.permissions?.includes(permission.id) || false}
                            onChange={() => togglePermission(permission.id)}
                            disabled={saving}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={permission.id} className="font-medium text-gray-700">
                            {permission.name}
                          </label>
                          <p className="text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {saving && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Saving changes...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-4xl mb-4">🔐</div>
              <p className="text-gray-500">Select a role to configure permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter role description"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateRole(false);
                    setNewRole({ name: '', description: '', permissions: [] });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createRole}
                  disabled={!newRole.name || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
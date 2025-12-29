/**
 * Authentication Test Page
 * Simple page to test authentication functionality
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-hooks';

export default function TestAuthPage() {
  const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    email: 'john.doe@example.com',
    password: 'Customer123!',
    userType: 'customer',
  });

  const handleLogin = async () => {
    await login(credentials);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Test</h1>
        
        {/* Authentication Status */}
        <div className="mb-6 p-4 rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          {user && (
            <div className="mt-2">
              <p><strong>User:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
          {error && (
            <p className="text-red-600 mt-2"><strong>Error:</strong> {error}</p>
          )}
        </div>

        {!isAuthenticated ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Test Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={credentials.userType}
                  onChange={(e) => setCredentials(prev => ({ ...prev, userType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Logging in...' : 'Test Login'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Logged In</h2>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Customer:</strong> john.doe@example.com / Customer123!</p>
            <p><strong>Employee:</strong> jane.smith@bank.com / Employee123!</p>
            <p><strong>Admin:</strong> admin@bank.com / Admin123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
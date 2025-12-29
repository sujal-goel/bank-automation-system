/**
 * Session Management Component
 * Provides interface for managing active user sessions, viewing session details,
 * and performing session operations like termination
 */

'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/sessions');
      setSessions(response.data || mockSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Use mock data for development
      setSessions(mockSessions);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await apiClient.delete(`/api/admin/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session.id !== sessionId));
      setShowModal(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to terminate session:', error);
      alert('Failed to terminate session. Please try again.');
    }
  };

  const terminateAllSessions = async (userId) => {
    try {
      await apiClient.delete(`/api/admin/sessions/user/${userId}`);
      setSessions(sessions.filter(session => session.userId !== userId));
    } catch (error) {
      console.error('Failed to terminate user sessions:', error);
      alert('Failed to terminate user sessions. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (device) => {
    if (device.includes('Mobile')) return '📱';
    if (device.includes('Tablet')) return '📱';
    return '💻';
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ipAddress.includes(searchTerm) ||
                         session.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Mock data for development
  const mockSessions = [
    {
      id: '1',
      userId: 'user1',
      userEmail: 'admin@bank.com',
      userRole: 'admin',
      ipAddress: '192.168.1.100',
      location: 'New York, US',
      device: 'Chrome on Windows',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: '2',
      userId: 'user2',
      userEmail: 'employee@bank.com',
      userRole: 'employee',
      ipAddress: '192.168.1.101',
      location: 'Los Angeles, US',
      device: 'Safari on MacOS',
      loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'idle',
    },
    {
      id: '3',
      userId: 'user3',
      userEmail: 'customer@example.com',
      userRole: 'customer',
      ipAddress: '192.168.1.102',
      location: 'Chicago, US',
      device: 'Chrome Mobile on Android',
      loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: 'active',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header and Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Active Sessions ({filteredSessions.length})
          </h2>
          <button
            onClick={fetchSessions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Sessions
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, IP, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{session.userEmail}</div>
                      <div className="text-sm text-gray-500 capitalize">{session.userRole}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getDeviceIcon(session.device)}</span>
                      <div>
                        <div className="text-sm text-gray-900">{session.device}</div>
                        <div className="text-sm text-gray-500">{session.location}</div>
                        <div className="text-xs text-gray-400">{session.ipAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Login: {new Date(session.loginTime).toLocaleString()}</div>
                      <div>Last: {new Date(session.lastActivity).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Terminate
                      </button>
                      <button
                        onClick={() => terminateAllSessions(session.userId)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Terminate All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-500">No sessions found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <p className="text-sm text-gray-900">{selectedSession.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedSession.userRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedSession.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm text-gray-900">{selectedSession.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Device</label>
                  <p className="text-sm text-gray-900">{selectedSession.device}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Login Time</label>
                  <p className="text-sm text-gray-900">{new Date(selectedSession.loginTime).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Activity</label>
                  <p className="text-sm text-gray-900">{new Date(selectedSession.lastActivity).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => terminateSession(selectedSession.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
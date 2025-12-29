/**
 * Audit Log Viewer Component
 * Advanced filtering, search, export, and real-time streaming capabilities
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api/client';
import AuditLogFilters from './AuditLogFilters';
import AuditLogTable from './AuditLogTable';
import AuditLogExport from './AuditLogExport';
import AuditLogDetails from './AuditLogDetails';

/**
 * @typedef {Object} AuditLog
 * @property {string} logId - Unique log identifier
 * @property {string} entityType - Type of entity (USER, ACCOUNT, TRANSACTION, etc.)
 * @property {string} entityId - ID of the affected entity
 * @property {string} action - Action performed (CREATE, UPDATE, DELETE, etc.)
 * @property {string} performedBy - User who performed the action
 * @property {Date} timestamp - When the action occurred
 * @property {Object} beforeState - State before the action
 * @property {Object} afterState - State after the action
 * @property {Object} metadata - Additional metadata
 */

export default function AuditLogViewer() {
  // State management
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    performedBy: '',
    dateRange: {
      start: '',
      end: '',
    },
    severity: '',
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Real-time streaming
  const wsRef = useRef(null);
  const streamingIntervalRef = useRef(null);

  /**
   * Fetch audit logs from the backend
   */
  const fetchLogs = useCallback(async (page = 1, size = 50, searchQuery = '', filterParams = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: size.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...Object.entries(filterParams).reduce((acc, [key, value]) => {
          if (value && value !== '') {
            if (key === 'dateRange' && value.start && value.end) {
              acc.startDate = value.start;
              acc.endDate = value.end;
            } else if (key !== 'dateRange') {
              acc[key] = value;
            }
          }
          return acc;
        }, {}),
      });

      const response = await apiClient.get(`/api/audit/logs?${queryParams}`);
      
      if (response.success) {
        const newLogs = response.data || [];
        setLogs(newLogs);
        setTotalCount(response.total || newLogs.length);
        
        // Apply client-side filtering if needed
        applyFiltersAndSearch(newLogs, searchQuery, filterParams);
      } else {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Apply search and filters to logs
   */
  const applyFiltersAndSearch = useCallback((logData, searchQuery, filterParams) => {
    let filtered = [...logData];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(query) ||
        log.entityType.toLowerCase().includes(query) ||
        log.performedBy.toLowerCase().includes(query) ||
        log.entityId.toLowerCase().includes(query) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query)),
      );
    }

    // Apply filters
    if (filterParams.entityType) {
      filtered = filtered.filter(log => log.entityType === filterParams.entityType);
    }
    
    if (filterParams.action) {
      filtered = filtered.filter(log => log.action === filterParams.action);
    }
    
    if (filterParams.performedBy) {
      filtered = filtered.filter(log => log.performedBy.includes(filterParams.performedBy));
    }

    if (filterParams.dateRange?.start && filterParams.dateRange?.end) {
      const startDate = new Date(filterParams.dateRange.start);
      const endDate = new Date(filterParams.dateRange.end);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    setFilteredLogs(filtered);
  }, []);

  /**
   * Handle search input changes
   */
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    applyFiltersAndSearch(logs, value, filters);
  }, [logs, filters, applyFiltersAndSearch]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    applyFiltersAndSearch(logs, searchTerm, newFilters);
  }, [logs, searchTerm, applyFiltersAndSearch]);

  /**
   * Clear all filters and search
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({
      entityType: '',
      action: '',
      performedBy: '',
      dateRange: { start: '', end: '' },
      severity: '',
    });
    setFilteredLogs(logs);
  }, [logs]);

  /**
   * Refresh logs
   */
  const refreshLogs = useCallback(() => {
    fetchLogs(currentPage, pageSize, searchTerm, filters);
  }, [fetchLogs, currentPage, pageSize, searchTerm, filters]);

  /**
   * Start real-time streaming
   */
  const startStreaming = useCallback(() => {
    if (isStreaming) return;

    setIsStreaming(true);
    
    // Poll for new logs every 5 seconds
    streamingIntervalRef.current = setInterval(() => {
      fetchLogs(1, pageSize, searchTerm, filters);
    }, 5000);

    // TODO: Implement WebSocket connection for real-time updates
    // This would connect to a WebSocket endpoint that streams new audit logs
  }, [isStreaming, pageSize, searchTerm, filters, fetchLogs]);

  /**
   * Stop real-time streaming
   */
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  /**
   * Handle pagination
   */
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchLogs(page, pageSize, searchTerm, filters);
  }, [fetchLogs, pageSize, searchTerm, filters]);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchLogs(1, size, searchTerm, filters);
  }, [fetchLogs, searchTerm, filters]);

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // Get severity icon and color
  const getSeverityDisplay = (log) => {
    const action = log.action.toLowerCase();
    if (action.includes('delete') || action.includes('fail')) {
      return { icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-50' };
    } else if (action.includes('create') || action.includes('success')) {
      return { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-50' };
    } else if (action.includes('update') || action.includes('modify')) {
      return { icon: ExclamationTriangleIcon, color: 'text-yellow-500', bg: 'bg-yellow-50' };
    }
    return { icon: DocumentTextIcon, color: 'text-blue-500', bg: 'bg-blue-50' };
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isStreaming 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isStreaming ? (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Stop Stream
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Live Stream
                </>
              )}
            </button>

            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || Object.values(filters).some(f => f && f !== '' && !(f.start === '' && f.end === ''))) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {searchTerm}
              </span>
            )}
            {filters.entityType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {filters.entityType}
              </span>
            )}
            {filters.action && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Action: {filters.action}
              </span>
            )}
            {filters.performedBy && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                User: {filters.performedBy}
              </span>
            )}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Date Range
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <AuditLogFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Results Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {totalCount} logs
            </span>
            {isStreaming && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-gray-600">Show:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <AuditLogTable
        logs={filteredLogs}
        isLoading={isLoading}
        onLogSelect={setSelectedLog}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={filteredLogs.length}
        onPageChange={handlePageChange}
        getSeverityDisplay={getSeverityDisplay}
      />

      {/* Export Modal */}
      {showExport && (
        <AuditLogExport
          logs={filteredLogs}
          filters={filters}
          searchTerm={searchTerm}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          getSeverityDisplay={getSeverityDisplay}
        />
      )}
    </div>
  );
}
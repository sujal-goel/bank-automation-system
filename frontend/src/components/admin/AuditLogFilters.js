/**
 * Audit Log Filters Component
 * Advanced filtering interface for audit logs
 */

'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ENTITY_TYPES = [
  'USER',
  'ACCOUNT',
  'TRANSACTION',
  'LOAN_APPLICATION',
  'KYC',
  'AML',
  'PAYMENT',
  'DOCUMENT',
  'SYSTEM',
  'SECURITY',
];

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'APPROVE',
  'REJECT',
  'SUBMIT',
  'PROCESS',
  'VERIFY',
  'UPLOAD',
  'DOWNLOAD',
  'ACCESS',
  'MODIFY',
  'EXPORT',
];

export default function AuditLogFilters({ filters, onFilterChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * Handle filter input changes
   */
  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle date range changes
   */
  const handleDateRangeChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }));
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    const emptyFilters = {
      entityType: '',
      action: '',
      performedBy: '',
      dateRange: { start: '', end: '' },
      severity: '',
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  /**
   * Set quick date ranges
   */
  const setQuickDateRange = (range) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        return;
    }

    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Entity Type and Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              id="entityType"
              value={localFilters.entityType}
              onChange={(e) => handleInputChange('entityType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              id="action"
              value={localFilters.action}
              onChange={(e) => handleInputChange('action', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {ACTIONS.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>

        {/* User Filter */}
        <div>
          <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-2">
            Performed By (User ID or Email)
          </label>
          <input
            type="text"
            id="performedBy"
            value={localFilters.performedBy}
            onChange={(e) => handleInputChange('performedBy', e.target.value)}
            placeholder="Enter user ID or email..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="inline h-4 w-4 mr-1" />
            Date Range
          </label>
          
          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'Last 7 days', value: 'last7days' },
              { label: 'Last 30 days', value: 'last30days' },
              { label: 'This month', value: 'thisMonth' },
              { label: 'Last month', value: 'lastMonth' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setQuickDateRange(value)}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={localFilters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={localFilters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Severity/Risk Level */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level
          </label>
          <select
            id="severity"
            value={localFilters.severity}
            onChange={(e) => handleInputChange('severity', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          onClick={resetFilters}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Reset All Filters
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              applyFilters();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
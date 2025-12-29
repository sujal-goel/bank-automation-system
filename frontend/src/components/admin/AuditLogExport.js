/**
 * Audit Log Export Component
 * Handles exporting audit logs in various formats (CSV, JSON, PDF)
 */

'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

const EXPORT_FORMATS = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values for spreadsheet applications',
    icon: TableCellsIcon,
    mimeType: 'text/csv',
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation for programmatic use',
    icon: CodeBracketIcon,
    mimeType: 'application/json',
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable Document Format for reports and archiving',
    icon: DocumentTextIcon,
    mimeType: 'application/pdf',
  },
];

export default function AuditLogExport({ logs, filters, searchTerm, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeStateChanges: true,
    dateFormat: 'iso',
    maxRecords: logs.length,
  });

  /**
   * Generate CSV content
   */
  const generateCSV = (data) => {
    const headers = [
      'Timestamp',
      'Entity Type',
      'Entity ID',
      'Action',
      'Performed By',
      'IP Address',
      'User Agent',
    ];

    if (exportOptions.includeMetadata) {
      headers.push('Metadata');
    }

    if (exportOptions.includeStateChanges) {
      headers.push('Before State', 'After State');
    }

    const csvContent = [
      headers.join(','),
      ...data.map(log => {
        const row = [
          formatDateForExport(log.timestamp),
          log.entityType,
          log.entityId,
          log.action,
          log.performedBy,
          log.metadata?.ipAddress || '',
          log.metadata?.userAgent || '',
        ];

        if (exportOptions.includeMetadata) {
          row.push(JSON.stringify(log.metadata || {}));
        }

        if (exportOptions.includeStateChanges) {
          row.push(
            JSON.stringify(log.beforeState || {}),
            JSON.stringify(log.afterState || {}),
          );
        }

        return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      }),
    ].join('\n');

    return csvContent;
  };

  /**
   * Generate JSON content
   */
  const generateJSON = (data) => {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalRecords: data.length,
        filters: filters,
        searchTerm: searchTerm,
        options: exportOptions,
      },
      logs: data.map(log => ({
        ...log,
        timestamp: formatDateForExport(log.timestamp),
        ...(exportOptions.includeMetadata ? {} : { metadata: undefined }),
        ...(exportOptions.includeStateChanges ? {} : { 
          beforeState: undefined, 
          afterState: undefined, 
        }),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  };

  /**
   * Format date for export based on selected format
   */
  const formatDateForExport = (timestamp) => {
    const date = new Date(timestamp);
    
    switch (exportOptions.dateFormat) {
      case 'iso':
        return date.toISOString();
      case 'local':
        return date.toLocaleString();
      case 'unix':
        return Math.floor(date.getTime() / 1000).toString();
      default:
        return date.toISOString();
    }
  };

  /**
   * Download file
   */
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = logs.slice(0, exportOptions.maxRecords);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit-logs-${timestamp}.${selectedFormat}`;
      
      let content;
      const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
      
      switch (selectedFormat) {
        case 'csv':
          content = generateCSV(exportData);
          break;
        case 'json':
          content = generateJSON(exportData);
          break;
        case 'pdf':
          // For PDF, we would typically use a library like jsPDF or send to backend
          // For now, we'll export as JSON and show a message
          content = generateJSON(exportData);
          alert('PDF export would be implemented with a PDF generation library');
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      downloadFile(content, filename, format.mimeType);
      
      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Export Audit Logs</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Export Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Total records: {logs.length}</p>
                {searchTerm && <p>Search term: "{searchTerm}"</p>}
                {Object.values(filters).some(f => f && f !== '' && !(f.start === '' && f.end === '')) && (
                  <p>Filters applied: Yes</p>
                )}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Icon className="h-5 w-5 mr-2" />
                        <span className="font-medium">{format.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{format.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Options
              </label>
              <div className="space-y-4">
                {/* Include Options */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeMetadata: e.target.checked,
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include metadata</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStateChanges}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeStateChanges: e.target.checked,
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include before/after states</span>
                  </label>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date Format</label>
                  <select
                    value={exportOptions.dateFormat}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateFormat: e.target.value,
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="iso">ISO 8601 (2023-12-01T10:30:00.000Z)</option>
                    <option value="local">Local format (12/1/2023, 10:30:00 AM)</option>
                    <option value="unix">Unix timestamp (1701423000)</option>
                  </select>
                </div>

                {/* Max Records */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Maximum Records (0 = all)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={logs.length}
                    value={exportOptions.maxRecords}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      maxRecords: parseInt(e.target.value) || logs.length,
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || logs.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
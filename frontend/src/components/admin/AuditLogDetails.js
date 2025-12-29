/**
 * Audit Log Details Component
 * Displays detailed information about a specific audit log entry
 */

'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CalendarIcon,
  UserIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export default function AuditLogDetails({ log, onClose, getSeverityDisplay }) {
  const [expandedSections, setExpandedSections] = useState({
    metadata: false,
    beforeState: false,
    afterState: false,
  });

  /**
   * Toggle section expansion
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  /**
   * Format JSON for display
   */
  const formatJSON = (obj) => {
    if (!obj || Object.keys(obj).length === 0) return null;
    return JSON.stringify(obj, null, 2);
  };

  /**
   * Render expandable section
   */
  const ExpandableSection = ({ title, content, sectionKey, icon: Icon }) => {
    const isExpanded = expandedSections[sectionKey];
    const hasContent = content && Object.keys(content).length > 0;

    if (!hasContent) {
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center text-gray-500">
            <Icon className="h-5 w-5 mr-2" />
            <span className="font-medium">{title}</span>
            <span className="ml-2 text-sm">(No data)</span>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Icon className="h-5 w-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-900">{title}</span>
            <span className="ml-2 text-sm text-gray-500">
              ({Object.keys(content).length} fields)
            </span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(formatJSON(content))}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <pre className="text-sm text-gray-800 overflow-x-auto bg-white rounded border p-3 pr-10">
                {formatJSON(content)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const severity = getSeverityDisplay(log);
  const SeverityIcon = severity.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${severity.bg} mr-3`}>
                <SeverityIcon className={`w-5 h-5 ${severity.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                <p className="text-sm text-gray-600">Log ID: {log.logId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <CalendarIcon className="inline h-4 w-4 mr-1" />
                      Timestamp
                    </label>
                    <div className="text-sm text-gray-900">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity Type
                    </label>
                    <span className="inline-flex px-2 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                      {log.entityType}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                      log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('fail')
                        ? 'bg-red-100 text-red-800'
                        : log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('success')
                          ? 'bg-green-100 text-green-800'
                          : log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('modify')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <UserIcon className="inline h-4 w-4 mr-1" />
                      Performed By
                    </label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 rounded px-2 py-1">
                      {log.performedBy}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity ID
                    </label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 rounded px-2 py-1 break-all">
                      {log.entityId}
                    </div>
                  </div>

                  {log.metadata?.ipAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                        IP Address
                      </label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 rounded px-2 py-1">
                        {log.metadata.ipAddress}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Agent */}
              {log.metadata?.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ComputerDesktopIcon className="inline h-4 w-4 mr-1" />
                    User Agent
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2 break-all">
                    {log.metadata.userAgent}
                  </div>
                </div>
              )}

              {/* Expandable Sections */}
              <div className="space-y-4">
                {/* Metadata */}
                <ExpandableSection
                  title="Metadata"
                  content={log.metadata}
                  sectionKey="metadata"
                  icon={ComputerDesktopIcon}
                />

                {/* Before State */}
                <ExpandableSection
                  title="Before State"
                  content={log.beforeState}
                  sectionKey="beforeState"
                  icon={ChevronRightIcon}
                />

                {/* After State */}
                <ExpandableSection
                  title="After State"
                  content={log.afterState}
                  sectionKey="afterState"
                  icon={ChevronDownIcon}
                />
              </div>

              {/* Raw Log Data */}
              <div className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Raw Log Data</h4>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                      Copy All
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-gray-800 overflow-x-auto bg-white rounded border p-3">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
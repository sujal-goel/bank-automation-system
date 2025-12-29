/**
 * Export Templates Component
 * Provides customizable export templates for different report types
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  DocumentDuplicateIcon, 
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * @typedef {Object} ExportTemplate
 * @property {string} id - Template ID
 * @property {string} name - Template name
 * @property {string} description - Template description
 * @property {'pdf'|'csv'|'excel'|'json'} format - Export format
 * @property {Object} config - Template configuration
 * @property {string[]} sections - Included sections
 * @property {Object} styling - Styling options
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Default template configurations
 */
const DEFAULT_TEMPLATES = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level KPIs and trends for executive reporting',
    format: 'pdf',
    sections: ['kpis', 'trends', 'alerts'],
    config: {
      includeCharts: true,
      chartTypes: ['line', 'bar'],
      timeRange: '30d',
      groupBy: 'department',
    },
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive data analysis with all metrics',
    format: 'excel',
    sections: ['kpis', 'trends', 'tables', 'processes', 'alerts'],
    config: {
      includeRawData: true,
      includeCalculations: true,
      multipleSheets: true,
    },
  },
  {
    id: 'operational-report',
    name: 'Operational Report',
    description: 'Daily operational metrics and process status',
    format: 'csv',
    sections: ['processes', 'tasks', 'performance'],
    config: {
      delimiter: ',',
      includeHeaders: true,
      timeRange: '7d',
    },
  },
  {
    id: 'compliance-audit',
    name: 'Compliance Audit',
    description: 'Regulatory compliance and audit trail report',
    format: 'pdf',
    sections: ['audit', 'compliance', 'security'],
    config: {
      includeSignatures: true,
      watermark: 'CONFIDENTIAL',
      pageNumbers: true,
    },
  },
];

/**
 * Available sections for templates
 */
const AVAILABLE_SECTIONS = [
  { id: 'kpis', name: 'Key Performance Indicators', icon: ChartBarIcon },
  { id: 'trends', name: 'Trend Analysis', icon: ChartBarIcon },
  { id: 'tables', name: 'Data Tables', icon: TableCellsIcon },
  { id: 'processes', name: 'Process Status', icon: DocumentIcon },
  { id: 'alerts', name: 'Alerts & Notifications', icon: DocumentTextIcon },
  { id: 'tasks', name: 'Task Summary', icon: DocumentIcon },
  { id: 'performance', name: 'Performance Metrics', icon: ChartBarIcon },
  { id: 'audit', name: 'Audit Logs', icon: DocumentTextIcon },
  { id: 'compliance', name: 'Compliance Status', icon: DocumentTextIcon },
  { id: 'security', name: 'Security Events', icon: DocumentTextIcon },
];

/**
 * Export Templates Component
 * @param {Object} props
 * @param {function} [props.onTemplateSelect] - Template selection callback
 * @param {function} [props.onTemplateCreate] - Template creation callback
 * @param {function} [props.onTemplateUpdate] - Template update callback
 * @param {function} [props.onTemplateDelete] - Template deletion callback
 * @param {string} [props.className] - Additional CSS classes
 */
const ExportTemplates = ({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  className = '',
}) => {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'pdf',
    sections: [],
    config: {},
  });

  const queryClient = useQueryClient();

  // Fetch templates from API
  const { data: apiTemplates, isLoading } = useQuery({
    queryKey: ['export-templates'],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/api/analytics/export/templates');
        return response.data || [];
      } catch (error) {
        console.warn('Failed to fetch templates from API, using defaults');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine API templates with defaults
  const allTemplates = [...templates, ...(apiTemplates || [])];

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await apiClient.request('/api/analytics/export/templates', {
        method: 'POST',
        body: templateData,
      });
      return response.data;
    },
    onSuccess: (newTemplate) => {
      setTemplates(prev => [...prev, newTemplate]);
      queryClient.invalidateQueries(['export-templates']);
      setIsCreating(false);
      resetForm();
      if (onTemplateCreate) {
        onTemplateCreate(newTemplate);
      }
    },
    onError: (error) => {
      console.error('Failed to create template:', error);
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }) => {
      const response = await apiClient.request(`/api/analytics/export/templates/${id}`, {
        method: 'PUT',
        body: templateData,
      });
      return response.data;
    },
    onSuccess: (updatedTemplate) => {
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
      queryClient.invalidateQueries(['export-templates']);
      setIsEditing(false);
      setSelectedTemplate(null);
      resetForm();
      if (onTemplateUpdate) {
        onTemplateUpdate(updatedTemplate);
      }
    },
    onError: (error) => {
      console.error('Failed to update template:', error);
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      await apiClient.request(`/api/analytics/export/templates/${templateId}`, {
        method: 'DELETE',
      });
      return templateId;
    },
    onSuccess: (deletedId) => {
      setTemplates(prev => prev.filter(t => t.id !== deletedId));
      queryClient.invalidateQueries(['export-templates']);
      if (onTemplateDelete) {
        onTemplateDelete(deletedId);
      }
    },
    onError: (error) => {
      console.error('Failed to delete template:', error);
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      format: 'pdf',
      sections: [],
      config: {},
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  // Handle create template
  const handleCreateTemplate = () => {
    setIsCreating(true);
    resetForm();
  };

  // Handle edit template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      format: template.format,
      sections: template.sections,
      config: template.config,
    });
    setIsEditing(true);
  };

  // Handle save template
  const handleSaveTemplate = () => {
    const templateData = {
      ...formData,
      id: isEditing ? selectedTemplate.id : `template-${Date.now()}`,
      createdAt: isEditing ? selectedTemplate.createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (isEditing) {
      updateTemplateMutation.mutate(templateData);
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Handle section toggle
  const handleSectionToggle = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId],
    }));
  };

  // Get format icon
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return DocumentTextIcon;
      case 'csv':
        return TableCellsIcon;
      case 'excel':
        return DocumentIcon;
      case 'json':
        return DocumentIcon;
      default:
        return DocumentIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <DocumentDuplicateIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Export Templates
            </h3>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>New Template</span>
            </div>
          </button>
        </div>

        {/* Template List */}
        {!isCreating && !isEditing && (
          <div className="space-y-4">
            {allTemplates.map((template) => {
              const FormatIcon = getFormatIcon(template.format);
              return (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <FormatIcon className={`h-6 w-6 mt-0.5 ${
                        selectedTemplate?.id === template.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          selectedTemplate?.id === template.id
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-400 uppercase font-medium">
                            {template.format}
                          </span>
                          <span className="text-xs text-gray-400">
                            {template.sections.length} sections
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setShowPreview(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pdf">PDF Report</option>
                  <option value="csv">CSV Data</option>
                  <option value="excel">Excel Workbook</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter template description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Include Sections
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isSelected = formData.sections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionToggle(section.id)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {section.name}
                        </span>
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!formData.name || formData.sections.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        )}

        {/* Template Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowPreview(false)} />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Template Preview: {selectedTemplate.name}
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Format</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 uppercase">
                        {selectedTemplate.format}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Included Sections</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.sections.map((sectionId) => {
                          const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
                          return section ? (
                            <span
                              key={sectionId}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                            >
                              {section.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuration</h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(selectedTemplate.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportTemplates;
/**
 * Export Manager Component
 * Handles multi-format export functionality for analytics data
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { 
  DocumentArrowDownIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

/**
 * @typedef {Object} ExportConfig
 * @property {'pdf'|'csv'|'excel'|'json'} format - Export format
 * @property {string} filename - Export filename
 * @property {Object} data - Data to export
 * @property {Object} [options] - Format-specific options
 */

/**
 * Export formats configuration
 */
const EXPORT_FORMATS = [
  {
    value: 'pdf',
    label: 'PDF Report',
    icon: DocumentTextIcon,
    description: 'Formatted report with charts and tables',
    extension: 'pdf',
  },
  {
    value: 'csv',
    label: 'CSV Data',
    icon: TableCellsIcon,
    description: 'Comma-separated values for spreadsheets',
    extension: 'csv',
  },
  {
    value: 'excel',
    label: 'Excel Workbook',
    icon: DocumentIcon,
    description: 'Excel file with multiple sheets',
    extension: 'xlsx',
  },
  {
    value: 'json',
    label: 'JSON Data',
    icon: DocumentIcon,
    description: 'Raw data in JSON format',
    extension: 'json',
  },
];

/**
 * Export Manager Component
 * @param {Object} props
 * @param {Object} props.data - Data to export
 * @param {string} [props.title] - Export title
 * @param {Object} [props.timeRange] - Time range for the export
 * @param {string} [props.defaultFormat] - Default export format
 * @param {function} [props.onExportStart] - Export start callback
 * @param {function} [props.onExportComplete] - Export complete callback
 * @param {function} [props.onExportError] - Export error callback
 * @param {boolean} [props.showScheduler] - Whether to show scheduled export options
 * @param {string} [props.className] - Additional CSS classes
 */
const ExportManager = ({
  data,
  title = 'Analytics Report',
  timeRange,
  defaultFormat = 'pdf',
  onExportStart,
  onExportComplete,
  onExportError,
  showScheduler = true,
  className = '',
}) => {
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [customFilename, setCustomFilename] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [scheduledExport, setScheduledExport] = useState({
    enabled: false,
    frequency: 'daily',
    time: '09:00',
    email: '',
  });

  // Generate default filename
  const generateFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const formatExt = EXPORT_FORMATS.find(f => f.value === selectedFormat)?.extension || 'txt';
    return customFilename || `${title.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.${formatExt}`;
  };

  // Export to PDF
  const exportToPDF = async (exportData, filename) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, 20, yPosition);
    yPosition += 15;

    // Time range
    if (timeRange) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Period: ${timeRange.label || 'Custom Range'}`, 20, yPosition);
      yPosition += 10;
    }

    // Generated timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 20;

    // KPI Summary
    if (exportData.kpis) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Performance Indicators', 20, yPosition);
      yPosition += 10;

      const kpiData = Object.entries(exportData.kpis).map(([key, value]) => [
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        typeof value === 'number' ? value.toLocaleString() : value,
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: kpiData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
      });

      yPosition = pdf.lastAutoTable.finalY + 20;
    }

    // Data tables
    if (exportData.tables) {
      for (const [tableName, tableData] of Object.entries(exportData.tables)) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 20, yPosition);
        yPosition += 10;

        if (tableData.length > 0) {
          const headers = Object.keys(tableData[0]);
          const rows = tableData.map(row => headers.map(header => row[header]));

          pdf.autoTable({
            startY: yPosition,
            head: [headers],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 20, right: 20 },
          });

          yPosition = pdf.lastAutoTable.finalY + 20;
        }
      }
    }

    // Include charts as images
    if (includeCharts && exportData.charts) {
      for (const chartId of exportData.charts) {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
          try {
            const canvas = await html2canvas(chartElement);
            const imgData = canvas.toDataURL('image/png');
            
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 20;
            }

            const imgWidth = pageWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 20;
          } catch (error) {
            console.warn('Failed to capture chart:', chartId, error);
          }
        }
      }
    }

    pdf.save(filename);
  };

  // Export to CSV
  const exportToCSV = (exportData, filename) => {
    let csvContent = '';

    // Add metadata
    csvContent += `Title,${title}\n`;
    if (timeRange) {
      csvContent += `Period,${timeRange.label || 'Custom Range'}\n`;
    }
    csvContent += `Generated,${new Date().toLocaleString()}\n\n`;

    // Add KPIs
    if (exportData.kpis) {
      csvContent += 'Key Performance Indicators\n';
      csvContent += 'Metric,Value\n';
      Object.entries(exportData.kpis).forEach(([key, value]) => {
        csvContent += `${key.replace(/_/g, ' ')},${value}\n`;
      });
      csvContent += '\n';
    }

    // Add tables
    if (exportData.tables) {
      Object.entries(exportData.tables).forEach(([tableName, tableData]) => {
        csvContent += `${tableName.replace(/_/g, ' ')}\n`;
        if (tableData.length > 0) {
          const csv = Papa.unparse(tableData);
          csvContent += csv + '\n\n';
        }
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Export to Excel
  const exportToExcel = (exportData, filename) => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Title', title],
      ['Period', timeRange?.label || 'Custom Range'],
      ['Generated', new Date().toLocaleString()],
      [''],
    ];

    if (exportData.kpis) {
      summaryData.push(['Key Performance Indicators'], ['Metric', 'Value']);
      Object.entries(exportData.kpis).forEach(([key, value]) => {
        summaryData.push([key.replace(/_/g, ' '), value]);
      });
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Data sheets
    if (exportData.tables) {
      Object.entries(exportData.tables).forEach(([tableName, tableData]) => {
        if (tableData.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(tableData);
          XLSX.utils.book_append_sheet(workbook, worksheet, tableName.substring(0, 31));
        }
      });
    }

    XLSX.writeFile(workbook, filename);
  };

  // Export to JSON
  const exportToJSON = (exportData, filename) => {
    const jsonData = {
      metadata: {
        title,
        period: timeRange?.label || 'Custom Range',
        generated: new Date().toISOString(),
      },
      ...exportData,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json;charset=utf-8;', 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Handle export
  const handleExport = async () => {
    if (!data) {
      console.error('No data provided for export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (onExportStart) {
        onExportStart(selectedFormat);
      }

      const filename = generateFilename();
      setExportProgress(25);

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF(data, filename);
          break;
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'excel':
          exportToExcel(data, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
        default:
          throw new Error(`Unsupported export format: ${selectedFormat}`);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      if (onExportComplete) {
        onExportComplete(selectedFormat, filename);
      }

      // Reset after a short delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      
      if (onExportError) {
        onExportError(error);
      }
    }
  };

  // Handle scheduled export setup
  const handleScheduledExport = async () => {
    try {
      await apiClient.request('/api/analytics/export/schedule', {
        method: 'POST',
        body: {
          format: selectedFormat,
          title,
          frequency: scheduledExport.frequency,
          time: scheduledExport.time,
          email: scheduledExport.email,
          options: {
            includeCharts,
            timeRange: timeRange?.value,
          },
        },
      });

      console.log('Scheduled export configured successfully');
    } catch (error) {
      console.error('Failed to configure scheduled export:', error);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Export Data
        </h3>
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXPORT_FORMATS.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-0.5 ${
                      selectedFormat === format.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        selectedFormat === format.value
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {format.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Export Options
          </h4>
          
          {/* Custom Filename */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Filename (optional)
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={generateFilename()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Include Charts */}
          {selectedFormat === 'pdf' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Include charts and visualizations
              </label>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            disabled={isExporting || !data}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isExporting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting... {exportProgress}%</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export {EXPORT_FORMATS.find(f => f.value === selectedFormat)?.label}</span>
              </div>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        )}

        {/* Scheduled Export */}
        {showScheduler && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduled Export
              </h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableScheduled"
                  checked={scheduledExport.enabled}
                  onChange={(e) => setScheduledExport(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableScheduled" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Enable automatic scheduled exports
                </label>
              </div>

              {scheduledExport.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Frequency
                    </label>
                    <select
                      value={scheduledExport.frequency}
                      onChange={(e) => setScheduledExport(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledExport.time}
                      onChange={(e) => setScheduledExport(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={scheduledExport.email}
                      onChange={(e) => setScheduledExport(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {scheduledExport.enabled && (
                <button
                  onClick={handleScheduledExport}
                  className="ml-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Configure Schedule</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportManager;
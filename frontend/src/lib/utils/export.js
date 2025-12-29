/**
 * Export utilities for generating reports in various formats
 * Supports PDF, CSV, and Excel export functionality
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

/**
 * Export data to CSV format
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToCSV = (data, filename = 'report.csv', options = {}) => {
  try {
    const csv = Papa.unparse(data, {
      header: true,
      delimiter: options.delimiter || ',',
      ...options,
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV file');
  }
};

/**
 * Export data to Excel format
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToExcel = (data, filename = 'report.xlsx', options = {}) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Apply column widths if provided
    if (options.columnWidths) {
      worksheet['!cols'] = options.columnWidths;
    }
    
    // Apply styling if provided
    if (options.headerStyle) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = options.headerStyle;
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Report');
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Failed to export Excel file');
  }
};

/**
 * Export data to PDF format
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToPDF = (data, filename = 'report.pdf', options = {}) => {
  try {
    const doc = new jsPDF(options.orientation || 'portrait');
    
    // Add title if provided
    if (options.title) {
      doc.setFontSize(16);
      doc.text(options.title, 20, 20);
    }
    
    // Add metadata if provided
    if (options.metadata) {
      let yPosition = options.title ? 35 : 20;
      doc.setFontSize(10);
      Object.entries(options.metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPosition);
        yPosition += 7;
      });
    }
    
    // Convert data to table format
    const tableData = data.map(item => Object.values(item));
    const tableHeaders = data.length > 0 ? Object.keys(data[0]) : [];
    
    // Add table
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: options.title || options.metadata ? 50 : 20,
      theme: options.theme || 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      ...options.tableOptions,
    });
    
    doc.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF file');
  }
};

/**
 * Export chart/visualization to PDF
 * @param {HTMLElement} element - DOM element to capture
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportChartToPDF = async (element, filename = 'chart.pdf', options = {}) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      ...options.canvasOptions,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF(options.orientation || 'landscape');
    
    const imgWidth = options.width || 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (options.title) {
      doc.setFontSize(16);
      doc.text(options.title, 20, 20);
      doc.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    } else {
      doc.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    }
    
    doc.save(filename);
  } catch (error) {
    console.error('Chart PDF export failed:', error);
    throw new Error('Failed to export chart to PDF');
  }
};

/**
 * Generate report data based on filters and type
 * @param {string} reportType - Type of report to generate
 * @param {Object} filters - Report filters
 * @param {Array} rawData - Raw data to process
 * @returns {Array} Processed report data
 */
export const generateReportData = (reportType, filters, rawData) => {
  let processedData = [...rawData];
  
  // Apply date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (filters.dateRange) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = filters.startDate ? new Date(filters.startDate) : null;
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      processedData = processedData.filter(item => {
        const itemDate = new Date(item.date || item.createdAt || item.timestamp);
        return itemDate >= startDate;
      });
    }
  }
  
  // Apply report type specific processing
  switch (reportType) {
    case 'performance':
      return processedData.map(item => ({
        'Employee ID': item.employeeId,
        'Employee Name': item.employeeName,
        'Applications Processed': item.applicationsProcessed,
        'Approval Rate': `${item.approvalRate}%`,
        'Average Processing Time': `${item.avgProcessingTime}h`,
        'Customer Satisfaction': item.customerSatisfaction,
        'Date': new Date(item.date).toLocaleDateString(),
      }));
      
    case 'applications':
      return processedData.map(item => ({
        'Application ID': item.id,
        'Customer Name': item.customerName,
        'Application Type': item.type,
        'Status': item.status,
        'Submitted Date': new Date(item.submittedDate).toLocaleDateString(),
        'Processing Time': item.processingTime ? `${item.processingTime}h` : 'N/A',
        'Assigned Officer': item.assignedOfficer,
      }));
      
    case 'productivity':
      return processedData.map(item => ({
        'Date': new Date(item.date).toLocaleDateString(),
        'Tasks Completed': item.tasksCompleted,
        'Applications Reviewed': item.applicationsReviewed,
        'Documents Processed': item.documentsProcessed,
        'Customer Interactions': item.customerInteractions,
        'Efficiency Score': `${item.efficiencyScore}%`,
      }));
      
    default:
      return processedData;
  }
};

/**
 * Format report metadata for export
 * @param {Object} filters - Applied filters
 * @param {string} reportType - Report type
 * @returns {Object} Formatted metadata
 */
export const formatReportMetadata = (filters, reportType) => {
  const metadata = {
    'Report Type': reportType.charAt(0).toUpperCase() + reportType.slice(1),
    'Generated On': new Date().toLocaleString(),
    'Date Range': filters.dateRange || 'All Time',
  };
  
  if (filters.department) {
    metadata['Department'] = filters.department;
  }
  
  if (filters.employee) {
    metadata['Employee'] = filters.employee;
  }
  
  if (filters.status) {
    metadata['Status Filter'] = filters.status;
  }
  
  return metadata;
};

/**
 * Validate export data before processing
 * @param {Array} data - Data to validate
 * @param {string} format - Export format
 * @returns {boolean} Validation result
 */
export const validateExportData = (data, format) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data available for export');
  }
  
  if (!['csv', 'excel', 'pdf'].includes(format.toLowerCase())) {
    throw new Error('Unsupported export format');
  }
  
  // Check if data has consistent structure
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  const hasConsistentStructure = data.every(item => {
    const itemKeys = Object.keys(item);
    return keys.length === itemKeys.length && 
           keys.every(key => itemKeys.includes(key));
  });
  
  if (!hasConsistentStructure) {
    console.warn('Data structure is inconsistent, export may have issues');
  }
  
  return true;
};
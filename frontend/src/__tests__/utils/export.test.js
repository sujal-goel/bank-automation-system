/**
 * Export utilities tests
 * Tests for report data generation and validation functionality
 */

import { 
  generateReportData, 
  formatReportMetadata, 
  validateExportData, 
} from '@/lib/utils/export';

// Mock the export libraries to avoid ES module issues in Jest
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

jest.mock('papaparse', () => ({
  unparse: jest.fn(() => 'mocked,csv,data'),
}));

jest.mock('html2canvas', () => jest.fn());

describe('Export Utilities', () => {
  const mockRawData = [
    {
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      applicationsProcessed: 45,
      approvalRate: 78,
      avgProcessingTime: 2.5,
      customerSatisfaction: 4.2,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      applicationsProcessed: 52,
      approvalRate: 85,
      avgProcessingTime: 2.1,
      customerSatisfaction: 4.5,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  ];

  describe('generateReportData', () => {
    test('should generate performance report data correctly', () => {
      const filters = { dateRange: 'last_30_days' };
      const result = generateReportData('performance', filters, mockRawData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('Employee ID', 'EMP001');
      expect(result[0]).toHaveProperty('Employee Name', 'John Smith');
      expect(result[0]).toHaveProperty('Applications Processed', 45);
      expect(result[0]).toHaveProperty('Approval Rate', '78%');
    });

    test('should filter data by date range', () => {
      const oldData = [
        {
          employeeId: 'EMP003',
          employeeName: 'Old Employee',
          applicationsProcessed: 10,
          approvalRate: 50,
          avgProcessingTime: 5.0,
          customerSatisfaction: 3.0,
          date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        },
      ];
      
      const filters = { 
        dateRange: 'last_7_days',
      };
      const result = generateReportData('performance', filters, oldData);
      
      // Should filter out old data (100 days ago)
      expect(result).toHaveLength(0);
    });

    test('should handle applications report type', () => {
      const applicationsData = [
        {
          id: 'APP001',
          customerName: 'Alice Brown',
          type: 'Personal Loan',
          status: 'Approved',
          submittedDate: new Date('2024-01-15'),
          processingTime: 24,
          assignedOfficer: 'John Smith',
        },
      ];
      
      const result = generateReportData('applications', {}, applicationsData);
      
      expect(result[0]).toHaveProperty('Application ID', 'APP001');
      expect(result[0]).toHaveProperty('Customer Name', 'Alice Brown');
      expect(result[0]).toHaveProperty('Processing Time', '24h');
    });
  });

  describe('formatReportMetadata', () => {
    test('should format metadata correctly', () => {
      const filters = {
        dateRange: 'last_30_days',
        department: 'loans',
        employee: 'john_smith',
      };
      
      const metadata = formatReportMetadata(filters, 'performance');
      
      expect(metadata).toHaveProperty('Report Type', 'Performance');
      expect(metadata).toHaveProperty('Date Range', 'last_30_days');
      expect(metadata).toHaveProperty('Department', 'loans');
      expect(metadata).toHaveProperty('Employee', 'john_smith');
      expect(metadata).toHaveProperty('Generated On');
    });

    test('should handle minimal filters', () => {
      const filters = { dateRange: 'all' };
      const metadata = formatReportMetadata(filters, 'applications');
      
      expect(metadata).toHaveProperty('Report Type', 'Applications');
      expect(metadata).toHaveProperty('Date Range', 'all');
      expect(metadata).not.toHaveProperty('Department');
    });
  });

  describe('validateExportData', () => {
    test('should validate correct data', () => {
      expect(() => {
        validateExportData(mockRawData, 'pdf');
      }).not.toThrow();
    });

    test('should throw error for empty data', () => {
      expect(() => {
        validateExportData([], 'pdf');
      }).toThrow('No data available for export');
    });

    test('should throw error for invalid format', () => {
      expect(() => {
        validateExportData(mockRawData, 'invalid');
      }).toThrow('Unsupported export format');
    });

    test('should throw error for non-array data', () => {
      expect(() => {
        validateExportData(null, 'pdf');
      }).toThrow('No data available for export');
    });

    test('should handle inconsistent data structure', () => {
      const inconsistentData = [
        { name: 'John', age: 30 },
        { name: 'Jane', department: 'IT' }, // Missing age, has department
      ];
      
      // Should not throw but warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => {
        validateExportData(inconsistentData, 'csv');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data structure is inconsistent, export may have issues',
      );
      
      consoleSpy.mockRestore();
    });
  });
});
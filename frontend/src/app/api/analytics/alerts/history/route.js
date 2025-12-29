/**
 * Alert History API Route
 * Handles alert history operations
 */
import { NextResponse } from 'next/server';

// Mock historical alert data
const mockAlertHistory = [
  {
    id: 'hist-1',
    severity: 'critical',
    title: 'Database Connection Failure',
    message: 'Primary database connection lost',
    metric: 'database_connections',
    value: 0,
    threshold: 1,
    condition: 'below',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    duration: '15 minutes',
    resolvedAt: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-2',
    severity: 'warning',
    title: 'High Response Time',
    message: 'API response time exceeded threshold',
    metric: 'response_time',
    value: 2500,
    threshold: 2000,
    condition: 'above',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    duration: '8 minutes',
    resolvedAt: new Date(Date.now() - 232 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-3',
    severity: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance window started',
    metric: 'system_status',
    value: 0,
    threshold: 1,
    condition: 'below',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    duration: '2 hours',
    resolvedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-4',
    severity: 'warning',
    title: 'High Transaction Volume',
    message: 'Transaction volume exceeded normal levels',
    metric: 'transaction_volume',
    value: 1250,
    threshold: 1000,
    condition: 'above',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'acknowledged',
    acknowledgedBy: 'ops@bank.com',
    acknowledgedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
    duration: '45 minutes',
  },
  {
    id: 'hist-5',
    severity: 'critical',
    title: 'Memory Leak Detected',
    message: 'Application memory usage continuously increasing',
    metric: 'memory_usage',
    value: 98.5,
    threshold: 95,
    condition: 'above',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    duration: '1.5 hours',
    resolvedAt: new Date(Date.now() - 10.5 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/analytics/alerts/history
 * Fetch alert history with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let filteredHistory = [...mockAlertHistory];

    // Apply filters
    if (severity && severity !== 'all') {
      filteredHistory = filteredHistory.filter(alert => alert.severity === severity);
    }

    if (status && status !== 'all') {
      filteredHistory = filteredHistory.filter(alert => alert.status === status);
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const cutoffTime = new Date();
      
      switch (dateRange) {
        case '24h':
          cutoffTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoffTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffTime.setDate(now.getDate() - 30);
          break;
      }

      filteredHistory = filteredHistory.filter(alert => 
        new Date(alert.timestamp) >= cutoffTime,
      );
    }

    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedHistory,
      pagination: {
        total: filteredHistory.length,
        limit,
        offset,
        hasMore: offset + limit < filteredHistory.length,
      },
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert history' },
      { status: 500 },
    );
  }
}
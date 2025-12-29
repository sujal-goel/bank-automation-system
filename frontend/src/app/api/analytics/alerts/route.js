/**
 * Analytics Alerts API Route
 * Handles alert management operations
 */
import { NextResponse } from 'next/server';

// Mock data for development - replace with actual backend integration
const mockAlerts = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: 'High CPU Usage',
    message: 'CPU usage has exceeded 90% for the last 5 minutes',
    metric: 'cpu_usage',
    value: 95.2,
    threshold: 90,
    condition: 'above',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'active',
    channels: ['email', 'sms', 'in-app'],
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: 'High Memory Usage',
    message: 'Memory usage is approaching critical levels',
    metric: 'memory_usage',
    value: 82.5,
    threshold: 80,
    condition: 'above',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'acknowledged',
    acknowledgedBy: 'admin@bank.com',
    acknowledgedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    channels: ['in-app'],
  },
  {
    id: 'alert-3',
    severity: 'info',
    title: 'Database Connection Pool',
    message: 'Database connection pool usage is elevated',
    metric: 'database_connections',
    value: 45,
    threshold: 40,
    condition: 'above',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    channels: ['in-app'],
  },
];

/**
 * GET /api/analytics/alerts
 * Fetch all alerts with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const timeRange = searchParams.get('timeRange');

    let filteredAlerts = [...mockAlerts];

    // Apply filters
    if (severity && severity !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    if (status && status !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }

    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const cutoffTime = new Date();
      
      switch (timeRange) {
        case '1h':
          cutoffTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoffTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoffTime.setDate(now.getDate() - 7);
          break;
      }

      filteredAlerts = filteredAlerts.filter(alert => 
        new Date(alert.timestamp) >= cutoffTime,
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analytics/alerts
 * Create a new alert (typically called by monitoring system)
 */
export async function POST(request) {
  try {
    const alertData = await request.json();
    
    const newAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'active',
      ...alertData,
    };

    // In a real implementation, this would save to database
    mockAlerts.unshift(newAlert);

    return NextResponse.json({
      success: true,
      data: newAlert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create alert' },
      { status: 500 },
    );
  }
}
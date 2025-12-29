/**
 * Alert Thresholds API Route
 * Handles threshold configuration operations
 */
import { NextResponse } from 'next/server';

// Mock threshold data for development
const mockThresholds = [
  {
    id: 'threshold-1',
    name: 'High CPU Usage',
    metric: 'cpu_usage',
    condition: 'above',
    value: 90,
    severity: 'critical',
    enabled: true,
    channels: ['email', 'sms', 'in-app'],
    recipients: ['admin@bank.com', 'ops@bank.com', '+1234567890'],
    cooldown: 15,
    description: 'Alert when CPU usage exceeds 90% for sustained periods',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'threshold-2',
    name: 'Memory Usage Warning',
    metric: 'memory_usage',
    condition: 'above',
    value: 80,
    severity: 'warning',
    enabled: true,
    channels: ['in-app'],
    recipients: ['admin@bank.com'],
    cooldown: 30,
    description: 'Warning when memory usage approaches critical levels',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'threshold-3',
    name: 'Low Database Connections',
    metric: 'database_connections',
    condition: 'below',
    value: 5,
    severity: 'critical',
    enabled: false,
    channels: ['email', 'in-app'],
    recipients: ['dba@bank.com', 'admin@bank.com'],
    cooldown: 5,
    description: 'Alert when database connection pool is critically low',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/analytics/alert-thresholds
 * Fetch all alert thresholds
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const severity = searchParams.get('severity');

    let filteredThresholds = [...mockThresholds];

    // Apply filters
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      filteredThresholds = filteredThresholds.filter(threshold => threshold.enabled === isEnabled);
    }

    if (severity && severity !== 'all') {
      filteredThresholds = filteredThresholds.filter(threshold => threshold.severity === severity);
    }

    // Sort by name
    filteredThresholds.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: filteredThresholds,
    });
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert thresholds' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analytics/alert-thresholds
 * Create a new alert threshold
 */
export async function POST(request) {
  try {
    const thresholdData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'metric', 'condition', 'value', 'severity'];
    for (const field of requiredFields) {
      if (!thresholdData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const newThreshold = {
      id: `threshold-${Date.now()}`,
      ...thresholdData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, this would save to database
    mockThresholds.push(newThreshold);

    return NextResponse.json({
      success: true,
      data: newThreshold,
      message: 'Alert threshold created successfully',
    });
  } catch (error) {
    console.error('Error creating alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create alert threshold' },
      { status: 500 },
    );
  }
}
/**
 * Individual Alert Threshold API Route
 * Handles operations on specific alert thresholds
 */
import { NextResponse } from 'next/server';

// Mock threshold data (shared with main route)
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
 * GET /api/analytics/alert-thresholds/[id]
 * Get a specific alert threshold
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const threshold = mockThresholds.find(t => t.id === id);
    
    if (!threshold) {
      return NextResponse.json(
        { success: false, error: 'Alert threshold not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: threshold,
    });
  } catch (error) {
    console.error('Error fetching alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert threshold' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/analytics/alert-thresholds/[id]
 * Update a specific alert threshold
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    const thresholdIndex = mockThresholds.findIndex(t => t.id === id);
    
    if (thresholdIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Alert threshold not found' },
        { status: 404 },
      );
    }

    // Update the threshold
    mockThresholds[thresholdIndex] = {
      ...mockThresholds[thresholdIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockThresholds[thresholdIndex],
      message: 'Alert threshold updated successfully',
    });
  } catch (error) {
    console.error('Error updating alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert threshold' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/analytics/alert-thresholds/[id]
 * Partially update a specific alert threshold (e.g., enable/disable)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const patchData = await request.json();
    
    const thresholdIndex = mockThresholds.findIndex(t => t.id === id);
    
    if (thresholdIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Alert threshold not found' },
        { status: 404 },
      );
    }

    // Apply partial update
    mockThresholds[thresholdIndex] = {
      ...mockThresholds[thresholdIndex],
      ...patchData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockThresholds[thresholdIndex],
      message: 'Alert threshold updated successfully',
    });
  } catch (error) {
    console.error('Error patching alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert threshold' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/analytics/alert-thresholds/[id]
 * Delete a specific alert threshold
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const thresholdIndex = mockThresholds.findIndex(t => t.id === id);
    
    if (thresholdIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Alert threshold not found' },
        { status: 404 },
      );
    }

    // Remove the threshold
    const deletedThreshold = mockThresholds.splice(thresholdIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedThreshold,
      message: 'Alert threshold deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete alert threshold' },
      { status: 500 },
    );
  }
}
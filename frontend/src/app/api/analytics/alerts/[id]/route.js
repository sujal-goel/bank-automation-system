/**
 * Individual Alert API Route
 * Handles operations on specific alerts
 */
import { NextResponse } from 'next/server';

/**
 * DELETE /api/analytics/alerts/[id]
 * Delete a specific alert
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // In a real implementation, this would:
    // 1. Remove the alert from the database
    // 2. Clean up any related delivery records
    // 3. Update monitoring dashboards
    // 4. Log the deletion for audit purposes

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete alert' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/analytics/alerts/[id]
 * Get a specific alert
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Mock alert data - in real implementation, fetch from database
    const mockAlert = {
      id,
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
    };

    return NextResponse.json({
      success: true,
      data: mockAlert,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert' },
      { status: 500 },
    );
  }
}
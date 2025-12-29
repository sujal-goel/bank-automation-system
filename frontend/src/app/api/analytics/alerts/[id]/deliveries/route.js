/**
 * Alert Deliveries API Route
 * Handles alert delivery tracking operations
 */
import { NextResponse } from 'next/server';

// Mock delivery data for development
const mockDeliveries = {
  'alert-1': [
    {
      id: 'delivery-1',
      alertId: 'alert-1',
      channel: 'email',
      recipient: 'admin@bank.com',
      status: 'delivered',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      retryCount: 0,
      metadata: {
        messageId: 'msg-123',
        provider: 'sendgrid',
      },
    },
    {
      id: 'delivery-2',
      alertId: 'alert-1',
      channel: 'sms',
      recipient: '+1234567890',
      status: 'delivered',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      retryCount: 0,
      metadata: {
        messageId: 'sms-456',
        provider: 'twilio',
      },
    },
    {
      id: 'delivery-3',
      alertId: 'alert-1',
      channel: 'in-app',
      recipient: 'admin@bank.com',
      status: 'acknowledged',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      retryCount: 0,
    },
  ],
  'alert-2': [
    {
      id: 'delivery-4',
      alertId: 'alert-2',
      channel: 'in-app',
      recipient: 'admin@bank.com',
      status: 'acknowledged',
      timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      retryCount: 0,
    },
  ],
  'alert-3': [
    {
      id: 'delivery-5',
      alertId: 'alert-3',
      channel: 'in-app',
      recipient: 'admin@bank.com',
      status: 'delivered',
      timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
      retryCount: 0,
    },
  ],
};

/**
 * GET /api/analytics/alerts/[id]/deliveries
 * Fetch delivery status for a specific alert
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get deliveries for this alert
    const deliveries = mockDeliveries[id] || [];

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Error fetching alert deliveries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert deliveries' },
      { status: 500 },
    );
  }
}
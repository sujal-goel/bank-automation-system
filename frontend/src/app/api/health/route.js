import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the frontend
 */
export async function GET() {
  try {
    // Check backend health
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    const backendHealthy = backendResponse?.ok || false;
    const backendData = backendHealthy ? await backendResponse.json() : null;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      frontend: {
        status: 'healthy',
        version: '1.0.0',
      },
      backend: {
        status: backendHealthy ? 'healthy' : 'unhealthy',
        connected: backendHealthy,
        data: backendData,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
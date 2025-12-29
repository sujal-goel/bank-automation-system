/**
 * Users API Route - Proxy to Backend API
 * Forwards all user management requests to the actual backend API
 */

import { NextResponse } from 'next/server';

// Get backend API URL from environment variables
const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Helper function to get auth token from request headers
 */
function getAuthToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader; // Already includes 'Bearer ' prefix
}

/**
 * Helper function to forward request to backend
 */
async function forwardToBackend(endpoint, options = {}) {
  const url = `${BACKEND_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Backend request failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend service unavailable', 
      },
      { status: 503 },
    );
  }
}

/**
 * GET /api/auth/users
 * Proxy to backend user listing and retrieval
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authToken = getAuthToken(request);
  
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  // Check if requesting single user
  const userId = searchParams.get('id');
  const action = searchParams.get('action');
  
  if (action === 'get' && userId) {
    // Get single user: GET /api/auth/users/:userId
    return forwardToBackend(`/api/auth/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
    });
  }

  // List users with filters: GET /api/auth/users
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/auth/users?${queryString}` : '/api/auth/users';
  
  return forwardToBackend(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authToken,
    },
  });
}

/**
 * POST /api/auth/users
 * Proxy to backend user creation and bulk operations
 */
export async function POST(request) {
  const authToken = getAuthToken(request);
  
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // Handle bulk operations
    if (body.action === 'bulk') {
      const { operation, userIds } = body;

      if (!operation || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid bulk operation parameters' },
          { status: 400 },
        );
      }

      // For bulk operations, we need to make individual requests to backend
      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          let endpoint;
          let requestBody = {};
          let method = 'POST';

          switch (operation) {
            case 'activate':
              endpoint = `/api/auth/users/${userId}/status`;
              requestBody = { status: 'active' };
              method = 'PUT';
              break;
            case 'suspend':
              endpoint = `/api/auth/users/${userId}/status`;
              requestBody = { status: 'suspended' };
              method = 'PUT';
              break;
            case 'approve':
              endpoint = `/api/auth/users/${userId}/approve`;
              method = 'POST';
              break;
            case 'delete':
              // Set user to inactive instead of deleting
              endpoint = `/api/auth/users/${userId}/status`;
              requestBody = { status: 'inactive' };
              method = 'PUT';
              break;
            default:
              throw new Error(`Unsupported bulk operation: ${operation}`);
          }

          const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken,
            },
            body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
          });

          if (response.ok) {
            results.push(userId);
          } else {
            const errorData = await response.json();
            errors.push({ userId, error: errorData.error });
          }
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        message: `${operation} operation completed for ${results.length} users`,
        affectedUsers: results,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Handle user creation - determine signup type based on role
    const { role } = body;
    let endpoint;

    switch (role) {
      case 'admin':
      case 'super_admin':
      case 'department_admin':
        endpoint = '/api/auth/signup/admin';
        break;
      case 'employee':
      case 'bank_officer':
      case 'senior_bank_officer':
      case 'branch_manager':
      case 'compliance_officer':
      case 'senior_compliance_officer':
      case 'compliance_manager':
      case 'risk_analyst':
      case 'risk_manager':
      case 'system_admin':
      case 'developer':
      case 'it_manager':
        endpoint = '/api/auth/signup/employee';
        break;
      case 'customer':
      default:
        endpoint = '/api/auth/signup/customer';
        break;
    }

    return forwardToBackend(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
      },
      body: JSON.stringify(body),
    });

  } catch (error) {
    console.error('Error processing POST request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }
}

/**
 * PUT /api/auth/users
 * Proxy to backend user update
 */
export async function PUT(request) {
  const authToken = getAuthToken(request);
  
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 },
      );
    }

    // Backend only supports status updates for now
    if (updateData.status) {
      return forwardToBackend(`/api/auth/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': authToken,
        },
        body: JSON.stringify({ status: updateData.status }),
      });
    }

    // For other updates, return a message indicating the limitation
    return NextResponse.json({
      success: false,
      error: 'Only status updates are currently supported. Other profile updates need to be implemented in the backend.',
    }, { status: 501 });

  } catch (error) {
    console.error('Error processing PUT request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/auth/users
 * Proxy to backend user deletion (sets status to inactive)
 */
export async function DELETE(request) {
  const authToken = getAuthToken(request);
  
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('id');

    // If no query parameter, try to get from body
    if (!userId) {
      try {
        const body = await request.json();
        userId = body.id;
      } catch (error) {
        // Body parsing failed, continue with null userId
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 },
      );
    }

    // Backend doesn't have a delete user endpoint
    // Instead, we'll set the user status to 'inactive'
    return forwardToBackend(`/api/auth/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': authToken,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
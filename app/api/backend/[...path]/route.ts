import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

/**
 * Generic API route handler that proxies requests to the FastAPI backend
 * This helps avoid CORS issues by routing requests through Next.js server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const unwrappedParams = await params;
  return handleApiRequest(request, unwrappedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const unwrappedParams = await params;
  return handleApiRequest(request, unwrappedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const unwrappedParams = await params;
  return handleApiRequest(request, unwrappedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const unwrappedParams = await params;
  return handleApiRequest(request, unwrappedParams.path, 'DELETE');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const unwrappedParams = await params;
  return handleApiRequest(request, unwrappedParams.path, 'OPTIONS');
}

/**
 * Helper function to handle all API requests
 */
async function handleApiRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get backend API URL from environment variable or use default
    const apiUrl = process.env.API_URL || 'http://103.18.20.205:8090';
    
    // Construct the target URL by joining path segments
    const targetPath = pathSegments.map(segment => encodeURIComponent(segment)).join('/');
    const url = `${apiUrl}/${targetPath}${request.nextUrl.search}`;
    
    console.log(`Proxying ${method} request to: ${url}`);
    
    // Create options for the fetch request
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    // Forward the request body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        // Handle different content types
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const json = await request.json();
          options.body = JSON.stringify(json);
        } else if (contentType.includes('text/')) {
          options.body = await request.text();
        } else if (contentType.includes('form')) {
          options.body = await request.formData();
        } else {
          // For other content types, use arrayBuffer
          const buffer = await request.arrayBuffer();
          options.body = buffer;
        }
      } catch (e) {
        console.warn('Could not parse request body:', e);
      }
    }
    
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;
    
    // Forward the request to the backend
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    // Get the response data
    let responseData: ArrayBuffer | Blob | string | any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType.includes('text/')) {
      responseData = await response.text();
    } else {
      responseData = await response.blob();
    }
    
    // Create a response with the same status and headers
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error proxying request:', error);
    
    return NextResponse.json(
      { error: `Proxy error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
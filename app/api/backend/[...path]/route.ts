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
    const apiUrl = process.env.API_URL || 'http://127.0.0.1:8000';
    
    // Handle OPTIONS requests directly for CORS preflight
    if (method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }
    
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
        'Origin': 'http://localhost:3000'
      },
    };
    
    // Forward the request body for methods that support it
    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        // Handle different content types
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          requestBody = await request.json();
          console.log(`Request body for ${targetPath}:`, JSON.stringify(requestBody).substring(0, 200) + '...');
          options.body = JSON.stringify(requestBody);
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Longer timeout (30s)
    options.signal = controller.signal;
    
    // Forward the request to the backend with custom error handling
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Log the response status
      console.log(`Backend response for ${targetPath}: ${response.status} ${response.statusText}`);
      
      // Handle errors from the backend (non-200 responses)
      if (!response.ok) {
        let errorBody = 'No error details available';
        try {
          if (response.headers.get('content-type')?.includes('application/json')) {
            const errorJson = await response.json();
            errorBody = JSON.stringify(errorJson);
            console.error(`Backend error response (${url}):`, errorBody);
          } else {
            errorBody = await response.text();
            console.error(`Backend error response (${url}):`, errorBody);
          }
        } catch (e) {
          console.error(`Failed to parse error response: ${e}`);
        }
        
        // For calculate-results endpoint, provide more detailed error info
        if (targetPath === 'calculate-results') {
          console.error(`Assessment submission error - Request: `, 
            JSON.stringify(requestBody).substring(0, 500) + '...');
        }
        
        return NextResponse.json(
          { error: errorBody },
          {
            status: response.status,
            statusText: response.statusText,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
              'Access-Control-Allow-Headers': '*',
            },
          }
        );
      }
      
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
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': '*',
        },
      });
    } catch (fetchError) {
      // Handle fetch errors like timeouts or network failures
      console.error('Error during fetch operation:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      return NextResponse.json(
        { 
          error: `Backend connection error: ${errorMessage}`,
          details: fetchError instanceof Error ? fetchError.stack : null
        },
        { 
          status: 502, // Bad Gateway for backend connection issues
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': '*',
          }
        }
      );
    }
  } catch (error) {
    console.error('Error proxying request:', error);
    
    return NextResponse.json(
      { error: `Proxy error: ${error instanceof Error ? error.message : String(error)}` },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': '*',
        }
      }
    );
  }
} 
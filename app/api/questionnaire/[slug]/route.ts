import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const apiUrl = process.env.API_URL || 'http://103.18.20.205:8090';
    
    console.log(`Proxying questionnaire request for: ${slug} to ${apiUrl}`);
    
    // Add retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts} of ${maxAttempts} for slug: ${slug}`);
        
        // Using fetch with better timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch(`${apiUrl}/questionnaire/${slug}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched questionnaire data for ${slug}`);
        return NextResponse.json(data);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempts} failed:`, error.message || error);
        
        // Only retry on network errors or 5xx server errors
        if (error.name === 'AbortError' || 
            (error.message && error.message.includes('status: 5'))) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        } else {
          // Don't retry on client errors (4xx)
          break;
        }
      }
    }
    
    // All attempts failed
    console.error(`All ${maxAttempts} attempts failed for questionnaire: ${slug}`);
    const errorMessage = lastError?.message || 'Multiple fetch attempts failed';
    
    // Special handling for AbortError
    if (lastError?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. The API server might be down or slow to respond.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to fetch questionnaire: ${errorMessage}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in questionnaire route handler:', error);
    return NextResponse.json(
      { error: `Request failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 
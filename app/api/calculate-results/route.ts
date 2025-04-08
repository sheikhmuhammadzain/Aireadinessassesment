import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8090';
    const payload = await request.json();
    
    console.log(`Proxying calculate-results request to ${apiUrl}/calculate-results`);
    console.log('Request payload structure:', {
      assessmentType: payload.assessmentType,
      categoryCount: payload.categoryResponses?.length || 0,
      hasSubcategoryInfo: payload.categoryResponses?.[0]?.subcategoryResponses ? true : false
    });

    const response = await fetch(`${apiUrl}/calculate-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      // Add timeout for reliability
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      // Get detailed error info
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorDetail = errorText;
        } catch (textError) {
          // If text extraction fails, stick with the status message
        }
      }
      
      console.error(`API error: ${errorMessage}`, errorDetail);
      return NextResponse.json(
        { error: errorMessage, detail: errorDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calculating results:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { error: 'Failed to calculate results', message: errorMessage },
      { status: 500 }
    );
  }
} 
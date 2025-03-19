import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.API_URL || 'http://103.18.20.205:8090';
    const payload = await request.json();
    
    console.log(`Proxying calculate-results request`);
    const response = await fetch(`${apiUrl}/calculate-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (textError) {
          // If text extraction fails, stick with the status message
        }
      }
      throw new Error(`Failed to submit assessment: ${errorMessage}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calculating results:', error);
    return NextResponse.json(
      { error: 'Failed to calculate results' },
      { status: 500 }
    );
  }
} 
// Research API client for generating deep research reports
const RESEARCH_API_BASE_URL = 'http://103.18.20.205:8070';

export interface ResearchPayload {
  task: {
    description: string;
  };
  Strategy?: any;
  Data?: any;
  Technology?: any;
  Talent?: any;
  Culture?: any;
  AI_Security?: any;
  Governance?: any;
  report_type: string;
  report_source: string;
  tone: string;
  report_length: string;
}

// Maps assessment types in our app to the API's expected format
const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  "AI Governance": "Governance",
  "AI Culture": "Culture",
  "AI Infrastructure": "Technology",
  "AI Strategy": "Strategy",
  "AI Data": "Data",
  "AI Talent": "Talent",
  "AI Security": "AI_Security",
};

/**
 * Start a new research process
 * @param payload Research data payload
 * @returns Research ID if successful
 */
export async function startResearch(payload: ResearchPayload): Promise<string> {
  try {
    const response = await fetch(`${RESEARCH_API_BASE_URL}/research/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.research_id;
  } catch (error) {
    console.error('Error starting research:', error);
    throw error;
  }
}

/**
 * Check if research is complete
 * @param researchId Research ID to check
 * @returns Status of the research
 */
export async function checkResearchStatus(researchId: string): Promise<{ status: string, message: string }> {
  try {
    const response = await fetch(`${RESEARCH_API_BASE_URL}/research/${researchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error checking research status:', error);
    throw error;
  }
}

/**
 * Download the research report
 * @param researchId Research ID to download
 * @param fileType File type (html, pdf, etc.)
 * @returns HTML content of the report
 */
export async function downloadResearchReport(researchId: string, fileType = 'html'): Promise<string> {
  try {
    const response = await fetch(`${RESEARCH_API_BASE_URL}/download/${fileType}/${researchId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    console.error('Error downloading research report:', error);
    throw error;
  }
}

/**
 * Prepare research payload from assessment results
 * @param assessmentResults Assessment results from our app
 * @param companyName Company name for the report
 * @returns Formatted payload for the research API
 */
export function prepareResearchPayload(assessmentResults: Record<string, any>, companyName: string): ResearchPayload {
  // Default task description
  const description = `Write a detailed report on AI readiness score based on the 7 following pillars: 1. AI STRATEGY, 2. Data, 3. INFRASTRUCTURE, 4. TALENT, 5. CULTURE, 6. AI Security, 7. AI GOVERNANCE. The scale for the overallScore of a pillar is: 0-30% is AI dormant, 31-60% is AI aware, 61-85% is AI-rise, and 86-100% is AI ready. Must add your insights abstractive summary, cross pillar analysis in detail.`;

  // Create the base payload
  const payload: ResearchPayload = {
    task: {
      description
    },
    report_type: "research_report",
    report_source: "web",
    tone: "Formal",
    report_length: "comprehensive"
  };

  // Map our assessment types to the API's expected format
  Object.entries(assessmentResults).forEach(([assessmentType, data]) => {
    const apiKey = ASSESSMENT_TYPE_MAP[assessmentType];
    
    if (apiKey) {
      if (data.overallScore !== undefined) {
        // Check if we have detailed assessment data
        if (data.categoryScores && Object.keys(data.categoryScores).length > 0) {
          payload[apiKey as keyof ResearchPayload] = {
            overallScore: data.overallScore,
            categoryScores: data.categoryScores,
            qValues: data.qValues || {},
            softmaxWeights: data.softmaxWeights || {},
            userWeights: data.userWeights || {},
            adjustedWeights: data.adjustedWeights || {}
          };
        } else {
          // Mark as not assessed but include the score
          payload[apiKey as keyof ResearchPayload] = {
            overallScore: data.overallScore,
            not_assessed: data.overallScore
          };
        }
      }
    }
  });

  return payload;
} 
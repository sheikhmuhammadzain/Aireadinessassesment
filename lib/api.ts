import { AssessmentResponse, AssessmentResult, CompanyInfo, CategoryWeights, SubcategoryWeights } from "@/types";

// Remove trailing slash if present to avoid double slash issues
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Normalize URL to prevent double slash issues
 * @param path API path (should start with a slash)
 * @returns Properly formatted URL
 */
function normalizeUrl(path: string): string {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Fetch questionnaire for a specific assessment type
 * @param assessmentType The type of assessment
 * @returns Promise with questionnaire data
 */
export async function fetchQuestionnaire(assessmentType: string) {
  try {
    console.log(`Fetching questionnaire for: ${assessmentType}`);
    const encodedType = encodeURIComponent(assessmentType);
    const response = await fetch(normalizeUrl(`/questionnaire/${encodedType}`));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch questionnaire: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    throw error;
  }
}

/**
 * Fetch all available questionnaires
 * @returns Promise with all questionnaires data
 */
export async function fetchAllQuestionnaires() {
  try {
    console.log("Fetching all questionnaires");
    const response = await fetch(normalizeUrl("/questionnaires"));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch questionnaires: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    throw error;
  }
}

/**
 * Submit assessment responses and get results
 * @param payload Assessment response data
 * @returns Promise with assessment results
 */
export async function submitAssessment(payload: AssessmentResponse): Promise<AssessmentResult> {
  try {
    console.log(`Submitting assessment for: ${payload.assessmentType}`);
    
    // Log the payload to help with debugging
    console.log(`Assessment payload structure:`, 
      JSON.stringify({
        assessmentType: payload.assessmentType,
        categoryCount: payload.categoryResponses.length,
        hasSubcategoryInfo: !!payload.categoryResponses[0]?.subcategoryResponses
      })
    );
    
    const response = await fetch(normalizeUrl("/calculate-results"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit assessment: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting assessment:", error);
    throw error;
  }
}

/**
 * Get recommended weights based on company information
 * @param companyInfo Company information
 * @returns Promise with recommended weights
 */
export async function getRecommendedWeights(companyInfo: CompanyInfo) {
  try {
    console.log(`Getting recommended weights for: ${companyInfo.name}`);
    
    // Since the FastAPI backend doesn't have a recommend-weights endpoint (404 error),
    // we'll use a client-side fallback to generate weights
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Default weights
    const defaultWeights = {
      "AI Governance": 14.3,
      "AI Culture": 14.3,
      "AI Infrastructure": 14.3,
      "AI Strategy": 14.3,
      "AI Data": 14.3,
      "AI Talent": 14.3,
      "AI Security": 14.2
    };
    
    // For demo purposes, adjust weights based on company size
    if (companyInfo.size === "Enterprise (1000+ employees)") {
      return {
        "AI Governance": 18,
        "AI Culture": 12,
        "AI Infrastructure": 15,
        "AI Strategy": 16,
        "AI Data": 14,
        "AI Talent": 10,
        "AI Security": 15
      };
    } else if (companyInfo.size === "Mid-size (100-999 employees)") {
      return {
        "AI Governance": 12,
        "AI Culture": 15,
        "AI Infrastructure": 16,
        "AI Strategy": 15,
        "AI Data": 16,
        "AI Talent": 13,
        "AI Security": 13
      };
    } else if (companyInfo.size === "Small (10-99 employees)") {
      return {
        "AI Governance": 10,
        "AI Culture": 16,
        "AI Infrastructure": 14,
        "AI Strategy": 14,
        "AI Data": 18,
        "AI Talent": 16,
        "AI Security": 12
      };
    } else {
      return defaultWeights;
    }
  } catch (error) {
    console.error("Error getting recommended weights:", error);
    throw error;
  }
}

/**
 * Get recommendations for a specific category based on score
 * @param assessmentType Assessment type
 * @param category Category name
 * @param score Category score
 * @returns Promise with recommendations
 */
export async function getRecommendations(assessmentType: string, category: string, score: number) {
  try {
    console.log(`Getting recommendations for ${category} with score ${score}`);
    const encodedType = encodeURIComponent(assessmentType);
    const encodedCategory = encodeURIComponent(category);
    
    const response = await fetch(
      normalizeUrl(`/recommendations/${encodedType}/${encodedCategory}?score=${score}`)
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get recommendations: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error getting recommendations:", error);
    // Return fallback recommendations
    return {
      recommendations: [
        "Develop a strategic plan for this area",
        "Consult with domain experts to identify improvements",
        "Benchmark against industry leaders in this category"
      ]
    };
  }
} 
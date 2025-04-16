import { AssessmentResponse, AssessmentResult, CompanyInfo, CategoryWeights, SubcategoryWeights } from "@/types";

// Use a proxy URL for API requests to avoid CORS issues
// This points to our Next.js API route that will forward requests to the actual backend
const USE_PROXY = true;
const API_PROXY_URL = '/api/backend';
const API_DIRECT_URL = process.env.NEXT_PUBLIC_API_URL || "http://103.18.20.205:8090";

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache duration
const pendingRequests = new Map();

/**
 * Improved wrapper for API calls with caching and request deduplication
 */
async function cachedApiCall<T>(cacheKey: string, apiFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = apiCache.get(cacheKey);
  
  // Return cached response if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  
  // Check if we already have this request in flight
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Create new request and store the promise
  const requestPromise = (async () => {
    try {
      const data = await apiFn();
      apiCache.set(cacheKey, { data, timestamp: now });
      pendingRequests.delete(cacheKey);
      return data;
    } catch (error) {
      pendingRequests.delete(cacheKey);
      // If error occurs and we have a stale cache, return that instead of failing
      if (cached) {
        console.warn(`Error fetching fresh data for ${cacheKey}, using stale cache`);
        return cached.data as T;
      }
      throw error;
    }
  })();
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Create API URL using either direct backend URL or proxy URL
 * @param path API path (should start with a slash)
 * @returns Properly formatted URL
 */
function createApiUrl(path: string): string {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (USE_PROXY) {
    // When using proxy, we need to keep the full path after /api/backend
    return `${API_PROXY_URL}${normalizedPath}`;
  } else {
    // When accessing directly, add path to backend URL
    return `${API_DIRECT_URL}${normalizedPath}`;
  }
}

/**
 * Fetch a questionnaire by slug
 * @param slug Questionnaire slug
 * @returns Promise with questionnaire data
 */
export async function fetchQuestionnaire(slug: string) {
  return cachedApiCall(`questionnaire_${slug}`, async () => {
    try {
      const apiUrl = createApiUrl(`/questionnaire/${encodeURIComponent(slug)}`);
      console.log(`Fetching questionnaire from ${apiUrl}`);
      
      // Using fetch with better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API Error: Status ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching questionnaire: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched questionnaire data:`, data);
      
      // Fix data structure - if the response is not in the expected format with slug as the key
      // For example, if we expect { "AI Culture": {...} } but receive { subcategory1: [...], subcategory2: [...] }
      if (data && typeof data === 'object' && !data[slug]) {
        // Wrap the response in the expected format
        return { [slug]: data };
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching questionnaire ${slug}:`, error);
      // Provide more detailed error information
      if (error instanceof Error) {
        throw new Error(`Error fetching questionnaire: ${error.message}`);
      }
      throw error;
    }
  });
}

/**
 * Fetch all available questionnaires
 * @returns Promise with all questionnaires data
 */
export async function fetchAllQuestionnaires() {
  return cachedApiCall('all_questionnaires', async () => {
    try {
      const apiUrl = createApiUrl('/questionnaires');
      console.log(`Fetching all questionnaires from ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API Error: Status ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch questionnaires: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched all questionnaires`);
      return data;
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      // Provide more detailed error information
      if (error instanceof Error) {
        throw new Error(`Error fetching questionnaires: ${error.message}`);
      }
      throw error;
    }
  });
}

/**
 * Submit assessment responses and get results
 * @param payload Assessment response data
 * @returns Promise with assessment results
 */
export async function submitAssessment(payload: AssessmentResponse): Promise<AssessmentResult> {
  try {
    console.log(`Submitting assessment for: ${payload.assessmentType}`);
    
    // Log the payload structure to help with debugging
    console.log('Assessment payload structure:', {
      assessmentType: payload.assessmentType,
      categoryCount: payload.categoryResponses?.length || 0,
      hasSubcategoryInfo: payload.categoryResponses?.[0]?.subcategoryResponses ? true : false,
      categories: payload.categoryResponses?.map(c => c.category) || []
    });
    
    // Validate payload structure before submitting
    if (!payload.assessmentType || !payload.categoryResponses || payload.categoryResponses.length === 0) {
      throw new Error('Invalid assessment payload - missing required fields');
    }
    
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const apiUrl = createApiUrl('/calculate-results');
    console.log(`Submitting to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorDetail = errorText;
        } catch (textError) {
          // If text extraction fails, stick with the status message
        }
      }
      
      console.error(`API Error: ${errorMessage}`, errorDetail);
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error submitting assessment:", error);
    // Provide more detailed error information
    if (error instanceof Error) {
      throw new Error(`Error submitting assessment: ${error.message}`);
    }
    throw error;
  }
}

// Generate a fallback result when the API fails
function generateFallbackResult(payload: AssessmentResponse): AssessmentResult {
  console.log("Generating fallback result due to API failure");
  
  const categoryScores: Record<string, number> = {};
  const userWeights: Record<string, number> = {};
  const qValues: Record<string, number> = {};
  const adjustedWeights: Record<string, number> = {};
  
  // Calculate simple scores based on responses
  payload.categoryResponses.forEach(category => {
    // Calculate average score (1-4) and convert to percentage (25-100)
    const totalScore = category.responses.reduce((sum, item) => sum + item.answer, 0);
    const avgScore = (totalScore / category.responses.length) * 25; // Scale to 25-100
    
    categoryScores[category.category] = avgScore;
    userWeights[category.category] = category.weight;
    qValues[category.category] = Math.random(); // Random value as placeholder
    adjustedWeights[category.category] = category.weight;
  });
  
  // Calculate overall score
  const overallScore = Object.keys(categoryScores).reduce((sum, category) => {
    return sum + (categoryScores[category] * (userWeights[category] / 100));
  }, 0);
  
  return {
    assessmentType: payload.assessmentType,
    categoryScores,
    userWeights,
    qValues,
    adjustedWeights,
    overallScore
  };
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
    
    const apiUrl = createApiUrl(`/recommendations/${encodedType}/${encodedCategory}?score=${score}`);
    console.log(`Fetching recommendations from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
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

/**
 * Prefetch and normalize questionnaire data for common assessment types
 * This helps ensure data is ready when needed and in the correct format
 */
export function prefetchCommonQuestionnaires() {
  // Only run this on the client side
  if (typeof window === 'undefined') return;
  
  const commonTypes = ['AI Culture', 'AI Governance', 'AI Infrastructure', 'AI Strategy', 'AI Data', 'AI Talent'];
  
  console.log('Prefetching common questionnaire data');
  
  commonTypes.forEach(type => {
    // Use setTimeout to stagger requests and not block initial page load
    setTimeout(() => {
      fetchQuestionnaire(type)
        .then(data => {
          console.log(`Successfully prefetched ${type} questionnaire data`);
          // Optionally store in a global cache or localStorage for immediate access
          try {
            // Store preprocessed data structure in localStorage
            localStorage.setItem(`prefetched_questionnaire_${type}`, JSON.stringify(data));
          } catch (err) {
            console.warn(`Could not cache ${type} in localStorage:`, err);
          }
        })
        .catch(err => console.warn(`Prefetch failed for ${type}:`, err));
    }, Math.random() * 2000); // Random delay between 0-2 seconds
  });
} 
import { AssessmentResponse, AssessmentResult, CompanyInfo, CategoryWeights, SubcategoryWeights } from "@/types";
import axios from "axios";

// API configuration
const API_DIRECT_URL = process.env.NEXT_PUBLIC_API_URL || "http://103.18.20.205:8090";

// Request cache to prevent duplicate requests
const pendingRequests = new Map();

/**
 * Initialize axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_DIRECT_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Helper function to create an API URL
 */
function createApiUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Fetch a questionnaire by slug
 */
export async function fetchQuestionnaire(slug: string) {
  // Deduplicate identical requests
  const cacheKey = `questionnaire_${slug}`;
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const apiUrl = createApiUrl(`/questionnaire/${encodeURIComponent(slug)}`);
      console.log(`Fetching questionnaire from ${apiUrl}`);
      
      const response = await apiClient.get(apiUrl, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`Successfully fetched questionnaire data`);
      
      // Fix data structure if needed
      if (response.data && typeof response.data === 'object' && !response.data[slug]) {
        // Wrap the response in the expected format
        return { [slug]: response.data };
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching questionnaire ${slug}:`, error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`Error fetching questionnaire: ${error.message}`);
      }
      throw error;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Fetch all questionnaires
 */
export async function fetchAllQuestionnaires() {
  const cacheKey = 'all_questionnaires';
  
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      console.log('Fetching all questionnaires...');
      
      const apiUrl = createApiUrl('/questionnaires');
      console.log(`Fetching from: ${apiUrl}`);
      
      const response = await apiClient.get(apiUrl, {
        timeout: 30000 // 30 second timeout
      });
      
      console.log(`Successfully fetched all questionnaires`);
      return response.data;
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`Error fetching questionnaires: ${error.message}`);
      }
      throw error;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Submit assessment responses and get results
 */
export async function submitAssessment(payload: AssessmentResponse): Promise<AssessmentResult> {
  try {
    console.log(`Submitting assessment for: ${payload.assessmentType}`);
    
    // Validate payload structure before submitting
    if (!payload.assessmentType || !payload.categoryResponses || payload.categoryResponses.length === 0) {
      throw new Error('Invalid assessment payload - missing required fields');
    }
    
    // Validate each category has responses and weights
    let totalWeight = 0;
    for (const category of payload.categoryResponses) {
      if (!category.category || !category.responses || category.responses.length === 0) {
        throw new Error(`Invalid category data for "${category.category || 'unnamed category'}"`);
      }
      
      // Check if any response is invalid
      const invalidResponses = category.responses.filter(r => 
        r.answer === null || r.answer === undefined || r.answer < 1 || r.answer > 4);
      
      if (invalidResponses.length > 0) {
        throw new Error(
          `Category "${category.category}" has ${invalidResponses.length} invalid responses. ` +
          `All answers must be between 1-4.`
        );
      }
      
      // Validate weight
      if (typeof category.weight !== 'number' || category.weight <= 0 || category.weight > 100) {
        throw new Error(`Invalid weight for category "${category.category}": ${category.weight}`);
      }
      
      totalWeight += category.weight;
    }
    
    // Check total weight is approximately 100
    if (Math.abs(totalWeight - 100) > 1) {
      console.warn(`Warning: Category weights sum to ${totalWeight.toFixed(1)}%, not 100%. Adjusting...`);
      
      // Apply proportional adjustment
      const factor = 100 / totalWeight;
      payload.categoryResponses.forEach(category => {
        category.weight = parseFloat((category.weight * factor).toFixed(1));
      });
      
      // Fix any remaining discrepancy in the last category
      const newTotal = payload.categoryResponses.reduce((sum, cat) => sum + cat.weight, 0);
      if (Math.abs(newTotal - 100) > 0.1) {
        const lastCategory = payload.categoryResponses[payload.categoryResponses.length - 1];
        lastCategory.weight = parseFloat((lastCategory.weight + (100 - newTotal)).toFixed(1));
      }
      
      console.log('Adjusted weights to total 100%');
    }
    
    // Simplify the payload structure - create a more flat structure
    const simplifiedPayload = {
      assessmentType: payload.assessmentType,
      // Create a more direct structure for categories and responses
      categoryData: payload.categoryResponses.map(category => ({
        name: category.category,
        weight: category.weight,
        answers: category.responses.map(response => ({
          question: response.question,
          value: response.answer
        }))
      }))
    };
    
    // Log the simplified payload structure
    console.log('Simplified assessment payload structure:', {
      assessmentType: simplifiedPayload.assessmentType,
      categoryCount: simplifiedPayload.categoryData.length,
      categories: simplifiedPayload.categoryData.map(c => ({
        name: c.name,
        weight: c.weight,
        answerCount: c.answers.length
      }))
    });
    
    const apiUrl = createApiUrl('/calculate-results');
    console.log(`Submitting to: ${apiUrl}`);
    
    // Use the original payload structure for the calculation API
    const response = await apiClient.post(apiUrl, payload, {
      timeout: 30000 // 30 second timeout
    });
    
    const result = response.data;
    console.log('Assessment submission successful with result:', result);
    
    // Save assessment to database if user is logged in
    try {
      const token = localStorage.getItem('token');
      
      // Only proceed if user is authenticated and we have company data
      if (token && payload.assessmentType) {
        // Extract company ID from payload if available
        const companyId = (payload as any).companyId || "";
        
        if (companyId) {
          console.log('User is authenticated, saving assessment to database');
          
          // Dynamically import the API client
          const apiModule = await import('@/lib/api/client');
          const api = apiModule.default;
          
          // Format assessment data for the backend API using the simplified structure
          const assessmentData = {
            company_id: companyId,
            assessment_type: payload.assessmentType,
            status: "completed",
            score: result.overallScore,
            data: {
              categoryScores: result.categoryScores || {},
              userWeights: Object.fromEntries(payload.categoryResponses.map(cat => [cat.category, cat.weight])),
              adjustedWeights: result.adjustedWeights || {},
              qValues: result.qValues || {},
              responses: payload.categoryResponses.map(category => ({
                category: category.category,
                weight: category.weight,
                responses: category.responses
              }))
            },
            completed_at: new Date().toISOString(),
            completed_by_id: localStorage.getItem('user_id') || null
          };
          
          // First check if assessment exists for this company
          try {
            const companyAssessmentsResponse = await api.assessments.getCompanyAssessments(companyId);
            const existingAssessments = companyAssessmentsResponse.data;
            
            let existingId = null;
            if (existingAssessments) {
              // Try to find matching assessment
              if (Array.isArray(existingAssessments)) {
                const existing = existingAssessments.find((a: any) => 
                  a.assessment_type === payload.assessmentType
                );
                // Cast to any to avoid type errors
                const existingAny = existing as any;
                if (existingAny && existingAny.id) {
                  existingId = existingAny.id;
                }
              } else if (existingAssessments.assessments) {
                const existing = existingAssessments.assessments.find((a: any) => 
                  a.type === payload.assessmentType
                );
                // Cast to any to avoid type errors
                const existingAny = existing as any;
                if (existingAny && existingAny.id) {
                  existingId = existingAny.id;
                }
              }
            }
            
            // Either update or create based on what we found
            if (existingId) {
              console.log(`Updating existing assessment: ${existingId}`);
              await api.assessments.updateAssessment(existingId, assessmentData);
              console.log('Assessment updated successfully in database');
            } else {
              console.log('Creating new assessment in database with complete data');
              // Use the function that accepts full data
              await api.assessments.createAssessmentWithData(assessmentData);
              console.log('Assessment created successfully in database');
            }
          } catch (apiError) {
            console.warn('Error with assessment database operation:', apiError);
          }
        } else {
          console.log('Missing company ID, cannot save to database');
        }
      } else {
        console.log('User not authenticated or missing assessment data, skipping database save');
      }
    } catch (saveError) {
      console.warn('Could not save assessment to database:', saveError);
      // Continue with the result even if saving failed
    }
    
    return result;
  } catch (error) {
    console.error("Error submitting assessment:", error);
    
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('Request timed out while submitting assessment. The server may be overloaded or not responding.');
    }
    
    if (error instanceof Error) {
      throw new Error(`Error submitting assessment: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get recommended weights based on company information
 */
export async function getRecommendedWeights(companyInfo: CompanyInfo) {
  try {
    console.log(`Getting recommended weights for: ${companyInfo.name}`);
    
    // If company has an ID, try to get company-specific weights from the backend
    if (companyInfo.id) {
      try {
        const apiUrl = createApiUrl(`/companies/${encodeURIComponent(companyInfo.id)}/weights`);
        const response = await apiClient.get(apiUrl);
        
        console.log(`Successfully fetched weights from backend for company: ${companyInfo.name}`);
        return response.data;
      } catch (apiError) {
        console.warn("Could not fetch weights from backend:", apiError);
      }
    }
    
    // Generate recommended weights based on company industry, size, and maturity
    if (companyInfo.industry === "Government" || companyInfo.industry?.includes("Government")) {
      console.log("Using government-specific recommended weights");
      return {
        "AI Governance": 20.0,
        "AI Infrastructure": 15.0,
        "AI Strategy": 15.0,
        "AI Data": 15.0,
        "AI Security": 15.0,
        "AI Culture": 10.0,
        "AI Talent": 10.0
      };
    }

    // Try to get default weights from backend
    try {
      const apiUrl = createApiUrl(`/weights/defaults`);
      const response = await apiClient.get(apiUrl);
      
      console.log(`Successfully fetched default weights from backend`);
      return response.data;
    } catch (apiError) {
      console.warn("Could not fetch default weights from backend:", apiError);
    }
    
    // Fallback to static defaults if backend fails
    console.log("Using fallback defaults for weights");
    
    // Default weights with equal distribution
    return {
      "AI Governance": 14.3,
      "AI Culture": 14.3,
      "AI Infrastructure": 14.3,
      "AI Strategy": 14.3,
      "AI Data": 14.3,
      "AI Talent": 14.3,
      "AI Security": 14.2
    };
  } catch (error) {
    console.error("Error getting recommended weights:", error);
    throw error;
  }
}

/**
 * Save company weights to the backend
 */
export async function saveCompanyWeights(companyId: string, weights: CategoryWeights) {
  try {
    console.log(`Saving weights for company: ${companyId}`);
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated: No token found in localStorage');
    }
    
    // Check if ID is numeric, as required by the backend
    const isNumericId = /^\d+$/.test(companyId);
    if (!isNumericId) {
      console.warn(`Company ID "${companyId}" is not in the expected numeric format. Attempting to find a valid ID...`);
      companyId = await getValidCompanyId(companyId);
    }
    
    const apiUrl = createApiUrl(`/companies/${encodeURIComponent(companyId)}/weights`);
    console.log(`Making API request to: ${apiUrl}`);
    
    const response = await apiClient.put(apiUrl, { weights }, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    console.log(`Successfully saved weights for company: ${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error saving company weights:", error);
    
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorMessage = typeof error.response.data === 'object' 
        ? error.response.data.detail || JSON.stringify(error.response.data)
        : error.response.data;
      throw new Error(errorMessage);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while saving weights');
  }
}

/**
 * Save category weights to the backend
 */
export async function saveCategoryWeights(companyId: string, assessmentType: string, weights: SubcategoryWeights | Record<string, number>) {
  try {
    console.log(`Saving ${assessmentType} weights for company: ${companyId}`);
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated: No token found in localStorage');
    }
    
    let weightsToSend: Record<string, number>;
    
    // Check if weights is a SubcategoryWeights object or just a Record<string, number>
    if (assessmentType in weights && typeof weights[assessmentType] === 'object') {
      // It's a SubcategoryWeights object
      weightsToSend = weights[assessmentType] as Record<string, number>;
    } else {
      // It's already a Record<string, number>
      weightsToSend = weights as Record<string, number>;
    }
    
    if (Object.keys(weightsToSend).length === 0) {
      console.warn(`No weights found for ${assessmentType}. Skipping save.`);
      return {};
    }
    
    // Check if ID is numeric, as required by the backend
    const isNumericId = /^\d+$/.test(companyId);
    if (!isNumericId) {
      console.warn(`Company ID "${companyId}" is not in the expected numeric format. Attempting to find a valid ID...`);
      companyId = await getValidCompanyId(companyId);
    }
    
    const apiUrl = createApiUrl(`/companies/${encodeURIComponent(companyId)}/weights/${encodeURIComponent(assessmentType)}`);
    console.log(`Making API request to: ${apiUrl}`);
    console.log(`Request payload:`, { weights: weightsToSend });
    
    const response = await apiClient.put(apiUrl, { weights: weightsToSend }, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    console.log(`Successfully saved ${assessmentType} weights for company: ${companyId}`);
    return response.data;
  } catch (error) {
    console.error(`Error saving ${assessmentType} weights:`, error);
    
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorMessage = typeof error.response.data === 'object' 
        ? error.response.data.detail || JSON.stringify(error.response.data)
        : error.response.data;
      throw new Error(errorMessage);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while saving weights');
  }
}

/**
 * Helper function to find a valid company ID
 */
async function getValidCompanyId(companyId: string): Promise<string> {
  // Try to get companies from localStorage to find a numeric ID match
  const storedCompanies = localStorage.getItem('companies');
  
  if (storedCompanies) {
    try {
      const companies = JSON.parse(storedCompanies);
      // Find company by string ID and get its numeric ID if exists
      const company = companies.find((c: any) => c.id === companyId || c.stringId === companyId);
      if (company && /^\d+$/.test(company.id)) {
        console.log(`Found numeric ID "${company.id}" for company "${companyId}"`);
        return company.id;
      } else {
        // Try the first company as fallback
        if (companies.length > 0 && companies[0].id && /^\d+$/.test(companies[0].id)) {
          console.log(`Using first available company ID: ${companies[0].id}`);
          return companies[0].id;
        }
      }
    } catch (parseError) {
      console.error("Error parsing companies from localStorage:", parseError);
    }
  }
  
  // Default to ID "1" as a last resort
  console.warn(`No valid company ID found. Using default company ID "1".`);
  return "1";
}

/**
 * Get recommendations for a specific category based on score
 */
export async function getRecommendations(assessmentType: string, category: string, score: number) {
  try {
    console.log(`Getting recommendations for ${category} with score ${score}`);
    const encodedType = encodeURIComponent(assessmentType);
    const encodedCategory = encodeURIComponent(category);
    
    const apiUrl = createApiUrl(`/recommendations/${encodedType}/${encodedCategory}?score=${score}`);
    console.log(`Fetching recommendations from: ${apiUrl}`);
    
    const response = await apiClient.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    // Simple fallback recommendations for UI display
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
 * Prefetch common questionnaires
 */
export function prefetchCommonQuestionnaires() {
  // Only run this on the client side
  if (typeof window === 'undefined') return;
  
  const commonTypes = ['AI Culture', 'AI Governance', 'AI Infrastructure', 'AI Strategy', 'AI Data', 'AI Talent'];
  
  console.log('Prefetching common questionnaire data');
  
  commonTypes.forEach(type => {
    // Stagger requests and not block initial page load
    setTimeout(() => {
      fetchQuestionnaire(type)
        .then(() => console.log(`Successfully prefetched ${type} questionnaire data`))
        .catch(err => console.warn(`Prefetch failed for ${type}:`, err));
    }, Math.random() * 2000); // Random delay between 0-2 seconds
  });
}

/**
 * Fetch questionnaires directly from the backend
 */
export const fetchQuestionnairesDirectly = async (): Promise<Record<string, any>> => {
  console.log('Fetching questionnaires directly from backend...');
  
  try {
    const requestUrl = createApiUrl('/questionnaires');
    console.log(`Making request to: ${requestUrl}`);
    
    const response = await apiClient.get(requestUrl, {
      timeout: 20000, // 20 second timeout
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Successfully fetched questionnaires from backend directly');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch questionnaires from backend:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error('Request timed out after 20 seconds. The backend server might be running slowly or not responding.');
      } else if (!error.response) {
        console.error('Network error: Failed to fetch. The backend server might not be running.');
        console.error('Please run the backend server using: python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000');
      }
    }
    
    throw error;
  }
};

/**
 * Synchronize category weights between backend and frontend
 */
export async function syncCategoryWeights(companyId: string, assessmentType: string): Promise<Record<string, number>> {
  try {
    console.log(`Synchronizing weights for company ${companyId}, assessment ${assessmentType}`);
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found, may not be able to access protected endpoints');
    }
    
    // Check if ID is numeric, as required by the backend
    const isNumericId = /^\d+$/.test(companyId);
    if (!isNumericId) {
      console.warn(`Company ID "${companyId}" is not in the expected numeric format. Attempting to find a valid ID...`);
      companyId = await getValidCompanyId(companyId);
    }
    
    // Step 1: Get weights from backend
    let backendWeights: Record<string, number> = {};
    try {
      const apiUrl = createApiUrl(`/companies/${encodeURIComponent(companyId)}/weights/${encodeURIComponent(assessmentType)}`);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await apiClient.get(apiUrl, { headers });
      backendWeights = response.data[assessmentType] || {};
      console.log(`Successfully fetched weights from backend:`, backendWeights);
    } catch (error) {
      console.warn("Could not fetch weights from backend:", error);
    }
    
    // Step 2: Get weights from localStorage
    let localWeights: Record<string, number> = {};
    const companyWeightsKey = `company_weights_${companyId}_${assessmentType}`;
    const storedWeights = localStorage.getItem(companyWeightsKey);
    const generalStoredWeights = localStorage.getItem('subcategory_weights');
    
    try {
      if (storedWeights) {
        localWeights = JSON.parse(storedWeights);
        console.log(`Found company-specific weights in localStorage:`, localWeights);
      } else if (generalStoredWeights) {
        // Check if we have category-specific weights in the general store
        const allWeights = JSON.parse(generalStoredWeights) as Record<string, Record<string, number>>;
        if (allWeights && allWeights[assessmentType]) {
          localWeights = allWeights[assessmentType];
          console.log(`Found weights in general localStorage:`, localWeights);
        }
      }
    } catch (error) {
      console.error("Error parsing stored weights:", error);
    }
    
    // Step 3: Determine the most up-to-date weights
    let finalWeights: Record<string, number>;
    
    // If backend has weights, prioritize those
    if (Object.keys(backendWeights).length > 0) {
      finalWeights = backendWeights;
    } 
    // Otherwise, use local weights if available
    else if (Object.keys(localWeights).length > 0) {
      finalWeights = localWeights;
      
      // Push local weights to backend to ensure consistency
      try {
        const weightsToSave: Record<string, Record<string, number>> = {
          [assessmentType]: localWeights
        };
        
        await saveCategoryWeights(companyId, assessmentType, weightsToSave);
        console.log(`Successfully saved local weights to backend`);
      } catch (saveError) {
        console.warn("Could not save local weights to backend:", saveError);
      }
    } 
    // If no weights are found, use equal distribution
    else {
      finalWeights = await getDefaultEqualSubcategoryWeights(assessmentType);
      
      // Save default weights to backend
      try {
        const weightsToSave: Record<string, Record<string, number>> = {
          [assessmentType]: finalWeights
        };
        
        await saveCategoryWeights(companyId, assessmentType, weightsToSave);
        console.log(`Successfully saved default weights to backend`);
      } catch (saveError) {
        console.warn("Could not save default weights to backend:", saveError);
      }
    }
    
    // Step 4: Update localStorage with the final weights
    try {
      // Save to company-specific key
      localStorage.setItem(companyWeightsKey, JSON.stringify(finalWeights));
      
      // Also update general weights storage
      const generalWeights = JSON.parse(localStorage.getItem('subcategory_weights') || '{}') as Record<string, Record<string, number>>;
      generalWeights[assessmentType] = finalWeights;
      localStorage.setItem('subcategory_weights', JSON.stringify(generalWeights));
      
      // Update the category weights derived from subcategory weights
      const derivedCategoryWeights = convertSubcategoryToCategory(generalWeights);
      localStorage.setItem('assessment_weights', JSON.stringify(derivedCategoryWeights));
      
      console.log(`Successfully updated localStorage with synchronized weights`);
    } catch (storageError) {
      console.error("Error saving weights to localStorage:", storageError);
    }
    
    return finalWeights;
  } catch (error) {
    console.error(`Error synchronizing weights:`, error);
    throw error;
  }
}

/**
 * Helper function to get default equal subcategory weights
 */
async function getDefaultEqualSubcategoryWeights(assessmentType: string): Promise<Record<string, number>> {
  try {
    // Try to get the questionnaire to determine subcategories
    const questionnaire = await fetchQuestionnaire(assessmentType);
    if (questionnaire && questionnaire[assessmentType]) {
      const categories = Object.keys(questionnaire[assessmentType]);
      const defaultWeight = Number((100 / categories.length).toFixed(1));
      
      const weights: Record<string, number> = {};
      categories.forEach(category => {
        weights[category] = defaultWeight;
      });
      
      // Adjust the last category to ensure sum is exactly 100
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        const lastCategory = categories[categories.length - 1];
        weights[lastCategory] = Number((weights[lastCategory] + (100 - totalWeight)).toFixed(1));
      }
      
      return weights;
    }
  } catch (error) {
    console.warn("Error getting questionnaire for default weights:", error);
  }
  
  // Fallback with a simple equal distribution across common subcategories
  return {
    "Strategy": 25,
    "Implementation": 25,
    "Monitoring": 25,
    "Evaluation": 25
  };
}

/**
 * Convert subcategory weights to category weights
 */
function convertSubcategoryToCategory(subcategoryWeights: Record<string, Record<string, number>>): Record<string, number> {
  const categoryWeights: Record<string, number> = {};
  
  // For each pillar/assessment type
  Object.keys(subcategoryWeights).forEach(pillar => {
    // Calculate average weight for the pillar
    const weights = Object.values(subcategoryWeights[pillar]);
    if (weights.length > 0) {
      categoryWeights[pillar] = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    }
  });
  
  return categoryWeights;
}

/**
 * Synchronize company pillar weights
 */
export async function syncCompanyWeights(companyId: string): Promise<Record<string, number>> {
  try {
    console.log(`Synchronizing pillar weights for company ${companyId}`);
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found, may not be able to access protected endpoints');
    }
    
    // Check if ID is numeric, as required by the backend
    const isNumericId = /^\d+$/.test(companyId);
    if (!isNumericId) {
      console.warn(`Company ID "${companyId}" is not in the expected numeric format. Attempting to find a valid ID...`);
      companyId = await getValidCompanyId(companyId);
    }
    
    // Step 1: Get weights from backend
    let backendWeights: Record<string, number> = {};
    try {
      const apiUrl = createApiUrl(`/companies/${encodeURIComponent(companyId)}/weights`);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await apiClient.get(apiUrl, { headers });
      backendWeights = response.data;
      console.log(`Successfully fetched pillar weights from backend:`, backendWeights);
    } catch (error) {
      console.warn("Could not fetch pillar weights from backend:", error);
    }
    
    // Step 2: Get weights from localStorage
    let localWeights: Record<string, number> = {};
    const companyWeightsKey = `pillar_weights_${companyId}`;
    const storedWeights = localStorage.getItem(companyWeightsKey);
    const generalStoredWeights = localStorage.getItem('assessment_weights');
    
    try {
      if (storedWeights) {
        localWeights = JSON.parse(storedWeights);
        console.log(`Found company-specific pillar weights in localStorage:`, localWeights);
      } else if (generalStoredWeights) {
        localWeights = JSON.parse(generalStoredWeights);
        console.log(`Found pillar weights in general localStorage:`, localWeights);
      }
    } catch (error) {
      console.error("Error parsing stored pillar weights:", error);
    }
    
    // Step 3: Determine the most up-to-date weights
    let finalWeights: Record<string, number>;
    
    // If backend has weights, prioritize those
    if (Object.keys(backendWeights).length > 0) {
      finalWeights = backendWeights;
    } 
    // Otherwise, use local weights if available
    else if (Object.keys(localWeights).length > 0) {
      finalWeights = localWeights;
      
      // Push local weights to backend to ensure consistency
      try {
        await saveCompanyWeights(companyId, finalWeights);
        console.log(`Successfully saved local pillar weights to backend`);
      } catch (saveError) {
        console.warn("Could not save local pillar weights to backend:", saveError);
      }
    } 
    // If no weights are found, use default equal distribution
    else {
      finalWeights = getDefaultEqualWeights();
      
      // Save default weights to backend
      try {
        await saveCompanyWeights(companyId, finalWeights);
        console.log(`Successfully saved default pillar weights to backend`);
      } catch (saveError) {
        console.warn("Could not save default pillar weights to backend:", saveError);
      }
    }
    
    // Step 4: Update localStorage with the final weights
    try {
      // Save to company-specific key
      localStorage.setItem(companyWeightsKey, JSON.stringify(finalWeights));
      
      // Also update general weights storage
      localStorage.setItem('assessment_weights', JSON.stringify(finalWeights));
      
      console.log(`Successfully updated localStorage with synchronized pillar weights`);
    } catch (storageError) {
      console.error("Error saving pillar weights to localStorage:", storageError);
    }
    
    return finalWeights;
  } catch (error) {
    console.error(`Error synchronizing pillar weights:`, error);
    throw error;
  }
}

/**
 * Helper function to get default equal weights
 */
function getDefaultEqualWeights(): Record<string, number> {
  // Default pillars with equal distribution
  const defaultPillars = ["AI Governance", "AI Culture", "AI Infrastructure", "AI Strategy", 
                         "AI Data", "AI Talent", "AI Security"];
  const equalWeight = Number((100 / defaultPillars.length).toFixed(1));
  
  const weights: Record<string, number> = {};
  defaultPillars.forEach(pillar => {
    weights[pillar] = equalWeight;
  });
  
  // Adjust the last pillar to ensure sum is exactly 100
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(totalWeight - 100) > 0.1) {
    const lastPillar = defaultPillars[defaultPillars.length - 1];
    weights[lastPillar] = Number((weights[lastPillar] + (100 - totalWeight)).toFixed(1));
  }
  
  return weights;
} 
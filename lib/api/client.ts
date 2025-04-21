import { User, CompanyInfo, CompanyAssessmentStatus } from "@/types";

// Base API URL
// const API_BASE_URL = '/api/backend'; // Changed to use Next.js API proxy instead of direct backend URL
const API_BASE_URL = 'http://127.0.0.1:8000'; // Point directly to the backend

// Response type wrapper
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Auth Types
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Helper to get stored token
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Base fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
    const token = getToken();
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add timeout signal (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status} for ${endpoint}`);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Handle error responses from the API proxy
        if (!response.ok) {
          console.error(`API Error (${response.status}):`, data);
          
          // Try to extract detailed error message
          const errorMessage = data.error || data.detail || (typeof data === 'object' ? JSON.stringify(data) : `Error ${response.status}: ${response.statusText}`);
          return { error: errorMessage };
        }
        
        return { data };
      } else {
        const text = await response.text();
        
        if (!response.ok) {
          console.error(`API Text Error (${response.status}):`, text);
          
          // For 422 errors, try to provide more helpful information
          if (response.status === 422) {
            return { error: `Validation error (422): ${text}. Please check the data format.` };
          }
          
          return { error: text || `Error ${response.status}: ${response.statusText}` };
        }
        
        return { data: text as unknown as T };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        return { error: 'Request timed out. Please check if the backend server is running.' };
      }
      
      console.error(`Fetch error for ${endpoint}:`, fetchError);
      
      // Check if it's a network error (backend not running)
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        return { error: `Connection error: Could not connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.` };
      }
      
      return { error: fetchError instanceof Error ? fetchError.message : 'Network error' };
    }
  } catch (error) {
    console.error('API wrapper error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    // Convert to form data for OAuth2 endpoint
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    return apiFetch<LoginResponse>('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  },
  
  signup: async (email: string, name: string, password: string, role: string): Promise<ApiResponse<User>> => {
    return apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, role }),
    });
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiFetch<User>('/users/me');
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiFetch<User[]>('/users');
  },
  
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return apiFetch<User>(`/users/${userId}`);
  },
};

// Companies API
export const companiesApi = {
  getCompanies: async (): Promise<ApiResponse<CompanyInfo[]>> => {
    const response = await apiFetch<any[]>('/companies');
    
    // Convert the data to match expected format if needed
    if (response.data && Array.isArray(response.data)) {
      // Process the companies to ensure they have the right format
      const processedCompanies = response.data.map(company => ({
        id: company.id || '',
        name: company.name || 'Unknown Company',
        industry: company.industry || 'Other',
        size: company.size || 'Unknown',
        region: company.region || 'Unknown',
        // Convert snake_case to camelCase 
        aiMaturity: company.ai_maturity || company.aiMaturity || 'Initial',
        notes: company.notes || '',
        // Convert snake_case to camelCase
        createdAt: company.created_at || company.createdAt || new Date().toISOString(),
        updatedAt: company.updated_at || company.updatedAt || new Date().toISOString()
      }));
      
      return { data: processedCompanies as CompanyInfo[] };
    }
    
    return response as ApiResponse<CompanyInfo[]>;
  },
  
  getCompany: async (companyId: string): Promise<ApiResponse<CompanyInfo>> => {
    const response = await apiFetch<any>(`/companies/${companyId}`);
    
    if (response.data) {
      // Convert snake_case to camelCase
      const company = response.data;
      const processedCompany: CompanyInfo = {
        id: company.id || '',
        name: company.name || 'Unknown Company',
        industry: company.industry || 'Other',
        size: company.size || 'Unknown',
        region: company.region || 'Unknown',
        aiMaturity: company.ai_maturity || company.aiMaturity || 'Initial',
        notes: company.notes || '',
        createdAt: company.created_at || company.createdAt || new Date().toISOString(),
        updatedAt: company.updated_at || company.updatedAt || new Date().toISOString()
      };
      
      return { data: processedCompany };
    }
    
    return response as ApiResponse<CompanyInfo>;
  },
  
  createCompany: async (company: Omit<CompanyInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CompanyInfo>> => {
    // Convert camelCase to snake_case for backend API compatibility
    const backendCompany = {
      name: company.name,
      industry: company.industry,
      size: company.size,
      region: company.region,
      ai_maturity: company.aiMaturity, // Convert camelCase to snake_case
      notes: company.notes || ""
    };
    
    return apiFetch<CompanyInfo>('/companies', {
      method: 'POST',
      body: JSON.stringify(backendCompany),
    });
  },
  
  updateCompany: async (companyId: string, company: Omit<CompanyInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CompanyInfo>> => {
    // Convert camelCase to snake_case for backend API compatibility
    const backendCompany = {
      name: company.name,
      industry: company.industry,
      size: company.size,
      region: company.region,
      ai_maturity: company.aiMaturity, // Convert camelCase to snake_case
      notes: company.notes || ""
    };
    
    return apiFetch<CompanyInfo>(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(backendCompany),
    });
  },
  
  deleteCompany: async (companyId: string): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/companies/${companyId}`, {
      method: 'DELETE',
    });
  },
  
  getCompanyUsers: async (companyId: string): Promise<ApiResponse<User[]>> => {
    return apiFetch<User[]>(`/companies/${companyId}/users`);
  },
  
  assignUsers: async (companyId: string, userIds: string[]): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/companies/${companyId}/assign-users`, {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId, user_ids: userIds }),
    });
  },
};

// Assessments API
export const assessmentsApi = {
  getCompanyAssessments: async (companyId: string): Promise<ApiResponse<CompanyAssessmentStatus>> => {
    const response = await apiFetch<any>(`/companies/${companyId}/assessments`);
    
    // Handle backend format mismatch
    if (response.data && Array.isArray(response.data)) {
      // Format the data to match expected CompanyAssessmentStatus
      const company = await companiesApi.getCompany(companyId);
      const companyName = company?.data?.name || '';
      
      // Format assessments from array to expected structure
      const assessments = response.data.map(assessment => ({
        type: assessment.assessment_type || assessment.assessmentType || '',
        status: assessment.status || 'not-started',
        score: assessment.score || 0,
        completedAt: assessment.completed_at || assessment.completedAt || null
      }));
      
      return { 
        data: {
          companyId: companyId,
          companyName: companyName,
          assessments: assessments
        } 
      };
    }
    
    return response;
  },
  
  getAssessment: async (assessmentId: string): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/assessments/${assessmentId}`);
  },
  
  createAssessment: async (companyId: string, assessmentType: string): Promise<ApiResponse<any>> => {
    try {
      // Construct proper API request body
      const requestData = {
        company_id: companyId,
        assessment_type: assessmentType,
        status: 'not-started'
      };
      
      console.log(`Creating assessment for company ${companyId}, type ${assessmentType}`);
      
      return await apiFetch<any>('/assessments', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.error("Error creating assessment:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  },
  
  updateAssessment: async (assessmentId: string, data: any): Promise<ApiResponse<any>> => {
    try {
      // Ensure data has the required fields and right format
      const requestData = {
        company_id: data.company_id || "",
        assessment_type: data.assessment_type || "", 
        status: data.status || "in-progress",
        score: data.score || null,
        data: data.data || null,
        completed_at: data.completed_at || null
      };
      
      console.log(`Updating assessment ${assessmentId} with data:`, requestData);
      
      return await apiFetch<any>(`/assessments/${assessmentId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.error(`Error updating assessment ${assessmentId}:`, error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  },
  
  submitAssessment: async (assessmentId: string, data: any): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        status: 'completed',
      }),
    });
  },
};

// Questionnaires API with specialized handling
export const questionnairesApi = {
  getQuestionnaires: async (): Promise<ApiResponse<any>> => {
    try {
      // Use a longer timeout for questionnaires (could be larger data)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${API_BASE_URL}/questionnaires`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || `Error ${response.status}: ${response.statusText}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  },
  
  getQuestionnaire: async (assessmentType: string): Promise<ApiResponse<any>> => {
    try {
      // Use a longer timeout for questionnaires (could be larger data)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${API_BASE_URL}/questionnaire/${assessmentType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || `Error ${response.status}: ${response.statusText}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

// Weights API for managing pillar and category weights
export const weightApi = {
  getCompanyWeights: async (companyId: string): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/companies/${companyId}/weights`);
  },
  
  updateCompanyWeights: async (companyId: string, weights: any): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/companies/${companyId}/weights`, {
      method: 'PUT',
      body: JSON.stringify(weights),
    });
  },
  
  updateCategoryWeights: async (companyId: string, assessmentType: string, weights: any): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/companies/${companyId}/weights/${assessmentType}`, {
      method: 'PUT',
      body: JSON.stringify(weights),
    });
  },
  
  getDefaultWeights: async (): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/weights/defaults`);
  },
  
  updateDefaultWeights: async (weights: any): Promise<ApiResponse<any>> => {
    return apiFetch<any>(`/weights/defaults`, {
      method: 'PUT',
      body: JSON.stringify(weights),
    });
  },
};

// Export a default API object with all services
const api = {
  auth: authApi,
  users: usersApi,
  companies: companiesApi,
  assessments: assessmentsApi,
  questionnaires: questionnairesApi,
  weights: weightApi,
};

export default api; 
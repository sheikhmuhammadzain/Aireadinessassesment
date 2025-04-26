import { User, CompanyInfo, CompanyAssessmentStatus } from "@/types";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Base API URL
// const API_BASE_URL = '/api/backend'; // Use Next.js API proxy instead of direct backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://103.18.20.205:8090'; // Point directly to the backend

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

// Initialize axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Base API call wrapper with error handling
async function apiCall<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<ApiResponse<T>> {
  try {
    console.log(`Making API request to: ${endpoint}`);
    
    const response = await apiClient({
      url: endpoint,
      ...options
    });
    
    return { data: response.data };
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Handle timeout errors
      if (axiosError.code === 'ECONNABORTED') {
        return { error: 'Request timed out. Please check if the backend server is running.' };
      }
      
      // Handle network errors
      if (!axiosError.response) {
        return { error: `Connection error: Could not connect to backend server. Please ensure the backend is running.` };
      }
      
      // Handle error response with data
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data as any;
        
        if (typeof errorData === 'string') {
          return { error: errorData };
        }
        
        // Better error message extraction
        let errorMessage;
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        } else if (typeof errorData === 'object') {
          errorMessage = JSON.stringify(errorData);
        } else {
          errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.statusText}`;
        }
        
        return { error: errorMessage };
      }
      
      // Generic error with status code
      return { error: `Error ${axiosError.response?.status || 'unknown'}: ${axiosError.message}` };
    }
    
    // Non-axios errors
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<any>> => {
    // Convert to form data for OAuth2 endpoint
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    return apiCall('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
  },
  
  signup: async (email: string, name: string, password: string, roles: string[] | string): Promise<ApiResponse<User>> => {
    // Support both string and array formats for roles for backward compatibility
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    return apiCall<User>('/users', {
      method: 'POST',
      data: { email, name, password, roles: rolesArray }
    });
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiCall<User>('/users/me');
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>('/users');
  },
  
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return apiCall<User>(`/users/${userId}`);
  },
  
  createUser: async (userData: { name: string; email: string; roles: string[] | string; password?: string }): Promise<ApiResponse<User>> => {
    // If no password provided, generate a random temporary one
    // Support both string and array formats for roles for backward compatibility
    const rolesArray = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
    
    const data = {
      ...userData,
      roles: rolesArray,
      password: userData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    };
    
    return apiCall<User>('/users', {
      method: 'POST',
      data
    });
  },
  
  updateUser: async (userId: string, userData: { name?: string; email?: string; roles?: string[] | string; password?: string }): Promise<ApiResponse<User>> => {
    // If roles provided, ensure it's an array
    const data = { ...userData };
    if (userData.roles) {
      data.roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
    }
    
    return apiCall<User>(`/users/${userId}`, {
      method: 'PUT',
      data
    });
  },
  
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/users/${userId}`, {
      method: 'DELETE'
    });
  },
};

// Companies API
export const companiesApi = {
  getCompanies: async (): Promise<ApiResponse<CompanyInfo[]>> => {
    const response = await apiCall<any[]>('/companies');
    
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
    const response = await apiCall<any>(`/companies/${companyId}`);
    
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
      notes: company.notes || "",
      verified_info: company.verifiedInfo ? JSON.stringify(company.verifiedInfo) : null // Add verified info
    };
    
    return apiCall<CompanyInfo>('/companies', {
      method: 'POST',
      data: backendCompany
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
      notes: company.notes || "",
      verified_info: company.verifiedInfo ? JSON.stringify(company.verifiedInfo) : null // Add verified info
    };
    
    return apiCall<CompanyInfo>(`/companies/${companyId}`, {
      method: 'PUT',
      data: backendCompany
    });
  },
  
  deleteCompany: async (companyId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/companies/${companyId}`, {
      method: 'DELETE'
    });
  },
  
  getCompanyUsers: async (companyId: string): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>(`/companies/${companyId}/users`);
  },
  
  assignUsers: async (companyId: string, userIds: string[]): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/companies/${companyId}/assign-users`, {
      method: 'POST',
      data: { company_id: companyId, user_ids: userIds }
    });
  },
};

// Assessments API
export const assessmentsApi = {
  getCompanyAssessments: async (companyId: string): Promise<ApiResponse<CompanyAssessmentStatus>> => {
    const response = await apiCall<any>(`/companies/${companyId}/assessments`);
    
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
    return apiCall<any>(`/assessments/${assessmentId}`);
  },
  
  createAssessment: async (companyId: string, assessmentType: string): Promise<ApiResponse<any>> => {
    const requestData = {
      company_id: companyId,
      assessment_type: assessmentType,
      status: 'not-started',
      score: 0,
      data: {
        categoryScores: {},
        userWeights: {},
        adjustedWeights: {},
        qValues: {},
        responses: []
      },
      completed_at: null,
      completed_by_id: null
    };
    
    console.log(`Creating assessment for company ${companyId}, type ${assessmentType}`);
    
    return apiCall<any>('/assessments', {
      method: 'POST',
      data: requestData
    });
  },
  
  createAssessmentWithData: async (assessmentData: any): Promise<ApiResponse<any>> => {
    console.log(`Creating assessment with complete data for company ${assessmentData.company_id} - sending direct to backend`);
    
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No auth token found, falling back to API proxy");
        return apiCall<any>('/assessments', {
          method: 'POST',
          data: assessmentData
        });
      }
      
      // Direct fetch to backend instead of using the proxy
      const response = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assessmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Backend error: ${response.status} ${response.statusText}`, errorData);
        
        // If the error is unauthorized, try the API proxy as fallback
        if (response.status === 401) {
          console.log("Auth error with direct backend access, falling back to API proxy");
          return apiCall<any>('/assessments', {
            method: 'POST',
            data: assessmentData
          });
        }
        
        return { 
          error: `Backend error: ${response.status} ${response.statusText} - ${errorData}`
        };
      }
      
      const data = await response.json();
      console.log('Successfully created assessment directly on backend');
      return { data };
    } catch (error) {
      console.error('Error creating assessment:', error);
      
      // On any error, try the API proxy as fallback
      console.log("Error with direct backend access, falling back to API proxy");
    return apiCall<any>('/assessments', {
      method: 'POST',
      data: assessmentData
    });
    }
  },
  
  updateAssessment: async (assessmentId: string, data: any): Promise<ApiResponse<any>> => {
    // Ensure data has the required fields and right format
    const requestData = {
      company_id: data.company_id || "",
      assessment_type: data.assessment_type || "", 
      status: data.status || "in-progress",
      score: data.score ?? null, // Use nullish coalescing to handle 0 scores correctly
      data: data.data || {},
      completed_at: data.completed_at || null,
      completed_by_id: data.completed_by_id || null
    };
    
    console.log(`Updating assessment ${assessmentId} with data - sending direct to backend`);
    
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No auth token found, falling back to API proxy");
        return apiCall<any>(`/assessments/${assessmentId}`, {
          method: 'PUT',
          data: requestData
        });
      }
      
      // Direct fetch to backend instead of using the proxy
      const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
    
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Backend error: ${response.status} ${response.statusText}`, errorData);
        
        // If the error is unauthorized, try the API proxy as fallback
        if (response.status === 401) {
          console.log("Auth error with direct backend access, falling back to API proxy");
          return apiCall<any>(`/assessments/${assessmentId}`, {
            method: 'PUT',
            data: requestData
          });
        }
        
        return { 
          error: `Backend error: ${response.status} ${response.statusText} - ${errorData}`
        };
      }
      
      const data = await response.json();
      console.log('Successfully updated assessment directly on backend');
      return { data };
    } catch (error) {
      console.error('Error updating assessment:', error);
      
      // On any error, try the API proxy as fallback
      console.log("Error with direct backend access, falling back to API proxy");
    return apiCall<any>(`/assessments/${assessmentId}`, {
      method: 'PUT',
      data: requestData
    });
    }
  },
  
  submitAssessment: async (assessmentId: string, data: any): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/assessments/${assessmentId}`, {
      method: 'PUT',
      data: {
        ...data,
        status: 'completed'
      }
    });
  },
};

// Questionnaires API
export const questionnairesApi = {
  getQuestionnaires: async (): Promise<ApiResponse<any>> => {
    return apiCall<any>('/questionnaires', {
      timeout: 60000 // 60 second timeout for questionnaires
    });
  },
  
  getQuestionnaire: async (assessmentType: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/questionnaire/${assessmentType}`, {
      timeout: 60000 // 60 second timeout for questionnaires
    });
  },
};

// Weights API for managing pillar and category weights
export const weightApi = {
  getCompanyWeights: async (companyId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/companies/${companyId}/weights`);
  },
  
  updateCompanyWeights: async (companyId: string, weights: any): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/companies/${companyId}/weights`, {
      method: 'PUT',
      data: weights
    });
  },
  
  updateCategoryWeights: async (companyId: string, assessmentType: string, weights: any): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/companies/${companyId}/weights/${assessmentType}`, {
      method: 'PUT',
      data: weights
    });
  },
  
  getDefaultWeights: async (): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/weights/defaults`);
  },
  
  updateDefaultWeights: async (weights: any): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/weights/defaults`, {
      method: 'PUT',
      data: weights
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
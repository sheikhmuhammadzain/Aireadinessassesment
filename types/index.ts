export interface CompanyInfo {
  id?: string;
  name: string;
  industry: string;
  size: string;
  region: string;
  aiMaturity: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  verifiedInfo?: CompanyVerificationInfo;
}

export interface CompanyVerificationInfo {
  name: string;
  industry: string;
  size: string;
  description: string;
  sources: {
    title: string;
    link: string;
  }[];
  isVerified: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // e.g., 'admin', 'user', 'pillar_lead'
  createdAt?: string;
  updatedAt?: string;
  // Add companies if needed, based on backend response structure
  companies?: CompanyInfo[]; 
}

// Define assessment status types
export interface Assessment {
  id?: string;
  type: string;
  status: "not-started" | "in-progress" | "completed";
  score?: number | null;
  completedAt?: string | null;
}

export interface CompanyAssessmentStatus {
  companyId: string;
  companyName: string;
  assessments: Assessment[];
}

export interface Question {
  question: string;
  answer: number | null;
}

export interface CategoryQuestions {
  [category: string]: Question[];
}

// New interface for category weights
export interface CategoryWeights {
  [category: string]: number;
}

// Interface for subcategory weights (renamed to category)
export interface SubcategoryWeights {
  [category: string]: {
    [category: string]: number;
  };
}

// Interface for subcategory responses (renamed to category)
export interface SubcategoryResponse {
  category: string;
  responses: {
    question: string;
    answer: number;
  }[];
  weight: number;
}

export interface CategoryResponse {
  category: string;
  responses: {
    question: string;
    answer: number;
  }[];
  weight: number;
  // Add category responses for nested structure
  subcategoryResponses?: SubcategoryResponse[];
}

export interface AssessmentResponse {
  assessmentType: string;
  categoryResponses: CategoryResponse[];
}

export interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  userWeights: Record<string, number>;
  qValues: Record<string, number>;
  adjustedWeights: Record<string, number>;
  softmaxWeights?: Record<string, number>;
  overallScore: number;
}

export interface WebSearchResult {
  weights: CategoryWeights;
  explanation: string;
  companyInsights: string;
} 
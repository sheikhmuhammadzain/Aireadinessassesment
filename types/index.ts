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
}

// Define assessment status types
export interface Assessment {
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

export interface CategoryWeights {
  [category: string]: number;
}

// New interface for subcategory weights
export interface SubcategoryWeights {
  [category: string]: {
    [subcategory: string]: number;
  };
}

// New interface for subcategory responses
export interface SubcategoryResponse {
  subcategory: string;
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
  // Add subcategory responses for nested structure
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
  overallScore: number;
}

export interface WebSearchResult {
  weights: CategoryWeights;
  explanation: string;
  companyInsights: string;
} 
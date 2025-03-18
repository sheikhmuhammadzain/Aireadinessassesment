export interface CompanyInfo {
  name: string;
  size: string;
  industry: string;
  description?: string;
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
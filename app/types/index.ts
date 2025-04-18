export interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  region: string;
  notes?: string;
  aiMaturity: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyAssessmentStatus {
  companyId: string;
  companyName: string;
  assessments: {
    type: string;
    status: 'completed' | 'in-progress' | 'not-started';
    score?: number;
    completedAt?: string;
  }[];
} 
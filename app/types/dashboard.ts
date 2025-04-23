import { FC } from 'react';

// Dashboard Types
export interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  userWeights: Record<string, number>;
  adjustedWeights: Record<string, number>;
  overallScore: number;
}

export interface AssessmentType {
  id: string;
  title: string;
  icon: FC;
}

export interface ChartDataItem {
  name: string;
  score: number;
} 
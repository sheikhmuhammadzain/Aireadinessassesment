"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Info,
} from "lucide-react";
import { AssessmentResult } from "@/types/dashboard";

interface KeyInsightsProps {
  results: Record<string, AssessmentResult>;
  strongestArea: string | null;
  weakestArea: string | null;
  readinessLevel: string;
}

export function KeyInsights({
  results,
  strongestArea,
  weakestArea,
  readinessLevel,
}: KeyInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {strongestArea && (
          <div className="flex items-start">
            <div className="bg-green-50 p-2 rounded-full mr-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">Strongest Area</h3>
              <p className="text-sm text-muted-foreground">
                {strongestArea} ({results[strongestArea]?.overallScore}%)
              </p>
            </div>
          </div>
        )}
        
        {weakestArea && (
          <div className="flex items-start">
            <div className="bg-amber-50 p-2 rounded-full mr-3">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Area for Improvement</h3>
              <p className="text-sm text-muted-foreground">
                {weakestArea} ({results[weakestArea]?.overallScore}%)
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-start">
          <div className="bg-blue-50 p-2 rounded-full mr-3">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Your Readiness Level</h3>
            <p className="text-sm text-muted-foreground">
              {readinessLevel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
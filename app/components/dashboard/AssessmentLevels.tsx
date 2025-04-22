"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart4 } from "lucide-react";
import { AssessmentLevelsVisual } from "@/components/assessment-levels-visual";

interface AssessmentLevelsProps {
  overallScore: number;
}

export function AssessmentLevels({ overallScore }: AssessmentLevelsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart4 className="h-5 w-5 mr-2 text-primary" />
          Assessment Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssessmentLevelsVisual 
          overallScore={overallScore} 
          className="max-w-md mx-auto" 
        />
      </CardContent>
    </Card>
  );
} 
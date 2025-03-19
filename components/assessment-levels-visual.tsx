"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssessmentLevel {
  range: string;
  label: string;
  description: string;
}

const assessmentLevels: AssessmentLevel[] = [
  {
    range: "0-30",
    label: "Unprepared",
    description: "AI Dormant"
  },
  {
    range: "30-60",
    label: "Somewhat Ready",
    description: "AI Aware"
  },
  {
    range: "60-85",
    label: "Moderately Prepared",
    description: "AI Rise"
  },
  {
    range: "85+",
    label: "Fully Prepared",
    description: "AI Ready"
  }
];

interface AssessmentLevelsVisualProps {
  overallScore: number;
}

export function AssessmentLevelsVisual({ overallScore }: AssessmentLevelsVisualProps) {
  // Calculate which level the score falls into
  const getLevel = (score: number) => {
    if (score <= 30) return 0;
    if (score <= 60) return 1;
    if (score <= 85) return 2;
    return 3;
  };

  const currentLevel = getLevel(overallScore);

  return (
    <Card className="mb-6">
      <CardHeader className="bg-slate-50 pb-4">
        <CardTitle className="text-center text-xl font-medium text-slate-800">
          AI Readiness Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative mb-8">
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 my-6 relative">
            {/* Filled progress */}
            <motion.div 
              className="absolute top-0 left-0 h-1 bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, overallScore)}%` }}
              transition={{ duration: 0.8 }}
            />
            
            {/* Marker dots */}
            {assessmentLevels.map((_, index) => {
              const position = index === 0 ? '0%' : 
                              index === 1 ? '33%' : 
                              index === 2 ? '66%' : '100%';
              
              return (
                <div key={index} className="absolute -top-1.5" style={{ left: position }}>
                  <div className={`w-3 h-3 rounded-full ${
                    index <= currentLevel ? 'bg-blue-500' : 'bg-gray-300'
                  } border border-white`}></div>
                </div>
              );
            })}
          </div>

          {/* Score indicator */}
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-slate-500">Current Score:</span>
            <span className="ml-2 text-lg font-semibold text-blue-600">{overallScore}</span>
          </div>

          {/* Level labels */}
          <div className="flex justify-between text-xs text-slate-500 px-1">
            {assessmentLevels.map((level, index) => (
              <div 
                key={index} 
                className={cn(
                  "text-center w-1/4",
                  currentLevel === index ? "text-blue-600 font-medium" : ""
                )}
              >
                <div className="text-xs font-medium">{level.range}</div>
                <div className="text-sm mt-1">{level.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current level description */}
        <div className="text-center border-t pt-4 mt-2">
          <div className="text-md font-medium text-slate-700">
            {assessmentLevels[currentLevel].label}: {assessmentLevels[currentLevel].description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
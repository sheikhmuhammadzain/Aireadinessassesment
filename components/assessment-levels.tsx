"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface AssessmentLevel {
  range: string;
  label: string;
  description: string;
  color: string;
  recommendation: string;
}

const assessmentLevels: AssessmentLevel[] = [
  {
    range: "0 – 30%",
    label: "AI Dormant",
    description: "Your organization is in the early stages of AI adoption",
    color: "#FFB4A2", // Light red
    recommendation: "Develop a well-defined AI strategy aligned with business goals, secure executive sponsorship, and build foundational AI capabilities."
  },
  {
    range: "31 – 60%",
    label: "AI Aware",
    description: "Your organization has begun implementing AI initiatives",
    color: "#F9C74F", // Light amber
    recommendation: "Enhance AI project identification and prioritization frameworks, strengthen budgeting processes, and drive stakeholder engagement through structured change management."
  },
  {
    range: "61 – 85%",
    label: "AI Rise",
    description: "Your organization has established AI practices",
    color: "#90BE6D", // Light green
    recommendation: "Ensure AI investments are strategically aligned with business objectives, establish governance models for AI oversight, and create a robust AI implementation roadmap."
  },
  {
    range: "86 – 100%",
    label: "AI Ready",
    description: "Your organization has mature AI capabilities",
    color: "#8ECAE6", // Light blue
    recommendation: "Scale AI-driven initiatives across departments, optimize AI-enhanced workflows, and fully integrate AI into core business decision-making for long-term success."
  }
];

interface AssessmentLevelsProps {
  overallScore: number;
  categoryScores?: Record<string, number>;
}

export function AssessmentLevels({ overallScore, categoryScores }: AssessmentLevelsProps) {
  const getCurrentLevel = (score: number): AssessmentLevel => {
    if (score <= 30) return assessmentLevels[0];
    if (score <= 60) return assessmentLevels[1];
    if (score <= 85) return assessmentLevels[2];
    return assessmentLevels[3];
  };

  const currentLevel = getCurrentLevel(overallScore);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Assessment Maturity Level
        </CardTitle>
        <CardDescription>
          Each pillar is evaluated across five levels of AI maturity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visual representation of levels */}
        <div className="relative mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">
              <span className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
                  <path d="M13 18l-6-6 6-6"></path>
                </svg>
              </span>
              Start
            </div>
            <div className="text-sm font-medium">
              Goal
              <span className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </span>
            </div>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full mb-2 relative">
            {/* Progress indicator */}
            <div 
              className="absolute h-2 rounded-full transition-all duration-1000 ease-in-out"
              style={{ 
                width: `${Math.min(100, overallScore)}%`,
                background: currentLevel.color
              }}
            ></div>
            
            {/* Level markers */}
            {assessmentLevels.map((level, index) => {
              const position = index === 0 ? 0 : index === 1 ? 30 : index === 2 ? 60 : 85;
              return (
                <div 
                  key={level.label}
                  className="absolute top-0 -mt-1 transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div 
                    className={cn(
                      "w-4 h-4 rounded-full border-2 border-white",
                      overallScore > position ? "bg-blue-500" : "bg-gray-300"
                    )}
                  ></div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            {assessmentLevels.map((level, index) => (
              <div 
                key={level.label}
                className={cn(
                  "text-center",
                  index === 0 ? "text-left" : "",
                  index === assessmentLevels.length - 1 ? "text-right" : ""
                )}
                style={{ 
                  width: index === 0 ? '30%' : index === 1 ? '30%' : index === 2 ? '25%' : '15%',
                  color: overallScore >= (index === 0 ? 0 : index === 1 ? 31 : index === 2 ? 61 : 86) ? currentLevel.color : undefined
                }}
              >
                <div className="font-semibold">{level.label}</div>
                <div>{level.range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current level details */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Badge 
              className="mr-2"
              style={{ backgroundColor: currentLevel.color, color: '#000' }}
            >
              {currentLevel.label}
            </Badge>
            <span className="text-lg font-semibold">{Math.round(overallScore)}% - {currentLevel.description}</span>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Recommendations:</h3>
          <p className="text-gray-700 mb-4">{currentLevel.recommendation}</p>
          
          {categoryScores && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Category Maturity Levels:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categoryScores).map(([category, score]) => {
                  const categoryLevel = getCurrentLevel(score);
                  return (
                    <div key={category} className="flex items-start">
                      <Badge 
                        className="mt-1 mr-2 flex-shrink-0"
                        style={{ backgroundColor: categoryLevel.color, color: '#000' }}
                      >
                        {categoryLevel.label}
                      </Badge>
                      <div>
                        <div className="font-medium">{category}: {Math.round(score)}%</div>
                        <div className="text-sm text-gray-600">{categoryLevel.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
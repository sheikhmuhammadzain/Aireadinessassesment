"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AssessmentLevel {
  range: string;
  label: string;
  score: string;
  description: string;
}

const assessmentLevels: AssessmentLevel[] = [
  {
    range: "0-30",
    label: "Unprepared –",
    score: "Score: 0-30",
    description: "AI Dormant"
  },
  {
    range: "30-60",
    label: "Somewhat Ready –",
    score: "Score: 30 - 60",
    description: "AI Aware"
  },
  {
    range: "60-85",
    label: "Moderately Prepared –",
    score: "Score: 60 - 85",
    description: "AI Rise"
  },
  {
    range: "85+",
    label: "Fully Prepared –",
    score: "Score: 85+",
    description: "AI Ready"
  }
];

interface AssessmentLevelsVisualProps {
  overallScore: number;
}

export function AssessmentLevelsVisual({ overallScore }: AssessmentLevelsVisualProps) {
  // Calculate runner position based on score
  const getRunnerPosition = (score: number) => {
    if (score <= 30) return 0;
    if (score <= 60) return 1;
    if (score <= 85) return 2;
    return 3;
  };

  const runnerPosition = getRunnerPosition(overallScore);

  return (
    <Card className="mb-8 overflow-hidden">
      <CardHeader className="bg-slate-900 text-white">
        <CardTitle className="text-center text-3xl font-bold tracking-tight">
          ASSESSMENT LEVELS
        </CardTitle>
        <CardDescription className="text-center text-gray-300 text-lg">
          Each pillar is evaluated across five levels of AI maturity
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 bg-white">
        <div className="relative">
          {/* Runner icon */}
          <motion.div 
            className="absolute -top-1"
            initial={{ left: "0%" }}
            animate={{ 
              left: runnerPosition === 0 ? "0%" : 
                   runnerPosition === 1 ? "33%" : 
                   runnerPosition === 2 ? "66%" : 
                   "90%" 
            }}
            transition={{ duration: 1, type: "spring" }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#8ECAE6"/>
              <path d="M25 15C26.6569 15 28 13.6569 28 12C28 10.3431 26.6569 9 25 9C23.3431 9 22 10.3431 22 12C22 13.6569 23.3431 15 25 15Z" fill="white"/>
              <path d="M14 25.5L17 22.5L19 24.5V30.5H22V23.5L20 21.5L22 17.5L25 22.5V30.5H28V21.5L25 16.5C24.5 15.5 23.5 15 22.5 15C22 15 21.5 15.1667 21 15.5L16 19.5C15.5 19.8333 15.1667 20.3333 15 21L13 25C12.8333 25.5 13 25.8333 13.5 26C13.6667 26 13.8333 25.8333 14 25.5Z" fill="white"/>
              <path d="M16 30.5C17.1046 30.5 18 29.6046 18 28.5C18 27.3954 17.1046 26.5 16 26.5C14.8954 26.5 14 27.3954 14 28.5C14 29.6046 14.8954 30.5 16 30.5Z" fill="white"/>
            </svg>
          </motion.div>

          {/* Progress line */}
          <div className="h-1 bg-gray-200 my-6 relative">
            {/* Colored progress */}
            <motion.div 
              className="absolute top-0 left-0 h-1 bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, overallScore)}%` }}
              transition={{ duration: 1 }}
            />
            
            {/* Dots for each level */}
            <div className="absolute -top-2 left-0">
              <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div>
            </div>
            <div className="absolute -top-2 left-1/3 transform -translate-x-1/2">
              <div className={`w-5 h-5 rounded-full ${overallScore >= 30 ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white`}></div>
            </div>
            <div className="absolute -top-2 left-2/3 transform -translate-x-1/2">
              <div className={`w-5 h-5 rounded-full ${overallScore >= 60 ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white`}></div>
            </div>
            <div className="absolute -top-2 right-0">
              <div className={`w-5 h-5 rounded-full ${overallScore >= 85 ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white`}></div>
            </div>
          </div>

          {/* Level labels */}
          <div className="flex justify-between mt-4">
            {assessmentLevels.map((level, index) => (
              <div 
                key={index} 
                className={cn(
                  "text-center flex-1",
                  runnerPosition === index ? "text-blue-600 font-bold" : "text-gray-700"
                )}
              >
                <div className="text-lg md:text-xl font-bold">{level.label}</div>
                <div className="text-md md:text-lg font-semibold">{level.description}</div>
                <div className="text-sm text-gray-500">{level.score}</div>
              </div>
            ))}
          </div>

          {/* Flag icon at the end */}
          <div className="absolute -top-2 right-0">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 15H13L12 13H4V21" stroke="#8ECAE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 2V13H18L20 9L18 5H11L10 3H4Z" fill="#8ECAE6" stroke="#8ECAE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
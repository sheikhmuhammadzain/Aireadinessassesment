"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardTitle imports
import { Badge } from "@/components/ui/badge"; // Added Badge for score display

interface AssessmentLevel {
  range: string;
  label: string; // Example: "AI Dormant"
  description: string; // Example: "Requires Foundational Development"
  minScore: number;
  maxScore: number;
  basisPoints: number; // Represents the width of the range (e.g., 30-0 = 30)
}

// Updated structure for easier calculations and clarity
const assessmentLevels: AssessmentLevel[] = [
  {
    range: "0-30",
    label: "AI Dormant",
    description: "Requires Foundational Development",
    minScore: 0,
    maxScore: 30,
    basisPoints: 30, // 30 - 0
  },
  {
    range: "31-60", // Adjusted range display for clarity
    label: "AI Aware",
    description: "Beginning Implementation",
    minScore: 31,
    maxScore: 60,
    basisPoints: 30, // 60 - 30
  },
  {
    range: "61-85", // Adjusted range display for clarity
    label: "AI Rise",
    description: "Established Practices, Room to Grow",
    minScore: 61,
    maxScore: 85,
    basisPoints: 25, // 85 - 60
  },
  {
    range: "86+", // Adjusted range display for clarity
    label: "AI Ready",
    description: "Mature Capabilities",
    minScore: 86,
    maxScore: 100, // Capped at 100 for calculation
    basisPoints: 15, // 100 - 85
  }
];

// Calculate total basis points for percentage calculation
const totalBasisPoints = assessmentLevels.reduce((sum, level) => sum + level.basisPoints, 0); // Should be 100

interface AssessmentLevelsVisualProps {
  overallScore: number;
  className?: string;
}

export function AssessmentLevelsVisual({ overallScore, className }: AssessmentLevelsVisualProps) {
  // Determine the current level index based on the score
  const currentLevelIndex = assessmentLevels.findIndex(
    level => overallScore >= level.minScore && overallScore <= level.maxScore
  );
  // Handle edge case where score might be slightly outside defined ranges if logic is complex elsewhere
  const activeLevelIndex = currentLevelIndex === -1 ? (overallScore > 85 ? 3 : 0) : currentLevelIndex;
  const activeLevel = assessmentLevels[activeLevelIndex];

  // Calculate the precise percentage position of the score (0-100 scale)
  const scorePercentage = Math.min(100, Math.max(0, overallScore));

  return (
    <div className={cn("p-6 bg-card rounded-lg border", className)}>
      {/* Visualization Container */}
      <div className="relative mb-4">
        {/* Segmented Background Bar */}
        <div className="flex h-8 w-full rounded-md overflow-hidden border bg-muted">
          {assessmentLevels.map((level, index) => (
            <div
              key={level.label}
              className={cn(
                "flex items-center justify-center text-center h-full transition-colors duration-300 ease-in-out",
                index === activeLevelIndex
                  ? "bg-primary/10" // Subtle background for active level
                  : "bg-muted hover:bg-accent/50"
              )}
              style={{
                // Use flex-basis to set width proportionally to the score range
                flexBasis: `${(level.basisPoints / totalBasisPoints) * 100}%`,
                // Add subtle borders between segments
                borderRight: index < assessmentLevels.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
              }}
            >
              {/* Optional: Show level label inside segments on larger screens */}
               <span className="text-xs font-medium hidden sm:inline text-muted-foreground px-1 truncate">
                 {level.label}
               </span>
            </div>
          ))}
        </div>

        {/* Score Indicator Pin + Value */}
        <motion.div
          className="absolute -top-2 h-full flex flex-col items-center"
          initial={{ left: `0%` }}
          animate={{ left: `${scorePercentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          // Adjust horizontal positioning based on percentage to keep indicator centered
          style={{ x: "-50%" }}
        >
           {/* Score Value Badge */}
           <Badge variant="default" className="text-xs font-semibold mb-1 whitespace-nowrap shadow-md">
             {Math.round(overallScore)}%
           </Badge>
           {/* Indicator Line */}
           <div className="w-px h-10 bg-primary"></div>
           {/* Optional: Indicator Circle/Triangle at the bottom */}
           {/* <div className="w-2 h-2 bg-primary rounded-full border-2 border-background shadow-sm -mt-1"></div> */}
        </motion.div>
      </div>

      {/* Labels below the bar */}
      <div className="flex w-full text-xs text-muted-foreground mt-1">
        {assessmentLevels.map((level, index) => (
          <div
            key={`${level.label}-label`}
            className={cn(
              "text-center px-1",
              index === activeLevelIndex ? "font-semibold text-foreground" : ""
            )}
            style={{
              flexBasis: `${(level.basisPoints / totalBasisPoints) * 100}%`,
            }}
          >
             <span className="sm:hidden">{level.label}</span> {/* Show on mobile */}
             <span className="hidden sm:inline">{level.range}</span> {/* Show range on desktop */}
          </div>
        ))}
      </div>

      {/* Current Level Description */}
      <div className="mt-6 text-center border-t pt-4">
        <p className="text-sm font-semibold text-foreground">
          Current Level: {activeLevel.label}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {activeLevel.description}
        </p>
      </div>
    </div>
    // Close </Card> if you kept the Card wrapper
  );
}
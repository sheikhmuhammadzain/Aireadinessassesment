"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";

interface CompanyCardProps {
  company: CompanyInfo;
  status: CompanyAssessmentStatus | undefined;
  completionPercentage: number;
  overallScore: number;
  onViewDetails: (companyId: string) => void;
  onManageAssessments: (companyId: string) => void;
  onStartAssessment: (assessmentType: string, companyId: string) => void;
  isAdmin: boolean;
  userAssessmentType: string | null;
}

export function CompanyCard({
  company,
  status,
  completionPercentage,
  overallScore,
  onViewDetails,
  onManageAssessments,
  onStartAssessment,
  isAdmin,
  userAssessmentType,
}: CompanyCardProps) {
  const companyId = company.id || "";

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Building className="h-5 w-5 mr-2 text-primary" />
          {company.name}
        </CardTitle>
        <CardDescription>
          {company.industry} • {company.size}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Assessments Completed</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        
        {status && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center">
              <Badge variant="default" className="bg-green-600 mb-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {(() => {
                  // Count unique completed assessment types
                  const completedTypes = new Set();
                  status.assessments
                    .filter(a => a.status === "completed")
                    .forEach(a => completedTypes.add(a.type));
                  return completedTypes.size;
                })()}
              </Badge>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="flex flex-col items-center">
              <Badge variant="secondary" className="mb-1">
                <Clock className="h-3 w-3 mr-1" />
                {(() => {
                  // For in-progress, only count a type if it's not already completed
                  const completedTypes = new Set(
                    status.assessments
                      .filter(a => a.status === "completed")
                      .map(a => a.type)
                  );
                  
                  const inProgressTypes = new Set();
                  status.assessments
                    .filter(a => a.status === "in-progress" && !completedTypes.has(a.type))
                    .forEach(a => inProgressTypes.add(a.type));
                  
                  return inProgressTypes.size;
                })()}
              </Badge>
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <div className="flex flex-col items-center">
              <Badge variant="outline" className="mb-1">
                <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                {(() => {
                  // Count types that are neither completed nor in-progress
                  const completedTypes = new Set(
                    status.assessments
                      .filter(a => a.status === "completed")
                      .map(a => a.type)
                  );
                  
                  const inProgressTypes = new Set(
                    status.assessments
                      .filter(a => a.status === "in-progress")
                      .map(a => a.type)
                  );
                  
                  // Expected total assessment types
                  const expectedTypes = [
                    "AI Governance", 
                    "AI Culture", 
                    "AI Infrastructure", 
                    "AI Strategy", 
                    "AI Data", 
                    "AI Talent", 
                    "AI Security"
                  ];
                  
                  // Count types that don't appear in either completed or in-progress
                  return expectedTypes.filter(type => 
                    !completedTypes.has(type) && !inProgressTypes.has(type)
                  ).length;
                })()}
              </Badge>
              <span className="text-xs text-muted-foreground">Not Started</span>
            </div>
          </div>
        )}
        
        {overallScore > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Overall Score:</span>
            <span className="text-sm font-medium">{overallScore}%</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="outline" 
          onClick={() => onViewDetails(companyId)}
        >
          View Details
        </Button>
        
        {isAdmin ? (
          <Button 
            variant="default"
            onClick={() => onManageAssessments(companyId)}
          >
            Manage Assessments
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={() => {
              if (userAssessmentType) {
                onStartAssessment(userAssessmentType, companyId);
              }
            }}
            disabled={!userAssessmentType}
          >
            Start Assessment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
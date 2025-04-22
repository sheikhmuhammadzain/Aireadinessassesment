"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  CheckCircle,
  BarChart2,
} from "lucide-react";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";

interface DashboardStatsProps {
  companies: CompanyInfo[];
  assessmentStatuses: Record<string, CompanyAssessmentStatus>;
  overallReadiness: number;
}

export function DashboardStats({
  companies,
  assessmentStatuses,
  overallReadiness,
}: DashboardStatsProps) {
  // Calculate total completed assessments
  const completedAssessments = Object.values(assessmentStatuses).reduce(
    (total, status) => 
      total + status.assessments.filter(a => a.status === "completed").length, 
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Building className="h-8 w-8 text-primary mr-3" />
            <div className="text-3xl font-bold">{companies.length}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Assessments Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div className="text-3xl font-bold">{completedAssessments}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <BarChart2 className="h-8 w-8 text-primary mr-3" />
            <div className="text-3xl font-bold">{overallReadiness}%</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
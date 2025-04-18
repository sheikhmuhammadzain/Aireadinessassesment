"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, Edit, FileText, Globe, Trash, Users, BarChart } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

// Sample company data
const SAMPLE_COMPANIES = [
  {
    id: "1",
    name: "Acme Corporation",
    industry: "Technology",
    size: "Enterprise (1000+ employees)",
    region: "North America",
    aiMaturity: "Expanding",
    notes: "Leading software provider specializing in cloud solutions. They have been investing in AI capabilities for the past 3 years, with several successful implementations in their products.",
    createdAt: "2023-05-15T10:30:00Z",
    updatedAt: "2023-11-20T14:45:00Z",
  },
  {
    id: "2",
    name: "GlobalFinance",
    industry: "Financial Services",
    size: "Enterprise (1000+ employees)",
    region: "Europe",
    aiMaturity: "Exploring",
    notes: "Major financial institution exploring AI for fraud detection and customer service automation. Recently started their AI journey but moving quickly.",
    createdAt: "2023-04-10T08:20:00Z",
    updatedAt: "2023-10-18T11:30:00Z",
  },
  {
    id: "3",
    name: "HealthPlus",
    industry: "Healthcare",
    size: "Mid-size (100-999 employees)",
    region: "North America",
    aiMaturity: "Initial",
    notes: "Healthcare provider looking to implement AI for patient care optimization and administrative tasks.",
    createdAt: "2023-06-20T09:15:00Z",
    updatedAt: "2023-12-05T16:20:00Z",
  },
  {
    id: "4",
    name: "TechStart",
    industry: "Technology",
    size: "Small (10-99 employees)",
    region: "Asia Pacific",
    aiMaturity: "Exploring",
    notes: "Innovative startup focused on AI-driven solutions for small businesses. Looking to grow their technical capabilities.",
    createdAt: "2023-07-05T13:40:00Z",
    updatedAt: "2023-11-30T10:10:00Z",
  },
  {
    id: "5",
    name: "EduLearn",
    industry: "Education",
    size: "Mid-size (100-999 employees)",
    region: "Europe",
    aiMaturity: "Initial",
    notes: "Educational technology company starting their AI journey to enhance online learning experiences.",
    createdAt: "2023-08-12T11:25:00Z",
    updatedAt: "2023-12-10T09:30:00Z",
  },
];

// Sample assessment data
const SAMPLE_ASSESSMENTS = [
  {
    companyId: "1",
    assessments: [
      { type: "AI Governance", status: "completed", score: 76, completedAt: "2023-11-20T14:30:00Z" },
      { type: "AI Culture", status: "completed", score: 82, completedAt: "2023-11-21T10:15:00Z" },
      { type: "AI Infrastructure", status: "completed", score: 88, completedAt: "2023-11-22T16:45:00Z" },
      { type: "AI Strategy", status: "not-started", score: null, completedAt: null },
      { type: "AI Data", status: "in-progress", score: null, completedAt: null },
      { type: "AI Talent", status: "not-started", score: null, completedAt: null },
      { type: "AI Security", status: "completed", score: 71, completedAt: "2023-12-01T11:30:00Z" }
    ]
  },
  {
    companyId: "2",
    assessments: [
      { type: "AI Governance", status: "completed", score: 85, completedAt: "2023-10-15T09:20:00Z" },
      { type: "AI Culture", status: "completed", score: 72, completedAt: "2023-10-16T14:30:00Z" },
      { type: "AI Infrastructure", status: "in-progress", score: null, completedAt: null },
      { type: "AI Strategy", status: "completed", score: 79, completedAt: "2023-10-18T11:45:00Z" },
      { type: "AI Data", status: "not-started", score: null, completedAt: null },
      { type: "AI Talent", status: "not-started", score: null, completedAt: null },
      { type: "AI Security", status: "completed", score: 88, completedAt: "2023-10-20T15:10:00Z" }
    ]
  }
];

// Get assessment summary
const getAssessmentSummary = (companyId: string) => {
  const assessmentData = SAMPLE_ASSESSMENTS.find(a => a.companyId === companyId)?.assessments || [];
  
  const total = assessmentData.length;
  const completed = assessmentData.filter(a => a.status === "completed").length;
  const inProgress = assessmentData.filter(a => a.status === "in-progress").length;
  const notStarted = assessmentData.filter(a => a.status === "not-started").length;
  
  const averageScore = assessmentData
    .filter(a => a.score !== null)
    .reduce((sum, current) => sum + (current.score || 0), 0) / (completed || 1);
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    completionRate: Math.round((completed / total) * 100),
    averageScore: Math.round(averageScore)
  };
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

interface CompanyDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CompanyDetailsPage({ params }: CompanyDetailsPageProps) {
  const router = useRouter();
  const { id } = params;
  
  const [company, setCompany] = useState<typeof SAMPLE_COMPANIES[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    // Load from localStorage
    const timer = setTimeout(() => {
      // Get companies from localStorage
      const storedCompaniesJson = localStorage.getItem("companies");
      let companies: typeof SAMPLE_COMPANIES = [];
      
      if (storedCompaniesJson) {
        try {
          companies = JSON.parse(storedCompaniesJson);
        } catch (error) {
          console.error("Error parsing companies from localStorage:", error);
          companies = SAMPLE_COMPANIES;
        }
      } else {
        // If no data in localStorage, use sample data
        companies = SAMPLE_COMPANIES;
        localStorage.setItem("companies", JSON.stringify(SAMPLE_COMPANIES));
      }
      
      const foundCompany = companies.find((c) => c.id === id);
      setCompany(foundCompany || null);
      setLoading(false);
      
      if (!foundCompany) {
        toast({
          title: "Company Not Found",
          description: "The requested company could not be found.",
          variant: "destructive",
        });
        router.push("/admin/companies");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id, router]);
  
  const handleEdit = () => {
    router.push(`/admin/companies/${id}/edit`);
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    
    // Delete from localStorage
    const storedCompaniesJson = localStorage.getItem("companies");
    if (storedCompaniesJson && company) {
      try {
        const companies = JSON.parse(storedCompaniesJson);
        const updatedCompanies = companies.filter((c: CompanyInfo) => c.id !== company.id);
        localStorage.setItem("companies", JSON.stringify(updatedCompanies));
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
    }
    
    // Show success message and redirect
    setTimeout(() => {
      toast({
        title: "Company Deleted",
        description: `${company?.name} has been successfully deleted.`,
      });
      router.push("/admin/companies");
    }, 500);
  };
  
  const handleViewAssessments = () => {
    router.push(`/admin/companies/${id}/assessments`);
  };
  
  // Get assessment data
  const assessmentSummary = company ? getAssessmentSummary(id) : null;
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!company) {
    return null; // Handled by the useEffect redirect
  }
  
  const getAIMaturityColor = (maturity: string) => {
    switch (maturity) {
      case "Initial": return "bg-gray-100 text-gray-800";
      case "Exploring": return "bg-blue-100 text-blue-800";
      case "Expanding": return "bg-purple-100 text-purple-800";
      case "Leading": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/admin/companies")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">
              Company ID: {company.id}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Company details card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Detailed information about {company.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Industry</h3>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="font-medium">{company.industry}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Company Size</h3>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="font-medium">{company.size}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Region</h3>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="font-medium">{company.region}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">AI Maturity Level</h3>
                <Badge className={getAIMaturityColor(company.aiMaturity)}>
                  {company.aiMaturity}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm">
                  {company.notes || "No additional notes provided."}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <p className="text-sm">{formatDate(company.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <p className="text-sm">{formatDate(company.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Assessment summary card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Assessment Summary</CardTitle>
                <CardDescription>
                  Overview of all assessments for this company
                </CardDescription>
              </div>
              <Button onClick={handleViewAssessments}>
                <BarChart className="mr-2 h-4 w-4" />
                View All Assessments
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assessmentSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-900">
                    {assessmentSummary.completed} <span className="text-sm font-medium">/ {assessmentSummary.total}</span>
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-amber-800 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {assessmentSummary.inProgress} <span className="text-sm font-medium">/ {assessmentSummary.total}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-800 mb-1">Not Started</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessmentSummary.notStarted} <span className="text-sm font-medium">/ {assessmentSummary.total}</span>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {assessmentSummary.averageScore}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-muted-foreground mb-2">No assessments found for this company</p>
                <Button size="sm" onClick={handleViewAssessments}>
                  Start Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{company.name}</span> and
              all associated assessment data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
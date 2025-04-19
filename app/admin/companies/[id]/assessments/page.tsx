"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, BarChart2, FileText, Clock, XCircle, ArrowRight, User, Users, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";
import { Separator } from "@/components/ui/separator";

// Sample data for demo purposes (same as in companies page)
const SAMPLE_COMPANIES: CompanyInfo[] = [
  {
    id: "1",
    name: "TechInnovate Solutions",
    industry: "Technology",
    size: "Enterprise (1000+ employees)",
    region: "North America",
    aiMaturity: "Exploring",
    notes: "Global tech firm focused on cloud solutions",
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-11-22T14:45:00Z"
  },
  {
    id: "2",
    name: "FinServe Global",
    industry: "Financial Services",
    size: "Enterprise (1000+ employees)",
    region: "Europe",
    aiMaturity: "Expanding",
    notes: "International banking corporation",
    createdAt: "2023-05-10T08:20:00Z",
    updatedAt: "2023-10-18T11:30:00Z"
  },
  {
    id: "3",
    name: "HealthPlus Medical",
    industry: "Healthcare",
    size: "Mid-size (100-999 employees)",
    region: "Asia Pacific",
    aiMaturity: "Exploring",
    notes: "Medical equipment manufacturer",
    createdAt: "2023-07-20T09:15:00Z",
    updatedAt: "2023-12-05T16:20:00Z"
  },
  {
    id: "4",
    name: "GreenEnergy Co",
    industry: "Energy",
    size: "Mid-size (100-999 employees)",
    region: "North America",
    aiMaturity: "Initial",
    notes: "Renewable energy provider",
    createdAt: "2023-08-05T13:40:00Z",
    updatedAt: "2023-11-30T10:10:00Z"
  },
  {
    id: "5",
    name: "RetailNow",
    industry: "Retail",
    size: "Small (10-99 employees)",
    region: "Europe",
    aiMaturity: "Initial",
    notes: "E-commerce company for fashion products",
    createdAt: "2023-09-12T11:25:00Z",
    updatedAt: "2023-12-10T09:30:00Z"
  }
];

// Sample assessment statuses
const SAMPLE_ASSESSMENT_STATUSES: CompanyAssessmentStatus[] = [
  {
    companyId: "1",
    companyName: "TechInnovate Solutions",
    assessments: [
      { type: "AI Governance", status: "completed", score: 76, completedAt: "2023-11-20T14:30:00Z" },
      { type: "AI Culture", status: "completed", score: 82, completedAt: "2023-11-21T10:15:00Z" },
      { type: "AI Infrastructure", status: "completed", score: 88, completedAt: "2023-11-22T16:45:00Z" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "in-progress" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "completed", score: 71, completedAt: "2023-12-01T11:30:00Z" }
    ]
  },
  {
    companyId: "2",
    companyName: "FinServe Global",
    assessments: [
      { type: "AI Governance", status: "completed", score: 85, completedAt: "2023-10-15T09:20:00Z" },
      { type: "AI Culture", status: "completed", score: 72, completedAt: "2023-10-16T14:30:00Z" },
      { type: "AI Infrastructure", status: "in-progress" },
      { type: "AI Strategy", status: "completed", score: 79, completedAt: "2023-10-18T11:45:00Z" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "completed", score: 88, completedAt: "2023-10-20T15:10:00Z" }
    ]
  },
  {
    companyId: "3",
    companyName: "HealthPlus Medical",
    assessments: [
      { type: "AI Governance", status: "in-progress" },
      { type: "AI Culture", status: "not-started" },
      { type: "AI Infrastructure", status: "not-started" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  },
  {
    companyId: "4",
    companyName: "GreenEnergy Co",
    assessments: [
      { type: "AI Governance", status: "not-started" },
      { type: "AI Culture", status: "not-started" },
      { type: "AI Infrastructure", status: "not-started" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  },
  {
    companyId: "5",
    companyName: "RetailNow",
    assessments: [
      { type: "AI Governance", status: "completed", score: 61, completedAt: "2023-12-08T10:30:00Z" },
      { type: "AI Culture", status: "completed", score: 68, completedAt: "2023-12-09T14:20:00Z" },
      { type: "AI Infrastructure", status: "completed", score: 55, completedAt: "2023-12-10T09:45:00Z" },
      { type: "AI Strategy", status: "not-started" },
      { type: "AI Data", status: "not-started" },
      { type: "AI Talent", status: "not-started" },
      { type: "AI Security", status: "not-started" }
    ]
  }
];

// Sample assigned users data for each assessment
const SAMPLE_ASSIGNED_USERS = {
  "1": {
    "AI Governance": [
      { id: "u1", name: "Michael Chen", role: "Governance Lead", assigned: "2023-11-15" },
      { id: "u2", name: "Sarah Johnson", role: "Legal Advisor", assigned: "2023-11-15" }
    ],
    "AI Culture": [
      { id: "u3", name: "Jessica Williams", role: "HR Director", assigned: "2023-11-16" },
      { id: "u4", name: "David Patel", role: "Change Management", assigned: "2023-11-16" }
    ],
    "AI Infrastructure": [
      { id: "u5", name: "Thomas Rodriguez", role: "CTO", assigned: "2023-11-18" },
      { id: "u6", name: "Emily Clark", role: "Infrastructure Manager", assigned: "2023-11-18" }
    ],
    "AI Security": [
      { id: "u7", name: "Carlos Martinez", role: "CISO", assigned: "2023-11-25" },
      { id: "u8", name: "Angela Davis", role: "Security Analyst", assigned: "2023-11-25" }
    ]
  }
};

export default function CompanyAssessmentsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.id;
  
  const router = useRouter();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<CompanyAssessmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    // Load stored data instead of just using sample data
    const loadCompanyData = () => {
      // Try to load real company data first
      try {
        const storedCompanies = localStorage.getItem('companies');
        if (storedCompanies) {
          const companies = JSON.parse(storedCompanies);
          const foundCompany = companies.find(c => c.id === companyId);
          if (foundCompany) {
            setCompany(foundCompany);
          }
        }
      } catch (error) {
        console.error("Error loading company data:", error);
      }
      
      // If no real data, use sample data
      if (!company) {
        const foundCompany = SAMPLE_COMPANIES.find(c => c.id === companyId);
        if (foundCompany) {
          setCompany(foundCompany);
        }
      }
      
      // Try to load real assessment status data
      try {
        const storedAssessmentStatuses = localStorage.getItem('assessment_statuses');
        if (storedAssessmentStatuses) {
          const assessmentStatuses = JSON.parse(storedAssessmentStatuses);
          const foundStatus = assessmentStatuses.find(s => s.companyId === companyId);
          if (foundStatus) {
            setAssessmentStatus(foundStatus);
            setLoading(false);
            return;
          }
        }
        
        // Also try company-specific assessment results
        const companyAssessmentsKey = `company_assessments_${companyId}`;
        const storedCompanyAssessments = localStorage.getItem(companyAssessmentsKey);
        if (storedCompanyAssessments) {
          const companyAssessments = JSON.parse(storedCompanyAssessments);
          if (Object.keys(companyAssessments).length > 0) {
            // Convert to assessment status format
            const assessmentStatus = {
              companyId,
              companyName: company?.name || "Unknown Company",
              assessments: Object.entries(companyAssessments).map(([type, data]) => ({
                type,
                status: "completed",
                score: data.overallScore,
                completedAt: data.completedAt,
                completedBy: data.completedBy
              }))
            };
            setAssessmentStatus(assessmentStatus);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error loading assessment data:", error);
      }
      
      // If no real data, use sample data
      const foundStatus = SAMPLE_ASSESSMENT_STATUSES.find(s => s.companyId === companyId);
      if (foundStatus) {
        setAssessmentStatus(foundStatus);
      }
      
      setLoading(false);
    };
    
    loadCompanyData();
  }, [companyId]);

  const handleStartAssessment = (assessmentType: string) => {
    toast({
      title: "Starting Assessment",
      description: `Navigating to ${assessmentType} assessment for ${company?.name}.`,
    });
    
    // In a real app, you would create a new assessment instance then navigate
    router.push(`/assessment/${encodeURIComponent(assessmentType)}`);
  };

  const handleContinueAssessment = (assessmentType: string) => {
    toast({
      title: "Continuing Assessment",
      description: `Resuming ${assessmentType} assessment for ${company?.name}.`,
    });
    
    router.push(`/assessment/${encodeURIComponent(assessmentType)}`);
  };

  const handleViewResults = (assessmentType: string) => {
    toast({
      title: "Viewing Results",
      description: `Opening ${assessmentType} assessment results for ${company?.name}.`,
    });
    
    router.push(`/results/${encodeURIComponent(assessmentType)}`);
  };

  const getCompletionPercentage = () => {
    if (!assessmentStatus) return 0;
    
    const completed = assessmentStatus.assessments.filter(a => a.status === "completed").length;
    const total = assessmentStatus.assessments.length;
    return Math.round((completed / total) * 100);
  };

  const getAssignedUsers = (assessmentType: string) => {
    // First try to get from real assessment data
    if (assessmentStatus) {
      const assessment = assessmentStatus.assessments.find(a => a.type === assessmentType);
      if (assessment && assessment.completedBy) {
        return [{
          id: assessment.completedBy.id,
          name: assessment.completedBy.name,
          role: assessment.completedBy.role,
          assigned: assessment.completedAt || new Date().toISOString()
        }];
      }
    }
    
    // Fall back to sample data
    return SAMPLE_ASSIGNED_USERS[companyId]?.[assessmentType] || [];
  };

  // Calculate the overall score (average of completed assessments)
  const calculateOverallScore = () => {
    if (!assessmentStatus) return 0;
    
    const completedAssessments = assessmentStatus.assessments.filter(a => a.status === "completed" && a.score);
    if (completedAssessments.length === 0) return 0;
    
    const totalScore = completedAssessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0);
    return Math.round(totalScore / completedAssessments.length);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-muted rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            <div className="h-56 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company || !assessmentStatus) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
        <p className="text-muted-foreground mb-6">The requested company information could not be loaded.</p>
        <Button onClick={() => router.push("/admin/companies")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/companies")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Assessment Management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Company Info</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Industry:</dt>
                    <dd>{company.industry}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Size:</dt>
                    <dd>{company.size}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Region:</dt>
                    <dd>{company.region}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">AI Maturity:</dt>
                    <dd>
                      <Badge 
                        variant={company.aiMaturity === "Initial" ? "outline" : 
                              company.aiMaturity === "Exploring" ? "secondary" : 
                              "default"}
                      >
                        {company.aiMaturity}
                      </Badge>
                    </dd>
                  </div>
                  {company.notes && (
                    <div className="pt-2">
                      <dt className="font-medium text-muted-foreground mb-1">Notes:</dt>
                      <dd className="text-sm">{company.notes}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Assessment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Overall Completion</span>
                      <span className="font-medium">{getCompletionPercentage()}%</span>
                    </div>
                    <Progress value={getCompletionPercentage()} className="h-2" />
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Overall Score</span>
                      <span className="font-medium">{calculateOverallScore()}%</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {assessmentStatus.assessments.map(assessment => (
                        assessment.status === "completed" && (
                          <div key={assessment.type} className="flex-1 min-w-[120px]">
                            <div className="text-xs text-muted-foreground mb-1">{assessment.type}</div>
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-2 rounded-full flex-1" 
                                style={{ 
                                  backgroundColor: `hsl(${assessment.score! * 1.2}, 70%, 50%)`,
                                  width: `${assessment.score}%`
                                }}
                              ></div>
                              <span className="text-xs font-medium">{assessment.score}%</span>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Assessment Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {assessmentStatus.assessments.filter(a => a.status === "completed").length}
                        </Badge>
                        <span className="text-sm">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {assessmentStatus.assessments.filter(a => a.status === "in-progress").length}
                        </Badge>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                          {assessmentStatus.assessments.filter(a => a.status === "not-started").length}
                        </Badge>
                        <span className="text-sm">Not Started</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest assessment activities for {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessmentStatus.assessments
                  .filter(a => a.status === "completed" && a.completedAt)
                  .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
                  .slice(0, 3)
                  .map(assessment => (
                    <div key={assessment.type} className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{assessment.type} Assessment Completed</h4>
                        <p className="text-sm text-muted-foreground">
                          Score: {assessment.score}% | 
                          {new Date(assessment.completedAt!).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                {assessmentStatus.assessments
                  .filter(a => a.status === "in-progress")
                  .map(assessment => (
                    <div key={assessment.type} className="flex items-start gap-3">
                      <div className="bg-secondary/20 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{assessment.type} Assessment In Progress</h4>
                        <p className="text-sm text-muted-foreground">
                          Assessment started but not yet completed
                        </p>
                      </div>
                    </div>
                  ))}

                {assessmentStatus.assessments.filter(a => a.status !== "not-started").length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No activity recorded yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleStartAssessment(assessmentStatus.assessments.find(a => a.status === "not-started")?.type || "AI Governance")}
                    >
                      Start First Assessment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Assessment Progress
              </CardTitle>
              <CardDescription>
                Track and manage all assessment areas for {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assessmentStatus.assessments.map((assessment) => (
                  <div key={assessment.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg">{assessment.type}</h3>
                      {assessment.status === 'completed' ? (
                        <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Completed
                        </Badge>
                      ) : assessment.status === 'in-progress' ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          Not Started
                        </Badge>
                      )}
                    </div>

                    {assessment.status === 'completed' && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-medium">{assessment.score}%</span>
                        </div>
                        <Progress value={assessment.score} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          Completed on {new Date(assessment.completedAt!).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm text-muted-foreground">
                        {getAssignedUsers(assessment.type).length > 0 ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {getAssignedUsers(assessment.type).length} users assigned
                          </span>
                        ) : (
                          <span>No users assigned</span>
                        )}
                      </div>
                      
                      {assessment.status === 'completed' ? (
                        <Button size="sm" onClick={() => handleViewResults(assessment.type)}>
                          View Results
                        </Button>
                      ) : assessment.status === 'in-progress' ? (
                        <Button size="sm" onClick={() => handleContinueAssessment(assessment.type)}>
                          Continue
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleStartAssessment(assessment.type)}>
                          Start Assessment
                        </Button>
                      )}
                    </div>

                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Assessment Team
              </CardTitle>
              <CardDescription>
                Team members assigned to {company.name}'s assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assessmentStatus.assessments.map((assessment) => {
                  const users = getAssignedUsers(assessment.type);
                  if (users.length === 0) return null;
                  
                  return (
                    <div key={assessment.type} className="space-y-3">
                      <h3 className="font-medium text-lg flex items-center">
                        {assessment.type}
                        {assessment.status === 'completed' && (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            Completed
                          </Badge>
                        )}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center gap-3 border rounded-md p-3">
                            <div className="bg-muted rounded-full p-2">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{user.role}</span>
                                <span className="text-xs flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Assigned: {new Date(user.assigned).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                    </div>
                  );
                })}
                
                {Object.values(SAMPLE_ASSIGNED_USERS).flat().length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No team members have been assigned yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                    >
                      Assign Team Members
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
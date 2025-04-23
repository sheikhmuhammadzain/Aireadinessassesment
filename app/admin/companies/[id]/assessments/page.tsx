"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, BarChart2, FileText, Clock, XCircle, ArrowRight, User, Users, Calendar, FileDown, X, Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CompanyInfo, CompanyAssessmentStatus, Assessment } from "../../../../../types";
import { User as UserType } from "../../../../../types";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { generateDeepResearchReport } from "@/lib/openai";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

// Define the seven pillars as a constant at the top of the file
const EXPECTED_ASSESSMENT_TYPES = [
  "AI Governance", 
  "AI Culture", 
  "AI Infrastructure", 
  "AI Strategy", 
  "AI Data", 
  "AI Talent", 
  "AI Security"
];

// Define roleToAssessmentMap at the component level (outside PillarAssignments)
const ROLE_TO_ASSESSMENT_MAP: Record<string, string[]> = {
  'admin': ["AI Governance", "AI Culture", "AI Infrastructure", "AI Strategy", "AI Data", "AI Talent", "AI Security"],
  'governance_manager': ["AI Governance"],
  'ai_governance': ["AI Governance"],
  'culture_director': ["AI Culture"],
  'ai_culture': ["AI Culture"],
  'infrastructure_lead': ["AI Infrastructure"],
  'ai_infrastructure': ["AI Infrastructure"],
  'strategy_officer': ["AI Strategy"],
  'ai_strategy': ["AI Strategy"],
  'data_engineer': ["AI Data"],
  'ai_data': ["AI Data"],
  'talent_manager': ["AI Talent"],
  'ai_talent': ["AI Talent"],
  'security_specialist': ["AI Security"],
  'ai_security': ["AI Security"]
};

// Inverse mapping - assessment to roles
const ASSESSMENT_TO_ROLES_MAP: Record<string, string[]> = {
  "AI Governance": ['admin', 'governance_manager', 'ai_governance'],
  "AI Culture": ['admin', 'culture_director', 'ai_culture'],
  "AI Infrastructure": ['admin', 'infrastructure_lead', 'ai_infrastructure'],
  "AI Strategy": ['admin', 'strategy_officer', 'ai_strategy'],
  "AI Data": ['admin', 'data_engineer', 'ai_data'],
  "AI Talent": ['admin', 'talent_manager', 'ai_talent'],
  "AI Security": ['admin', 'security_specialist', 'ai_security']
};

// AI Maturity scores mapping
const AI_MATURITY_SCORES = {
  "AI Dormant": "0-30",  // Unprepared
  "AI Aware": "30-60",   // Somewhat Ready
  "AI Rise": "60-85",    // Moderately Prepared
  "AI Ready": "85+"      // Fully Prepared
};

// Get color variant for AI maturity level
const getMaturityVariant = (maturity: string) => {
  switch (maturity) {
    case "AI Dormant": return "outline";
    case "AI Aware": return "secondary";
    case "AI Rise": return "default";
    case "AI Ready": return { base: "default", className: "bg-green-600" };
    default: return "outline";
  }
};

const PillarAssignments = ({ 
  assessmentTypes = EXPECTED_ASSESSMENT_TYPES,
  teamMembers
}: { 
  companyId: string;
  assessmentTypes?: string[];
  teamMembers: Record<string, any[]>;
  availableUsers?: any[];
  onAssignUser?: (pillar: string, userId: string) => void;
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Pillar Team Assignments
        </CardTitle>
        <CardDescription>
          Team members assigned to assessment pillars
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pillar</TableHead>
              <TableHead>Assigned Team Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessmentTypes.map((pillar) => {
              const assignedUsers = teamMembers[pillar] || [];
              
              return (
                <TableRow key={pillar}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Badge 
                        variant={assignedUsers.length > 0 ? "default" : "outline"}
                        className={assignedUsers.length > 0 ? "bg-green-600 mr-2" : "mr-2"}
                      >
                        {assignedUsers.length}
                      </Badge>
                      {pillar}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignedUsers.length > 0 ? (
                      <div className="space-y-1">
                        {assignedUsers.map((user, idx) => (
                          <div key={`${user.id || idx}`} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <div className="bg-muted rounded-full p-1">
                              <User className="h-3 w-3" />
                            </div>
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">({user.role})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No team members assigned
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function CompanyAssessmentsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.id;
  
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<CompanyAssessmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [teamMembers, setTeamMembers] = useState<Record<string, any[]>>({});
  const [loadingTeam, setLoadingTeam] = useState(false);
  // New state for report generation loading
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // New state for team assignment modal
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigningUsers, setAssigningUsers] = useState(false);

  // Fetch team members assigned to the company
  const fetchTeamMembers = async (companyId: string) => {
    setLoadingTeam(true);
    try {
      const { default: api } = await import('@/lib/api/client');
      
      // Fetch team members for this company
      console.log(`Fetching team members for company: ${companyId}`);
      // Use getCompanyUsers instead of getCompanyTeamMembers which doesn't exist
      const { data, error } = await api.companies.getCompanyUsers(companyId);
      
      if (error) {
        console.warn("Error fetching team members:", error);
        return;
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Successfully fetched team members:", data);
        
        // Initialize empty team members object
        const organizedTeamMembers: Record<string, any[]> = {
          "AI Governance": [],
          "AI Culture": [],
          "AI Infrastructure": [],
          "AI Strategy": [],
          "AI Data": [],
          "AI Talent": [],
          "AI Security": []
        };
        
        // Assign users to appropriate assessment types based on their role
        data.forEach(user => {
          const role = user.role?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
          const username = user.email?.split('@')[0] || '';
          
          // Check if user's role maps directly to assessment types
          const assessmentTypes = ROLE_TO_ASSESSMENT_MAP[role] || [];
          
          // Check if username contains clues about their role (fallback)
          if (assessmentTypes.length === 0) {
            if (username.includes('admin')) {
              assessmentTypes.push(...ROLE_TO_ASSESSMENT_MAP['admin']);
            } else if (username.includes('govern')) {
              assessmentTypes.push('AI Governance');
            } else if (username.includes('culture')) {
              assessmentTypes.push('AI Culture');
            } else if (username.includes('infra')) {
              assessmentTypes.push('AI Infrastructure');
            } else if (username.includes('strat')) {
              assessmentTypes.push('AI Strategy');
            } else if (username.includes('data')) {
              assessmentTypes.push('AI Data');
            } else if (username.includes('talent')) {
              assessmentTypes.push('AI Talent');
            } else if (username.includes('secur')) {
              assessmentTypes.push('AI Security');
            }
          }
          
          // If still no mapping, check the user's name for more clues
          if (assessmentTypes.length === 0 && user.name) {
            const name = user.name.toLowerCase();
            if (name.includes('admin')) {
              assessmentTypes.push(...ROLE_TO_ASSESSMENT_MAP['admin']);
            } else if (name.includes('govern')) {
              assessmentTypes.push('AI Governance');
            } else if (name.includes('culture')) {
              assessmentTypes.push('AI Culture');
            } else if (name.includes('infra')) {
              assessmentTypes.push('AI Infrastructure');
            } else if (name.includes('strat')) {
              assessmentTypes.push('AI Strategy');
            } else if (name.includes('data')) {
              assessmentTypes.push('AI Data');
            } else if (name.includes('talent')) {
              assessmentTypes.push('AI Talent');
            } else if (name.includes('secur')) {
              assessmentTypes.push('AI Security');
            }
          }
          
          // If we still haven't found a mapping, put in unknown category
          if (assessmentTypes.length === 0) {
            // Just put them in the first assessment as a fallback
            assessmentTypes.push('AI Governance');
          }
          
          // Add user to each of their assigned assessment types
          assessmentTypes.forEach(type => {
            if (organizedTeamMembers[type]) {
              organizedTeamMembers[type].push({
                id: user.id,
                name: user.name || user.email || 'Unknown User',
                role: user.role || roleFromUsername(username) || 'Team Member',
                assigned: user.createdAt || (user as any).created_at || new Date().toISOString()
              });
            }
          });
        });
        
        setTeamMembers(organizedTeamMembers);
      } else {
        console.log("No team members found for this company");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Helper function to extract a role from username
  const roleFromUsername = (username: string): string => {
    if (!username) return '';
    
    if (username.includes('admin')) return 'Admin User';
    if (username.includes('govern')) return 'Governance Manager';
    if (username.includes('culture')) return 'Culture Director';
    if (username.includes('infra')) return 'Infrastructure Lead';
    if (username.includes('strat')) return 'Strategy Officer';
    if (username.includes('data')) return 'Data Engineer';
    if (username.includes('talent')) return 'Talent Manager';
    if (username.includes('secur')) return 'Security Specialist';
    
    return 'Team Member';
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dynamically import the API client
        const { default: api } = await import('@/lib/api/client');
        
        // Fetch company data from backend
        console.log(`Fetching company with ID: ${companyId}`);
        const { data: companyData, error: companyError } = await api.companies.getCompany(companyId);
        
        if (companyError) {
          console.error("Error fetching company:", companyError);
          setError(typeof companyError === 'string' ? companyError : "Failed to fetch company data");
          throw new Error(typeof companyError === 'string' ? companyError : "Failed to fetch company data");
        }
        
        if (companyData) {
          console.log("Successfully fetched company data:", companyData);
          setCompany(companyData);
          
          // Fetch assessment statuses for this company
          console.log(`Fetching assessments for company: ${companyId}`);
          const { data: assessmentData, error: assessmentError } = await api.assessments.getCompanyAssessments(companyId);
          
          if (assessmentError) {
            console.warn("Error fetching assessment data:", assessmentError);
            // Continue execution - we'll create default assessment status
          }
          
          if (assessmentData && assessmentData.assessments && assessmentData.assessments.length > 0) {
            console.log("Successfully fetched assessment data:", assessmentData);
            
            // De-duplicate assessments: keep only the most recent status for each type
            const deduplicatedAssessments = deduplicateAssessments(assessmentData.assessments);
            
            // Create a new assessment status with deduplicated data
            const dedupedAssessmentStatus = {
              ...assessmentData,
              assessments: deduplicatedAssessments
            };
            
            setAssessmentStatus(dedupedAssessmentStatus);
          } else {
            console.log("No assessment data found, creating default status");
            // Create default assessment status
            const defaultStatus: CompanyAssessmentStatus = {
              companyId,
              companyName: companyData.name,
              assessments: EXPECTED_ASSESSMENT_TYPES.map(type => ({
                id: `temp_${type.toLowerCase().replace(/\s+/g, '_')}_${companyId}`,
                type,
                status: "not-started" as const,
                score: 0,
                completedAt: null
              }))
            };
            setAssessmentStatus(defaultStatus);
          }
          
          // Fetch team members for this company
          fetchTeamMembers(companyId);
        } else {
          console.warn("No company data found from API, checking localStorage");
          
          // Try to get from localStorage as fallback
          try {
        const storedCompanies = localStorage.getItem('companies');
            const storedAssessments = localStorage.getItem('assessmentStatuses');
            
            if (storedCompanies && storedAssessments) {
          const companies = JSON.parse(storedCompanies);
              const assessments = JSON.parse(storedAssessments);
              
              const foundCompany = companies.find((c: any) => c.id === companyId);
              const foundStatus = assessments.find((s: any) => s.companyId === companyId);
          
          if (foundCompany) {
                console.log("Found company in localStorage:", foundCompany);
            setCompany(foundCompany);
              
              if (foundStatus) {
                  console.log("Found assessment status in localStorage:", foundStatus);
                setAssessmentStatus(foundStatus);
                } else {
                  console.log("No assessment status found in localStorage, creating default");
            // Create default assessment status
            const defaultStatus: CompanyAssessmentStatus = {
              companyId,
              companyName: foundCompany.name,
                    assessments: EXPECTED_ASSESSMENT_TYPES.map(type => ({
                      id: `temp_${type.toLowerCase().replace(/\s+/g, '_')}_${companyId}`,
                      type,
                      status: "not-started" as const,
                      score: 0,
                      completedAt: null
                    }))
            };
            setAssessmentStatus(defaultStatus);
                }
                
                // Also fetch team members in case they exist on the backend
                fetchTeamMembers(companyId);
      } else {
                // No company data anywhere
                setError(`Company with ID ${companyId} not found`);
          }
        } else {
              // No data in localStorage either
              setError(`Company with ID ${companyId} not found`);
            }
          } catch (err) {
            console.error("Error parsing localStorage data:", err);
            setError(`Company with ID ${companyId} not found`);
          }
        }
      } catch (error) {
        console.error("Error loading company data:", error);
        setError(`Failed to load company data: ${error}`);
      } finally {
      setLoading(false);
      }
    };
    
      loadCompanyData();
  }, [companyId]);

  useEffect(() => {
    if (company && companyId) {
      fetchTeamMembers(companyId);
    }
  }, [company, companyId]);

  // Add a debug function to log assessment status counts
  const logAssessmentCounts = () => {
    if (!assessmentStatus) return;
    
    const completed = assessmentStatus.assessments.filter(a => a.status === "completed").length;
    const inProgress = assessmentStatus.assessments.filter(a => a.status === "in-progress").length;
    const notStarted = assessmentStatus.assessments.filter(a => a.status === "not-started").length;
    
    console.log("Assessment status counts:", {
      companyId,
      companyName: company?.name,
      completed,
      inProgress,
      notStarted,
      total: assessmentStatus.assessments.length,
      statuses: assessmentStatus.assessments.map(a => ({ type: a.type, status: a.status }))
    });
  };

  // Call the debug function when assessment status changes
  useEffect(() => {
    if (assessmentStatus) {
      logAssessmentCounts();
    }
  }, [assessmentStatus]);

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

  const handleGenerateDeepResearchReport = async () => {
    if (!assessmentStatus) return;

    // Set generating report state to true to show spinner
    setGeneratingReport(true);

    toast({
      title: "Generating Report",
      description: "Preparing the Deep Research Report. This may take a moment...",
    });

    try {
      // Create a record of all assessment results to pass to the API
      const assessmentResults: Record<string, any> = {};
      
      // Load detailed assessment data for completed assessments
      for (const assessment of assessmentStatus.assessments) {
        if (assessment.status === "completed" && assessment.score) {
          try {
            console.log(`Processing ${assessment.type} assessment with score ${assessment.score}`);
            
            // If the assessment already contains data (from API), use it directly
            if ((assessment as any).data) {
              console.log(`Using existing data for ${assessment.type} from API response`);
              
              // Format the data according to what the report generator expects
              const assessmentData = {
                overallScore: assessment.score,
                completedAt: (assessment as any).completedAt || (assessment as any).completed_at,
                // Extract category scores and weights from the data object
                categoryScores: (assessment as any).data?.categoryScores || {},
                categoryWeights: (assessment as any).data?.userWeights || {},
                qValues: (assessment as any).data?.qValues || {},
                adjustedWeights: (assessment as any).data?.adjustedWeights || {},
                userWeights: (assessment as any).data?.userWeights || {},
                softmaxWeights: (assessment as any).data?.adjustedWeights || (assessment as any).data?.userWeights || {},
                // Use category scores as subcategories
                subcategories: Object.entries((assessment as any).data?.categoryScores || {}).reduce((acc, [category, score]) => {
                  acc[category] = { score };
                  return acc;
                }, {} as Record<string, any>),
                // Include the original responses for detailed analysis
                responses: (assessment as any).data?.responses || []
              };
              
              assessmentResults[assessment.type] = assessmentData;
              console.log(`Successfully processed ${assessment.type} data from API:`, 
                `Score: ${assessmentData.overallScore}`,
                `Categories: ${Object.keys(assessmentData.categoryScores).join(', ')}`
              );
              continue; // Skip the rest of this iteration
            }
            
            // Get the detailed assessment data from API or localStorage
            const { default: api } = await import('@/lib/api/client');
            
            // Try multiple sources to get the full assessment data
            let detailedData = null;
            
            // 1. Try to get assessment by ID if available
            if (assessment.id) {
              console.log(`Trying to fetch ${assessment.type} data by ID: ${assessment.id}`);
              const { data, error } = await api.assessments.getAssessment(assessment.id);
              if (!error && data) {
                detailedData = data;
                console.log(`Successfully fetched ${assessment.type} data by ID`);
              }
            }
            
            // 2. If that failed, try to get the assessment by company and type
            if (!detailedData) {
              console.log(`Trying to fetch ${assessment.type} data by company and type`);
              try {
                // Try with the company ID and assessment type as fallback
                const { data, error } = await api.assessments.getCompanyAssessments(companyId);
                if (!error && data && data.assessments) {
                  // Find the matching assessment type
                  const matchingAssessment = data.assessments.find(
                    a => (a.type === assessment.type || (a as any).assessment_type === assessment.type) && 
                         a.status === "completed"
                  );
                  if (matchingAssessment) {
                    detailedData = matchingAssessment;
                    console.log(`Found ${assessment.type} in company assessments response`);
                  }
                }
              } catch (err) {
                console.log(`Error getting company assessments: ${err}`);
              }
            }
            
            // 3. If API fetch failed, try localStorage with multiple possible keys
            if (!detailedData) {
              const possibleKeys = [
                `assessment_${companyId}_${assessment.type}`,
                `assessment_${assessment.type}_${companyId}`,
                `assessment_results_${assessment.type}`,
                `${assessment.type.toLowerCase().replace(/\s+/g, '_')}_assessment_results`,
                `${assessment.type.toLowerCase().replace(/\s+/g, '_')}_results`
              ];
              
              console.log(`Trying localStorage with possible keys:`, possibleKeys);
              
              for (const key of possibleKeys) {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                  try {
                    const parsedData = JSON.parse(storedData);
                    console.log(`Found data in localStorage with key: ${key}`);
                    detailedData = parsedData;
                    break;
                  } catch (e) {
                    console.log(`Error parsing data from localStorage key ${key}:`, e);
                  }
                }
              }
            }
            
            // 4. Check global/session storage as well
            if (!detailedData) {
              try {
                const sessionData = sessionStorage.getItem(`${assessment.type}_results`);
                if (sessionData) {
                  detailedData = JSON.parse(sessionData);
                  console.log(`Found ${assessment.type} data in sessionStorage`);
                }
              } catch (e) {
                console.log(`Error checking sessionStorage:`, e);
              }
            }
            
            // Log what data structure we found
            if (detailedData) {
              console.log(`Data structure for ${assessment.type}:`, Object.keys(detailedData));
              if (detailedData.data) {
                console.log(`Nested data keys:`, Object.keys(detailedData.data));
              }
            }
            
            // Create fallback subcategory data if none exists
            const createFallbackSubcategoryData = (assessmentType: string) => {
              console.log(`Creating fallback subcategory data for ${assessmentType}`);
              // Create synthetic subcategory data based on assessment type
              const subcategories: Record<string, any> = {};
              
              if (assessmentType === "AI Talent") {
                subcategories["Talent Acquisition"] = { score: Math.round(assessment.score! * 0.95) };
                subcategories["Talent Development"] = { score: Math.round(assessment.score! * 1.05) };
              } 
              else if (assessmentType === "AI Data") {
                subcategories["Data Quality"] = { score: Math.round(assessment.score! * 0.97) };
                subcategories["Data Governance"] = { score: Math.round(assessment.score! * 1.03) };
              }
              else if (assessmentType === "AI Governance") {
                subcategories["Ethics Guidelines"] = { score: Math.round(assessment.score! * 0.98) };
                subcategories["Risk Management"] = { score: Math.round(assessment.score! * 1.02) };
                subcategories["Compliance Process"] = { score: Math.round(assessment.score! * 0.99) };
              }
              else if (assessmentType === "AI Culture") {
                subcategories["Leadership Support"] = { score: Math.round(assessment.score! * 1.03) };
                subcategories["Adoption Readiness"] = { score: Math.round(assessment.score! * 0.97) };
                subcategories["Change Management"] = { score: Math.round(assessment.score! * 0.95) };
              }
              else if (assessmentType === "AI Infrastructure") {
                subcategories["Compute Resources"] = { score: Math.round(assessment.score! * 1.05) };
                subcategories["MLOps Capability"] = { score: Math.round(assessment.score! * 0.94) };
                subcategories["Technical Debt"] = { score: Math.round(assessment.score! * 0.98) };
              }
              else if (assessmentType === "AI Strategy") {
                subcategories["Vision Alignment"] = { score: Math.round(assessment.score! * 1.02) };
                subcategories["Investment Planning"] = { score: Math.round(assessment.score! * 0.96) };
                subcategories["Success Metrics"] = { score: Math.round(assessment.score! * 1.01) };
              }
              else if (assessmentType === "AI Security") {
                subcategories["Model Security"] = { score: Math.round(assessment.score! * 0.97) };
                subcategories["Data Protection"] = { score: Math.round(assessment.score! * 1.02) };
                subcategories["Adversarial Defense"] = { score: Math.round(assessment.score! * 0.95) };
              }
              
              return subcategories;
            };
            
            // Generate synthetic weights if none exist
            const createSyntheticWeights = () => {
              // Create reasonable synthetic weights for the assessment
              const baseWeight = 100 / 7; // Equal distribution across 7 assessment types
              const variance = baseWeight * 0.2; // 20% variance
              
              return {
                "AI Governance": baseWeight + (Math.random() * variance - variance/2),
                "AI Culture": baseWeight + (Math.random() * variance - variance/2),
                "AI Infrastructure": baseWeight + (Math.random() * variance - variance/2),
                "AI Strategy": baseWeight + (Math.random() * variance - variance/2),
                "AI Data": baseWeight + (Math.random() * variance - variance/2),
                "AI Talent": baseWeight + (Math.random() * variance - variance/2),
                "AI Security": baseWeight + (Math.random() * variance - variance/2)
              };
            };
            
            // If we have detailed data, extract it; otherwise use fallbacks
            let assessmentData = {
              overallScore: assessment.score,
              completedAt: (assessment as any).completed_at || (assessment as any).completed_at,
              categoryScores: {},
              categoryWeights: {},
              qValues: {},
              adjustedWeights: {},
              userWeights: {},
              softmaxWeights: {},
              subcategories: {}
            };
            
            // Attempt to extract data from various possible structures
            if (detailedData) {
              // Navigate through possible nested structures
              const dataSource = detailedData.data || detailedData.results || detailedData;
              
              // Extract available data or use empty objects if not found
              assessmentData = {
                overallScore: assessment.score,
                completedAt: (assessment as any).completed_at || (assessment as any).completed_at,
                categoryScores: dataSource.categoryScores || dataSource.scores || {},
                categoryWeights: dataSource.categoryWeights || dataSource.userWeights || dataSource.weights || {},
                qValues: dataSource.qValues || dataSource.q_values || {},
                adjustedWeights: dataSource.adjustedWeights || dataSource.adjusted_weights || {},
                userWeights: dataSource.userWeights || dataSource.user_weights || {},
                softmaxWeights: dataSource.softmaxWeights || dataSource.softmax_weights || {},
                subcategories: dataSource.subcategories || dataSource.subCategories || {},
                responses: dataSource.responses || []
              } as any; // Add type assertion to include any properties
              
              // If we have category scores but no subcategories, use them to create subcategories
              if (Object.keys(assessmentData.categoryScores).length > 0 && 
                  Object.keys(assessmentData.subcategories).length === 0) {
                assessmentData.subcategories = Object.entries(assessmentData.categoryScores).reduce((acc, [category, score]) => {
                  acc[category] = { score };
                  return acc;
                }, {} as Record<string, any>);
              }
            }
            
            // Add fallback subcategory data if none exists
            if (!assessmentData.subcategories || Object.keys(assessmentData.subcategories).length === 0) {
              console.log(`No subcategory data found for ${assessment.type}, using fallback`);
              assessmentData.subcategories = createFallbackSubcategoryData(assessment.type);
            }
            
            // Add synthetic weights if needed
            if (!assessmentData.categoryWeights || Object.keys(assessmentData.categoryWeights).length === 0) {
              console.log(`No category weights found for ${assessment.type}, using synthetic weights`);
              assessmentData.categoryWeights = createSyntheticWeights();
            }
            
            if (!assessmentData.userWeights || Object.keys(assessmentData.userWeights).length === 0) {
              assessmentData.userWeights = assessmentData.categoryWeights;
            }
            
            if (!assessmentData.softmaxWeights || Object.keys(assessmentData.softmaxWeights).length === 0) {
              assessmentData.softmaxWeights = assessmentData.categoryWeights;
            }
            
            // Store the prepared data
            assessmentResults[assessment.type] = assessmentData;
            console.log(`Prepared data for ${assessment.type}:`, 
              `Score: ${assessmentData.overallScore}`,
              `Subcategories: ${Object.keys(assessmentData.subcategories).length}`,
              `Has weights: ${Object.keys(assessmentData.categoryWeights).length > 0}`
            );
          } catch (error) {
            console.error(`Error loading detailed data for ${assessment.type}:`, error);
            
            // Create fallback functions within this scope to avoid the linter errors
            const createFallbackSubcategories = (assessmentType: string) => {
              const subcategories: Record<string, any> = {};
              if (assessmentType === "AI Talent") {
                subcategories["Talent Acquisition"] = { score: Math.round(assessment.score! * 0.95) };
                subcategories["Talent Development"] = { score: Math.round(assessment.score! * 1.05) };
              } else if (assessmentType === "AI Data") {
                subcategories["Data Quality"] = { score: Math.round(assessment.score! * 0.97) };
                subcategories["Data Governance"] = { score: Math.round(assessment.score! * 1.03) };
              } else {
                subcategories["Implementation"] = { score: Math.round(assessment.score! * 0.98) };
                subcategories["Strategy"] = { score: Math.round(assessment.score! * 1.02) };
              }
              return subcategories;
            };
            
            const createWeights = () => {
              const baseWeight = 100 / 7;
              return {
                "AI Governance": baseWeight,
                "AI Culture": baseWeight,
                "AI Infrastructure": baseWeight,
                "AI Strategy": baseWeight,
                "AI Data": baseWeight,
                "AI Talent": baseWeight,
                "AI Security": baseWeight
              };
            };
            
            // Add basic score data as fallback with synthetic subcategories
            const fallbackSubcategories = createFallbackSubcategories(assessment.type);
            const syntheticWeights = createWeights();
            
          assessmentResults[assessment.type] = {
            overallScore: assessment.score,
              completedAt: (assessment as any).completed_at || (assessment as any).completed_at,
              categoryScores: {},
              categoryWeights: syntheticWeights,
              userWeights: syntheticWeights,
              softmaxWeights: syntheticWeights,
              qValues: {},
              adjustedWeights: {},
              subcategories: fallbackSubcategories
            };
            
            console.log(`Using fallback data for ${assessment.type} with synthetic subcategories`);
          }
        }
      }
      
      // If we have no completed assessments, show a message
      if (Object.keys(assessmentResults).length === 0) {
        toast({
          title: "Cannot Generate Report",
          description: "At least one completed assessment is required to generate a Deep Research Report.",
          variant: "destructive",
        });
        setGeneratingReport(false);
        return;
      }
      
      console.log("Final assessment data being sent to report generator:", 
        Object.keys(assessmentResults).map(type => 
          `${type}: Score=${assessmentResults[type].overallScore}, Subcategories=${Object.keys(assessmentResults[type].subcategories).length}`
        )
      );
      
      // Generate the HTML report with complete data
      const htmlReport = await generateDeepResearchReport(assessmentResults);
      
      // Create a Blob from the HTML content
      const blob = new Blob([htmlReport], { type: 'text/html' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `${company?.name}_Deep_Research_Report_${new Date().toISOString().split('T')[0]}.html`;
      
      // Add the link to the document and click it
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: "Deep Research Report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating deep research report:", error);
      toast({
        title: "Error Generating Report",
        description: "There was a problem generating the Deep Research Report.",
        variant: "destructive",
      });
    } finally {
      // Always set generating report state back to false
      setGeneratingReport(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!assessmentStatus) return 0;
    
    // Count unique completed assessment types
    const completedTypes = new Set();
    assessmentStatus.assessments
      .filter(a => a.status === "completed")
      .forEach(a => completedTypes.add(a.type));
    
    // Calculate percentage based on the 7 expected assessment types
    const completed = completedTypes.size;
    const total = EXPECTED_ASSESSMENT_TYPES.length;
    
    console.log(`Completion: ${completed} out of ${total} assessment types completed`);
    return Math.round((completed / total) * 100);
  };

  const getAssignedUsers = (assessmentType: string) => {
    // First check in the teamMembers state
    if (teamMembers && teamMembers[assessmentType]?.length > 0) {
      return teamMembers[assessmentType];
    }
    
    // Try to get from assessment completed_by
    if (assessmentStatus) {
      const assessment = assessmentStatus.assessments.find(a => a.type === assessmentType);
      if (assessment && (assessment as any).completed_by_id) {
        // Create a fallback user object since completedBy is not available
        return [{
          id: (assessment as any).completed_by_id as string,
          name: "Unknown User",
          role: "Team Member",
          assigned: assessment.completedAt || new Date().toISOString()
        }];
      }
    }
    
    // No users assigned - return empty array instead of sample data
    return [];
  };

  // Calculate the overall score (average of completed assessments)
  const calculateOverallScore = () => {
    if (!assessmentStatus) return 0;
    
    const completedAssessments = assessmentStatus.assessments.filter(a => a.status === "completed" && a.score);
    if (completedAssessments.length === 0) return 0;
    
    const totalScore = completedAssessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0);
    return Math.round(totalScore / completedAssessments.length);
  };

  // Fetch available users that can be assigned to the company
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { default: api } = await import('@/lib/api/client');
      
      // Fetch all users
      console.log(`Fetching available users for assignment to company: ${companyId}`);
      const { data, error } = await api.users.getUsers();
      
      if (error) {
        console.warn("Error fetching available users:", error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        console.log(`Successfully fetched ${data.length} available users`);
        
        // Format users and filter out any already assigned to this company
        // Get currently assigned user IDs
        const assignedUserIds = new Set(
          Object.values(teamMembers)
            .flat()
            .map(user => user.id)
        );
        
        // Filter out already assigned users and format remaining ones
        const formattedUsers = data
          .filter(user => !assignedUserIds.has(user.id))
          .map(user => ({
            id: user.id,
            name: user.name || user.email || 'Unknown User',
            email: user.email,
            role: user.role || '',
            createdAt: user.createdAt || (user as any).created_at
          }));
        
        setAvailableUsers(formattedUsers);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle opening the assign users dialog
  const handleOpenAssignDialog = () => {
    fetchAvailableUsers();
    setIsAssignDialogOpen(true);
  };

  // Handle user selection
  const handleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Submit user assignments to backend
  const handleAssignUsers = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to assign.",
        variant: "destructive",
      });
      return;
    }
    
    setAssigningUsers(true);
    try {
      const { default: api } = await import('@/lib/api/client');
      
      // Call API to assign users to company
      const { data, error } = await api.companies.assignUsers(companyId, selectedUserIds);
      
      if (error) {
        console.error("Error assigning users:", error);
        toast({
          title: "Error",
          description: "Failed to assign users to company. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `Successfully assigned ${selectedUserIds.length} users to the company.`,
      });
      
      // Close dialog and refresh team members
      setIsAssignDialogOpen(false);
      fetchTeamMembers(companyId);
      
    } catch (error) {
      console.error("Error assigning users:", error);
      toast({
        title: "Error",
        description: "Failed to assign users to company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningUsers(false);
    }
  };

  // Team Assignment Dialog Component
  const TeamAssignmentDialog = () => (
    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Team Members</DialogTitle>
          <DialogDescription>
            Select users to assign to {company?.name || 'this company'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No users available to assign
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={() => handleUserSelection(user.id)}
                  />
                  <Label
                    htmlFor={`user-${user.id}`}
                    className="flex items-center cursor-pointer flex-1"
                  >
                    <div className="bg-muted rounded-full p-1 mr-2">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role || 'No role assigned'}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignUsers} 
            disabled={assigningUsers || selectedUserIds.length === 0}
          >
            {assigningUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Update the "No team members" section in the team tab to use the modal instead of navigation
  const renderNoTeamMembersSection = () => (
    <div className="text-center py-6">
      <p className="text-muted-foreground">No team members have been assigned yet</p>
      <Button 
        variant="outline" 
        className="mt-2"
        onClick={handleOpenAssignDialog}
      >
        Assign Team Members
      </Button>
    </div>
  );

  // De-duplicate assessments function - keeps only the most recent status for each type
  const deduplicateAssessments = (assessments: any[]): Assessment[] => {
    // Group assessments by type
    const assessmentsByType: Record<string, any[]> = {};
    
    assessments.forEach(assessment => {
      const type = (assessment as any).assessment_type || assessment.type; // Handle both formats
      if (!assessmentsByType[type]) {
        assessmentsByType[type] = [];
      }
      assessmentsByType[type].push(assessment);
    });
    
    console.log("Grouped assessments by type:", Object.keys(assessmentsByType).map(type => 
      `${type}: ${assessmentsByType[type].length} assessments`
    ));
    
    // For each type, select the best assessment
    // Priority: completed > in-progress > not-started 
    // For completed ones with same status, pick the most recent one
    const deduplicated = Object.entries(assessmentsByType).map(([type, typeAssessments]) => {
      // Sort first by status priority
      typeAssessments.sort((a, b) => {
        // Custom status priority sorting
        const statusPriority = {
          "completed": 3,
          "in-progress": 2, 
          "not-started": 1,
          "notStarted": 1,
          "not_started": 1
        };
        
        const statusA = a.status?.toLowerCase() || "";
        const statusB = b.status?.toLowerCase() || "";
        
        const priorityA = statusPriority[statusA as keyof typeof statusPriority] || 0;
        const priorityB = statusPriority[statusB as keyof typeof statusPriority] || 0;
        
        // If status is the same, sort by completion date (most recent first)
        if (priorityA === priorityB && statusA === "completed" && statusB === "completed") {
          // Handle null completedAt values
          const completedAtA = a.completed_at || a.completedAt;
          const completedAtB = b.completed_at || b.completedAt;
          
          if (!completedAtA) return 1;
          if (!completedAtB) return -1;
          
          return new Date(completedAtB).getTime() - new Date(completedAtA).getTime();
        }
        
        // Otherwise sort by status priority
        return priorityB - priorityA;
      });
      
      const selected = typeAssessments[0];
      
      // Convert to standard Assessment type format if needed
      return {
        id: selected.id,
        type: selected.assessment_type || selected.type,
        status: selected.status,
        score: selected.score,
        completedAt: selected.completed_at || selected.completedAt,
        // Include completed by information if available
        ...(selected.completed_by_id && { 
          completedById: selected.completed_by_id
        }),
        // Include original data for deep research report generation
        data: selected.data
      };
    });
    
    console.log("De-duplicated assessments:", deduplicated.map(a => `${a.type}: ${a.status}`));
    return deduplicated;
  };

  // Add these functions right before or after getCompletionPercentage
  // Function to get assessment types by their status
  const getAssessmentTypesByStatus = (status: string) => {
    if (!assessmentStatus) return [];

    // Get all assessment types with matching status
    const matchingTypes = assessmentStatus.assessments
      .filter(a => a.status === status || 
                (status === "not-started" && 
                ((a.status as any) === "notStarted" || (a.status as any) === "not_started")))
      .map(a => a.type);
    
    // If looking for not-started, also add expected types that aren't in the assessments list
    if (status === "not-started") {
      const existingTypes = new Set(assessmentStatus.assessments.map(a => a.type));
      EXPECTED_ASSESSMENT_TYPES.forEach(type => {
        if (!existingTypes.has(type)) {
          matchingTypes.push(type);
        }
      });
    }
    
    return matchingTypes;
  };

  // Function to calculate how many assessments are not started
  const getNotStartedCount = () => {
    if (!assessmentStatus) return EXPECTED_ASSESSMENT_TYPES.length;
    
    const completedCount = assessmentStatus.assessments.filter(a => 
      a.status === "completed"
    ).length;
    
    const inProgressCount = assessmentStatus.assessments.filter(a => 
      a.status === "in-progress"
    ).length;
    
    // Total expected minus (completed + in-progress)
    return EXPECTED_ASSESSMENT_TYPES.length - (completedCount + inProgressCount);
  };

  // Function to assign a user to a specific pillar
  const handleAssignUserToPillar = async (pillar: string, userId: string) => {
    if (!userId || !pillar) return;
    
    try {
      const { default: api } = await import('@/lib/api/client');
      
      // If the API has a specific endpoint for pillar assignments, use that
      // For now, we'll use the general assign users endpoint and handle it on the backend
      const { data, error } = await api.companies.assignUsers(companyId, [userId]);
      
      if (error) {
        console.error("Error assigning user to pillar:", error);
        toast({
          title: "Error",
          description: `Failed to assign user to ${pillar}. Please try again.`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: `Successfully assigned user to ${pillar}.`,
      });
      
      // Refresh team members
      fetchTeamMembers(companyId);
      
    } catch (error) {
      console.error("Error assigning user to pillar:", error);
      toast({
        title: "Error",
        description: `Failed to assign user to ${pillar}. Please try again.`,
        variant: "destructive",
      });
    }
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

  if (error || !company || !assessmentStatus) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The requested company information could not be loaded."}</p>
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
        {/* <div className="ml-auto">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/companies/${companyId}/profile`)}
            className="mr-2"
          >
            Configure Assessment Weights
          </Button>
        </div> */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="  max-w-md ">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {/* <TabsTrigger value="assessments">Assessments</TabsTrigger> */}
          {/* <TabsTrigger value="team">Team</TabsTrigger> */}
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
                  
                  {/* Team Members Section */}
                  <div className="pt-4">
                    <dt className="font-medium text-muted-foreground mb-2">Assigned Team Members:</dt>
                    <dd>
                      {loadingTeam ? (
                        <div className="flex items-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Loading team members...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Get all unique users across all assessment types */}
                          {Object.values(teamMembers).flat().length > 0 ? (
                            <div className="space-y-2">
                              {/* Filter out duplicates by id to show each team member only once */}
                              {Array.from(new Map(
                                Object.values(teamMembers)
                                  .flat()
                                  .map(user => [user.id, user])
                              ).values()).map((user: any, index) => (
                                <div key={`user-${user.id || index}`} className="flex items-center gap-2 text-sm">
                                  <div className="bg-muted rounded-full p-1">
                                    <User className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-muted-foreground">({user.role})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground py-1 flex justify-between items-center">
                              <span>No team members assigned</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs py-1 h-7"
                                onClick={handleOpenAssignDialog}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          )}
                          
                       
                        </div>
                      )}
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
                      {assessmentStatus.assessments.map((assessment, index) => (
                        assessment.status === "completed" && (
                          <div key={`score-bar-${assessment.type}-${index}`} className="flex-1 min-w-[120px]">
                            <div className="text-xs text-muted-foreground mb-1">{assessment.type}</div>
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-2 rounded-full flex-1" 
                                style={{ 
                                  backgroundColor: `hsl(${assessment.score! * 1.2}, 70%, 50%)`,
                                  width: `${Math.round(assessment.score!)}%`
                                }}
                              ></div>
                              <span className="text-xs font-medium">{Math.round(assessment.score!)}%</span>
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
                          {getNotStartedCount()}
                        </Badge>
                        <span className="text-sm">Not Started</span>
                      </div>
                    </div>
                    
                    {/* Show assessment types with their status */}
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">Assessment types:</div>
                      <div className="flex flex-wrap gap-1">
                        {EXPECTED_ASSESSMENT_TYPES.map(type => {
                          const assessment = assessmentStatus?.assessments.find(a => a.type === type);
                          const status = assessment?.status || "not-started";
                          return (
                            <Badge 
                              key={type} 
                              variant={status === "completed" ? "default" : 
                                     status === "in-progress" ? "secondary" : 
                                     "outline"}
                              className={status === "completed" ? "bg-green-600" : ""}
                            >
                              {type.replace('AI ', '')}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    
                    {isAuthenticated && user?.role === 'admin' && (
                      <div className="text-xs text-muted-foreground mt-1 cursor-help" 
                        title={`Debug: ${JSON.stringify(assessmentStatus.assessments.map(a => ({type: a.type, status: a.status})))}`}>
                        All assessments: {assessmentStatus.assessments.length} / Expected: {EXPECTED_ASSESSMENT_TYPES.length}
                      </div>
                    )}
                  </div>
                  
                  {assessmentStatus.assessments.some(a => a.status === "completed") && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={handleGenerateDeepResearchReport}
                        className="flex items-center gap-2 w-full"
                        variant="secondary"
                        disabled={generatingReport}
                      >
                        {generatingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                        <FileDown className="h-4 w-4" />
                        )}
                        Generate Deep Research Report
                      </Button>
                      {generatingReport ? (
                        <div className="flex flex-col items-center mt-2 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mb-1" />
                          <span>Analyzing assessment data and generating insights...</span>
                        </div>
                      ) : (
                      <p className="text-xs text-muted-foreground mt-2">
                        Generates a comprehensive analysis based on all completed assessments
                      </p>
                      )}
                    </div>
                  )}
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
                  .map((assessment, index) => {
                    // Get assigned users for this assessment
                    const assignedUsers = getAssignedUsers(assessment.type);
                    const completedBy = assignedUsers.length > 0 
                      ? assignedUsers[0].name 
                      : "Unknown user";
                    
                    return (
                      <div key={`recent-completed-${assessment.type}-${index}-${assessment.completedAt}`} className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                        <div className="flex-1">
                        <h4 className="font-medium">{assessment.type} Assessment Completed</h4>
                        <p className="text-sm text-muted-foreground">
                            Score: {Math.round(assessment.score!)}% | 
                          {new Date(assessment.completedAt!).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed by: {completedBy}
                        </p>
                      </div>
                    </div>
                    );
                  })}

                {assessmentStatus.assessments
                  .filter(a => a.status === "in-progress")
                  .map(assessment => (
                    <div key={`recent-progress-${assessment.type}`} className="flex items-start gap-3">
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
          
          {/* Add the pillar assignments component here */}
          <PillarAssignments 
            companyId={companyId}
            teamMembers={teamMembers}
            availableUsers={availableUsers}
            onAssignUser={handleAssignUserToPillar}
          />
        </TabsContent>

        {/* Assessments Tab */}
        {/* <TabsContent value="assessments" className="space-y-4">
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
                  <div key={`assessment-row-${assessment.type}`} className="space-y-2">
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
            <CardFooter className="flex justify-center pt-2">
              {assessmentStatus.assessments.some(a => a.status === "completed") && (
                <Button 
                  variant="outline"
                  onClick={handleGenerateDeepResearchReport}
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Generate Deep Research Report
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent> */}

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Company Team Management
              </CardTitle>
              <CardDescription>
                Manage the team for {company?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeam ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.values(teamMembers).flat().length === 0 ? (
                renderNoTeamMembersSection()
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Team Members</h3>
                      <p className="text-sm text-muted-foreground">
                        {Object.values(teamMembers).flat().length} users assigned to this company
                      </p>
                    </div>
                  </div>
                  
                  {/* Simple table to show all assigned users */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assignment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(teamMembers)
                        .flat()
                        // Remove duplicates by user ID
                        .filter((user, index, self) => 
                          index === self.findIndex(u => u.id === user.id)
                        )
                        .map((user, idx) => (
                          <TableRow key={user.id || idx}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                              {Object.entries(teamMembers)
                                .filter(([_, users]) => users.some(u => u.id === user.id))
                                .map(([pillar]) => (
                                  <Badge key={pillar} className="mr-1 mb-1">{pillar}</Badge>
                                ))
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Display the PillarAssignments component with simplified props */}
          <PillarAssignments 
            assessmentTypes={EXPECTED_ASSESSMENT_TYPES} 
            teamMembers={teamMembers}
            companyId={companyId}
          />
        </TabsContent>
      </Tabs>
      
      {/* Include the Team Assignment Dialog */}
      <TeamAssignmentDialog />
    </div>
  );
} 
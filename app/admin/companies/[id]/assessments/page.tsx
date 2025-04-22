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
  const { isAuthenticated, user } = useAuth();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<CompanyAssessmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [teamMembers, setTeamMembers] = useState<Record<string, any[]>>({});
  const [loadingTeam, setLoadingTeam] = useState(false);
  
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
        
        // Map roles to assessment types
        const roleToAssessmentMap: Record<string, string[]> = {
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
          const assessmentTypes = roleToAssessmentMap[role] || [];
          
          // Check if username contains clues about their role (fallback)
          if (assessmentTypes.length === 0) {
            if (username.includes('admin')) {
              assessmentTypes.push(...roleToAssessmentMap['admin']);
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
              assessmentTypes.push(...roleToAssessmentMap['admin']);
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
                assigned: user.created_at || new Date().toISOString()
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
          setError(companyError.message || "Failed to fetch company data");
          throw new Error(companyError.message);
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
              assessments: [
                { type: "AI Governance", status: "not-started" },
                { type: "AI Culture", status: "not-started" },
                { type: "AI Infrastructure", status: "not-started" },
                { type: "AI Strategy", status: "not-started" },
                { type: "AI Data", status: "not-started" },
                { type: "AI Talent", status: "not-started" },
                { type: "AI Security", status: "not-started" }
              ]
            };
            setAssessmentStatus(defaultStatus);
          }
          
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        // Continue to fallback methods
      }
      
      // Fallback methods if API fails
      try {
        console.log("API fetch failed, checking localStorage for company data");
        
        // Check localStorage for company info
        const storedCompanyInfo = localStorage.getItem('company_info');
        if (storedCompanyInfo) {
          const parsedInfo = JSON.parse(storedCompanyInfo);
          if (parsedInfo.id === companyId) {
            console.log("Found company in localStorage:", parsedInfo);
            setCompany(parsedInfo);
            
            // Check localStorage for assessment data
            const companyAssessmentsKey = `company_assessments_${companyId}`;
            const storedCompanyAssessments = localStorage.getItem(companyAssessmentsKey);
            
            if (storedCompanyAssessments) {
              const assessments = JSON.parse(storedCompanyAssessments);
              if (Object.keys(assessments).length > 0) {
                // Convert to assessment status format
                const status: CompanyAssessmentStatus = {
                  companyId,
                  companyName: parsedInfo.name,
                  assessments: Object.entries(assessments).map(([type, data]: [string, any]) => ({
                    type,
                    status: "completed",
                    score: data.overallScore,
                    completedAt: data.completedAt,
                    completedBy: data.completedBy
                  }))
                };
                setAssessmentStatus(status);
                setLoading(false);
                return;
              }
            }
          }
        }
        
        // Check companies list in localStorage
        const storedCompanies = localStorage.getItem('companies');
        if (storedCompanies) {
          const companies = JSON.parse(storedCompanies);
          const foundCompany = companies.find((c: CompanyInfo) => c.id === companyId);
          
          if (foundCompany) {
            console.log("Found company in companies list:", foundCompany);
            setCompany(foundCompany);
            
            // Check assessment statuses in localStorage
            const storedStatuses = localStorage.getItem('assessment_statuses');
            if (storedStatuses) {
              const statuses = JSON.parse(storedStatuses);
              const foundStatus = statuses.find((s: CompanyAssessmentStatus) => s.companyId === companyId);
              
              if (foundStatus) {
                setAssessmentStatus(foundStatus);
                setLoading(false);
                return;
              }
            }
            
            // Create default assessment status
            const defaultStatus: CompanyAssessmentStatus = {
              companyId,
              companyName: foundCompany.name,
              assessments: [
                { type: "AI Governance", status: "not-started" },
                { type: "AI Culture", status: "not-started" },
                { type: "AI Infrastructure", status: "not-started" },
                { type: "AI Strategy", status: "not-started" },
                { type: "AI Data", status: "not-started" },
                { type: "AI Talent", status: "not-started" },
                { type: "AI Security", status: "not-started" }
              ]
            };
            setAssessmentStatus(defaultStatus);
            setLoading(false);
            return;
          }
        }
        
        // Final fallback to sample data if all else fails
        console.log("No data found in localStorage, using sample data as last resort");
        const foundCompany = SAMPLE_COMPANIES.find(c => c.id === companyId);
        const foundStatus = SAMPLE_ASSESSMENT_STATUSES.find(s => s.companyId === companyId);
        
        if (foundCompany) {
        setCompany(foundCompany);
          if (foundStatus) {
        setAssessmentStatus(foundStatus);
      } else {
            // Create default status
            const defaultStatus = {
              companyId,
              companyName: foundCompany.name,
              assessments: [
                { type: "AI Governance", status: "not-started" },
                { type: "AI Culture", status: "not-started" },
                { type: "AI Infrastructure", status: "not-started" },
                { type: "AI Strategy", status: "not-started" },
                { type: "AI Data", status: "not-started" },
                { type: "AI Talent", status: "not-started" },
                { type: "AI Security", status: "not-started" }
              ]
            };
            setAssessmentStatus(defaultStatus);
          }
        } else {
          // Company not found anywhere
          setError(`Company not found with ID: ${companyId}`);
          toast({
            title: "Company Not Found",
            description: "The requested company could not be found.",
            variant: "destructive",
          });
          setTimeout(() => router.push("/admin/companies"), 2000);
        }
      } catch (error) {
        console.error("Error in fallback loading:", error);
        setError("Failed to load company data");
        toast({
          title: "Error Loading Data",
          description: "There was a problem loading the company data.",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    };
    
    if (companyId) {
      loadCompanyData();
    }
  }, [companyId, router]);

  useEffect(() => {
    if (company && companyId) {
      fetchTeamMembers(companyId);
    }
  }, [company, companyId]);

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

    toast({
      title: "Generating Report",
      description: "Preparing the Deep Research Report. This may take a moment...",
    });

    try {
      // Create a record of all assessment results to pass to the API
      const assessmentResults: Record<string, any> = {};
      
      // Create a formatted record for each assessment type
      assessmentStatus.assessments.forEach(assessment => {
        if (assessment.status === "completed" && assessment.score) {
          // For each completed assessment, create a structured record
          assessmentResults[assessment.type] = {
            overallScore: assessment.score,
            categoryScores: {}, // Would be populated with subcategory scores in a real implementation
            qValues: {},        // Would be populated with actual Q-values in a real implementation
            adjustedWeights: {}, // Would be populated with actual weights in a real implementation
            userWeights: {},    // Would be populated with user-defined weights
            softmaxWeights: {}  // Would be populated with calculated softmax weights
          };
          
          // In a real implementation, you would fetch detailed subcategory data here
        }
      });
      
      // If we have no completed assessments, show a message
      if (Object.keys(assessmentResults).length === 0) {
        toast({
          title: "Cannot Generate Report",
          description: "At least one completed assessment is required to generate a Deep Research Report.",
          variant: "destructive",
        });
        return;
      }
      
      // Generate the HTML report
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
    }
  };

  const getCompletionPercentage = () => {
    if (!assessmentStatus) return 0;
    
    // Define the complete list of expected assessment types
    const expectedAssessmentTypes = [
      "AI Governance", 
      "AI Culture", 
      "AI Infrastructure", 
      "AI Strategy", 
      "AI Data", 
      "AI Talent", 
      "AI Security"
    ];
    
    // Count unique completed assessment types
    const completedTypes = new Set();
    assessmentStatus.assessments
      .filter(a => a.status === "completed")
      .forEach(a => completedTypes.add(a.type));
    
    // Calculate percentage based on the 7 expected assessment types
    const completed = completedTypes.size;
    const total = expectedAssessmentTypes.length;
    
    console.log(`Completion: ${completed} out of ${total} assessment types completed`);
    return Math.round((completed / total) * 100);
  };

  const getAssignedUsers = (assessmentType: string) => {
    // First check if we have team members from backend
    if (teamMembers && teamMembers[assessmentType] && teamMembers[assessmentType].length > 0) {
      return teamMembers[assessmentType];
    }
    
    // If we have assessment status with completedBy info, use that
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
    
    // Fall back to sample data only as last resort
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

  // Fetch available users that can be assigned to the company
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { default: api } = await import('@/lib/api/client');
      
      // Fetch users from backend
      const { data, error } = await api.users.getUsers();
      
      if (error) {
        console.warn("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load available users. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data && Array.isArray(data)) {
        console.log("Available users loaded:", data);
        setAvailableUsers(data);
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast({
        title: "Error",
        description: "Failed to load available users. Please try again.",
        variant: "destructive",
      });
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
  const deduplicateAssessments = (assessments: Assessment[]): Assessment[] => {
    // Group assessments by type
    const assessmentsByType: Record<string, Assessment[]> = {};
    
    assessments.forEach(assessment => {
      if (!assessmentsByType[assessment.type]) {
        assessmentsByType[assessment.type] = [];
      }
      assessmentsByType[assessment.type].push(assessment);
    });
    
    // For each type, select the best assessment
    // Priority: completed > in-progress > not-started 
    // For completed ones with same status, pick the most recent one
    const deduplicated = Object.values(assessmentsByType).map(typeAssessments => {
      // Sort first by status priority
      typeAssessments.sort((a, b) => {
        // Custom status priority sorting
        const statusPriority = {
          "completed": 3,
          "in-progress": 2, 
          "not-started": 1
        };
        
        const priorityA = statusPriority[a.status] || 0;
        const priorityB = statusPriority[b.status] || 0;
        
        // If status is the same, sort by completion date (most recent first)
        if (priorityA === priorityB && a.status === "completed" && b.status === "completed") {
          // Handle null completedAt values
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        
        // Otherwise sort by status priority
        return priorityB - priorityA;
      });
      
      // Return the first (highest priority) assessment
      return typeAssessments[0];
    });
    
    console.log("De-duplicated assessments:", deduplicated);
    return deduplicated;
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
                  
                  {assessmentStatus.assessments.some(a => a.status === "completed") && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={handleGenerateDeepResearchReport}
                        className="flex items-center gap-2 w-full"
                        variant="secondary"
                      >
                        <FileDown className="h-4 w-4" />
                        Generate Deep Research Report
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Generates a comprehensive analysis based on all completed assessments
                      </p>
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
                  .map((assessment, index) => (
                    <div key={`recent-completed-${assessment.type}-${index}-${assessment.completedAt}`} className="flex items-start gap-3">
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
                Assessment Team
              </CardTitle>
              <CardDescription>
                Team members assigned to {company?.name}'s assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeam ? (
                <div className="py-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading team members...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assessmentStatus && Object.entries(teamMembers).map(([assessmentType, users], index) => {
                    if (users.length === 0) return null;
                    
                    // Look up the assessment to get its status
                    const assessment = assessmentStatus.assessments.find(a => a.type === assessmentType);
                    if (!assessment) return null;
                    
                    return (
                      <div key={`team-section-${index}-${assessmentType}`} className="space-y-3">
                        <h3 className="font-medium text-lg flex items-center">
                          {assessmentType}
                          {assessment.status === 'completed' && (
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          )}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {users.map((user, userIndex) => (
                            <div key={`user-${index}-${assessmentType}-${user.id || userIndex}`} className="flex items-center gap-3 border rounded-md p-3">
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
                  
                  {(!assessmentStatus || Object.values(teamMembers).every(users => users.length === 0)) && renderNoTeamMembersSection()}
                </div>
              )}
              
              {/* Add a button to assign more team members even when some exist */}
              {!loadingTeam && Object.keys(teamMembers).length > 0 && 
               Object.values(teamMembers).some(users => users.length > 0) && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleOpenAssignDialog}
                  >
                    <Plus className="h-4 w-4" />
                    Assign More Team Members
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Include the Team Assignment Dialog */}
      <TeamAssignmentDialog />
    </div>
  );
} 
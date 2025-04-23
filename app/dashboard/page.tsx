"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth, ROLE_TO_PILLAR } from "@/lib/auth-context";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";
import { AssessmentResult, AssessmentType, ChartDataItem } from "../types/dashboard";
import React from "react";

// Import dashboard components
import { CompanyCard } from "../components/dashboard";

// Assessment Type Configuration
const assessmentTypes: AssessmentType[] = [
    { id: "AI Governance", title: "AI Governance", icon: () => null },
    { id: "AI Culture", title: "AI Culture", icon: () => null },
    { id: "AI Infrastructure", title: "AI Infrastructure", icon: () => null },
    { id: "AI Strategy", title: "AI Strategy", icon: () => null },
    { id: "AI Data", title: "AI Data", icon: () => null },
    { id: "AI Talent", title: "AI Talent", icon: () => null },
    { id: "AI Security", title: "AI Security", icon: () => null },
];

// Dashboard Page Wrapper
export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}

// Main Dashboard Content
function DashboardContent() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<CompanyInfo[]>([]);
    const [assessmentStatuses, setAssessmentStatuses] = useState<Record<string, CompanyAssessmentStatus>>({});
    const [results, setResults] = useState<Record<string, AssessmentResult>>({});
    const [overallData, setOverallData] = useState<ChartDataItem[]>([]);

    // Filter assessment types based on user role
    const filteredAssessmentTypes = React.useMemo(() => {
        return assessmentTypes.filter(type => {
            // Admin can see all assessment types
            if (user?.role === "admin") return true;
            
            // Other users can only see their assigned assessment type
            return user?.role ? ROLE_TO_PILLAR[user.role] === type.title : false;
        });
    }, [user?.role]);

    // Load data from API and localStorage
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            try {
                // Dynamically import API client
                const { default: api } = await import('@/lib/api/client');
                
                // Fetch companies based on user role
                if (user?.role === "admin") {
                    // Admin sees all companies
                    const { data: companiesData, error: companiesError } = await api.companies.getCompanies();
                    
                    if (companiesError) {
                        throw new Error(companiesError);
                    }
                    
                    if (companiesData && Array.isArray(companiesData)) {
                        setCompanies(companiesData);
                        
                        // Fetch assessment status for each company
                        const statusesMap: Record<string, CompanyAssessmentStatus> = {};
                        const assessmentResultsMap: Record<string, AssessmentResult> = {};
                        const chartDataArray: ChartDataItem[] = [];
                        
                        for (const company of companiesData) {
                            if (company.id) {
                                try {
                                    const { data: assessmentData, error: assessmentError } = 
                                        await api.assessments.getCompanyAssessments(company.id);
                                    
                                    if (!assessmentError && assessmentData) {
                                        statusesMap[company.id] = assessmentData;
                                        
                                        // Process completed assessments and add them to the results map
                                        if (assessmentData.assessments) {
                                            for (const assessment of assessmentData.assessments) {
                                                if (assessment.status === 'completed' && assessment.score) {
                                                    // Find assessment details if they exist
                                                    try {
                                                        if (assessment.id) {
                                                            const { data: assessmentDetails } = await api.assessments.getAssessment(assessment.id);
                                                            
                                                            if (assessmentDetails && assessmentDetails.data) {
                                                                // Extract the full result data
                                                                const resultData = {
                                                                    assessmentType: assessment.type,
                                                                    categoryScores: assessmentDetails.data.categoryScores || {},
                                                                    qValues: assessmentDetails.data.qValues || {},
                                                                    overallScore: assessment.score,
                                                                    // Handle softmaxWeights field
                                                                    softmaxWeights: assessmentDetails.data.adjustedWeights || {}
                                                                };
                                                                
                                                                assessmentResultsMap[assessment.type] = resultData;
                                                                
                                                                // Add to chart data with user-friendly display name
                                                                const assessmentType = assessmentTypes.find(t => t.id === assessment.type);
                                                                const displayName = assessmentType ? assessmentType.title : assessment.type;
                                                                
                                                                chartDataArray.push({
                                                                    name: displayName,
                                                                    score: assessment.score
                                                                });
                                                            }
                                                        }
                                                    } catch (assessmentDetailError) {
                                                        console.warn(`Error fetching assessment details for ${assessment.type}:`, assessmentDetailError);
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        // Create default assessment status if not found
                                        statusesMap[company.id] = {
                                            companyId: company.id,
                                            companyName: company.name,
                                            assessments: assessmentTypes.map(type => ({
                                                type: type.id,
                                                status: "not-started"
                                            }))
                                        };
                                    }
                                } catch (error) {
                                    console.warn(`Error fetching assessments for company ${company.id}:`, error);
                                }
                            }
                        }
                        
                        setAssessmentStatuses(statusesMap);
                        
                        // If we found results from the API, use them
                        if (Object.keys(assessmentResultsMap).length > 0) {
                            setResults(assessmentResultsMap);
                            setOverallData(chartDataArray);
                        } else {
                            // Fallback to localStorage
                            loadResultsFromLocalStorage(filteredAssessmentTypes);
                        }
                    }
                } else if (user?.id) {
                    // Regular user sees only assigned companies
                    try {
                        // Try to get user companies directly if available
                        const { data: userCompanies, error: companiesError } = await api.companies.getCompanies();
                        
                        // Filter companies for this user
                        const filteredCompanies = userCompanies ? userCompanies.filter(company => {
                            // In a real app, you would have a proper way to determine if the user is assigned to this company
                            // This is a simplified version
                            return company.hasOwnProperty('users') ? 
                                ((company as any).users as any[]).some(u => u.id === user.id) : true;
                        }) : [];
                        
                        if (companiesError) {
                            console.warn("Error fetching user companies:", companiesError);
                        }
                        
                        if (filteredCompanies.length > 0) {
                            setCompanies(filteredCompanies);
                            
                            // Fetch assessment status for each assigned company
                            const statusesMap: Record<string, CompanyAssessmentStatus> = {};
                            const assessmentResultsMap: Record<string, AssessmentResult> = {};
                            const chartDataArray: ChartDataItem[] = [];
                            
                            for (const company of filteredCompanies) {
                                if (company.id) {
                                    try {
                                        const { data: assessmentData, error: assessmentError } = 
                                            await api.assessments.getCompanyAssessments(company.id);
                                        
                                        if (!assessmentError && assessmentData) {
                                            statusesMap[company.id] = assessmentData;
                                            
                                            // Process completed assessments and add them to the results map
                                            if (assessmentData.assessments) {
                                                for (const assessment of assessmentData.assessments) {
                                                    if (assessment.status === 'completed' && assessment.score) {
                                                        // Only care about assessments this role can access
                                                        if (user.role && ROLE_TO_PILLAR[user.role] === assessment.type) {
                                                            try {
                                                                if (assessment.id) {
                                                                    const { data: assessmentDetails } = await api.assessments.getAssessment(assessment.id);
                                                                    
                                                                    if (assessmentDetails && assessmentDetails.data) {
                                                                        // Extract the full result data
                                                                        const resultData = {
                                                                            assessmentType: assessment.type,
                                                                            categoryScores: assessmentDetails.data.categoryScores || {},
                                                                            qValues: assessmentDetails.data.qValues || {},
                                                                            overallScore: assessment.score,
                                                                            // Handle softmaxWeights field
                                                                            softmaxWeights: assessmentDetails.data.adjustedWeights || {}
                                                                        };
                                                                        
                                                                        assessmentResultsMap[assessment.type] = resultData;
                                                                        
                                                                        // Add to chart data with user-friendly display name
                                                                        const assessmentType = assessmentTypes.find(t => t.id === assessment.type);
                                                                        const displayName = assessmentType ? assessmentType.title : assessment.type;
                                                                        
                                                                        chartDataArray.push({
                                                                            name: displayName,
                                                                            score: assessment.score
                                                                        });
                                                                    }
                                                                }
                                                            } catch (assessmentDetailError) {
                                                                console.warn(`Error fetching assessment details for ${assessment.type}:`, assessmentDetailError);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.warn(`Error fetching assessments for company ${company.id}:`, error);
                                    }
                                }
                            }
                            
                            setAssessmentStatuses(statusesMap);
                            
                            // If we found results from the API, use them
                            if (Object.keys(assessmentResultsMap).length > 0) {
                                setResults(assessmentResultsMap);
                                setOverallData(chartDataArray);
                            } else {
                                // Fallback to localStorage
                                loadResultsFromLocalStorage(filteredAssessmentTypes);
                            }
                        } else {
                            // Fallback to localStorage if API fails
                            const storedCompanyInfo = localStorage.getItem('company_info');
                            if (storedCompanyInfo) {
                                try {
                                    const company = JSON.parse(storedCompanyInfo);
                                    setCompanies([company]);
                                    
                                    // Create a default assessment status
                                    if (company.id) {
                                        const statusesMap: Record<string, CompanyAssessmentStatus> = {
                                            [company.id]: {
                                                companyId: company.id,
                                                companyName: company.name,
                                                assessments: assessmentTypes.map(type => ({
                                                    type: type.id,
                                                    status: "not-started"
                                                }))
                                            }
                                        };
                                        setAssessmentStatuses(statusesMap);
                                    }
                                    
                                    // Fallback to localStorage for assessment results
                                    loadResultsFromLocalStorage(filteredAssessmentTypes);
                                } catch (error) {
                                    console.error("Error parsing stored company info:", error);
                                }
                            } else {
                                // No companies at all - fallback to localStorage
                                loadResultsFromLocalStorage(filteredAssessmentTypes);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching user companies:", error);
                        
                        // Fallback to localStorage
                        const storedCompanyInfo = localStorage.getItem('company_info');
                        if (storedCompanyInfo) {
                            try {
                                const company = JSON.parse(storedCompanyInfo);
                                setCompanies([company]);
                                loadResultsFromLocalStorage(filteredAssessmentTypes);
                            } catch (error) {
                                console.error("Error parsing stored company info:", error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading dashboard data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load dashboard data. Please try again.",
                    variant: "destructive",
                });
                
                // Final fallback - try localStorage
                loadResultsFromLocalStorage(filteredAssessmentTypes);
            } finally {
                setLoading(false);
            }
        };

        // Helper function to load results from localStorage
        const loadResultsFromLocalStorage = (filteredTypes: typeof assessmentTypes) => {
            console.log("Falling back to localStorage for assessment results");
            const loadedResults: Record<string, AssessmentResult> = {};

            filteredTypes.forEach(type => {
                const storageKey = `assessment_result_${type.id}`;
                const storedResult = localStorage.getItem(storageKey);
                
                if (storedResult) {
                    try {
                        const parsedResult = JSON.parse(storedResult);
                        loadedResults[type.id] = parsedResult;
                    } catch (error) {
                        console.error(`Error parsing stored result for ${type.id}:`, error);
                    }
                }
            });

            if (Object.keys(loadedResults).length > 0) {
                setResults(loadedResults);
                
                // Prepare overall data for bar chart with explicit mapping to handle labels correctly
                const chartData = Object.entries(loadedResults).map(([type, result]) => {
                    // Find the user-friendly display name for this assessment type
                    const assessmentType = assessmentTypes.find(a => a.id === type);
                    const displayName = assessmentType ? assessmentType.title : type;
                    
                    return {
                        name: displayName,
                        score: Math.round(result.overallScore)
                    };
                });
                
                console.log("Setting chart data:", chartData);
                setOverallData(chartData);
            }
        };

        fetchData();
    }, [user, filteredAssessmentTypes, toast]);

    // Debug: Log overall data when it changes
    useEffect(() => {
        console.log("Overall data updated:", overallData);
        if (overallData.length > 0) {
            console.log("BarChart data:", JSON.stringify(overallData));
        }
    }, [overallData]);
    
    // Calculate company completion percentage
    const getCompanyCompletionPercentage = (companyId: string): number => {
        const status = assessmentStatuses[companyId];
        if (!status) return 0;
        
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
        status.assessments
          .filter(a => a.status === "completed")
          .forEach(a => completedTypes.add(a.type));
        
        // Calculate percentage based on the 7 expected assessment types
        const completed = completedTypes.size;
        const total = expectedAssessmentTypes.length;
        
        console.log(`Dashboard: Company ${companyId}: ${completed} out of ${total} assessment types completed`);
        return Math.round((completed / total) * 100);
    };
    
    // Calculate company overall score
    const getCompanyOverallScore = (companyId: string): number => {
        const status = assessmentStatuses[companyId];
        if (!status) return 0;
        
        // Group by assessment type and take the latest/highest score for each type
        const scoresByType: Record<string, number> = {};
        
        // Process all completed assessments with scores
        status.assessments
            .filter(a => a.status === "completed" && a.score)
            .forEach(a => {
                // If this type doesn't exist yet or has a lower score, update it
                if (!scoresByType[a.type] || scoresByType[a.type] < (a.score || 0)) {
                    scoresByType[a.type] = a.score || 0;
                }
            });
        
        // Get array of unique scores (one per assessment type)
        const uniqueScores = Object.values(scoresByType);
            
        if (uniqueScores.length === 0) return 0;
        
        // Calculate average of the unique scores
        const totalScore = uniqueScores.reduce((sum, score) => sum + score, 0);
        const averageScore = Math.round(totalScore / uniqueScores.length);
        
        console.log(`Company ${companyId} overall score: ${averageScore}% (averaged from ${uniqueScores.length} unique assessment types)`);
        
        return averageScore;
    };

    const handleViewCompany = (companyId: string) => {
        router.push(`/admin/companies/${companyId}/assessments`);
    };
    
    const handleStartAssessment = (assessmentType: string, companyId?: string) => {
        // If company ID is provided, store it in localStorage first
        if (companyId) {
            const company = companies.find(c => c.id === companyId);
            if (company) {
                localStorage.setItem('company_info', JSON.stringify(company));
            }
        }
        
        router.push(`/assessment/${encodeURIComponent(assessmentType)}`);
    };

    // Prepare overall data for bar chart with explicit mapping to handle labels correctly
    useEffect(() => {
        if (Object.keys(results).length > 0) {
            // Create a better formatted dataset for the chart
            const chartData = Object.entries(results).map(([type, result]) => {
                // Find the user-friendly display name for this assessment type
                const assessmentType = assessmentTypes.find(a => a.id === type);
                const displayName = assessmentType ? assessmentType.title : type;
                
                return {
                    name: displayName,
                    score: Math.round(result.overallScore)
                };
            });
            
            console.log("Setting chart data:", chartData);
            setOverallData(chartData);
        }
    }, [results, assessmentTypes]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-lg font-medium">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    // Get the user's assessment type based on role
    const userAssessmentType = user?.role ? ROLE_TO_PILLAR[user.role] : null;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{user?.role === 'admin' ? 'Companies Dashboard' : 'My Companies'}</h1>
                    <p className="text-muted-foreground">
                        {user?.role === 'admin' 
                            ? 'Overview of all companies and their assessment progress' 
                            : `Welcome back, ${user?.name || 'User'}`}
                    </p>
                </div>

                {user?.role === 'admin' && (
                    <Button onClick={() => router.push('/admin/companies/add')}>
                        Add New Company
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-4">
                        {user?.role === 'admin' ? 'All Companies' : 'Companies Assigned to You'}
                    </h2>
                    
                    {companies.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Companies Found</CardTitle>
                                <CardDescription>
                                    {user?.role === 'admin' 
                                        ? 'No companies have been added to the system yet.' 
                                        : 'You have not been assigned to any companies yet.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center py-6">
                            <Button onClick={() => router.push('/admin/companies')}>
                                {user?.role === 'admin' ? 'View Companies' : 'Start Assessments'}
                                    </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <CompanyCard
                                key={company.id}
                                company={company}
                                status={assessmentStatuses[company.id || ""]}
                                completionPercentage={getCompanyCompletionPercentage(company.id || "")}
                                overallScore={getCompanyOverallScore(company.id || "")}
                                onViewDetails={handleViewCompany}
                                onManageAssessments={(id: string) => router.push(`/admin/companies/${id}/assessments`)}
                                onStartAssessment={handleStartAssessment}
                                isAdmin={user?.role === 'admin'}
                                userAssessmentType={userAssessmentType}
                            />
                        ))}
                                                </div>
                                            )}
                        </div>
        </div>
    );
}
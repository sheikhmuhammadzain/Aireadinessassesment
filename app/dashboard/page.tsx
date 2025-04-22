"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    BarChart4,
    Brain,
    Database,
    FileText,
    Layers,
    Loader2,
    Search,
    Shield,
    Users,
    TrendingUp,
    CheckCircle,
    TrendingDown,
    Target,
    Info,
    BarChart2,
    Building,
    Clock,
    XCircle,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateDeepResearchReport } from "@/lib/openai";
import { AssessmentLevelsVisual } from "@/components/assessment-levels-visual";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth, ROLE_TO_PILLAR } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { CompanyInfo, CompanyAssessmentStatus } from "@/types";
import React from "react";

// Interfaces
interface AssessmentResult {
    assessmentType: string;
    categoryScores: Record<string, number>;
    qValues: Record<string, number>;
    softmaxWeights: Record<string, number>;
    overallScore: number;
}

// Assessment Type Configuration
const assessmentTypes = [
    { id: "AI Governance", title: "AI Governance", icon: Shield },
    { id: "AI Culture", title: "AI Culture", icon: Users },
    { id: "AI Infrastructure", title: "AI Infrastructure", icon: Layers },
    { id: "AI Strategy", title: "AI Strategy", icon: BarChart4 },
    { id: "AI Data", title: "AI Data", icon: Database },
    { id: "AI Talent", title: "AI Talent", icon: Brain },
    { id: "AI Security", title: "AI Security", icon: Shield },
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
    const [overallData, setOverallData] = useState<{ name: string; score: number }[]>([]);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportGenerationMessage, setReportGenerationMessage] = useState("Generating report...");
    const [activeTab, setActiveTab] = useState("overview");

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
                        const chartDataArray: { name: string; score: number }[] = [];
                        
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
                                                                
                                                                // Add to chart data
                                                                chartDataArray.push({
                                                                    name: assessment.type,
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
                            const chartDataArray: { name: string; score: number }[] = [];
                            
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
                                                                        
                                                                        // Add to chart data
                                                                        chartDataArray.push({
                                                                            name: assessment.type,
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
                
                // Prepare overall data for bar chart
                const overallScores = Object.entries(loadedResults).map(([type, result]) => {
                    const score = typeof result.overallScore === 'number' ? 
                        Math.round(result.overallScore * 100) / 100 : 0;
                    
                    return {
                        name: type,
                        score: score
                    };
                }).filter(item => item.score > 0);
                
                setOverallData(overallScores);
            }
        };

        fetchData();
    }, [user, filteredAssessmentTypes, toast]);

    // Report Generation Animation Effect
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        const messages = [
            "Analyzing assessment data...",
            "Scanning industry benchmarks...",
            "Identifying key opportunities...",
            "Compiling strategic insights...",
            "Finalizing comprehensive report..."
        ];
        let messageIndex = 0;

        if (generatingReport) {
            setReportGenerationMessage(messages[0]);
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setReportGenerationMessage(messages[messageIndex]);
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [generatingReport]);

    const getScoreLabel = (score: number): string => {
        if (score >= 80) return "Advanced";
        if (score >= 60) return "Developed";
        if (score >= 40) return "Emerging";
        return "Initial";
    };

    const calculateOverallReadiness = (): number => {
        const scores = Object.values(results).map(r => r.overallScore);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    };

    const getStrongestArea = (): string | null => {
        if (Object.keys(results).length === 0) return null;
        return Object.entries(results)
            .sort((a, b) => b[1].overallScore - a[1].overallScore)[0][0];
    };

    const getWeakestArea = (): string | null => {
        if (Object.keys(results).length === 0) return null;
        return Object.entries(results)
            .sort((a, b) => a[1].overallScore - b[1].overallScore)[0][0];
    };
    
    // Calculate company completion percentage
    const getCompanyCompletionPercentage = (companyId: string): number => {
        const status = assessmentStatuses[companyId];
        if (!status) return 0;
        
        const completed = status.assessments.filter(a => a.status === "completed").length;
        const total = status.assessments.length;
        return Math.round((completed / total) * 100);
    };
    
    // Calculate company overall score
    const getCompanyOverallScore = (companyId: string): number => {
        const status = assessmentStatuses[companyId];
        if (!status) return 0;
        
        const completedAssessments = status.assessments.filter(a => a.status === "completed" && a.score);
        if (completedAssessments.length === 0) return 0;
        
        const totalScore = completedAssessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0);
        return Math.round(totalScore / completedAssessments.length);
    };

    const handleGenerateReport = async () => {
        if (Object.keys(results).length === 0) {
            toast({
                title: "Cannot Generate Report",
                description: "No assessment results found. Please complete at least one assessment first.",
                variant: "destructive",
            });
            return;
        }
        
        setGeneratingReport(true);
        try {
            const mainReport = await generateDeepResearchReport(
                // Directly pass filtered results of completed assessments
                Object.entries(results).map(([type, result]) => ({
                    type,
                    result,
                }))
            );
            
            if (mainReport && mainReport.trim()) {
                // Save the report to localStorage, might be more appropriate to save to backend
                localStorage.setItem('strategic_report', mainReport);
                
                // Navigate to the report page
                router.push('/dashboard/report');
            } else {
                throw new Error("Report generation failed");
            }
        } catch (error) {
            console.error("Error generating report:", error);
            toast({
                title: "Report Generation Failed",
                description: "There was an error generating your report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setGeneratingReport(false);
        }
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

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}</h1>
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
                    <TabsTrigger value="companies">
                        {user?.role === 'admin' ? 'All Companies' : 'My Companies'}
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                    {/* Overall stats cards */}
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
                                    <div className="text-3xl font-bold">
                                        {Object.values(assessmentStatuses).reduce((total, status) => 
                                            total + status.assessments.filter(a => a.status === "completed").length, 0)}
                                    </div>
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
                                    <div className="text-3xl font-bold">
                                        {calculateOverallReadiness()}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {Object.keys(results).length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Assessment results chart */}
                            <Card className="col-span-1 lg:col-span-2">
                                    <CardHeader>
                                    <CardTitle>Assessment Results Overview</CardTitle>
                                        <CardDescription>
                                        Readiness scores across different assessment areas
                                        </CardDescription>
                                    </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                data={overallData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                                                >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="name"
                                                    tick={{ fontSize: 12 }}
                                                    angle={-45}
                                                        textAnchor="end"
                                                        height={60}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                    tick={{ fontSize: 12 }}
                                                    label={{
                                                        value: 'Score (%)',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        style: { textAnchor: 'middle' }
                                                    }}
                                                    />
                                                    <Tooltip
                                                    formatter={(value) => [`${value}%`, 'Score']}
                                                    labelFormatter={(label) => `${label} Assessment`}
                                                />
                                                <Bar
                                                    dataKey="score"
                                                    fill="hsl(var(--primary))"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                <CardFooter className="flex justify-between pt-0">
                                    <div className="text-xs text-muted-foreground">
                                        Based on your completed assessments
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleGenerateReport}
                                        disabled={generatingReport}
                                    >
                                        {generatingReport ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {reportGenerationMessage}
                                            </>
                                        ) : (
                                            "Generate Strategic Report"
                                        )}
                                    </Button>
                                </CardFooter>
                                </Card>

                            {/* Key Insights */}
                                <Card>
                                    <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <Target className="h-5 w-5 mr-2 text-primary" />
                                        Key Insights
                                    </CardTitle>
                                    </CardHeader>
                                <CardContent className="space-y-4">
                                    {getStrongestArea() && (
                                        <div className="flex items-start">
                                            <div className="bg-green-50 p-2 rounded-full mr-3">
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Strongest Area</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {getStrongestArea()} ({results[getStrongestArea()!]?.overallScore}%)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {getWeakestArea() && (
                                        <div className="flex items-start">
                                            <div className="bg-amber-50 p-2 rounded-full mr-3">
                                                <TrendingDown className="h-5 w-5 text-amber-600" />
                                                    </div>
                                            <div>
                                                <h3 className="font-medium">Area for Improvement</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {getWeakestArea()} ({results[getWeakestArea()!]?.overallScore}%)
                                                    </p>
                                                </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start">
                                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                                            <Info className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Your Readiness Level</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {getScoreLabel(calculateOverallReadiness())}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assessment Levels */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <BarChart4 className="h-5 w-5 mr-2 text-primary" />
                                        Assessment Levels
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AssessmentLevelsVisual 
                                        overallScore={calculateOverallReadiness()} 
                                        className="max-w-md mx-auto" 
                                    />
                                    </CardContent>
                                </Card>
                            </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Assessments Completed Yet</CardTitle>
                                <CardDescription>
                                    Complete assessments to see your results and insights.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center py-6">
                                <Button onClick={() => setActiveTab("companies")}>
                                    {user?.role === 'admin' ? 'View Companies' : 'Start Assessments'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                        </TabsContent>

                <TabsContent value="companies" className="space-y-6">
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
                                {user?.role === 'admin' && (
                                    <Button onClick={() => router.push('/admin/companies/add')}>
                                        Add New Company
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companies.map((company) => {
                                const companyId = company.id || "";
                                const status = assessmentStatuses[companyId];
                                const completionPercentage = getCompanyCompletionPercentage(companyId);
                                const overallScore = getCompanyOverallScore(companyId);

                                    return (
                                    <Card key={companyId} className="hover:shadow-md transition-all">
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
                                                            {status.assessments.filter(a => a.status === "completed").length}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">Completed</span>
                                                                </div>
                                                    <div className="flex flex-col items-center">
                                                        <Badge variant="secondary" className="mb-1">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {status.assessments.filter(a => a.status === "in-progress").length}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">In Progress</span>
                                                            </div>
                                                    <div className="flex flex-col items-center">
                                                        <Badge variant="outline" className="mb-1">
                                                            <XCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                                                            {status.assessments.filter(a => a.status === "not-started").length}
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
                                                onClick={() => handleViewCompany(companyId)}
                                            >
                                                View Details
                                            </Button>
                                            
                                            {user?.role === 'admin' ? (
                                                <Button 
                                                    variant="default"
                                                    onClick={() => router.push(`/admin/companies/${companyId}/assessments`)}
                                                >
                                                    Manage Assessments
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        // Find the assessment type for this user based on role
                                                        const assessmentType = user?.role ? ROLE_TO_PILLAR[user.role] : null;
                                                        if (assessmentType) {
                                                            handleStartAssessment(assessmentType, companyId);
                                                        }
                                                    }}
                                                >
                                                    Start Assessment
                                                </Button>
                                            )}
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                        </div>
                    )}
                        </TabsContent>
                    </Tabs>
        </div>
    );
}
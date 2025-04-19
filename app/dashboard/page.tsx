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
import { Separator } from "@/components/ui/separator"; // Keep if used, currently not
import { Progress } from "@/components/ui/progress"; // Import Shadcn Progress
import {
    ArrowRight,
    BarChart4,
    Brain,
    Database,
    FileText,
    Layers,
    Loader2,
    Search, // Keep for icon, animation changed
    Shield,
    Users,
    TrendingUp, // Added for overview
    CheckCircle, // Added for completed
    TrendingDown, // Added for improvement area
    Target,      // Added for strongest area
    Info, // Added for insights
    BarChart2,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    // Legend, // Likely not needed with single color bar
    // LineChart, // Not used
    // Line // Not used
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateDeepResearchReport } from "@/lib/openai"; // Assuming this function exists and works
import { AssessmentLevelsVisual } from "@/components/assessment-levels-visual"; // Assuming this exists
import { ProtectedRoute } from "@/components/protected-route"; // Assuming this exists
import { useAuth, ROLE_TO_PILLAR } from "@/lib/auth-context"; // Assuming this exists
import { cn } from "@/lib/utils"; // Import cn utility
import React from "react";

// --- Interfaces (Keep As Is) ---
interface AssessmentResult {
    assessmentType: string;
    categoryScores: Record<string, number>;
    qValues: Record<string, number>; // Assuming these are used by generateDeepResearchReport
    softmaxWeights: Record<string, number>; // Assuming these are used by generateDeepResearchReport
    overallScore: number;
}

// --- Assessment Type Configuration (Simplified) ---
// Removed color properties, icons will inherit color or use semantic colors
const assessmentTypes = [
    { id: "AI Governance", title: "AI Governance", icon: Shield },
    { id: "AI Culture", title: "AI Culture", icon: Users },
    { id: "AI Infrastructure", title: "AI Infrastructure", icon: Layers },
    { id: "AI Strategy", title: "AI Strategy", icon: BarChart4 },
    { id: "AI Data", title: "AI Data", icon: Database },
    { id: "AI Talent", title: "AI Talent", icon: Brain },
    { id: "AI Security", title: "AI Security", icon: Shield }, // Consider a different icon if Governance uses Shield
];

// --- Dashboard Page Wrapper ---
export default function DashboardPage() {
    // Wrap the existing content with ProtectedRoute
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}

// --- Main Dashboard Content ---
function DashboardContent() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth(); // Use auth context
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<Record<string, AssessmentResult>>({});
    const [overallData, setOverallData] = useState<{ name: string; score: number }[]>([]); // Simplified data structure
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportGenerationMessage, setReportGenerationMessage] = useState("Generating report...");

    // Filter assessment types based on user role
    const filteredAssessmentTypes = React.useMemo(() => {
        return assessmentTypes.filter(type => {
            // Admin can see all assessment types
            if (user?.role === "admin") return true;
            
            // Other users can only see their assigned assessment type
            return user?.role ? ROLE_TO_PILLAR[user.role] === type.title : false;
        });
    }, [user?.role]); // Only recompute when user role changes

    // --- Data Loading Effect ---
    useEffect(() => {
        console.log("Loading dashboard data");
        const loadedResults: Record<string, AssessmentResult> = {};
        let hasResults = false;

        // Debug: check what keys exist in localStorage
        console.log("Available localStorage keys:", Object.keys(localStorage).filter(key => 
            key.startsWith('assessment_result_')));

        // Only load results for assessment types that the user can see
        filteredAssessmentTypes.forEach(type => {
            const storageKey = `assessment_result_${type.id}`;
            console.log(`Checking for assessment result: ${storageKey}`);
            
            const storedResult = localStorage.getItem(storageKey);
            if (storedResult) {
                try {
                    const parsedResult = JSON.parse(storedResult);
                    console.log(`Found result for ${type.id}:`, parsedResult);
                    loadedResults[type.id] = parsedResult;
                    hasResults = true;
                } catch (error) {
                    console.error(`Error parsing stored result for ${type.id}:`, error);
                    // Optionally show a toast for corrupted data
                }
            } else {
                console.log(`No result found for ${type.id}`);
            }
        });

        // Additional check - look for any assessment results
        if (!hasResults) {
            console.log("No filtered assessment results found, checking for any assessment results");
            const allStorageKeys = Object.keys(localStorage);
            const assessmentResultKeys = allStorageKeys.filter(key => key.startsWith('assessment_result_'));
            
            if (assessmentResultKeys.length > 0) {
                console.log("Found some assessment results not in the filtered types");
                assessmentResultKeys.forEach(key => {
                    try {
                        const assessmentType = key.replace('assessment_result_', '');
                        const result = JSON.parse(localStorage.getItem(key) || '{}');
                        console.log(`Found result for ${assessmentType}:`, result);
                        loadedResults[assessmentType] = result;
                        hasResults = true;
                    } catch (error) {
                        console.error(`Error parsing result from ${key}:`, error);
                    }
                });
            }
        }

        if (hasResults) {
            console.log("Setting loaded results:", loadedResults);
            setResults(loadedResults);
            
            // Prepare overall data for bar chart
            const overallScores = Object.entries(loadedResults).map(([type, result]) => {
                // Make sure to handle null/undefined values safely
                const score = typeof result.overallScore === 'number' ? 
                    Math.round(result.overallScore * 100) / 100 : 0;
                
                return {
                    name: type, // Use assessment type name
                    score: score // Use a number between 0-100
                };
            }).filter(item => item.score > 0);
            
            console.log("Prepared chart data:", overallScores);
            setOverallData(overallScores);
        } else {
            console.log("No assessment results found");
        }
        setLoading(false);
    }, [filteredAssessmentTypes]); // Dependency is now a memoized value

    // --- Report Generation Animation Effect (Simplified) ---
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
            setReportGenerationMessage(messages[0]); // Start with the first message
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setReportGenerationMessage(messages[messageIndex]);
            }, 2500); // Change message every 2.5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [generatingReport]);

    // --- Helper Functions ---
    const getScoreLabel = (score: number): string => {
        if (score <= 30) return "Needs Significant Improvement";
        if (score <= 60) return "Developing Foundational Capability";
        if (score <= 85) return "Established & Maturing";
        return "Advanced & Well-Positioned";
    };

    const calculateOverallReadiness = (): number => {
        const validResults = Object.values(results).filter(r => r && typeof r.overallScore === 'number');
        if (validResults.length === 0) return 0;
        const sum = validResults.reduce((acc, result) => acc + result.overallScore, 0);
        return Math.round(sum / validResults.length);
    };

    const getStrongestArea = (): string | null => {
        const validResults = Object.entries(results).filter(([, r]) => r && typeof r.overallScore === 'number');
        if (validResults.length === 0) return null;
        return validResults.reduce((max, [type, result]) =>
            result.overallScore > (results[max]?.overallScore ?? -1) ? type : max,
            validResults[0][0] // Start with the first valid key
        );
    };

    const getWeakestArea = (): string | null => {
        const validResults = Object.entries(results).filter(([, r]) => r && typeof r.overallScore === 'number');
        if (validResults.length === 0) return null;
        return validResults.reduce((min, [type, result]) =>
            result.overallScore < (results[min]?.overallScore ?? 101) ? type : min,
            validResults[0][0] // Start with the first valid key
        );
    };

    const completedAssessments = Object.keys(results).length;
    const totalAssessments = filteredAssessmentTypes.length;
    const overallReadiness = calculateOverallReadiness();
    const strongestArea = getStrongestArea();
    const weakestArea = getWeakestArea();

    // --- Report Generation Handler ---
    const handleGenerateReport = async () => {
        if (completedAssessments === 0) {
            toast({
                title: "No Assessment Data",
                description: "Complete at least one assessment before generating a report.",
                variant: "destructive",
            });
            return;
        }

        setGeneratingReport(true);
        toast({
            title: "Generating Deep Research Report",
            description: "This may take a moment. Please wait...",
        });

        try {
            // Assuming generateDeepResearchReport needs the results object
            const reportHtml = await generateDeepResearchReport(results);

            const blob = new Blob([reportHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AI_Readiness_DeepResearch_Report_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Report Ready",
                description: "Your Deep Research Report has been downloaded.",
            });
        } catch (error) {
            console.error("Error generating report:", error);
            toast({
                title: "Report Generation Failed",
                description: "Could not generate the report. Check console or try again.",
                variant: "destructive",
            });
        } finally {
            setGeneratingReport(false);
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // --- Render Dashboard UI ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Readiness Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and analyze your organization's AI readiness across key dimensions.
                    </p>
                    {user && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {/* Display user role or pillar */}
                            {user.role === 'admin' ? 'Administrator View' : `Viewing as ${ROLE_TO_PILLAR[user.role] || 'User'}`}
                        </p>
                    )}
                </div>

                {/* Generate Report Button - Only show if assessments are done */}
                {completedAssessments > 0 && (
                    <Button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        size="lg" // Make button prominent
                        className="min-w-[260px] transition-all duration-300 ease-in-out" // Ensure min-width
                    >
                        {generatingReport ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-semibold leading-tight">Generating...</span>
                                    {/* Animate message change smoothly */}
                                    <span key={reportGenerationMessage} className="text-xs opacity-80 animate-in fade-in duration-500 leading-tight">
                                        {reportGenerationMessage}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <FileText className="h-5 w-5" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-semibold leading-tight">Generate Full Report</span>
                                    <span className="text-xs opacity-80 leading-tight">Deep analysis & recommendations</span>
                                </div>
                            </div>
                        )}
                    </Button>
                )}
            </div>

            {/* Content Area - Conditional Rendering */}
            {completedAssessments === 0 ? (
                // Empty State Card
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="pt-10 pb-10 text-center">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h2 className="text-xl font-semibold mb-2 text-foreground">Get Started with Assessments</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Complete your first AI readiness assessment to unlock insights and visualize your progress on this dashboard.
                        </p>
                        <Button onClick={() => router.push("/")}> {/* Adjust route if needed */}
                            Start First Assessment
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                // Dashboard Content (when assessments exist)
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overall Readiness</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overallReadiness}%</div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {getScoreLabel(overallReadiness)}
                                </p>
                                <Progress value={overallReadiness} className="h-2 mt-4" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Assessments Done</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{completedAssessments}/{totalAssessments}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {completedAssessments === totalAssessments
                                        ? "All areas assessed"
                                        : `${totalAssessments - completedAssessments} remaining`}
                                </p>
                                <Progress value={(completedAssessments / totalAssessments) * 100} className="h-2 mt-4" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Strongest Area</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {strongestArea ? (
                                    <>
                                        <div className="text-lg font-semibold truncate">{strongestArea}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Score: {Math.round(results[strongestArea]?.overallScore ?? 0)}%
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {weakestArea ? (
                                    <>
                                        <div className="text-lg font-semibold truncate">{weakestArea}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Score: {Math.round(results[weakestArea]?.overallScore ?? 0)}%
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Overview and Details */}
                    <Tabs defaultValue="overview">
                        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="details">Assessment Details</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab Content */}
                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Bar Chart Card */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Assessment Scores Overview</CardTitle>
                                        <CardDescription>
                                            Comparison across completed assessment areas.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4 pl-0 pr-2 pb-4"> {/* Adjusted padding for chart */}
                                        <div className="h-[400px] w-full">
                                            {overallData.length > 0 ? (
                                                <div className="h-full flex">
                                                    {/* Y-axis markers */}
                                                    <div className="w-12 h-full flex flex-col justify-between pr-2 pb-16">
                                                        <div className="text-xs text-muted-foreground">100%</div>
                                                        <div className="text-xs text-muted-foreground">75%</div>
                                                        <div className="text-xs text-muted-foreground">50%</div>
                                                        <div className="text-xs text-muted-foreground">25%</div>
                                                        <div className="text-xs text-muted-foreground">0%</div>
                                                    </div>
                                                    
                                                    {/* Chart content */}
                                                    <div className="flex-1 flex flex-col">
                                                        {/* Grid lines */}
                                                        <div className="flex-1 relative">
                                                            <div className="absolute w-full h-[1px] bg-gray-200 top-0"></div>
                                                            <div className="absolute w-full h-[1px] bg-gray-200 top-1/4"></div>
                                                            <div className="absolute w-full h-[1px] bg-gray-200 top-1/2"></div>
                                                            <div className="absolute w-full h-[1px] bg-gray-200 top-3/4"></div>
                                                            <div className="absolute w-full h-[1px] bg-gray-200 bottom-0"></div>
                                                            
                                                            {/* Bars */}
                                                            <div className="h-full flex items-end justify-around gap-6 pb-16 px-4">
                                                                {overallData.map((item, index) => {
                                                                    // Choose a color based on the index
                                                                    const colors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500", "bg-rose-500", "bg-red-500"];
                                                                    const barColor = colors[index % colors.length];
                                                                    
                                                                    return (
                                                                        <div key={item.name} className="flex flex-col items-center w-full max-w-[150px]">
                                                                            <div className="w-full flex flex-col items-center">
                                                                                <div 
                                                                                    className={`w-[80px] ${barColor} rounded-t-sm transition-all duration-500 shadow-md`}
                                                                                    style={{ 
                                                                                        height: `${Math.min(item.score, 100) * 2.5}px`,
                                                                                        maxHeight: '250px'
                                                                                    }}
                                                                                ></div>
                                                                                <div className="text-sm font-medium mt-2">{item.score}%</div>
                                                                                <div 
                                                                                    className="mt-2 text-sm font-medium text-center" 
                                                                                    style={{ 
                                                                                        transform: 'rotate(-45deg)',
                                                                                        transformOrigin: 'top left',
                                                                                        width: '120px', 
                                                                                        position: 'relative',
                                                                                        left: '30px',
                                                                                        top: '30px'
                                                                                    }}
                                                                                >
                                                                                    {item.name}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="h-[1px] bg-gray-200 mx-4"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <BarChart2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                                    <p className="text-muted-foreground text-center">No assessment data to display</p>
                                                    <p className="text-sm text-muted-foreground/80 text-center mt-1">
                                                        Complete assessments to see comparison chart
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Improvement Priorities Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Improvement Priorities</CardTitle>
                                        <CardDescription>
                                            Top 3 areas needing the most focus based on scores.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-5">
                                        {overallData
                                            .sort((a, b) => a.score - b.score) // Sort lowest first
                                            .slice(0, 3) // Take top 3 lowest
                                            .map((item, index) => (
                                                <div key={item.name}>
                                                    <div className="flex justify-between items-center mb-1 text-sm">
                                                        <span className="font-medium truncate pr-2">{item.name}</span>
                                                        <span className="font-semibold text-foreground">{item.score}%</span>
                                                    </div>
                                                    <Progress value={item.score} className="h-2" />
                                                    <p className="text-xs text-muted-foreground mt-1.5">
                                                        Priority: {index === 0 ? "Highest" : index === 1 ? "Medium" : "Lower"}
                                                    </p>
                                                </div>
                                            ))}
                                        {overallData.length === 0 && (
                                             <p className="text-sm text-muted-foreground">No completed assessments to prioritize.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                             {/* Optional: Add AssessmentLevelsVisual here if desired for overall score */}
                             {/* <AssessmentLevelsVisual overallScore={overallReadiness} /> */}
                        </TabsContent>

                        {/* Details Tab Content */}
                        <TabsContent value="details" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredAssessmentTypes.map((type) => {
                                    const result = results[type.id];
                                    if (!result) return null; // Skip if no result for this type

                                    const typeStrongestCategory = Object.entries(result.categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0];
                                    const typeWeakestCategory = Object.entries(result.categoryScores).sort((a, b) => a[1] - b[1])[0]?.[0];

                                    return (
                                        <Card key={type.id}>
                                            <CardHeader>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <type.icon className="h-5 w-5 text-primary" />
                                                    <CardTitle className="text-lg">{type.title}</CardTitle>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <CardDescription>Overall Score</CardDescription>
                                                    <span className="text-lg font-semibold">{Math.round(result.overallScore)}%</span>
                                                </div>
                                                <Progress value={result.overallScore} className="h-2 mt-2" />
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Category Scores Section */}
                                                <div>
                                                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Category Scores</h3>
                                                    <div className="space-y-3">
                                                        {Object.entries(result.categoryScores)
                                                            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort highest first
                                                            .map(([category, score]) => (
                                                            <div key={category}>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-sm truncate pr-2">{category}</span>
                                                                    <span className="text-sm font-medium">{Math.round(score)}%</span>
                                                                </div>
                                                                <Progress value={score} className="h-1.5" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Key Insights Section */}
                                                <div className="bg-muted/50 p-4 rounded-lg">
                                                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Key Insights</h3>
                                                    <ul className="space-y-2.5 text-sm text-foreground/90">
                                                        <li className="flex items-start gap-2.5">
                                                            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                            <span>
                                                                {getScoreLabel(result.overallScore)} in {type.title}.
                                                            </span>
                                                        </li>
                                                        {typeStrongestCategory && (
                                                            <li className="flex items-start gap-2.5">
                                                                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span>
                                                                    Strongest category: <strong>{typeStrongestCategory}</strong> ({Math.round(result.categoryScores[typeStrongestCategory])}%)
                                                                </span>
                                                            </li>
                                                        )}
                                                         {typeWeakestCategory && (
                                                            <li className="flex items-start gap-2.5">
                                                                <TrendingDown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                                <span>
                                                                    Needs most focus: <strong>{typeWeakestCategory}</strong> ({Math.round(result.categoryScores[typeWeakestCategory])}%)
                                                                </span>
                                                            </li>
                                                         )}
                                                    </ul>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    variant="outline" // Use outline for less emphasis than primary actions
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => router.push(`/results/${encodeURIComponent(type.id)}`)}
                                                >
                                                    View Full Details for {type.title}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                                {/* Message if no results exist - should not happen if parent check works, but good fallback */}
                                {completedAssessments === 0 && (
                                     <p className="text-center py-8 text-muted-foreground md:col-span-2">
                                        Complete assessments to see detailed breakdowns here.
                                    </p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
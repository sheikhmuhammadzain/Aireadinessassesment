"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, BarChart4, Brain, Database, Download, FileText, Layers, Loader2, Search, Shield, Users } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateDeepResearchReport } from "@/lib/openai";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
}

// Light blue color palette
const BLUE_COLORS = [
  '#E0F7FF', // Lightest blue
  '#C2EAFF', // Very light blue
  '#A5DBFF', // Light blue
  '#8ECAE6', // Medium light blue
  '#73BFDC', // Medium blue
  '#5BA3C6', // Blue
  '#4389B0', // Deeper blue
  '#2C6F9B', // Rich blue
  '#1A5785', // Deep blue
  '#0A4570', // Darkest blue
];

const assessmentTypes = [
  {
    id: "AI Governance",
    title: "AI Governance",
    icon: Shield,
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "AI Culture",
    title: "AI Culture",
    icon: Users,
    color: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    id: "AI Infrastructure",
    title: "AI Infrastructure",
    icon: Layers,
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "AI Strategy",
    title: "AI Strategy",
    icon: BarChart4,
    color: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    id: "AI Data",
    title: "AI Data",
    icon: Database,
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "AI Talent",
    title: "AI Talent",
    icon: Brain,
    color: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    id: "AI Security",
    title: "AI Security",
    icon: Shield,
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, AssessmentResult>>({});
  const [overallData, setOverallData] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [searchAnimationStep, setSearchAnimationStep] = useState(0);
  const searchMessages = [
    "Analyzing assessment data...",
    "Scanning industry benchmarks...",
    "Identifying improvement opportunities...",
    "Formulating strategic recommendations...",
    "Preparing comprehensive report..."
  ];
  
  useEffect(() => {
    // Load all assessment results from localStorage
    const loadedResults: Record<string, AssessmentResult> = {};
    let hasResults = false;
    
    for (const type of assessmentTypes) {
      const storedResult = localStorage.getItem(`assessment_result_${type.id}`);
      if (storedResult) {
        try {
          loadedResults[type.id] = JSON.parse(storedResult);
          hasResults = true;
        } catch (error) {
          console.error(`Error parsing stored result for ${type.id}:`, error);
        }
      }
    }
    
    if (hasResults) {
      setResults(loadedResults);
      
      // Prepare overall data for bar chart
      const overallScores = assessmentTypes.map((type, index) => ({
        name: type.id,
        score: loadedResults[type.id]?.overallScore || 0,
        fill: BLUE_COLORS[index % BLUE_COLORS.length]
      }));
      setOverallData(overallScores);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Animation interval for report generation
    let interval: NodeJS.Timeout;
    
    if (generatingReport) {
      interval = setInterval(() => {
        setSearchAnimationStep(prev => (prev + 1) % searchMessages.length);
      }, 1500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generatingReport, searchMessages.length]);

  const getColorForScore = (score: number) => {
    if (score < 30) return BLUE_COLORS[3]; // Light blue
    if (score < 60) return BLUE_COLORS[5]; // Medium blue
    if (score < 80) return BLUE_COLORS[7]; // Rich blue
    return BLUE_COLORS[9]; // Darkest blue
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return "Needs Significant Improvement";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Advanced";
  };

  const calculateOverallReadiness = () => {
    if (Object.keys(results).length === 0) return 0;
    
    const sum = Object.values(results).reduce((acc, result) => acc + result.overallScore, 0);
    return Math.round(sum / Object.keys(results).length);
  };

  const completedAssessments = Object.keys(results).length;
  const overallReadiness = calculateOverallReadiness();

  const handleGenerateReport = async () => {
    if (Object.keys(results).length === 0) {
      toast({
        title: "No Assessment Data",
        description: "Complete at least one assessment before generating a report.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingReport(true);
    setSearchAnimationStep(0);
    
    toast({
      title: "Generating Report",
      description: "Please wait while we analyze your assessment data...",
    });

    try {
      // Generate the report HTML
      const reportHtml = await generateDeepResearchReport(results);
      
      // Create a blob from the HTML
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Readiness_DeepResearch_Report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Ready",
        description: "Your Deep Research Report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Readiness Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze your organization's AI readiness across multiple dimensions
          </p>
        </div>
        
        {completedAssessments > 0 && (
          <Button 
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className={`relative bg-gradient-to-r ${
              generatingReport 
              ? "from-blue-400 to-blue-600" 
              : "from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            }`}
            size="lg"
          >
            {generatingReport ? (
              <>
                <div className="mr-2 flex items-center">
                  <div className="relative w-5 h-5">
                    <Search className="h-5 w-5 absolute animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 w-8 h-8 -ml-4 -mt-4 border-2 border-blue-300 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">Deep AI Research</span>
                  <span className="text-xs opacity-90">{searchMessages[searchAnimationStep]}</span>
                </div>
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Detailed Report
              </>
            )}
          </Button>
        )}
      </div>
      
      {completedAssessments === 0 ? (
        <Card className="mb-8 border shadow-md overflow-hidden">
          <div className="h-1 bg-blue-100"></div>
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No Assessment Data Available</h2>
              <p className="text-muted-foreground mb-6">
                You haven't completed any assessments yet. Complete at least one assessment to see your dashboard.
              </p>
              <Button 
                onClick={() => router.push("/")}
              >
                Start an Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border shadow-md overflow-hidden">
              <div className="h-1 bg-blue-100"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall AI Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{overallReadiness}%</div>
                <p className="text-xs text-muted-foreground">
                  {getScoreLabel(overallReadiness)}
                </p>
                <div className="mt-4 h-2 w-full bg-blue-50 rounded-full">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${overallReadiness}%`,
                      backgroundColor: getColorForScore(overallReadiness)
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border shadow-md overflow-hidden">
              <div className="h-1 bg-blue-100"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Assessments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{completedAssessments}/7</div>
                <p className="text-xs text-muted-foreground">
                  {completedAssessments === 7 ? "All assessments completed" : `${7 - completedAssessments} remaining`}
                </p>
                <div className="mt-4 h-2 w-full bg-blue-50 rounded-full">
                  <div 
                    className="h-2 rounded-full bg-blue-600" 
                    style={{ width: `${(completedAssessments / 7) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border shadow-md overflow-hidden">
              <div className="h-1 bg-blue-100"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Strongest Area
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {Object.keys(results).length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Object.entries(results).reduce((max, [type, result]) => 
                        result.overallScore > (results[max]?.overallScore || 0) ? type : max, 
                        Object.keys(results)[0]
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your organization's best performing area
                    </p>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border shadow-md overflow-hidden">
              <div className="h-1 bg-blue-100"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Area Needing Most Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {Object.keys(results).length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Object.entries(results).reduce((min, [type, result]) => 
                        result.overallScore < (results[min]?.overallScore || 100) ? type : min, 
                        Object.keys(results)[0]
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Focus on improving this area
                    </p>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Assessment Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border shadow-md overflow-hidden">
                  <div className="h-1 bg-blue-100"></div>
                  <CardHeader>
                    <CardTitle>Overall Assessment Scores</CardTitle>
                    <CardDescription>
                      Comparison of your scores across all assessment areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overallData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f7ff" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 12, fill: '#5BA3C6' }}
                          />
                          <YAxis domain={[0, 100]} tick={{ fill: '#5BA3C6' }} />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Score']}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
                              border: 'none' 
                            }}
                          />
                          <Bar dataKey="score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border shadow-md overflow-hidden">
                  <div className="h-1 bg-blue-100"></div>
                  <CardHeader>
                    <CardTitle>Improvement Priorities</CardTitle>
                    <CardDescription>
                      Focus areas based on assessment scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {overallData
                        .sort((a, b) => a.score - b.score)
                        .slice(0, 3)
                        .map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm font-medium">{item.score}%</span>
                            </div>
                            <div className="w-full bg-blue-50 rounded-full h-2.5">
                              <div 
                                className="h-2.5 rounded-full" 
                                style={{ width: `${item.score}%`, backgroundColor: BLUE_COLORS[7 - index * 2] }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {item.score < 30 ? "Critical priority" : 
                               item.score < 60 ? "High priority" : "Medium priority"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {assessmentTypes.map((type, typeIndex) => {
                  const result = results[type.id];
                  const hasResult = !!result;
                  
                  if (!hasResult) return null;
                  
                  return (
                    <Card key={type.id} className="border shadow-md overflow-hidden">
                      <div className="h-1 bg-blue-100"></div>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <type.icon className={`h-6 w-6 ${type.textColor}`} />
                          <CardTitle>{type.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Overall Score</span>
                            <span className="font-medium">{Math.round(result.overallScore)}%</span>
                          </div>
                          <div className="w-full bg-blue-50 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${result.overallScore}%`,
                                backgroundColor: getColorForScore(result.overallScore)
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium mb-4">Category Scores</h3>
                            <div className="space-y-4">
                              {Object.entries(result.categoryScores).map(([category, score], idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm">{category}</span>
                                    <span className="text-xs font-medium">{Math.round(score)}%</span>
                                  </div>
                                  <div className="w-full bg-blue-50 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full" 
                                      style={{ 
                                        width: `${score}%`,
                                        backgroundColor: BLUE_COLORS[(idx * 2) % BLUE_COLORS.length]
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-blue-50/50 p-6 rounded-lg">
                            <h3 className="text-sm font-medium mb-4">Key Insights</h3>
                            <ul className="space-y-3 text-sm">
                              <li className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500 w-2 h-2 mt-1.5"></div>
                                <span>
                                  {result.overallScore >= 80 ? 
                                    "Your organization demonstrates advanced capabilities in this area" : 
                                    result.overallScore >= 60 ? 
                                    "Your organization has established good foundations in this area" :
                                    result.overallScore >= 30 ?
                                    "Your organization is developing capabilities in this area" :
                                    "This area requires significant improvement"}
                                </span>
                              </li>
                              <li className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500 w-2 h-2 mt-1.5"></div>
                                <span>
                                  {Object.entries(result.categoryScores).sort((a, b) => b[1] - a[1])[0][0]} is your strongest category
                                </span>
                              </li>
                              <li className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-500 w-2 h-2 mt-1.5"></div>
                                <span>
                                  {Object.entries(result.categoryScores).sort((a, b) => a[1] - b[1])[0][0]} needs the most improvement
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => router.push(`/results/${encodeURIComponent(type.id)}`)}
                        >
                          View Detailed Results
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
                
                {Object.keys(results).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No assessment data available. Complete at least one assessment to see details.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
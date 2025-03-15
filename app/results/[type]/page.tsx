"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Home, Loader2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIRecommendations } from "@/components/ai-recommendations";
import { AIGapAnalysis } from "@/components/ai-gap-analysis";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AssessmentLevelsVisual } from "@/components/assessment-levels-visual";
import { AssessmentRecommendations } from "@/components/assessment-recommendations";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  userWeights: Record<string, number>;
  qValues: Record<string, number>;
  adjustedWeights: Record<string, number>;
  overallScore: number;
  answers?: {
    category: string;
    question: string;
    weight: number;
    options: { label: string; value: number }[];
    selectedOption: string;
    score: number;
    comment?: string;
  }[];
}

interface GapAnalysis {
  category: string;
  score: number;
  weight: number;
  gap: number;
  impact: number;
  priority: 'High' | 'Medium' | 'Low';
}

// Premium color palette - light blue shades only
const PREMIUM_COLORS = [
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

// Helper function to get consistent colors, and handle edge cases.
const getColor = (index: number) => {
  return PREMIUM_COLORS[index % PREMIUM_COLORS.length];
};

// Add this helper function after the getColor function and before the ResultsPage component
const getColorForScore = (score: number): string => {
  if (score <= 30) return "#73BFDC"; // AI Dormant - Light blue
  if (score <= 60) return "#5BA3C6"; // AI Aware - Medium blue
  if (score <= 85) return "#2C6F9B"; // AI Rise - Rich blue
  return "#0A4570"; // AI Ready - Deep blue
};

export default function ResultsPage({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [qValuesData, setQValuesData] = useState<any[]>([]);
  const [weightsComparisonData, setWeightsComparisonData] = useState<any[]>([]);
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysis[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    const storedResult = localStorage.getItem(`assessment_result_${assessmentType}`);

    if (storedResult) {
      try {
        const parsedResult: AssessmentResult = JSON.parse(storedResult);
        setResult(parsedResult);

        // Prepare chart data for category scores
        const chartData = Object.entries(parsedResult.categoryScores).map(([category, score], index) => ({
          category,
          score: Math.round(score * 10) / 10,
          fill: getColor(index)
        }));
        setChartData(chartData);

        // Prepare radar data for category scores
        const radarData = Object.entries(parsedResult.categoryScores).map(([category, score]) => ({
          subject: category,
          A: Math.round(score * 10) / 10,
          fullMark: 100
        }));
        setRadarData(radarData);

        // Prepare data for Q-values
        const qValuesData = Object.entries(parsedResult.qValues).map(([category, qValue], index) => ({
          category,
          qValue: Math.round(qValue * 1000) / 1000,
          fill: getColor(index)
        }));
        setQValuesData(qValuesData);

        // Prepare data for weights comparison (user weights vs adjusted weights)
        const weightsComparisonData = Object.entries(parsedResult.userWeights).map(([category, userWeight], index) => {
          const adjustedWeight = parsedResult.adjustedWeights[category] || 0;
          return {
            category,
            userWeight: Math.round(userWeight * 100) / 100,
            adjustedWeight: Math.round(adjustedWeight * 100) / 100,
            fill: getColor(index)
          };
        });
        setWeightsComparisonData(weightsComparisonData);

        // Prepare gap analysis data
        const gapAnalysis = Object.entries(parsedResult.categoryScores).map(([category, score]) => {
          const weight = parsedResult.userWeights[category] || 0;
          const gap = 100 - score;
          const impact = (gap * weight) / 100;
          
          let priority: 'High' | 'Medium' | 'Low';
          if (impact > 15) priority = 'High';
          else if (impact > 7) priority = 'Medium';
          else priority = 'Low';
          
          return {
            category,
            score,
            weight,
            gap,
            impact,
            priority
          };
        }).sort((a, b) => b.impact - a.impact); // Sort by impact (highest first)
        
        setGapAnalysisData(gapAnalysis);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing stored result:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment results. Please try again.",
          variant: "destructive",
        });
        router.push("/");
      }
    } else {
      toast({
        title: "No Results Found",
        description: "No assessment results found. Please complete the assessment first.",
        variant: "destructive",
      });
      router.push(`/assessment/${encodeURIComponent(assessmentType)}`);
    }
  }, [assessmentType, router, toast]);

  const getScoreLabel = (score: number) => {
    if (score < 30) return "Needs Significant Improvement";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Advanced";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Low': return 'bg-blue-50 text-blue-500 border-blue-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    
    // Create a formatted date for the filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `ai-readiness-assessment-${date}.json`;
    
    // Create a JSON blob with the assessment data
    const reportData = {
      assessmentType: assessmentType,
      date: new Date().toISOString(),
      companyName: localStorage.getItem('companyName') || 'Your Company',
      result: result
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Report downloaded successfully",
      variant: "default",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">Error: Assessment results are unavailable.</p>
        <Button variant="outline" onClick={() => router.push("/")} className="mt-4">
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      <div className="relative mb-12">
        {/* Premium header with gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-lg -z-10"></div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
              {assessmentType === 'quick' ? 'Quick Assessment Results' : 'Comprehensive Assessment Results'}
            </h1>
            <p className="text-muted-foreground">
              Detailed analysis of your AI readiness assessment
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDownloadReport}
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            
            <Button
              variant="default"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
              onClick={() => router.push(`/assessment/${encodeURIComponent(assessmentType)}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Retake Assessment
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full mb-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-blue-50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="maturity" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">Maturity</TabsTrigger>
          <TabsTrigger value="gap-analysis" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">Gap Analysis</TabsTrigger>
          <TabsTrigger value="detailed" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Overall Assessment
                </CardTitle>
                <CardDescription>
                  Your organization's AI readiness score and breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <div
                      className="w-36 h-36 rounded-full flex items-center justify-center mb-4"
                      style={{
                        background: `conic-gradient(${getColorForScore(result.overallScore)} ${result.overallScore / 100 * 360}deg, #e0f7ff 0)`
                      }}
                    >
                      <div className="w-28 h-28 bg-background rounded-full flex items-center justify-center">
                        <div className="text-4xl font-bold">{Math.round(result.overallScore)}%</div>
                      </div>
                    </div>
                    <div className="absolute -right-2 -top-2 bg-white rounded-full p-1 shadow-md">
                      {result.overallScore >= 85 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      ) : result.overallScore >= 60 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M8 15h8"></path>
                          <path d="M9 9h.01"></path>
                          <path d="M15 9h.01"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="8" y1="15" x2="16" y2="15"></line>
                          <line x1="9" y1="9" x2="9.01" y2="9"></line>
                          <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{getScoreLabel(result.overallScore)}</div>
                  <div className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                    {result.overallScore >= 85 ? 
                      "Your organization demonstrates mature AI capabilities and is well-positioned to implement advanced AI initiatives." :
                      result.overallScore >= 60 ?
                      "Your organization has established AI practices but needs further development in key areas." :
                      "Your organization is in the early stages of AI adoption and requires significant improvements across multiple dimensions."
                    }
                  </div>
                </div>

                <div className="space-y-5">
                  {Object.entries(result.categoryScores).map(([category, score], index) => (
                    <div key={category} className="group">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getColor(index) }}
                          ></div>
                          <span className="text-sm font-medium">{category}</span>
                        </div>
                        <span className="text-sm font-medium">{Math.round(score)}%</span>
                      </div>
                      <div className="relative">
                        <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 ease-in-out group-hover:opacity-80"
                            style={{ width: `${score}%`, backgroundColor: getColor(index) }}
                          />
                        </div>
                        <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Badge variant="outline" className="text-xs bg-white shadow-sm">
                            {score < 60 ? "Needs Improvement" : score < 85 ? "Good" : "Excellent"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                  Radar Analysis
                </CardTitle>
                <CardDescription>
                  Visual representation of category scores
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="#e0f7ff" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#5BA3C6', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#5BA3C6' }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#2C6F9B"
                        fill="#2C6F9B"
                        fillOpacity={0.6}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
                          border: 'none' 
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Levels Visual */}
          <div className="mb-8 overflow-hidden rounded-lg border shadow-md">
            <AssessmentLevelsVisual overallScore={result.overallScore} />
          </div>

          {/* Recommendations */}
          <div className="overflow-hidden rounded-lg border shadow-md">
            <AssessmentRecommendations 
              overallScore={result.overallScore} 
              categoryScores={result.categoryScores} 
            />
          </div>
        </TabsContent>

        <TabsContent value="maturity" className="mt-6">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Maturity Assessment</CardTitle>
              <CardDescription>
                Detailed analysis of your organization's AI maturity level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Overall Maturity</h3>
                <div className="flex items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                    style={{
                      background: `conic-gradient(${getColorForScore(result.overallScore)} ${result.overallScore / 100 * 360}deg, #e0f7ff 0)`
                    }}
                  >
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                      <div className="text-lg font-bold">{Math.round(result.overallScore)}%</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {result.overallScore <= 30 ? "AI Dormant" : 
                       result.overallScore <= 60 ? "AI Aware" : 
                       result.overallScore <= 85 ? "AI Rise" : 
                       "AI Ready"}
                    </div>
                    <div className="text-muted-foreground">
                      {result.overallScore <= 30 ? "Early stages of AI adoption" : 
                       result.overallScore <= 60 ? "Beginning AI implementation" : 
                       result.overallScore <= 85 ? "Established AI practices" : 
                       "Mature AI capabilities"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Assessment Levels */}
          <AssessmentLevelsVisual overallScore={result.overallScore} />

          {/* Detailed Recommendations */}
          <AssessmentRecommendations 
            overallScore={result.overallScore} 
            categoryScores={result.categoryScores} 
          />

          {/* Category Maturity Levels */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Category Maturity Levels</CardTitle>
              <CardDescription>
                Breakdown of maturity levels across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(result.categoryScores).map(([category, score]) => {
                  const maturityLevel = score <= 30 ? "AI Dormant" : 
                                       score <= 60 ? "AI Aware" : 
                                       score <= 85 ? "AI Rise" : 
                                       "AI Ready";
                  const maturityColor = score <= 30 ? "#73BFDC" : 
                                       score <= 60 ? "#5BA3C6" : 
                                       score <= 85 ? "#2C6F9B" : 
                                       "#0A4570";
                  const recommendation = score <= 30 ? "Develop a well-defined AI strategy aligned with business goals, secure executive sponsorship, and build foundational AI capabilities." : 
                                        score <= 60 ? "Enhance AI project identification and prioritization frameworks, strengthen budgeting processes, and drive stakeholder engagement through structured change management." : 
                                        score <= 85 ? "Ensure AI investments are strategically aligned with business objectives, establish governance models for AI oversight, and create a robust AI implementation roadmap." : 
                                        "Scale AI-driven initiatives across departments, optimize AI-enhanced workflows, and fully integrate AI into core business decision-making for long-term success.";
                  
                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-lg">{category}</div>
                        <Badge 
                          className="ml-2"
                          style={{ backgroundColor: maturityColor, color: '#000' }}
                        >
                          {maturityLevel}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Score</span>
                          <span className="text-sm font-medium">{Math.round(score)}%</span>
                        </div>
                        <Progress value={score} className="h-2" style={{ backgroundColor: '#f0f0f0' }}>
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${score}%`, backgroundColor: maturityColor }}
                          />
                        </Progress>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Recommendation:</strong> {recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gap-analysis" className="mt-6">
          {result.overallScore >= 85 ? (
            <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-center text-2xl text-blue-700">Congratulations!</CardTitle>
                <CardDescription className="text-center text-lg">
                  Your organization is AI Ready
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6 text-gray-700">
                  <p className="mb-4">
                    With an overall score of <span className="font-bold text-blue-600">{Math.round(result.overallScore)}%</span>, 
                    your organization demonstrates mature AI capabilities and readiness.
                  </p>
                  <p>
                    You've established strong foundations across key AI readiness dimensions. 
                    Your organization is well-positioned to implement and scale AI initiatives 
                    for significant business impact.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-blue-200 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-700">Next Steps for AI Excellence</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-1 flex-shrink-0">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Scale your AI initiatives across all business units</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-1 flex-shrink-0">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Establish AI centers of excellence to drive innovation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-1 flex-shrink-0">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Optimize AI governance and ethics frameworks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-1 flex-shrink-0">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Develop advanced AI talent and leadership capabilities</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 italic">
                    While your organization is AI-ready, continue to monitor and improve in any areas 
                    that scored below 85% to maintain your competitive advantage.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Gap Analysis</CardTitle>
                  <CardDescription>
                    Identify the areas with the largest gaps between current state and desired state
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-muted-foreground mb-4">
                      Gap analysis helps identify the difference between your current AI capabilities and where you need to be. 
                      Categories with higher impact scores require more immediate attention.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">
                              {gapAnalysisData && gapAnalysisData.length > 0 ? gapAnalysisData[0].category : "N/A"}
                            </div>
                            <p className="text-sm text-muted-foreground">Highest Priority</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">
                              {gapAnalysisData && gapAnalysisData.length > 0 ? 
                                Math.round(
                                  gapAnalysisData.reduce((sum, item) => sum + item.gap, 0) / 
                                  gapAnalysisData.length
                                ) : "N/A"
                              }%
                            </div>
                            <p className="text-sm text-muted-foreground">Average Gap</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">
                              {gapAnalysisData && gapAnalysisData.length > 0 ? 
                                Math.round(gapAnalysisData[0].impact) : 
                                "N/A"
                              }
                            </div>
                            <p className="text-sm text-muted-foreground">Highest Impact</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {gapAnalysisData && gapAnalysisData.length > 0 ? (
                      gapAnalysisData.map((item, index) => (
                        <div key={item.category} className="border rounded-lg p-4 transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-lg flex items-center">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                                {index + 1}
                              </span>
                              {item.category}
                            </div>
                            <Badge 
                              variant={index < 3 ? "destructive" : index < 6 ? "warning" : "outline"}
                              className="ml-2"
                            >
                              Priority: {item.priority}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Current Score</div>
                              <div className="text-xl font-medium">{Math.round(item.score)}%</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Weight</div>
                              <div className="text-xl font-medium">{Math.round(item.weight)}%</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Gap</div>
                              <div className="text-xl font-medium">{Math.round(item.gap)}%</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Impact</div>
                              <div className="text-xl font-medium">{Math.round(item.impact)}</div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-muted-foreground">Progress</span>
                              <span className="text-sm font-medium">{Math.round(item.score)}%</span>
                            </div>
                            <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${item.score}%`, 
                                  backgroundColor: getColor(index)
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <strong>Recommendation:</strong> {
                              item.gap > 50 ? 
                                `Significant improvement needed in ${item.category}. Consider prioritizing this area in your AI strategy.` :
                              item.gap > 30 ?
                                `Moderate improvement needed in ${item.category}. Develop specific action plans to address gaps.` :
                                `Minor improvements needed in ${item.category}. Continue to refine and optimize your approach.`
                            }
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        No gap analysis data available.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Gap Analysis */}
              {!loading && result && (
                <AIGapAnalysis
                  categories={chartData}
                  weights={result.userWeights}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
              <CardDescription>
                In-depth breakdown of your assessment responses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.answers && result.answers.length > 0 ? (
                <>
                  <div className="mb-6">
                    <p className="text-muted-foreground">
                      This detailed analysis shows your responses to each question, organized by category. 
                      Use this information to identify specific areas for improvement within each category.
                    </p>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(result.categoryScores).map(([category, score], categoryIndex) => (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: getColor(categoryIndex) }}
                              ></div>
                              <span>{category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="ml-2">
                                Score: {Math.round(score)}%
                              </Badge>
                              <Progress 
                                value={score} 
                                className="w-24 h-2"
                                style={{
                                  backgroundColor: '#f0f0f0',
                                  '& > div': {
                                    backgroundColor: getColor(categoryIndex)
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 mt-2">
                            {result.answers && result.answers
                              .filter(answer => answer.category === category)
                              .map((answer, index) => (
                                <Card key={index} className="border-l-4" style={{ borderLeftColor: getColor(categoryIndex) }}>
                                  <CardContent className="p-4">
                                    <div className="mb-2">
                                      <div className="font-medium">{answer.question}</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        Weight: {answer.weight}%
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {answer.options.map((option, optIndex) => (
                                        <Badge 
                                          key={optIndex}
                                          variant={answer.selectedOption === option.value ? "default" : "outline"}
                                          className={answer.selectedOption === option.value ? "" : "text-muted-foreground"}
                                        >
                                          {option.label} ({option.value})
                                        </Badge>
                                      ))}
                                    </div>
                                    
                                    <div className="mt-3 text-sm">
                                      <div className="font-medium">Score Impact:</div>
                                      <div className="flex items-center mt-1">
                                        <Progress 
                                          value={answer.score} 
                                          max={5} 
                                          className="w-full h-2"
                                          style={{
                                            backgroundColor: '#f0f0f0',
                                            '& > div': {
                                              backgroundColor: getColor(categoryIndex)
                                            }
                                          }}
                                        />
                                        <span className="ml-2 min-w-[40px] text-right">{answer.score}/5</span>
                                      </div>
                                    </div>
                                    
                                    {answer.comment && (
                                      <div className="mt-3 text-sm">
                                        <div className="font-medium">Your Comment:</div>
                                        <div className="p-2 bg-blue-50 rounded mt-1 italic">
                                          "{answer.comment}"
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-3 text-sm">
                                      <div className="font-medium">Recommendation:</div>
                                      <div className="mt-1">
                                        {answer.score <= 2 ? 
                                          `This is a critical area for improvement. Consider developing a specific action plan to address this gap.` :
                                         answer.score <= 3.5 ?
                                          `There is room for improvement in this area. Review best practices and consider incremental enhancements.` :
                                          `You're doing well in this area. Continue to refine and optimize your approach.`
                                        }
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                            ))}
                            {(!result.answers || result.answers.filter(answer => answer.category === category).length === 0) && (
                              <div className="p-4 text-center text-muted-foreground">
                                No detailed answers available for this category.
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 className="text-lg font-medium mb-2">No Detailed Data Available</h3>
                    <p>
                      Detailed question and answer data is not available for this assessment.
                      <br />
                      This may be because you completed a quick assessment or an older version.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => router.push(`/assessment/${encodeURIComponent(assessmentType)}`)}>
                    Take a New Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      {!loading && result && result.overallScore < 85 && (
        <AIRecommendations
          categories={chartData}
          overallScore={result.overallScore}
          categoryScores={result.categoryScores}
          onSummaryGenerated={setAiSummary}
        />
      )}
    </div>
  );
}
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Home, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  Legend
} from "recharts";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
}

export default function ResultsPage({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [qValuesData, setQValuesData] = useState<any[]>([]);
  const [softmaxData, setSoftmaxData] = useState<any[]>([]);

  useEffect(() => {
    // Try to get results from localStorage
    const storedResult = localStorage.getItem(`assessment_result_${assessmentType}`);
    
    if (storedResult) {
      try {
        const parsedResult: AssessmentResult = JSON.parse(storedResult);
        setResult(parsedResult);
        
        // Prepare chart data for category scores
        const chartData = Object.entries(parsedResult.categoryScores).map(([category, score]) => ({
          category,
          score: Math.round(score * 10) / 10,
          fill: getColorForScore(score)
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
        const qValuesData = Object.entries(parsedResult.qValues).map(([category, qValue]) => ({
          category,
          qValue: Math.round(qValue * 1000) / 1000
        }));
        setQValuesData(qValuesData);
        
        // Prepare data for softmax weights (scale to percentage)
        const softmaxData = Object.entries(parsedResult.softmaxWeights).map(([category, weight]) => ({
          category,
          weight: Math.round(weight * 10000) / 100
        }));
        setSoftmaxData(softmaxData);
        
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

  const getColorForScore = (score: number) => {
    if (score < 30) return "#EF4444"; // Red
    if (score < 60) return "#F59E0B"; // Amber
    if (score < 80) return "#10B981"; // Green
    return "#3B82F6"; // Blue
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return "Needs Significant Improvement";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Advanced";
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download Started",
      description: "Your assessment report is being downloaded as PDF.",
    });
    // In a real app, this would generate and download a PDF
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment Results</h1>
          <p className="text-muted-foreground">
            Your organization scored {Math.round(result?.overallScore || 0)}% overall - {getScoreLabel(result?.overallScore || 0)}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Scores</CardTitle>
            <CardDescription>
              Breakdown of your scores across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Bar dataKey="score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>
              Your organization's overall AI readiness
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div 
              className="relative w-48 h-48 rounded-full flex items-center justify-center mb-6"
              style={{ 
                background: `conic-gradient(${getColorForScore(result?.overallScore || 0)} ${(result?.overallScore || 0) / 100 * 360}deg, #e5e7eb 0)` 
              }}
            >
              <div className="absolute w-36 h-36 bg-background rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold">{Math.round(result?.overallScore || 0)}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-lg">{getScoreLabel(result?.overallScore || 0)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {result?.overallScore || 0 < 60 ? 
                  "Your organization needs to improve its AI readiness" : 
                  "Your organization has good AI readiness foundations"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="radar">Radar Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="qvalues">Q-Values & Softmax</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Analysis</CardTitle>
              <CardDescription>
                Breakdown of your scores with strengths and areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {chartData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg">{item.category}</h3>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.fill }}
                        ></div>
                        <span className="font-medium">{item.score}%</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({getScoreLabel(item.score)})
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ width: `${item.score}%`, backgroundColor: item.fill }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Strengths</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.score >= 60 ? 
                            `Your organization demonstrates good capabilities in ${item.category} with a score of ${item.score}%.` : 
                            `Despite challenges, there are opportunities to build on existing ${item.category} foundations.`}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Areas for Improvement</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.score < 80 ? 
                            `Focus on enhancing capabilities in ${item.category} from the current score of ${item.score}%.` : 
                            `Continue to refine and optimize your already strong ${item.category} practices.`}
                        </p>
                      </div>
                    </div>
                    
                    {index < chartData.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="radar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Radar Analysis</CardTitle>
              <CardDescription>
                Visualize your organization's AI readiness across all dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Your Organization"
                      dataKey="A"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Actionable steps to improve your organization's AI readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {chartData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg">{item.category}</h3>
                      <span className="text-sm text-muted-foreground">
                        Current Score: <span className="font-medium">{item.score}%</span>
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {item.score < 30 ? (
                        <>
                          <p className="text-sm">High Priority Recommendations:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Establish a formal {item.category.toLowerCase()} strategy and framework</li>
                            <li>Conduct a comprehensive assessment of current capabilities</li>
                            <li>Develop basic policies and procedures</li>
                            <li>Provide foundational training to key stakeholders</li>
                            <li>Allocate dedicated resources to improvement initiatives</li>
                          </ul>
                        </>
                      ) : item.score < 60 ? (
                        <>
                          <p className="text-sm">Medium Priority Recommendations:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Strengthen existing {item.category.toLowerCase()} practices</li>
                            <li>Formalize processes and documentation</li>
                            <li>Expand training and awareness programs</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">Optimization Recommendations:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Refine and optimize {item.category.toLowerCase()} practices</li>
                            <li>Implement advanced monitoring and measurement</li>
                            <li>Share best practices across the organization</li>
                          </ul>
                        </>
                      )}
                    </div>
                    
                    {index < chartData.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qvalues" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Q‑Values & Softmax Weights</CardTitle>
              <CardDescription>
                View the final Q‑values and the computed softmax weights for each category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Q-Values Chart */}
                <div>
                  <h4 className="font-medium text-lg mb-2">Q‑Values</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={qValuesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value) => value} />
                        <Bar dataKey="qValue" fill="#9333EA" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Softmax Weights Chart */}
                <div>
                  <h4 className="font-medium text-lg mb-2">Softmax Weights (%)</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={softmaxData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="weight" fill="#2563EB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-8">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/assessment/${encodeURIComponent(assessmentType)}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retake Assessment
        </Button>
      </div>
    </div>
  );
}

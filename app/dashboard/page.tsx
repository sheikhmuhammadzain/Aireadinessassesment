"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, BarChart4, Brain, Database, Layers, Loader2, Shield, Users } from "lucide-react";
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
  LineChart,
  Line
} from "recharts";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
}

const assessmentTypes = [
  {
    id: "AI Governance",
    title: "AI Governance",
    icon: Shield,
    color: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "AI Culture",
    title: "AI Culture",
    icon: Users,
    color: "bg-purple-100 dark:bg-purple-900",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  {
    id: "AI Infrastructure",
    title: "AI Infrastructure",
    icon: Layers,
    color: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300",
  },
  {
    id: "AI Strategy",
    title: "AI Strategy",
    icon: BarChart4,
    color: "bg-amber-100 dark:bg-amber-900",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  {
    id: "AI Data",
    title: "AI Data",
    icon: Database,
    color: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-700 dark:text-red-300",
  },
  {
    id: "AI Talent",
    title: "AI Talent",
    icon: Brain,
    color: "bg-indigo-100 dark:bg-indigo-900",
    textColor: "text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "AI Security",
    title: "AI Security",
    icon: Shield,
    color: "bg-indigo-100 dark:bg-indigo-900",
    textColor: "text-indigo-700 dark:text-indigo-300",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, AssessmentResult>>({});
  const [overallData, setOverallData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  
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
      const overallScores = assessmentTypes.map(type => ({
        name: type.id,
        score: loadedResults[type.id]?.overallScore || 0,
        fill: getColorForScore(loadedResults[type.id]?.overallScore || 0)
      }));
      setOverallData(overallScores);
      
      // Prepare radar data
      const radarPoints: Record<string, number> = {};
      for (const type of assessmentTypes) {
        if (loadedResults[type.id]) {
          radarPoints[type.id] = loadedResults[type.id].overallScore;
        }
      }
      
      const formattedRadarData = [radarPoints].map(point => {
        const result: any = { name: "Your Organization" };
        for (const type of assessmentTypes) {
          result[type.id] = point[type.id] || 0;
        }
        return result;
      });
      
      setRadarData(formattedRadarData);
    }
    
    setLoading(false);
  }, []);

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

  const calculateOverallReadiness = () => {
    if (Object.keys(results).length === 0) return 0;
    
    const sum = Object.values(results).reduce((acc, result) => acc + result.overallScore, 0);
    return Math.round(sum / Object.keys(results).length);
  };

  const completedAssessments = Object.keys(results).length;
  const overallReadiness = calculateOverallReadiness();

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Readiness Dashboard</h1>
        <p className="text-muted-foreground">
          Track and analyze your organization's AI readiness across multiple dimensions
        </p>
      </div>
      
      {completedAssessments === 0 ? (
        <Card className="mb-8">
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No Assessment Data Available</h2>
              <p className="text-muted-foreground mb-6">
                You haven't completed any assessments yet. Complete at least one assessment to see your dashboard.
              </p>
              <Button onClick={() => router.push("/")}>
                Start an Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall AI Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallReadiness}%</div>
                <p className="text-xs text-muted-foreground">
                  {getScoreLabel(overallReadiness)}
                </p>
                <div className="mt-4 h-1 w-full bg-secondary">
                  <div 
                    className="h-1" 
                    style={{ 
                      width: `${overallReadiness}%`,
                      backgroundColor: getColorForScore(overallReadiness)
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAssessments}/6</div>
                <p className="text-xs text-muted-foreground">
                  {completedAssessments === 6 ? "All assessments completed" : `${6 - completedAssessments} remaining`}
                </p>
                <div className="mt-4 h-1 w-full bg-secondary">
                  <div 
                    className="h-1 bg-primary" 
                    style={{ width: `${(completedAssessments / 6) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Strongest Area
                </CardTitle>
              </CardHeader>
              <CardContent>
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
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Area Needing Most Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="details">Assessment Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Overall Assessment Scores</CardTitle>
                    <CardDescription>
                      Comparison of your scores across all assessment areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overallData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                          <Bar dataKey="score" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Radar Analysis</CardTitle>
                    <CardDescription>
                      Multi-dimensional view of your AI readiness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          {assessmentTypes.map((type, index) => (
                            <Radar
                              key={type.id}
                              name={type.id}
                              dataKey={type.id}
                              stroke={`hsl(${index * 60}, 70%, 50%)`}
                              fill={`hsl(${index * 60}, 70%, 50%)`}
                              fillOpacity={0.6}
                            />
                          ))}
                          <Legend />
                          <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Improvement Priorities</CardTitle>
                    <CardDescription>
                      Focus areas based on assessment scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overallData
                        .sort((a, b) => a.score - b.score)
                        .slice(0, 3)
                        .map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm">{item.score}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ width: `${item.score}%`, backgroundColor: item.fill }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
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
            
            <TabsContent value="comparison" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Comparison</CardTitle>
                  <CardDescription>
                    Compare your scores across different assessment areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {assessmentTypes.map((type) => {
                      const result = results[type.id];
                      const hasResult = !!result;
                      
                      return (
                        <div key={type.id}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-md ${type.color}`}>
                              <type.icon className={`h-5 w-5 ${type.textColor}`} />
                            </div>
                            <div>
                              <h3 className="font-medium">{type.title}</h3>
                              {hasResult ? (
                                <p className="text-sm text-muted-foreground">
                                  Score: <span className="font-medium">{Math.round(result.overallScore)}%</span> - {getScoreLabel(result.overallScore)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Not assessed yet
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {hasResult ? (
                            <div className="space-y-4">
                              <div className="w-full bg-secondary rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full" 
                                  style={{ 
                                    width: `${result.overallScore}%`,
                                    backgroundColor: getColorForScore(result.overallScore)
                                  }}
                                ></div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(result.categoryScores).slice(0, 3).map(([category, score], idx) => (
                                  <div key={idx} className="bg-secondary/20 p-3 rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium">{category}</span>
                                      <span className="text-xs">{Math.round(score)}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                      <div 
                                        className="h-1.5 rounded-full" 
                                        style={{ 
                                          width: `${score}%`,
                                          backgroundColor: getColorForScore(score)
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/results/${encodeURIComponent(type.id)}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <Button 
                                size="sm"
                                onClick={() => router.push(`/assessment/${encodeURIComponent(type.id)}`)}
                              >
                                Start Assessment
                              </Button>
                            </div>
                          )}
                          
                          <Separator className="my-6" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {assessmentTypes.map((type) => {
                  const result = results[type.id];
                  const hasResult = !!result;
                  
                  if (!hasResult) return null;
                  
                  return (
                    <Card key={type.id}>
                      <CardHeader className={type.color}>
                        <div className="flex items-center gap-3">
                          <type.icon className={`h-6 w-6 ${type.textColor}`} />
                          <CardTitle>{type.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Overall Score</span>
                            <span className="font-medium">{Math.round(result.overallScore)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5">
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
                            <h3 className="text-sm font-medium mb-3">Category Scores</h3>
                            <div className="space-y-3">
                              {Object.entries(result.categoryScores).map(([category, score], idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm">{category}</span>
                                    <span className="text-xs">{Math.round(score)}%</span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-1.5">
                                    <div 
                                      className="h-1.5 rounded-full" 
                                      style={{ 
                                        width: `${score}%`,
                                        backgroundColor: getColorForScore(score)
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-3">Key Insights</h3>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <div className="rounded-full bg-blue-500 w-1.5 h-1.5 mt-1.5"></div>
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
                              <li className="flex items-start gap-2">
                                <div className="rounded-full bg-blue-500 w-1.5 h-1.5 mt-1.5"></div>
                                <span>
                                  {Object.entries(result.categoryScores).sort((a, b) => b[1] - a[1])[0][0]} is your strongest category
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <div className="rounded-full bg-blue-500 w-1.5 h-1.5 mt-1.5"></div>
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
                          variant="outline" 
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
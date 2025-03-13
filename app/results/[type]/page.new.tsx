"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Home, Loader2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIRecommendations } from "@/components/ai-recommendations";
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

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  userWeights: Record<string, number>;
  qValues: Record<string, number>;
  adjustedWeights: Record<string, number>;
  overallScore: number;
}

interface GapAnalysis {
  category: string;
  score: number;
  weight: number;
  gap: number;
  impact: number;
  priority: 'High' | 'Medium' | 'Low';
}

// Premium color palette - lighter, more professional colors
const PREMIUM_COLORS = [
  '#8ECAE6', // Light blue
  '#A8DADC', // Pale cyan
  '#FFB4A2', // Light salmon
  '#E9C46A', // Pale gold
  '#B5E48C', // Light green
  '#CDB4DB', // Lavender
  '#F4A261', // Light orange
  '#90BE6D', // Sage green
  '#F9C74F', // Mellow yellow
  '#A2D2FF', // Sky blue
];

// Helper function to get consistent colors, and handle edge cases.
const getColor = (index: number, length: number) => {
  if (length === 0) {
    return PREMIUM_COLORS[0]; // Default color if no data
  }
  return PREMIUM_COLORS[index % PREMIUM_COLORS.length];
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
          fill: getColor(index, Object.keys(parsedResult.categoryScores).length)
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
          fill: getColor(index, Object.keys(parsedResult.qValues).length)
        }));
        setQValuesData(qValuesData);

        // Prepare data for weights comparison (user weights vs adjusted weights)
        const weightsComparisonData = Object.entries(parsedResult.userWeights).map(([category, userWeight], index) => {
          const adjustedWeight = parsedResult.adjustedWeights[category] || 0;
          return {
            category,
            userWeight: Math.round(userWeight * 100) / 100,
            adjustedWeight: Math.round(adjustedWeight * 100) / 100,
            fill: getColor(index, Object.keys(parsedResult.userWeights).length)
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

  const getColorForScore = (score: number) => {
    if (score < 30) return "#FFB4A2"; // Light red
    if (score < 60) return "#F9C74F"; // Light amber
    if (score < 80) return "#90BE6D"; // Light green
    return "#8ECAE6"; // Light blue
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return "Needs Significant Improvement";
    if (score < 60) return "Developing";
    if (score < 80) return "Established";
    return "Advanced";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment Results</h1>
          <p className="text-muted-foreground whitespace-pre-line">
            {aiSummary || `Your organization scored ${Math.round(result.overallScore)}% overall - ${getScoreLabel(result.overallScore)}`}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="default" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Get Full Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gap-analysis">Gap Analysis</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="category"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                        stroke="#888888"
                      />
                      <YAxis domain={[0, 100]} stroke="#888888" />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Score']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
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
                    background: `conic-gradient(${getColorForScore(result.overallScore)} ${result.overallScore / 100 * 360}deg, #f0f0f0 0)`
                  }}
                >
                  <div className="absolute w-36 h-36 bg-background rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{Math.round(result.overallScore)}%</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-lg">{getScoreLabel(result.overallScore)}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.overallScore < 60 ?
                      "Your organization needs to improve its AI readiness" :
                      "Your organization has good AI readiness foundations"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar Chart */}
          <Card className="mb-8">
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
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="subject" stroke="#888888" />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#888888" />
                    <Radar
                      name="Your Organization"
                      dataKey="A"
                      stroke="#8ECAE6"
                      fill="#8ECAE6"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gap-analysis" className="mt-6">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Gap Analysis & Improvement Priorities
              </CardTitle>
              <CardDescription>
                Identifying the most critical areas for improvement based on current scores and category weights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-center py-3 px-4">Current Score</th>
                      <th className="text-center py-3 px-4">Weight</th>
                      <th className="text-center py-3 px-4">Gap</th>
                      <th className="text-center py-3 px-4">Impact</th>
                      <th className="text-center py-3 px-4">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapAnalysisData.map((item, index) => (
                      <tr key={index} className="border-b border-muted hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{item.category}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span>{item.score.toFixed(1)}%</span>
                            <div className="w-16">
                              <Progress value={item.score} className="h-2" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{item.weight.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-center">{item.gap.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-center">{item.impact.toFixed(1)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={`${getPriorityColor(item.priority)} border`}>
                            {item.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Gap Impact Visualization</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={gapAnalysisData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" domain={[0, 25]} stroke="#888888" />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        width={150}
                        stroke="#888888"
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Impact Score']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {gapAnalysisData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.priority === 'High' ? '#FFB4A2' : entry.priority === 'Medium' ? '#F9C74F' : '#90BE6D'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Improvement Strategy</h3>
                <p className="text-blue-700 mb-4">
                  Focus your improvement efforts on the high-priority categories first, as they will have the most significant impact on your overall AI readiness score.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-md border border-red-100">
                    <h4 className="font-medium text-red-800 flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4" />
                      High Priority
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      Immediate action required. These areas have the largest impact on your overall score.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-amber-100">
                    <h4 className="font-medium text-amber-800 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Medium Priority
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Plan improvements in the near term. These areas have moderate impact on your overall score.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-green-100">
                    <h4 className="font-medium text-green-800 flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4" />
                      Low Priority
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Address after higher priorities. These areas have minimal impact on your overall score.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Score vs. Weight Analysis</CardTitle>
              <CardDescription>
                Comparing category scores against their weights to identify critical improvement areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData.map((item, index) => ({
                      ...item,
                      weight: result.userWeights[item.category] || 0
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      tick={{ fontSize: 12 }}
                      stroke="#888888"
                    />
                    <YAxis yAxisId="left" domain={[0, 100]} stroke="#8ECAE6" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 50]} stroke="#FFB4A2" />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}${name === 'score' ? '%' : '% weight'}`, 
                        name === 'score' ? 'Score' : 'Weight'
                      ]}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8ECAE6" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#8ECAE6" }}
                      name="Score"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#FFB4A2" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#FFB4A2" }}
                      name="Weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          {/* Weights Comparison and Q-Values */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Category Weights Comparison</CardTitle>
                <CardDescription>
                  User-defined vs. AI-adjusted weights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={weightsComparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      barGap={0}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="category"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                        stroke="#888888"
                      />
                      <YAxis 
                        domain={[0, 50]} 
                        label={{ value: 'Weight (%)', angle: -90, position: 'insideLeft' }}
                        stroke="#888888"
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Weight']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                      <Legend />
                      <Bar name="User-defined Weight" dataKey="userWeight" fill="#A8DADC" radius={[4, 4, 0, 0]} />
                      <Bar name="AI-adjusted Weight" dataKey="adjustedWeight" fill="#FFB4A2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Q-Values Distribution</CardTitle>
                <CardDescription>
                  Reinforcement learning Q-values by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={qValuesData}
                        dataKey="qValue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {qValuesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => value !== null && value !== undefined ? (value as number).toFixed(3) : ''}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      {!loading && result && (
        <AIRecommendations
          categories={chartData}
          overallScore={result.overallScore}
          categoryScores={result.categoryScores}
          onSummaryGenerated={setAiSummary}
        />
      )}

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
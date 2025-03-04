"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Home, Loader2 } from "lucide-react";
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
  Cell
} from "recharts";

interface AssessmentResult {
  assessmentType: string;
  categoryScores: Record<string, number>;
  qValues: Record<string, number>;
  softmaxWeights: Record<string, number>;
  overallScore: number;
}

// Helper function to get consistent colors, and handle edge cases.
const getColor = (index: number, length: number) => {
  if (length === 0) {
    return "#8884d8"; // Default color if no data
  }
  return `hsl(${index * (360 / length)}, 70%, 60%)`;
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
  const [softmaxData, setSoftmaxData] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");

  useEffect(() => {
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
                background: `conic-gradient(${getColorForScore(result.overallScore)} ${result.overallScore / 100 * 360}deg, #e5e7eb 0)`
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

      {/* Q-Values and Softmax Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Q‑Values Distribution</CardTitle>
            <CardDescription>
              Distribution of Q‑values across categories
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
                    fill="#8884d8"
                  >
                    {qValuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index, qValuesData.length)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value !== null && value !== undefined ? (value as number).toFixed(3) : ''} />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Softmax Weights Distribution</CardTitle>
            <CardDescription>
              Distribution of softmax weights across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={softmaxData}
                    dataKey="weight"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                  >
                    {softmaxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index, softmaxData.length)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value !== null && value !== undefined ? (value as number).toFixed(3) : ''} />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
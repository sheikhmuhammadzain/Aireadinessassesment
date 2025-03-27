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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// Add the missing getScoreLabel function
const getScoreLabel = (score: number): string => {
  if (score <= 30) return "AI Dormant";
  if (score <= 60) return "AI Aware";
  if (score <= 85) return "AI Rise";
  return "AI Ready";
};

// Add this helper function after the getColor function and before the ResultsPage component
const getColorForScore = (score: number): string => {
  if (score <= 30) return "#73BFDC"; // AI Dormant - Light blue
  if (score <= 60) return "#5BA3C6"; // AI Aware - Medium blue
  if (score <= 85) return "#2C6F9B"; // AI Rise - Rich blue
  return "#0A4570"; // AI Ready - Deep blue
};

// Add this function before the ResultsPage component
const generatePDFReport = async (result: AssessmentResult, assessmentType: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  // Set light blue theme colors
  const primaryColor = '#4389B0';
  const secondaryColor = '#E0F7FF';
  const textColor = '#2C6F9B';

  // Helper function to add text with styling
  const addStyledText = (text: string, y: number, fontSize: number = 12, color: string = textColor) => {
    doc.setTextColor(color);
    doc.setFontSize(fontSize);
    doc.text(text, margin, y);
  };

  // Add header
  doc.setFillColor(secondaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  addStyledText('AI Readiness Assessment Report', 25, 20, primaryColor);
  addStyledText(`Assessment Type: ${assessmentType}`, 35, 14);
  addStyledText(`Date: ${new Date().toLocaleDateString()}`, 45, 12);

  // Add company info
  const companyName = localStorage.getItem('companyName') || 'Your Company';
  addStyledText(`Company: ${companyName}`, 60, 14);

  // Add overall score
  const score = Math.round(result.overallScore * 10) / 10;
  const scoreColor = getColorForScore(score);
  addStyledText(`Overall Score: ${score}%`, 80, 16, scoreColor);
  addStyledText(`Level: ${getScoreLabel(score)}`, 90, 14);

  // Add category scores
  addStyledText('Category Scores', 110, 16, primaryColor);
  let y = 130;
  Object.entries(result.categoryScores).forEach(([category, score]) => {
    const roundedScore = Math.round(score * 10) / 10;
    addStyledText(`${category}: ${roundedScore}%`, y, 12);
    y += 10;
  });

  // Add category weights
  y += 10;
  addStyledText('Category Weights', y, 16, primaryColor);
  y += 10;
  
  // Calculate total weights to ensure they sum to 100%
  const totalWeight = Object.values(result.userWeights).reduce((sum, weight) => sum + weight, 0);
  
  Object.entries(result.userWeights).forEach(([category, weight]) => {
    const adjustedWeight = result.adjustedWeights[category] || 0;
    const normalizedWeight = (weight / totalWeight) * 100;
    const normalizedAdjustedWeight = (adjustedWeight / totalWeight) * 100;
    
    addStyledText(`${category}:`, y, 12);
    addStyledText(`  User Weight: ${Math.round(normalizedWeight * 100) / 100}%`, y + 5, 10);
    addStyledText(`  Adjusted Weight: ${Math.round(normalizedAdjustedWeight * 100) / 100}%`, y + 10, 10);
    y += 20;
  });

  // Add gap analysis
  if (y < pageHeight - 100) {
    y += 10;
    addStyledText('Gap Analysis', y, 16, primaryColor);
    y += 10;
    gapAnalysisData.slice(0, 5).forEach((gap) => {
      addStyledText(`${gap.category}:`, y, 12);
      addStyledText(`  Gap: ${Math.round(gap.gap)}%`, y + 5, 10);
      addStyledText(`  Impact: ${Math.round(gap.impact)}%`, y + 10, 10);
      addStyledText(`  Priority: ${gap.priority}`, y + 15, 10);
      y += 25;
    });
  }

  // Add footer
  doc.setFillColor(secondaryColor);
  doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
  addStyledText('AI Readiness Assessment Report', pageHeight - 20, 12, primaryColor);
  addStyledText('Confidential - For Internal Use Only', pageHeight - 15, 10);

  return doc;
};

// Add new HTML report generation function
const generateHTMLReport = (result: AssessmentResult, assessmentType: string): string => {
  // Get current date for the report
  const date = new Date().toLocaleDateString();
  const companyName = localStorage.getItem('companyName') || 'Your Company';
  const score = Math.round(result.overallScore * 10) / 10;
  const scoreLabel = getScoreLabel(score);
  
  // Create sorted category entries for consistent ordering
  const sortedCategories = Object.entries(result.categoryScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  
  // Generate gap analysis data
  const gapAnalysis = Object.entries(result.categoryScores).map(([category, score]) => {
    const weight = result.userWeights[category] || 0;
    const gap = 100 - score;
    const impact = (gap * weight) / 100;
    
    let priority: 'High' | 'Medium' | 'Low';
    if (impact > 15) priority = 'High';
    else if (impact > 7) priority = 'Medium';
    else priority = 'Low';
    
    return { category, score, weight, gap, impact, priority };
  }).sort((a, b) => b.impact - a.impact); // Sort by impact (highest first)

  // Generate HTML content
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Readiness Assessment Report - ${assessmentType}</title>
    <style>
      :root {
        --primary-color: #4389B0;
        --secondary-color: #E0F7FF;
        --accent-color: #2C6F9B;
        --text-color: #333333;
        --light-gray: #f8f9fa;
        --border-color: #e0e0e0;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      body {
        color: var(--text-color);
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
        background-color: white;
      }
      
      .report-header {
        background: linear-gradient(to right, var(--secondary-color), white);
        padding: 2rem;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 2rem;
      }
      
      .logo-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
      }
      
      .report-date {
        color: var(--accent-color);
        font-size: 0.9rem;
      }
      
      .report-title {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      
      .report-subtitle {
        font-size: 1.25rem;
        color: var(--accent-color);
        margin-bottom: 1rem;
      }
      
      .company-info {
        margin-top: 1rem;
        font-size: 1.1rem;
      }
      
      .score-section {
        display: flex;
        align-items: center;
        background-color: var(--light-gray);
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        border: 1px solid var(--border-color);
      }
      
      .score-display {
        position: relative;
        width: 150px;
        height: 150px;
        margin-right: 2rem;
      }
      
      .score-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: conic-gradient(
          ${getColorForScore(score)} ${score}%, 
          var(--secondary-color) 0%
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .score-inner {
        width: 70%;
        height: 70%;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        color: var(--primary-color);
      }
      
      .score-details {
        flex: 1;
      }
      
      .score-label {
        font-size: 2rem;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }
      
      .score-description {
        font-size: 1.1rem;
        color: var(--accent-color);
      }
      
      .section {
        margin-bottom: 2.5rem;
        padding: 0 2rem;
      }
      
      .section-title {
        font-size: 1.75rem;
        color: var(--primary-color);
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--secondary-color);
        margin-bottom: 1.5rem;
      }
      
      .category-scores {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .category-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      
      .category-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--accent-color);
      }
      
      .progress-container {
        height: 10px;
        background-color: var(--secondary-color);
        border-radius: 5px;
        margin-bottom: 0.5rem;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        border-radius: 5px;
      }
      
      .score-value {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }
      
      .weights-section {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .weight-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        background-color: var(--light-gray);
      }
      
      .weight-name {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--accent-color);
      }
      
      .weight-details {
        margin-bottom: 0.5rem;
      }
      
      .weight-label {
        font-weight: 600;
        display: inline-block;
        width: 120px;
      }
      
      .gap-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
      }
      
      .gap-table th, .gap-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }
      
      .gap-table th {
        background-color: var(--secondary-color);
        color: var(--accent-color);
        font-weight: 600;
      }
      
      .gap-table tr:nth-child(even) {
        background-color: var(--light-gray);
      }
      
      .priority-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      .priority-high {
        background-color: #fad2d2;
        color: #a02929;
      }
      
      .priority-medium {
        background-color: #fae8d2;
        color: #a07529;
      }
      
      .priority-low {
        background-color: #d2fad5;
        color: #29a041;
      }
      
      .recommendations {
        background-color: var(--light-gray);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
      }
      
      .recommendation-list {
        list-style-type: none;
        margin-top: 1rem;
      }
      
      .recommendation-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      
      .recommendation-icon {
        margin-right: 0.75rem;
        color: var(--primary-color);
        font-size: 1.25rem;
      }
      
      .report-footer {
        margin-top: 3rem;
        padding: 2rem;
        background: linear-gradient(to right, var(--secondary-color), white);
        text-align: center;
        border-top: 1px solid var(--border-color);
        font-size: 0.9rem;
        color: var(--accent-color);
      }
    </style>
  </head>
  <body>
    <div class="report-header">
      <div class="logo-section">
        <div class="logo">AI READINESS ASSESSMENT</div>
        <div class="report-date">Generated on ${date}</div>
      </div>
      <h1 class="report-title">AI Readiness Report</h1>
      <h2 class="report-subtitle">${assessmentType} Assessment</h2>
      <div class="company-info">
        <strong>Company:</strong> ${companyName}
      </div>
    </div>
    
    <div class="score-section">
      <div class="score-display">
        <div class="score-circle">
          <div class="score-inner">${score}%</div>
        </div>
      </div>
      <div class="score-details">
        <div class="score-label">${scoreLabel}</div>
        <div class="score-description">
          ${score <= 30 ? 
            "Your organization is in the early stages of AI adoption and requires significant improvements across multiple dimensions." :
            score <= 60 ?
            "Your organization has begun AI implementation but needs further development in key areas." :
            score <= 85 ?
            "Your organization has established AI practices but needs further development in key areas." :
            "Your organization demonstrates mature AI capabilities and is well-positioned to implement advanced AI initiatives."
          }
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Category Scores</h2>
      <div class="category-scores">
        ${sortedCategories.map(([category, score], index) => `
          <div class="category-card">
            <div class="category-name">${category}</div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${score}%; background-color: ${getColor(index)};"></div>
            </div>
            <div class="score-value">
              <span>Score: ${Math.round(score)}%</span>
              <span>${score < 60 ? "Needs Improvement" : score < 85 ? "Good" : "Excellent"}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Category Weights</h2>
      <div class="weights-section">
        ${Object.entries(result.userWeights).map(([category, weight]) => {
          const adjustedWeight = result.adjustedWeights[category] || 0;
          return `
            <div class="weight-card">
              <div class="weight-name">${category}</div>
              <div class="weight-details">
                <span class="weight-label">User Weight:</span> ${Math.round(weight * 10) / 10}%
              </div>
              <div class="weight-details">
                <span class="weight-label">Adjusted Weight:</span> ${Math.round(adjustedWeight * 10) / 10}%
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Gap Analysis</h2>
      <table class="gap-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Current Score</th>
            <th>Gap</th>
            <th>Weight</th>
            <th>Impact</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${gapAnalysis.map(gap => `
            <tr>
              <td>${gap.category}</td>
              <td>${Math.round(gap.score)}%</td>
              <td>${Math.round(gap.gap)}%</td>
              <td>${Math.round(gap.weight)}%</td>
              <td>${Math.round(gap.impact)}</td>
              <td>
                <span class="priority-badge priority-${gap.priority.toLowerCase()}">
                  ${gap.priority}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2 class="section-title">Recommendations</h2>
      <div class="recommendations">
        <ul class="recommendation-list">
          ${score <= 30 ? `
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Develop a well-defined AI strategy aligned with business goals</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Secure executive sponsorship for AI initiatives</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Build foundational AI capabilities and infrastructure</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Invest in AI training and education for key team members</span>
            </li>
          ` : score <= 60 ? `
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Enhance AI project identification and prioritization frameworks</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Strengthen budgeting processes for AI initiatives</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Drive stakeholder engagement through structured change management</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Develop more sophisticated data governance practices</span>
            </li>
          ` : score <= 85 ? `
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Ensure AI investments are strategically aligned with business objectives</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Establish governance models for AI oversight</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Create a robust AI implementation roadmap</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Cultivate cross-functional collaboration for AI initiatives</span>
            </li>
          ` : `
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Scale AI-driven initiatives across departments</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Optimize AI-enhanced workflows</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Fully integrate AI into core business decision-making</span>
            </li>
            <li class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <span>Lead industry developments in AI governance and ethics</span>
            </li>
          `}
        </ul>
      </div>
    </div>
    
    <div class="report-footer">
      <p>AI Readiness Assessment Report | Confidential - For Internal Use Only</p>
      <p>© ${new Date().getFullYear()} AI Readiness Assessment</p>
    </div>
  </body>
  </html>
  `;
};

export default function ResultsPage({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysis[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);

  useEffect(() => {
    const storedResult = localStorage.getItem(`assessment_result_${assessmentType}`);

    if (storedResult) {
      try {
        const parsedResult: AssessmentResult = JSON.parse(storedResult);
        setResult(parsedResult);

        // Prepare chart data for category scores
        const chartData = Object.entries(parsedResult.categoryScores || {}).map(([category, score], index) => ({
          category,
          score: Math.round(score * 10) / 10,
          fill: getColor(index)
        }));
        setChartData(chartData);

        // Prepare gap analysis data
        const gapAnalysis = Object.entries(parsedResult.categoryScores || {}).map(([category, score]) => {
          const weight = parsedResult.userWeights?.[category] || 0;
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

  const handleReset = () => {
    setShowResetConfirmation(true);
  };

  const confirmReset = () => {
    localStorage.clear();
    toast({
      title: "Reset Complete",
      description: "All assessment data has been cleared.",
    });
    router.push("/");
  };

  const cancelReset = () => {
    setShowResetConfirmation(false);
  };

  const handleDownloadReport = async (format: 'pdf' | 'html' = 'pdf') => {
    if (!result) return;
    
    try {
      if (format === 'pdf') {
        const doc = await generatePDFReport(result, assessmentType);
        const date = new Date().toISOString().split('T')[0];
        const filename = `ai-readiness-assessment-${date}.pdf`;
        doc.save(filename);
        
        toast({
          title: "Success",
          description: "PDF report downloaded successfully",
          variant: "default",
        });
      } else {
        const htmlContent = generateHTMLReport(result, assessmentType);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-readiness-assessment-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "HTML report downloaded successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error(`Error generating ${format.toUpperCase()} report:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report. Please try again.`,
        variant: "destructive",
      });
    }
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
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-lg -z-10"></div>
        <div className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
              {assessmentType} Results
            </h1>
            <p className="text-muted-foreground">
              Analysis of your organization's {assessmentType} readiness
          </p>
        </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleReset}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
              Reset
          </Button>

            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                <Download className="h-4 w-4" />
                Download Report
          </Button>
              
              {showDownloadOptions && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-10 border">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      onClick={() => {
                        handleDownloadReport('pdf');
                        setShowDownloadOptions(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      PDF Format
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                      onClick={() => {
                        handleDownloadReport('html');
                        setShowDownloadOptions(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                      HTML Format
                    </button>
        </div>
                </div>
              )}
      </div>

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

      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Reset Confirmation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset? This will clear all assessment data and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelReset}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmReset}>
                Reset All Data
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-8 overflow-hidden border-0 shadow-md">
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
            Your organization's {assessmentType} readiness score
            </CardDescription>
          </CardHeader>
              <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
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
            <div className="flex-1">
              <div className="text-2xl font-semibold mb-2">{getScoreLabel(result.overallScore)}</div>
              <div className="text-muted-foreground mb-6">
                    {result.overallScore >= 85 ? 
                      "Your organization demonstrates mature AI capabilities and is well-positioned to implement advanced AI initiatives." :
                      result.overallScore >= 60 ?
                      "Your organization has established AI practices but needs further development in key areas." :
                      "Your organization is in the early stages of AI adoption and requires significant improvements across multiple dimensions."
                    }
                  </div>
              <div className="space-y-4">
                {Object.entries(result.categoryScores || {}).slice(0, 3).map(([category, score], index) => (
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
                        <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                          <div 
                        className="h-full rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: `${score}%`, backgroundColor: getColor(index) }}
                          />
                        </div>
                        </div>
                ))}
                {Object.entries(result.categoryScores || {}).length > 3 && (
                  <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => window.scrollTo({ top: document.getElementById('all-categories')?.offsetTop, behavior: 'smooth' })}>
                    Show all categories
                  </Button>
                )}
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>

      <Card className="mb-8 overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
            AI Recommendations
                </CardTitle>
            <CardDescription>
            Personalized recommendations based on your assessment results
            </CardDescription>
          </CardHeader>
        <CardContent className="pt-6">
          <AIRecommendations
            categories={chartData}
              overallScore={result.overallScore} 
            categoryScores={result.categoryScores || {}}
            onSummaryGenerated={setAiSummary}
          />
          </CardContent>
        </Card>

      <div id="all-categories" className="mb-8"></div>
      <Card className="mb-8 overflow-hidden border-0 shadow-md">
        <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Category Breakdown
          </CardTitle>
          <CardDescription>
            Detailed score breakdown by assessment category
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-5">
            {Object.entries(result.categoryScores || {}).map(([category, score], index) => (
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

      {gapAnalysisData && gapAnalysisData.length > 0 && result.overallScore < 85 && (
        <Card className="mb-8 overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
                    </svg>
              Gap Analysis
            </CardTitle>
            <CardDescription>
              Areas to focus on for improving your {assessmentType} readiness
            </CardDescription>
          </CardHeader>
                        <CardContent className="pt-6">
                  <div className="space-y-6">
              {gapAnalysisData.map((item, index) => (
                        <div key={item.category} className="border rounded-lg p-4 transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-lg flex items-center">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                                {index + 1}
                              </span>
                              {item.category}
                            </div>
                            <Badge 
                      variant={item.priority === 'High' ? 'destructive' : (item.priority === 'Medium' ? 'secondary' : 'outline')}
                              className="ml-2"
                            >
                              Priority: {item.priority}
                            </Badge>
                          </div>
                          
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Current Score</div>
                              <div className="text-xl font-medium">{Math.round(item.score)}%</div>
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
                          </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 overflow-hidden border-0 shadow-md">
        <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
            Maturity Level
          </CardTitle>
            <CardDescription>
            Your organization's {assessmentType} maturity assessment
            </CardDescription>
          </CardHeader>
        <CardContent className="pt-6">
          <AssessmentLevelsVisual overallScore={result.overallScore} />
          </CardContent>
        </Card>
    </div>
  );
}
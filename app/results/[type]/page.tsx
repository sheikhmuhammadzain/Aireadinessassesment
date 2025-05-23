  "use client";

  // Keep necessary imports
  import { useEffect, useState, use } from "react";
  import { useRouter } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { ArrowLeft, Download, Home, Loader2, TrendingUp, FileText, Code, RefreshCw, BarChart2, Target, CheckCircle, AlertCircle, Info, List } from "lucide-react"; // Removed Zap icon
  import { useToast } from "@/hooks/use-toast";
  import { Progress } from "@/components/ui/progress";
  import { Badge } from "@/components/ui/badge";
  import { AssessmentLevelsVisual } from "@/components/assessment-levels-visual";
  import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"; // Keep if used, otherwise remove
  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas'; // Keep for functionality
  import { Separator } from "@/components/ui/separator";

  // --- Functionality Interfaces and Types (Keep As Is) ---
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
  }

  // Add a type for gap analysis items - Keep if used internally
  interface GapAnalysisItem {
    category: string;
    subcategory: string;
    score: number;
    suggestions: string[];
  }

  // --- Removed UI Specific Helpers ---
  // Removed PREMIUM_COLORS and getColor - Use Shadcn defaults

  // Keep for logic, but styling impact reduced
  const getScoreLabel = (score: number): string => {
    if (score <= 30) return "AI Dormant";
    if (score <= 60) return "AI Aware";
    if (score <= 85) return "AI Rise";
    return "AI Ready";
  };

  // Keep for logic, but UI impact reduced (used in circle background now)
  const getScoreColorVar = (score: number): string => {
    if (score <= 30) return "hsl(var(--muted))"; // Muted color for low scores
    if (score <= 60) return "hsl(var(--secondary))"; // Secondary color for medium scores
    if (score <= 85) return "hsl(var(--primary) / 0.8)"; // Primary slightly less intense
    return "hsl(var(--primary))"; // Primary color for high scores
  };

  // --- PDF/HTML Generation (Keep Functionality, Internal Styling Unchanged As Requested) ---
  // NOTE: The internal styling of PDF/HTML generation functions remains largely untouched
  // as per the request to only fix the React UI part. The visual output of the downloaded
  // files will retain their original blue theme unless those functions are also modified.

  const generatePDFReport = async (result: AssessmentResult, assessmentType: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Original Blue Theme Colors (Kept for PDF styling as requested)
    const primaryColor = '#4389B0';
    const secondaryColor = '#E0F7FF';
    const textColor = '#2C6F9B';

    const addStyledText = (text: string, y: number, fontSize: number = 12, color: string = textColor) => {
      doc.setTextColor(color);
      doc.setFontSize(fontSize);
      doc.text(text, margin, y);
    };

    doc.setFillColor(secondaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    addStyledText('AI Readiness Assessment Report', 25, 20, primaryColor);
    addStyledText(`Assessment Type: ${assessmentType}`, 35, 14);
    addStyledText(`Date: ${new Date().toLocaleDateString()}`, 45, 12);

    const companyName = localStorage.getItem('companyName') || 'Your Company';
    addStyledText(`Company: ${companyName}`, 60, 14);

    const score = Math.round(result.overallScore * 10) / 10;
    // PDF uses its own color logic, not the UI's getScoreColorVar
    const pdfScoreColor = score <= 30 ? '#73BFDC' : score <= 60 ? '#5BA3C6' : score <= 85 ? '#2C6F9B' : '#0A4570';
    addStyledText(`Overall Score: ${score}%`, 80, 16, pdfScoreColor);
    addStyledText(`Level: ${getScoreLabel(score)}`, 90, 14);

    addStyledText('Category Scores', 110, 16, primaryColor);
    let y = 130;
    Object.entries(result.categoryScores).forEach(([category, score]) => {
      const roundedScore = Math.round(score * 10) / 10;
      addStyledText(`${category}: ${roundedScore}%`, y, 12);
      y += 10;
    });

    y += 10;
    addStyledText('Category Weights', y, 16, primaryColor);
    y += 10;

    const totalWeight = Object.values(result.userWeights).reduce((sum, weight) => sum + weight, 0);

    Object.entries(result.userWeights).forEach(([category, weight]) => {
      const adjustedWeight = result.adjustedWeights[category] || 0;
      const normalizedWeight = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
      const normalizedAdjustedWeight = totalWeight > 0 ? (adjustedWeight / totalWeight) * 100 : 0;

      addStyledText(`${category}:`, y, 12);
      addStyledText(`  User Weight: ${Math.round(normalizedWeight * 100) / 100}%`, y + 5, 10);
      addStyledText(`  Adjusted Weight: ${Math.round(normalizedAdjustedWeight * 100) / 100}%`, y + 10, 10);
      y += 20;
    });

    // Calculate gap analysis data for PDF (reuse logic from main component)
    const gapAnalysisDataForPdf = Object.entries(result.categoryScores || {}).map(([category, score]) => {
        const weight = result.userWeights?.[category] || 0;
        const gap = 100 - score;
        const impact = totalWeight > 0 ? (gap * weight) / 100 : 0; // Use normalized weight impact? Or raw weight? Assuming raw as before.
        return { category, score, weight, gap, impact } as GapAnalysis;
    }).sort((a, b) => b.impact - a.impact);

    if (y < pageHeight - 100 && gapAnalysisDataForPdf.length > 0) {
      y += 10;
      addStyledText('Gap Analysis (Top 5 by Impact)', y, 16, primaryColor);
      y += 10;
      gapAnalysisDataForPdf.slice(0, 5).forEach((gap) => {
          if (y > pageHeight - 40) { // Basic page break check
              doc.addPage();
              y = margin;
          }
        addStyledText(`${gap.category}:`, y, 12);
        addStyledText(`  Gap: ${Math.round(gap.gap)}%`, y + 5, 10);
        addStyledText(`  Impact Score: ${Math.round(gap.impact)}`, y + 10, 10); // Renamed for clarity
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


  const generateHTMLReport = (result: AssessmentResult, assessmentType: string): string => {
    const date = new Date().toLocaleDateString();
    const companyName = localStorage.getItem('companyName') || 'Your Company';
    const score = Math.round(result.overallScore * 10) / 10;
    const scoreLabel = getScoreLabel(score);
    const scoreColor = score <= 30 ? '#73BFDC' : score <= 60 ? '#5BA3C6' : score <= 85 ? '#2C6F9B' : '#0A4570'; // Keep blue theme for HTML export

    const sortedCategories = Object.entries(result.categoryScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    const gapAnalysis = Object.entries(result.categoryScores).map(([category, score]) => {
      const weight = result.userWeights[category] || 0;
      const gap = 100 - score;
      const impact = (gap * weight) / 100;
      return { category, score, weight, gap, impact } as GapAnalysis;
    }).sort((a, b) => b.impact - a.impact);

    // HTML content with original blue-themed styles (as requested)
    // Note: The internal CSS uses the original blue color scheme.
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
        /* ... (rest of the original CSS styles for HTML report - keeping the blue theme) ... */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body { color: var(--text-color); line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 0; background-color: white; }
        .report-header { background: linear-gradient(to right, var(--secondary-color), white); padding: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--primary-color); }
        .report-date { color: var(--accent-color); font-size: 0.9rem; }
        .report-title { font-size: 2.5rem; color: var(--primary-color); margin-bottom: 0.5rem; font-weight: 600; }
        .report-subtitle { font-size: 1.25rem; color: var(--accent-color); margin-bottom: 1rem; }
        .company-info { margin-top: 1rem; font-size: 1.1rem; }
        .score-section { display: flex; align-items: center; background-color: var(--light-gray); padding: 2rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--border-color); }
        .score-display { position: relative; width: 150px; height: 150px; margin-right: 2rem; }
        .score-circle { width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(${scoreColor} ${score}%, var(--secondary-color) 0%); display: flex; align-items: center; justify-content: center; }
        .score-inner { width: 70%; height: 70%; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: var(--primary-color); }
        .score-details { flex: 1; }
        .score-label { font-size: 2rem; font-weight: bold; color: var(--primary-color); margin-bottom: 0.5rem; }
        .score-description { font-size: 1.1rem; color: var(--accent-color); }
        .section { margin-bottom: 2.5rem; padding: 0 2rem; }
        .section-title { font-size: 1.75rem; color: var(--primary-color); padding-bottom: 0.75rem; border-bottom: 2px solid var(--secondary-color); margin-bottom: 1.5rem; }
        .category-scores { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .category-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .category-name { font-size: 1.25rem; font-weight: 600; color: var(--accent-color); }
        .category-badge { font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; color: white; font-weight: 500; }
        .category-score-circle { position: relative; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; }
        .category-score-inner { width: 60px; height: 60px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: var(--accent-color); }
        .progress-container { height: 8px; background-color: var(--secondary-color); border-radius: 4px; margin-bottom: 0.75rem; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 4px; }
        .score-value { display: flex; justify-content: center; font-size: 0.9rem; color: var(--accent-color); margin-bottom: 0.75rem; }
        .category-recommendation { font-size: 0.85rem; color: var(--text-color); text-align: center; background-color: var(--light-gray); padding: 0.75rem; border-radius: 4px; margin-top: auto; }
        .weights-section { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .weight-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; background-color: var(--light-gray); }
        .weight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .weight-name { font-size: 1.2rem; font-weight: 600; color: var(--accent-color); }
        .weight-score { font-size: 0.9rem; font-weight: 500; color: var(--accent-color); }
        .weight-details-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .weight-details { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
        .weight-label { font-weight: 600; color: var(--text-color); font-size: 0.9rem; width: 120px; }
        .weight-value-container { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .weight-progress-container { flex: 1; height: 6px; background-color: var(--secondary-color); border-radius: 3px; overflow: hidden; }
        .weight-progress-bar { height: 100%; border-radius: 3px; }
        .weight-value { font-weight: 500; min-width: 50px; text-align: right; font-size: 0.9rem; }
        .weight-contribution { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border-color); }
        .gap-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .gap-table th, .gap-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
        .gap-table th { background-color: var(--secondary-color); color: var(--accent-color); font-weight: 600; }
        .gap-table tr:nth-child(even) { background-color: var(--light-gray); }
        .recommendations { background-color: var(--light-gray); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; }
        .recommendation-list { list-style-type: none; margin-top: 1rem; padding-left: 0; }
        .recommendation-item { display: flex; align-items: flex-start; margin-bottom: 1rem; }
        .recommendation-icon { margin-right: 0.75rem; color: var(--primary-color); font-size: 1.25rem; flex-shrink: 0; line-height: 1.6; }
        .report-footer { margin-top: 3rem; padding: 2rem; background: linear-gradient(to right, var(--secondary-color), white); text-align: center; border-top: 1px solid var(--border-color); font-size: 0.9rem; color: var(--accent-color); }
        .section-description { margin-bottom: 1.5rem; color: var(--accent-color); font-size: 1rem; }
        .gap-analysis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .gap-analysis-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .gap-card-header { display: flex; align-items: center; margin-bottom: 1.25rem; gap: 0.75rem; }
        .gap-rank { display: flex; align-items: center; justify-content: center; width: 1.75rem; height: 1.75rem; background-color: var(--accent-color); color: white; border-radius: 50%; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
        .gap-category { font-size: 1.1rem; font-weight: 600; color: var(--accent-color); flex: 1; }
        .gap-priority-badge { padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-size: 0.7rem; font-weight: 500; }
        .gap-metrics { display: flex; flex-direction: column; gap: 0.75rem; }
        .gap-metric { margin-bottom: 0.5rem; }
        .gap-metric-label { font-size: 0.8rem; color: var(--text-color); margin-bottom: 0.25rem; }
        .gap-metric-value { font-size: 1rem; font-weight: 600; color: var(--accent-color); margin-bottom: 0.25rem; }
        .gap-metric-bar-container { width: 100%; height: 6px; background-color: var(--secondary-color); border-radius: 3px; overflow: hidden; }
        .gap-metric-bar { height: 100%; border-radius: 3px; }
        .gap-bar { background-color: var(--primary-color); }
        .gap-impact { margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; padding-top: 0.75rem; border-top: 1px dashed var(--border-color); }
        .gap-impact-label { font-size: 0.9rem; font-weight: 600; margin-right: auto; color: var(--text-color); }
        .gap-impact-value { font-size: 1.25rem; font-weight: 700; color: var(--accent-color); }
        .gap-quick-win { background-color: #e6a700; color: white; font-size: 0.7rem; font-weight: 500; padding: 0.25rem 0.5rem; border-radius: 4px; margin-left: 0.75rem; }
        .gap-analysis-info { background-color: var(--light-gray); padding: 1rem; border-radius: 8px; font-size: 0.85rem; color: var(--accent-color); }
        .gap-analysis-info p { margin-bottom: 0.5rem; }
        .gap-analysis-info p:last-child { margin-bottom: 0; }
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
          ${sortedCategories.map(([category, score], index) => {
            // Determine category maturity level
            const maturityLevel = score <= 30 ? "AI Dormant" :
                                 score <= 60 ? "AI Aware" :
                                 score <= 85 ? "AI Rise" : "AI Ready";
            
            // Determine category color based on score
            const categoryColor = score <= 30 ? "#73BFDC" : 
                                 score <= 60 ? "#5BA3C6" : 
                                 score <= 85 ? "#2C6F9B" : "#0A4570";
            
            return `
            <div class="category-card">
              <div class="category-header">
                <div class="category-name">${category}</div>
                <div class="category-badge" style="background-color: ${categoryColor};">
                  ${maturityLevel}
                </div>
              </div>
              <div class="category-score-circle" style="background: conic-gradient(${categoryColor} ${score}%, var(--secondary-color) 0%);">
                <div class="category-score-inner">${Math.round(score)}%</div>
              </div>
              <div class="progress-container">
                <div class="progress-bar" style="width: ${score}%; background-color: ${categoryColor};"></div>
              </div>
              <div class="score-value">
                <span>${score < 60 ? "Needs Improvement" : score < 85 ? "Good" : "Excellent"}</span>
              </div>
              <div class="category-recommendation">
                ${score <= 30 ? 
                  "Establish foundational elements and initiate formal planning." :
                  score <= 60 ? 
                  "Focus on expanding capabilities and addressing key gaps." :
                  score <= 85 ? 
                  "Enhance current practices and move toward optimization." : 
                  "Maintain excellence and explore innovative approaches."}
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Category Weights</h2>
        <div class="weights-section">
          ${Object.entries(result.userWeights).map(([category, weight]) => {
            const adjustedWeight = result.adjustedWeights[category] || 0;
            const categoryScore = result.categoryScores[category] || 0;
            
            // Determine category color based on score
            const categoryColor = categoryScore <= 30 ? "#73BFDC" : 
                                 categoryScore <= 60 ? "#5BA3C6" : 
                                 categoryScore <= 85 ? "#2C6F9B" : "#0A4570";
            
            // Calculate the weight's contribution to overall score
            const scoreContribution = (categoryScore * adjustedWeight) / 100;
                
            return `
              <div class="weight-card">
                <div class="weight-header">
                  <div class="weight-name">${category}</div>
                  <div class="weight-score">Score: ${Math.round(categoryScore)}%</div>
                </div>
                
                <div class="weight-details-container">
                  <div class="weight-details">
                    <span class="weight-label">User Weight:</span> 
                    <div class="weight-value-container">
                      <div class="weight-progress-container">
                        <div class="weight-progress-bar" style="width: ${weight}%; background-color: ${categoryColor};"></div>
                      </div>
                      <span class="weight-value">${Math.round(weight * 10) / 10}%</span>
                    </div>
                  </div>
                  
                  <div class="weight-details">
                    <span class="weight-label">Adjusted Weight:</span>
                    <div class="weight-value-container">
                      <div class="weight-progress-container">
                        <div class="weight-progress-bar" style="width: ${adjustedWeight}%; background-color: ${categoryColor};"></div>
                      </div>
                      <span class="weight-value">${Math.round(adjustedWeight * 10) / 10}%</span>
                    </div>
                  </div>
                  
                  <div class="weight-contribution">
                    <span class="weight-label">Impact on Overall:</span>
                    <span class="weight-value">${Math.round(scoreContribution * 10) / 10} points</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Gap Analysis</h2>
        <p class="section-description">
          The analysis below highlights areas with the greatest potential for improvement, based on both their current scores and assigned weights.
        </p>
        <div class="gap-analysis-grid">
          ${gapAnalysis.map((gap, index) => {
            // Get priority level based on impact
            const priorityLevel = gap.impact > 15 ? "High Priority" :
                                 gap.impact > 7 ? "Medium Priority" : "Lower Priority";
            
            // Determine color based on priority
            const priorityColor = gap.impact > 15 ? "#d64545" :
                                 gap.impact > 7 ? "#e6a700" : "#5BA3C6";
            
            // Get quick-win status (high impact, smaller gap is a "quick win")
            const isQuickWin = gap.impact > 7 && gap.gap < 50;
            
            return `
              <div class="gap-analysis-card">
                <div class="gap-card-header">
                  <div class="gap-rank">${index + 1}</div>
                  <div class="gap-category">${gap.category}</div>
                  <div class="gap-priority-badge" style="background-color: ${priorityColor};">
                    ${priorityLevel}
                  </div>
                </div>
                
                <div class="gap-metrics">
                  <div class="gap-metric">
                    <div class="gap-metric-label">Current Score</div>
                    <div class="gap-metric-value">${Math.round(gap.score)}%</div>
                    <div class="gap-metric-bar-container">
                      <div class="gap-metric-bar" style="width: ${gap.score}%; background-color: #4389B0;"></div>
                    </div>
                  </div>
                  
                  <div class="gap-metric">
                    <div class="gap-metric-label">Gap</div>
                    <div class="gap-metric-value">${Math.round(gap.gap)}%</div>
                    <div class="gap-metric-bar-container">
                      <div class="gap-metric-bar gap-bar" style="width: ${gap.gap}%; background-color: ${priorityColor};"></div>
                    </div>
                  </div>
                  
                  <div class="gap-metric">
                    <div class="gap-metric-label">Category Weight</div>
                    <div class="gap-metric-value">${Math.round(gap.weight)}%</div>
                    <div class="gap-metric-bar-container">
                      <div class="gap-metric-bar" style="width: ${gap.weight}%; background-color: #2C6F9B;"></div>
                    </div>
                  </div>
                  
                  <div class="gap-impact">
                    <div class="gap-impact-label">Impact Score</div>
                    <div class="gap-impact-value">${Math.round(gap.impact)}</div>
                    ${isQuickWin ? `<div class="gap-quick-win">Potential Quick Win</div>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="gap-analysis-info">
          <p><strong>Impact Score</strong> = Gap × Weight ÷ 100. Higher scores suggest higher priority areas to focus on.</p>
          <p><strong>Quick Wins</strong> are areas with significant impact that may require less effort to improve.</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Recommendations</h2>
        <div class="recommendations">
          <ul class="recommendation-list">
            ${score <= 30 ? `
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Develop a well-defined AI strategy aligned with business goals</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Secure executive sponsorship for AI initiatives</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Build foundational AI capabilities and infrastructure</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Invest in AI training and education for key team members</span></li>
            ` : score <= 60 ? `
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Enhance AI project identification and prioritization frameworks</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Strengthen budgeting processes for AI initiatives</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Drive stakeholder engagement through structured change management</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Develop more sophisticated data governance practices</span></li>
            ` : score <= 85 ? `
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Ensure AI investments are strategically aligned with business objectives</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Establish governance models for AI oversight</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Create a robust AI implementation roadmap</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Cultivate cross-functional collaboration for AI initiatives</span></li>
            ` : `
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Scale AI-driven initiatives across departments</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Optimize AI-enhanced workflows</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Fully integrate AI into core business decision-making</span></li>
              <li class="recommendation-item"><span class="recommendation-icon">→</span><span>Lead industry developments in AI governance and ethics</span></li>
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

  // --- React Component ---
  export default function ResultsPage({ params }: { params: Promise<{ type: string }> }) {
    const unwrappedParams = use(params);
    const assessmentType = decodeURIComponent(unwrappedParams.type);
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysis[]>([]);
    const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);
    const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);

    useEffect(() => {
      // Store the current assessment type in localStorage for caching purposes
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentAssessmentType', assessmentType);
      }

      const storedResult = localStorage.getItem(`assessment_result_${assessmentType}`);

      if (storedResult) {
        try {
          const parsedResult: AssessmentResult = JSON.parse(storedResult);
          setResult(parsedResult);

          // Prepare gap analysis data
          const gapAnalysis = Object.entries(parsedResult.categoryScores || {}).map(([category, score]) => {
            const weight = parsedResult.userWeights?.[category] || 0;
            const gap = 100 - score;
            const impact = (gap * weight) / 100;
            
            return {
              category,
              score,
              weight,
              gap,
              impact
            } as GapAnalysis;  // Explicitly cast to GapAnalysis
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

    // --- Event Handlers (Functionality Unchanged) ---
    const handleReset = () => {
      setShowResetConfirmation(true);
    };

    const confirmReset = () => {
      // Clear only assessment-related data if possible, otherwise clear all
      // Example: Clear specific keys instead of localStorage.clear() if other app data exists
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('assessment_')) {
              localStorage.removeItem(key);
          }
      });
      // Clear company name too if set during assessment
      localStorage.removeItem('companyName');

      toast({
        title: "Reset Complete",
        description: "Assessment data has been cleared.",
      });
      setShowResetConfirmation(false); // Close modal after reset
      router.push("/"); // Go to home page after reset
    };

    const cancelReset = () => {
      setShowResetConfirmation(false);
    };

    const handleDownloadReport = async (format: 'pdf' | 'html' = 'pdf') => {
      if (!result) return;

      setLoading(true); // Show loading indicator during generation
      try {
        if (format === 'pdf') {
          const doc = await generatePDFReport(result, assessmentType);
          const date = new Date().toISOString().split('T')[0];
          const filename = `ai-readiness-assessment-${assessmentType.replace(/\s+/g, '-')}-${date}.pdf`;
          doc.save(filename);

          toast({
            title: "Success",
            description: "PDF report downloaded.",
          });
        } else {
          const htmlContent = generateHTMLReport(result, assessmentType);
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = `ai-readiness-assessment-${assessmentType.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Success",
            description: "HTML report downloaded.",
          });
        }
      } catch (error) {
        console.error(`Error generating ${format.toUpperCase()} report:`, error);
        toast({
          title: "Error",
          description: `Failed to generate ${format.toUpperCase()} report. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setLoading(false); // Hide loading indicator
        setShowDownloadOptions(false); // Close dropdown
      }
    };

    // --- Loading State ---
    if (loading && !result) { // Show loader only on initial load
      return (
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading assessment results...</p>
          </div>
        </div>
      );
    }

    // --- Error State (No Result) ---
    // This case is handled by the useEffect redirect, but added as a fallback.
    if (!result) {
      return (
        <div className="container mx-auto p-4 text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-lg text-destructive mb-4">Error: Assessment results are unavailable.</p>
          <p className="text-muted-foreground mb-6">No results were found for this assessment type.</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>
      );
    }

    // --- Render UI ---
    return (
      <div className="container mx-auto py-8 max-w-4xl px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {assessmentType} Results
            </h1>
            <p className="text-muted-foreground mt-1">
              Analysis of your organization's {assessmentType.toLowerCase()} readiness.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Reset Button */}
            <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleReset}
                  disabled={loading}
              >
                  <RefreshCw className="h-4 w-4" />
                  Reset Data
              </Button>

            {/* Download Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full"
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Download Report
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </Button>

              {showDownloadOptions && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover border z-20">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => handleDownloadReport('pdf')}
                      role="menuitem"
                    >
                      <FileText className="h-4 w-4" />
                      PDF Format
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => handleDownloadReport('html')}
                      role="menuitem"
                    >
                      <Code className="h-4 w-4" />
                      HTML Format
                    </button>
                  </div>
                </div>
              )}
            </div>

              {/* Retake Button */}
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                // Set flag in localStorage that we're retaking an assessment
                localStorage.setItem('retaking_assessment', 'true');
                router.push(`/assessment/${encodeURIComponent(assessmentType)}`);
              }}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              Retake Assessment
            </Button>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                  <CardTitle>Reset Confirmation</CardTitle>
                  <CardDescription>
                      Are you sure you want to reset? This will clear all saved assessment data for all types and cannot be undone.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">
                      Consider downloading your report first if you wish to keep a record.
                  </p>
              </CardContent>
              <CardContent className="flex justify-end gap-3">
                  <Button variant="outline" onClick={cancelReset}>
                      Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmReset}>
                      Yes, Reset All Data
                  </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Maturity Level Card - Moved to the top */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-primary" />
              Maturity Level
            </CardTitle>
            <CardDescription>
              Visual representation of your organization's {assessmentType.toLowerCase()} maturity.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AssessmentLevelsVisual overallScore={result.overallScore} />
          </CardContent>
        </Card>

        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart2 className="h-5 w-5 text-primary" />
              Overall Assessment
            </CardTitle>
            <CardDescription>
              Your organization's overall {assessmentType.toLowerCase()} readiness score.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Score Circle */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(${getScoreColorVar(result.overallScore)} ${result.overallScore}%, hsl(var(--muted)) 0)`,
                  }}
                >
                  <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{Math.round(result.overallScore)}%</span>
                  </div>
                </div>
                {/* Status Icon (Optional refinement) */}
                  <div className="absolute -right-1 -top-1 bg-background rounded-full p-1 border shadow-sm">
                      {result.overallScore >= 85 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : result.overallScore >= 60 ? (
                          <Info className="h-5 w-5 text-blue-600" />
                      ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                  </div>
              </div>

              {/* Score Details & Top Categories */}
              <div className="flex-1">
                <div className="text-2xl font-semibold mb-1">{getScoreLabel(result.overallScore)}</div>
                <p className="text-muted-foreground mb-4 text-sm">
                  {result.overallScore >= 85 ?
                    "Demonstrates mature AI capabilities, well-positioned for advanced initiatives." :
                    result.overallScore >= 60 ?
                    "Established AI practices, but needs further development in key areas." :
                    "Early stages of AI adoption, requires significant improvements across dimensions."
                  }
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Top Categories:</h4>
                  {Object.entries(result.categoryScores || {})
                    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort to show highest first
                    .slice(0, 3) // Show top 3
                    .map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium text-foreground">{category}</span>
                        <span className="text-muted-foreground">{Math.round(score)}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                  {Object.keys(result.categoryScores || {}).length > 3 && (
                    <button
                          className="text-sm text-primary hover:underline p-0 h-auto mt-2"
                          onClick={() => document.getElementById('category-breakdown')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                          View all categories
                      </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Card */}
        <Card id="category-breakdown">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <List className="h-5 w-5 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Detailed score breakdown by assessment category.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {Object.entries(result.categoryScores || {})
              .sort(([catA], [catB]) => catA.localeCompare(catB)) // Sort alphabetically for consistency
              .map(([category, score]) => {
                // Get maturity level for this category
                const maturityLevel = score <= 30 ? "AI Dormant" :
                                    score <= 60 ? "AI Aware" :
                                    score <= 85 ? "AI Rise" : "AI Ready";
                                    
                // Get recommendation based on score
                const recommendation = score <= 30 ? 
                  "Establish foundational elements and initiate formal planning." :
                  score <= 60 ? 
                  "Focus on expanding capabilities and addressing key gaps." :
                  score <= 85 ? 
                  "Enhance current practices and move toward optimization." : 
                  "Maintain excellence and explore innovative approaches.";
                  
                return (
                  <div key={category} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{category}</span>
                        <Badge variant={score < 30 ? "destructive" : score < 60 ? "secondary" : score >= 85 ? "default" : "outline"} className="text-xs">
                          {maturityLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{Math.round(score)}%</span>
                        <Badge variant={score < 30 ? "destructive" : score < 60 ? "secondary" : "outline"} className="text-xs hidden sm:inline-block">
                          {score < 30 ? "Low" : score < 60 ? "Medium" : score < 85 ? "Good" : "Excellent"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={score} className="h-2 mb-3" />
                    <p className="text-xs text-muted-foreground mt-2">{recommendation}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Gap Analysis Card - Conditionally Rendered */}
        {gapAnalysisData && gapAnalysisData.length > 0 && result.overallScore < 95 && ( // Show unless score is very high
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-primary" />
                Gap Analysis & Focus Areas
              </CardTitle>
              <CardDescription>
                Prioritized areas for improving your {assessmentType.toLowerCase()} readiness, based on potential impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {gapAnalysisData.map((item, index) => {
                // Determine priority level based on impact
                const priorityLevel = item.impact > 15 ? "High Priority" :
                                    item.impact > 7 ? "Medium Priority" : "Lower Priority";
                                    
                // Check if this could be a "quick win" - high impact with relatively smaller gap
                const isQuickWin = item.impact > 7 && item.gap < 50;
                
                return (
                  <div key={item.category} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {/* Priority Ranking */}
                        <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            item.impact > 15 ? 'bg-destructive text-destructive-foreground' :
                            item.impact > 7 ? 'bg-yellow-500 text-black' :
                            'bg-secondary text-secondary-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        {item.category}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                            item.impact > 15 ? "destructive" :
                            item.impact > 7 ? "outline" : "secondary"
                        }>
                          {priorityLevel}
                        </Badge>
                        {isQuickWin && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                            Quick Win
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Current Score</div>
                        <div className="font-medium text-foreground">{Math.round(item.score)}%</div>
                        <div className="mt-1.5 mb-2 bg-secondary h-1.5 w-full rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Gap</div>
                        <div className="font-medium text-foreground">{Math.round(item.gap)}%</div>
                        <div className="mt-1.5 mb-2 bg-secondary h-1.5 w-full rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.gap > 70 ? 'bg-destructive' : 
                              item.gap > 40 ? 'bg-yellow-500' : 
                              'bg-primary/60'
                            }`}
                            style={{ width: `${item.gap}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Weight</div>
                        <div className="font-medium text-foreground">{Math.round(item.weight)}%</div>
                        <div className="mt-1.5 mb-2 bg-secondary h-1.5 w-full rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/80 rounded-full" 
                            style={{ width: `${item.weight}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">Impact Score</div>
                      <div className={`text-lg font-bold ${
                        item.impact > 15 ? 'text-destructive' : 
                        item.impact > 7 ? 'text-yellow-600' : 
                        'text-foreground'
                      }`}>
                        {Math.round(item.impact)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p><span className="font-medium">Impact Score</span> = Gap × Weight ÷ 100. Higher scores suggest higher priority focus areas.</p>
                <p><span className="font-medium">Quick Wins</span> are areas with significant impact that may require less effort to improve.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface RecommendationItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface AssessmentRecommendationsProps {
  overallScore: number;
  categoryScores?: Record<string, number>;
}

export function AssessmentRecommendations({ overallScore, categoryScores }: AssessmentRecommendationsProps) {
  const getMaturityLevel = (score: number): string => {
    if (score <= 30) return "AI Dormant";
    if (score <= 60) return "AI Aware";
    if (score <= 85) return "AI Rise";
    return "AI Ready";
  };

  const getRecommendations = (level: string): RecommendationItem[] => {
    switch (level) {
      case "AI Dormant":
        return [
          { 
            text: "Develop a well-defined AI strategy aligned with business goals", 
            priority: 'high' 
          },
          { 
            text: "Secure executive sponsorship for AI initiatives", 
            priority: 'high' 
          },
          { 
            text: "Build foundational AI capabilities and infrastructure", 
            priority: 'medium' 
          },
          { 
            text: "Identify potential AI use cases with high business impact", 
            priority: 'medium' 
          },
          { 
            text: "Establish basic data governance practices", 
            priority: 'high' 
          }
        ];
      case "AI Aware":
        return [
          { 
            text: "Enhance AI project identification and prioritization frameworks", 
            priority: 'high' 
          },
          { 
            text: "Strengthen budgeting processes for AI initiatives", 
            priority: 'medium' 
          },
          { 
            text: "Drive stakeholder engagement through structured change management", 
            priority: 'high' 
          },
          { 
            text: "Develop AI talent acquisition and training programs", 
            priority: 'medium' 
          },
          { 
            text: "Implement data quality improvement processes", 
            priority: 'high' 
          }
        ];
      case "AI Rise":
        return [
          { 
            text: "Ensure AI investments are strategically aligned with business objectives", 
            priority: 'high' 
          },
          { 
            text: "Establish governance models for AI oversight", 
            priority: 'high' 
          },
          { 
            text: "Create a robust AI implementation roadmap", 
            priority: 'medium' 
          },
          { 
            text: "Develop advanced AI risk management frameworks", 
            priority: 'medium' 
          },
          { 
            text: "Implement comprehensive AI ethics guidelines", 
            priority: 'high' 
          }
        ];
      case "AI Ready":
        return [
          { 
            text: "Scale AI-driven initiatives across departments", 
            priority: 'high' 
          },
          { 
            text: "Optimize AI-enhanced workflows", 
            priority: 'medium' 
          },
          { 
            text: "Fully integrate AI into core business decision-making", 
            priority: 'high' 
          },
          { 
            text: "Establish AI centers of excellence", 
            priority: 'medium' 
          },
          { 
            text: "Develop advanced AI innovation pipelines", 
            priority: 'medium' 
          }
        ];
      default:
        return [];
    }
  };

  const maturityLevel = getMaturityLevel(overallScore);
  const recommendations = getRecommendations(maturityLevel);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMaturityDescription = (level: string): string => {
    switch (level) {
      case "AI Dormant":
        return "Your organization is in the early stages of AI adoption. Focus on building a strong foundation for AI implementation.";
      case "AI Aware":
        return "Your organization has begun implementing AI initiatives. Strengthen your approach with more structured processes.";
      case "AI Rise":
        return "Your organization has established AI practices. Focus on governance and strategic alignment.";
      case "AI Ready":
        return "Your organization has mature AI capabilities. Scale your initiatives and optimize for maximum impact.";
      default:
        return "";
    }
  };

  const getMaturityColor = (level: string): string => {
    switch (level) {
      case "AI Dormant": return "#FFB4A2"; // Light red
      case "AI Aware": return "#F9C74F"; // Light amber
      case "AI Rise": return "#90BE6D"; // Light green
      case "AI Ready": return "#8ECAE6"; // Light blue
      default: return "#8ECAE6";
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Strategic Recommendations
        </CardTitle>
        <CardDescription>
          Based on your assessment results, we recommend the following actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${getMaturityColor(maturityLevel)}30` }}>
          <div className="flex items-center mb-3">
            <Badge 
              className="mr-2"
              style={{ backgroundColor: getMaturityColor(maturityLevel), color: '#000' }}
            >
              {maturityLevel}
            </Badge>
            <span className="text-lg font-semibold">{Math.round(overallScore)}% - Overall Maturity Level</span>
          </div>
          <p className="text-gray-700">{getMaturityDescription(maturityLevel)}</p>
        </div>

        <h3 className="text-xl font-semibold mb-4">Key Recommendations:</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              {rec.priority === 'high' ? (
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{rec.text}</span>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categoryScores && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Category-Specific Recommendations:</h3>
            <div className="space-y-6">
              {Object.entries(categoryScores)
                .sort(([, scoreA], [, scoreB]) => scoreA - scoreB) // Sort by score ascending (lowest first)
                .slice(0, 3) // Take only the 3 lowest scoring categories
                .map(([category, score]) => {
                  const categoryLevel = getMaturityLevel(score);
                  const categoryRecs = getRecommendations(categoryLevel).slice(0, 3); // Take only 3 recommendations
                  
                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Badge 
                          className="mr-2"
                          style={{ backgroundColor: getMaturityColor(categoryLevel), color: '#000' }}
                        >
                          {categoryLevel}
                        </Badge>
                        <span className="text-lg font-semibold">{category}: {Math.round(score)}%</span>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        {categoryRecs.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{rec.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface RecommendationItem {
  text: string;
  detail: string;
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
            detail: "Create a comprehensive AI roadmap that outlines short and long-term objectives, required resources, and expected outcomes. Ensure this strategy directly supports your organization's mission and business priorities.",
            priority: 'high' 
          },
          { 
            text: "Secure executive sponsorship for AI initiatives", 
            detail: "Identify and engage C-suite champions who can advocate for AI adoption, secure necessary funding, and remove organizational barriers. Develop executive briefings that highlight AI's potential ROI and competitive advantages.",
            priority: 'high' 
          },
          { 
            text: "Build foundational AI capabilities and infrastructure", 
            detail: "Establish the technical foundation needed for AI implementation, including data storage solutions, processing capabilities, and integration frameworks. Consider cloud-based platforms that offer scalability with minimal upfront investment.",
            priority: 'medium' 
          },
          { 
            text: "Identify potential AI use cases with high business impact", 
            detail: "Conduct workshops with key stakeholders to identify business challenges that AI could address. Prioritize use cases based on feasibility, potential ROI, strategic alignment, and ability to demonstrate early wins.",
            priority: 'medium' 
          },
          { 
            text: "Establish basic data governance practices", 
            detail: "Implement foundational data management policies covering quality, privacy, security, and compliance. Create a data inventory to understand what information assets are available and where critical gaps exist.",
            priority: 'high' 
          }
        ];
      case "AI Aware":
        return [
          { 
            text: "Enhance AI project identification and prioritization frameworks", 
            detail: "Develop a structured evaluation methodology for AI opportunities that considers strategic alignment, technical feasibility, resource requirements, and potential business impact. Create a portfolio management approach to balance quick wins with transformative projects.",
            priority: 'high' 
          },
          { 
            text: "Strengthen budgeting processes for AI initiatives", 
            detail: "Implement dedicated budget allocation mechanisms for AI projects with appropriate success metrics. Develop models to forecast both immediate costs and ongoing operational expenses, while establishing monitoring protocols to track ROI.",
            priority: 'medium' 
          },
          { 
            text: "Drive stakeholder engagement through structured change management", 
            detail: "Create a comprehensive change management strategy that addresses cultural resistance to AI adoption. Develop targeted communication plans for different stakeholder groups, emphasizing benefits and addressing concerns about job displacement or process changes.",
            priority: 'high' 
          },
          { 
            text: "Develop AI talent acquisition and training programs", 
            detail: "Create upskilling pathways for existing employees while strategically recruiting specialists for critical roles. Establish partnerships with educational institutions and consider developing an AI Center of Excellence to nurture internal expertise.",
            priority: 'medium' 
          },
          { 
            text: "Implement data quality improvement processes", 
            detail: "Establish systematic approaches to measure and enhance data quality across dimensions such as accuracy, completeness, timeliness, and consistency. Develop data cleaning protocols and implement automated quality monitoring tools where appropriate.",
            priority: 'high' 
          }
        ];
      case "AI Rise":
        return [
          { 
            text: "Ensure AI investments are strategically aligned with business objectives", 
            detail: "Implement a formal AI project portfolio management process that links initiatives directly to strategic goals. Develop KPIs to measure AI's contribution to business outcomes and establish regular review processes to adjust priorities based on evolving business needs.",
            priority: 'high' 
          },
          { 
            text: "Establish governance models for AI oversight", 
            detail: "Create cross-functional AI governance committees with clear decision rights and accountability frameworks. Develop approval processes for AI deployments that include ethical review, risk assessment, and compliance verification checkpoints.",
            priority: 'high' 
          },
          { 
            text: "Create a robust AI implementation roadmap", 
            detail: "Develop a detailed, phase-based plan for expanding AI capabilities across the organization. Include technology infrastructure upgrades, data strategy evolution, talent development, and process redesign considerations in your roadmap.",
            priority: 'medium' 
          },
          { 
            text: "Develop advanced AI risk management frameworks", 
            detail: "Implement comprehensive approaches to identify, assess, and mitigate AI-specific risks including algorithmic bias, security vulnerabilities, and regulatory compliance issues. Establish monitoring systems to detect emerging risks in deployed AI systems.",
            priority: 'medium' 
          },
          { 
            text: "Implement comprehensive AI ethics guidelines", 
            detail: "Develop organization-specific ethical principles for AI development and use. Create practical decision frameworks that help teams navigate complex ethical considerations while establishing review processes for high-risk AI applications.",
            priority: 'high' 
          }
        ];
      case "AI Ready":
        return [
          { 
            text: "Scale AI-driven initiatives across departments", 
            detail: "Systematically expand successful AI implementations throughout the organization using a hub-and-spoke model. Create standardized deployment methodologies that facilitate knowledge transfer while maintaining flexibility for department-specific needs. Establish cross-functional teams to identify synergies between different AI initiatives.",
            priority: 'high' 
          },
          { 
            text: "Optimize AI-enhanced workflows", 
            detail: "Continuously refine AI-integrated business processes to maximize efficiency and effectiveness. Implement sophisticated monitoring systems that track AI performance metrics and impact on business outcomes. Develop automation for routine maintenance and update procedures to ensure AI systems remain aligned with evolving business needs.",
            priority: 'medium' 
          },
          { 
            text: "Fully integrate AI into core business decision-making", 
            detail: "Embed AI insights into executive dashboards and strategic planning processes. Develop advanced simulation capabilities that allow leadership to model different scenarios. Create data visualization tools that make complex AI outputs accessible and actionable for decision-makers across organizational levels.",
            priority: 'high' 
          },
          { 
            text: "Establish AI centers of excellence", 
            detail: "Create dedicated teams responsible for advancing AI capabilities, disseminating best practices, and providing specialized expertise to business units. Develop internal certification programs to recognize AI expertise and create career advancement pathways for AI specialists. Implement knowledge management systems to capture and share learnings across projects.",
            priority: 'medium' 
          },
          { 
            text: "Develop advanced AI innovation pipelines", 
            detail: "Establish structured processes to continuously identify emerging AI technologies relevant to your business. Create rapid prototyping capabilities and sandbox environments for experimentation. Implement stage-gate methodologies to efficiently move promising innovations from concept to production deployment.",
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

  // Get category-specific recommendations with details
  const getCategoryRecommendations = (category: string, score: number) => {
    const categoryLevel = getMaturityLevel(score);
    const baseRecs = getRecommendations(categoryLevel).slice(0, 3);
    
    // Add category-specific context to each recommendation
    return baseRecs.map(rec => ({
      ...rec,
      text: rec.text,
      detail: rec.detail
    }));
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
            <div key={index} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
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
                  <p className="text-sm text-gray-600 mt-2">{rec.detail}</p>
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
                  const categoryRecs = getCategoryRecommendations(category, score);
                  
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
                      
                      <div className="space-y-4 mt-3">
                        {categoryRecs.map((rec, index) => (
                          <div key={index} className="bg-gray-50 rounded-md p-3">
                            <div className="flex items-start gap-2">
                              <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-medium">{rec.text}</span>
                                <p className="text-sm text-gray-600 mt-1">{rec.detail}</p>
                              </div>
                            </div>
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
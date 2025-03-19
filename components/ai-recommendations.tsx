import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { generateRecommendations, generateOverallSummary } from "@/lib/gemini";

interface RecommendationDetail {
  title: string;
  details: string;
}

interface CategoryRecommendation {
  category: string;
  score: number;
  priority: string;
  color: string;
  recommendations: RecommendationDetail[];
  loading: boolean;
}

interface Props {
  categories: Array<{
    category: string;
    score: number;
  }>;
  overallScore: number;
  categoryScores: Record<string, number>;
  onSummaryGenerated?: (summary: string) => void;
  onRecommendationsGenerated?: (recommendations: CategoryRecommendation[]) => void;
}

export function AIRecommendations({
  categories,
  overallScore,
  categoryScores,
  onSummaryGenerated,
  onRecommendationsGenerated
}: Props) {
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([]);

  useEffect(() => {
    // Initialize recommendations with loading state
    const initialRecs = categories.map(item => ({
      category: item.category,
      score: item.score,
      priority: getPriority(item.score),
      color: getPriorityColor(item.score),
      recommendations: [],
      loading: true
    }));
    setRecommendations(initialRecs);

    // Generate AI summary
    generateOverallSummary(overallScore, categoryScores)
      .then(summary => onSummaryGenerated?.(summary))
      .catch(console.error);

    // Generate recommendations for each category
    initialRecs.forEach((rec, index) => {
      generateRecommendations(rec.category, rec.score)
        .then(aiRecs => {
          // If the response is already in the expected format (array of objects with title and details)
          if (Array.isArray(aiRecs) && aiRecs.length > 0 && 
              typeof aiRecs[0] === 'object' && 'title' in aiRecs[0] && 'details' in aiRecs[0]) {
            
            setRecommendations(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                recommendations: aiRecs,
                loading: false
              };
              onRecommendationsGenerated?.(updated);
              return updated;
            });
            return;
          }
          
          // For backward compatibility with string format
          let parsedRecs: RecommendationDetail[] = [];

          if (typeof aiRecs === "string") {
            // Remove `````` markers and parse the JSON content
            const cleanedRecs = (aiRecs as string).replace(/``````/g, "").trim();
            const lines = cleanedRecs.split('\n').filter(line => line.trim().length > 0);
            
            parsedRecs = lines.map(line => ({
              title: line,
              details: `Detailed guidance for implementing "${line}" in your organization.`
            }));
          } else if (Array.isArray(aiRecs) && typeof aiRecs[0] === 'string') {
            parsedRecs = (aiRecs as string[]).map(rec => ({
              title: rec,
              details: `Detailed guidance for implementing "${rec}" in your organization.`
            }));
          } else {
            console.error(`Unexpected type for recommendations: ${typeof aiRecs}`);
            parsedRecs = [{
              title: "Unable to parse recommendations",
              details: "The AI-generated recommendations could not be properly formatted."
            }];
          }

          setRecommendations(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              recommendations: parsedRecs,
              loading: false
            };
            onRecommendationsGenerated?.(updated);
            return updated;
          });
        })
        .catch(error => {
          console.error(`Error generating recommendations for ${rec.category}:`, error);
          setRecommendations(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              recommendations: [{
                title: "Unable to generate recommendations",
                details: "An error occurred while generating AI recommendations."
              }],
              loading: false
            };
            onRecommendationsGenerated?.(updated);
            return updated;
          });
        });
    });
  }, [categories, overallScore, categoryScores, onSummaryGenerated, onRecommendationsGenerated]);

  const getPriority = (score: number) => {
    if (score < 30) return "Critical Priority";
    if (score < 60) return "High Priority";
    if (score < 80) return "Medium Priority";
    return "Low Priority";
  };

  const getPriorityColor = (score: number) => {
    if (score < 30) return "text-red-500";
    if (score < 60) return "text-amber-500";
    if (score < 80) return "text-green-500";
    return "text-blue-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Recommendations</CardTitle>
        <CardDescription>
          Personalized recommendations generated by AI based on your assessment results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg">{item.category}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${item.color}`}>
                    {item.priority}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Score: <span className="font-medium">{item.score}%</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                {item.loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {item.recommendations.map((rec, recIndex) => (
                      <div key={recIndex} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {index < recommendations.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, Loader2, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryWeights } from "@/types";
import { PieChart } from "./PieChart";

interface WeightAdjustmentProps {
  weights: CategoryWeights;
  recommendedWeights?: CategoryWeights;
  onWeightsChange: (weights: CategoryWeights) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function WeightAdjustment({ 
  weights, 
  recommendedWeights, 
  onWeightsChange, 
  onSubmit,
  loading = false
}: WeightAdjustmentProps) {
  const [localWeights, setLocalWeights] = useState<CategoryWeights>(weights);
  const [totalWeight, setTotalWeight] = useState(100);

  useEffect(() => {
    setLocalWeights(weights);
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    setTotalWeight(total);
  }, [weights]);

  const handleWeightChange = (category: string, value: number[]) => {
    const newValue = value[0];
    const oldValue = localWeights[category];
    const diff = newValue - oldValue;
    
    // Update weights while ensuring total is still 100
    const updated = { ...localWeights };
    updated[category] = newValue;
    
    // Distribute the difference among other categories proportionally
    const otherCategories = Object.keys(updated).filter(cat => cat !== category);
    if (otherCategories.length > 0) {
      const totalOtherWeights = otherCategories.reduce((sum, cat) => sum + updated[cat], 0);
      
      // If there are other weights to adjust
      if (totalOtherWeights > 0) {
        otherCategories.forEach(cat => {
          const proportion = updated[cat] / totalOtherWeights;
          updated[cat] = Math.max(0, updated[cat] - (diff * proportion));
        });
      }
    }
    
    // Ensure all weights sum to 100 by normalizing
    const sum = Object.values(updated).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.1) {
      Object.keys(updated).forEach(cat => {
        updated[cat] = (updated[cat] / sum) * 100;
      });
    }
    
    setLocalWeights(updated);
    setTotalWeight(sum);
    onWeightsChange(updated);
  };

  const resetToRecommended = () => {
    if (recommendedWeights) {
      setLocalWeights(recommendedWeights);
      onWeightsChange(recommendedWeights);
    }
  };

  const categories = Object.keys(localWeights);
  const chartData = categories.map(category => ({
    name: category,
    value: localWeights[category]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Pillar Weights</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Adjust the importance of each category. The weights automatically balance to total 100%.
                    {recommendedWeights && " The recommended weights are based on your company profile."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Define how important each Pillar is to your assessment (total: {totalWeight.toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{category}</Label>
                    <div className="flex items-center gap-2">
                      {recommendedWeights && (
                        <span className="text-xs text-muted-foreground">
                          (Recommended: {recommendedWeights[category].toFixed(1)}%)
                        </span>
                      )}
                      <span className="font-medium">{localWeights[category].toFixed(1)}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[localWeights[category]]}
                    min={5}
                    max={50}
                    step={0.1}
                    onValueChange={(value) => handleWeightChange(category, value)}
                    className="cursor-pointer"
                  />
                  {category !== categories[categories.length - 1] && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-64 flex items-center justify-center">
                <PieChart data={chartData} />
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                Visual representation of category weights
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
          {recommendedWeights && (
            <Button 
              variant="outline" 
              onClick={resetToRecommended}
              className="w-full sm:w-auto"
            >
              Reset to Recommended
            </Button>
          )}
          <Button 
            onClick={onSubmit} 
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue with Selected Weights
                <BarChart3 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
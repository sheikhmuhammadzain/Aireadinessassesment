import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, Loader2, BarChart3, Lock, Unlock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryWeights } from "@/types";
import { PieChart } from "./PieChart";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [localWeights, setLocalWeights] = useState<CategoryWeights>(weights);
  const [totalWeight, setTotalWeight] = useState(100);
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalWeights(weights);
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    setTotalWeight(total);
    
    // Load locked categories from localStorage
    const storedLockedCategories = localStorage.getItem('locked_categories');
    if (storedLockedCategories) {
      try {
        const parsedLocked = JSON.parse(storedLockedCategories);
        setLockedCategories(parsedLocked);
      } catch (error) {
        console.error("Error parsing stored locked categories:", error);
        setLockedCategories({});
      }
    }
  }, [weights]);

  // Toggle lock for a category
  const toggleCategoryLock = (category: string) => {
    setLockedCategories(prev => {
      const updated = { ...prev };
      // Toggle the lock status
      updated[category] = !updated[category];
      
      // Save to localStorage
      localStorage.setItem('locked_categories', JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleWeightChange = (category: string, value: number[]) => {
    const newValue = value[0];
    const oldValue = localWeights[category];
    const diff = newValue - oldValue;
    
    // Update weights while ensuring total is still 100
    const updated = { ...localWeights };
    updated[category] = newValue;
    
    // Only distribute the difference among unlocked categories
    const otherCategories = Object.keys(updated).filter(cat => cat !== category && !lockedCategories[cat]);
    
    // If all other categories are locked, show warning and only update current category
    if (otherCategories.length === 0) {
      toast({
        title: "Weight adjustment limited",
        description: "All other categories are locked. Unlock some to enable proper weight distribution.",
        variant: "destructive",
      });
      
      setLocalWeights(prev => ({
        ...prev,
        [category]: newValue
      }));
      onWeightsChange({...localWeights, [category]: newValue});
      return;
    }
    
    // Calculate total weight of other modifiable categories
    const totalOtherWeights = otherCategories.reduce((sum, cat) => sum + updated[cat], 0);
    
    // Distribute the difference proportionally among other modifiable categories
    if (totalOtherWeights > 0 && diff !== 0) {
      // Safety check - if the difference would make any categories go below 5%, adjust
      let adjustedDifference = diff;
      const minWeight = 5; // Minimum weight for a category
      
      otherCategories.forEach(cat => {
        const proportion = updated[cat] / totalOtherWeights;
        const potentialNewWeight = updated[cat] - (diff * proportion);
        if (potentialNewWeight < minWeight) {
          // If this would reduce the weight below minimum, adjust the difference
          const maxReduction = updated[cat] - minWeight;
          const proportionalMaxReduction = maxReduction / proportion;
          if (proportionalMaxReduction < Math.abs(adjustedDifference)) {
            adjustedDifference = diff > 0 ? proportionalMaxReduction : -proportionalMaxReduction;
          }
        }
      });
      
      // Apply the adjusted difference
      otherCategories.forEach(cat => {
        const proportion = updated[cat] / totalOtherWeights;
        updated[cat] = Math.max(minWeight, updated[cat] - (adjustedDifference * proportion));
      });
    }
    
    // Normalize to ensure total is 100
    let total = Object.values(updated).reduce((sum, w) => sum + w, 0);
    
    if (Math.abs(total - 100) > 0.1) {
      // Get all locked categories (including the one we're adjusting)
      const lockedCats = Object.keys(updated)
        .filter(cat => lockedCategories[cat] || cat === category);
      
      // Calculate sum of locked weights
      const lockedSum = lockedCats.reduce((sum, cat) => sum + updated[cat], 0);
      
      // Calculate remaining weight for unlocked categories
      const remainingSum = 100 - lockedSum;
      
      if (remainingSum <= 0) {
        toast({
          title: "Weight adjustment failed",
          description: "Too many locked categories. Please unlock some to continue adjusting.",
          variant: "destructive",
        });
        return;
      }
      
      // Normalize only unlocked categories
      const unlockedSum = otherCategories.reduce((sum, cat) => sum + updated[cat], 0);
      const normalizationFactor = remainingSum / unlockedSum;
      
      otherCategories.forEach(cat => {
        updated[cat] = Math.round(updated[cat] * normalizationFactor * 10) / 10;
      });
    }
    
    // Final check - make sure the total is exactly 100%
    let finalTotal = Object.values(updated).reduce((sum, w) => sum + w, 0);
    if (Math.abs(finalTotal - 100) > 0.01) {
      // If we have unlocked categories, distribute the difference
      if (otherCategories.length > 0) {
        const difference = 100 - finalTotal;
        
        // Find the largest unlocked category to adjust
        const largestUnlockedCategory = otherCategories.reduce((a, b) => 
          updated[a] > updated[b] ? a : b
        );
        
        // Apply the difference to the largest category
        updated[largestUnlockedCategory] += difference;
      } else {
        // If all categories are locked except the current one, adjust the current category
        updated[category] = 100 - (finalTotal - updated[category]);
      }
    }
    
    setLocalWeights(updated);
    setTotalWeight(100);
    onWeightsChange(updated);
    
    // Save locked categories to localStorage
    localStorage.setItem('locked_categories', JSON.stringify(lockedCategories));
  };

  const resetToRecommended = () => {
    if (recommendedWeights) {
      setLocalWeights(recommendedWeights);
      onWeightsChange(recommendedWeights);
      // Reset all locks when resetting to recommended weights
      setLockedCategories({});
      localStorage.setItem('locked_categories', JSON.stringify({}));
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
                    Lock a category to prevent its weight from changing when adjusting others.
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
                <div key={category} className="space-y-2 p-3 border rounded-lg bg-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{category}</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleCategoryLock(category)}
                        className="flex items-center space-x-1 text-xs"
                      >
                        {lockedCategories[category] ? (
                          <>
                            <Lock className="h-4 w-4 text-red-500" />
                            <span>Locked</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 text-green-500" />
                            <span>Unlocked</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-right">
                      {recommendedWeights && (
                        <div className="text-xs text-muted-foreground">
                          Recommended: {recommendedWeights[category].toFixed(1)}%
                        </div>
                      )}
                      <div className="font-medium">{localWeights[category].toFixed(1)}%</div>
                    </div>
                  </div>
                  <Slider
                    value={[localWeights[category]]}
                    min={5}
                    max={50}
                    step={0.1}
                    onValueChange={(value) => handleWeightChange(category, value)}
                    className={lockedCategories[category] ? "opacity-60" : "cursor-pointer"}
                    disabled={lockedCategories[category]}
                  />
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
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertCircle, Plus, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Helper function for precise rounding
const roundToOneDecimal = (num: number): number => {
  return Math.round(num * 10) / 10;
};

type CategoryWeights = Record<string, number>;

interface CategoryWeightAdjusterProps {
  weights: CategoryWeights;
  onWeightsChange: (newWeights: CategoryWeights) => void;
  onSubmit?: () => void;
  loading?: boolean;
}

/**
 * CategoryWeightAdjuster Component:
 * A simplified component specifically for adjusting weights between categories.
 */
export function CategoryWeightAdjuster({
  weights,
  onWeightsChange,
  onSubmit,
  loading = false
}: CategoryWeightAdjusterProps) {
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({});
  const STEP_SIZE = 5; // 5% increments for buttons

  // Toggle lock status for a category
  const toggleLock = useCallback((category: string) => {
    setLockedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  // Calculate total weight
  const getTotalWeight = useCallback((): number => {
    return roundToOneDecimal(
      Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    );
  }, [weights]);

  // Handle weight adjustment
  const handleWeightChange = useCallback((changedCategory: string, newValue: number) => {
    // Ensure the value is within valid range
    newValue = roundToOneDecimal(Math.max(0, Math.min(100, newValue)));
    
    // Create a copy of weights
    const updatedWeights = { ...weights };
    const categories = Object.keys(updatedWeights);
    
    // Get old value for comparison
    const oldValue = updatedWeights[changedCategory] || 0;
    
    // If no change, return early
    if (Math.abs(newValue - oldValue) < 0.01) return;
    
    // Set the new value
    updatedWeights[changedCategory] = newValue;
    
    // Get unlocked categories (except the one being changed)
    const unlockedCategories = categories.filter(
      cat => cat !== changedCategory && !lockedCategories[cat]
    );
    
    // If no unlocked categories, can't adjust
    if (unlockedCategories.length === 0) {
      // Warn user
      alert("Please unlock at least one other category to adjust weights.");
      // Revert change
      updatedWeights[changedCategory] = oldValue;
      onWeightsChange(updatedWeights);
      return;
    }
    
    // Calculate how much needs to be distributed to other categories
    const difference = oldValue - newValue;
    
    // Distribute the difference among unlocked categories
    const totalUnlockedWeight = unlockedCategories.reduce(
      (sum, cat) => sum + updatedWeights[cat], 0
    );
    
    if (totalUnlockedWeight <= 0.01) {
      // If other weights are near zero, distribute equally
      const adjustmentPerCat = roundToOneDecimal(difference / unlockedCategories.length);
      unlockedCategories.forEach(cat => {
        updatedWeights[cat] = Math.max(0, adjustmentPerCat);
      });
    } else {
      // Distribute proportionally
      unlockedCategories.forEach(cat => {
        const proportion = updatedWeights[cat] / totalUnlockedWeight;
        const adjustment = roundToOneDecimal(difference * proportion);
        updatedWeights[cat] = Math.max(0, roundToOneDecimal(updatedWeights[cat] + adjustment));
      });
    }
    
    // Final check to ensure total is 100%
    const total = Object.values(updatedWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 100) > 0.01) {
      // Adjust the largest unlocked category
      const sortedUnlocked = [...unlockedCategories].sort(
        (a, b) => updatedWeights[b] - updatedWeights[a]
      );
      
      if (sortedUnlocked.length > 0) {
        const adjustment = roundToOneDecimal(100 - total);
        const catToAdjust = sortedUnlocked[0];
        updatedWeights[catToAdjust] = Math.max(0, roundToOneDecimal(updatedWeights[catToAdjust] + adjustment));
      }
    }
    
    onWeightsChange(updatedWeights);
  }, [weights, lockedCategories, onWeightsChange]);
  
  // Handle increment
  const incrementWeight = useCallback((category: string) => {
    handleWeightChange(category, (weights[category] || 0) + STEP_SIZE);
  }, [handleWeightChange, weights, STEP_SIZE]);
  
  // Handle decrement
  const decrementWeight = useCallback((category: string) => {
    handleWeightChange(category, (weights[category] || 0) - STEP_SIZE);
  }, [handleWeightChange, weights, STEP_SIZE]);
  
  // Handle input change
  const handleInputChange = useCallback((category: string, valueStr: string) => {
    if (/^\d+(\.\d*)?$/.test(valueStr)) {
      const newValue = parseFloat(valueStr);
      if (!isNaN(newValue)) {
        handleWeightChange(category, newValue);
      }
    }
  }, [handleWeightChange]);
  
  // Get total weight to check balance
  const totalWeight = getTotalWeight();
  const isBalanced = Math.abs(totalWeight - 100) < 0.05;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="bg-muted/30 px-4 py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold">Category Weights</CardTitle>
            <CardDescription className={cn(
              "text-sm",
              !isBalanced && "flex items-center gap-1"
            )}>
              Total: <span className={cn(
                "font-bold",
                isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive animate-pulse'
              )}>{totalWeight.toFixed(1)}%</span> / 100%
              {!isBalanced && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-5">
            {Object.keys(weights).length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories defined.</p>
            ) : (
              Object.entries(weights).map(([category, weight]) => {
                const isLocked = lockedCategories[category] || false;
                
                return (
                  <div key={category} className="space-y-2">
                    {/* Category Label and Lock Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleLock(category)}
                                className="h-7 w-7"
                              >
                                {isLocked ? (
                                  <Lock className="h-4 w-4 text-primary" />
                                ) : (
                                  <Unlock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isLocked ? 'Unlock category' : 'Lock category'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="font-medium">{category}</span>
                      </div>
                    </div>
                    
                    {/* Weight Controls */}
                    <div className="flex items-center space-x-2">
                      {/* Decrement Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={isLocked || weight <= 0}
                        onClick={() => decrementWeight(category)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      {/* Input Field */}
                      <div className="relative flex-1 max-w-[100px]">
                        <Input
                          type="text"
                          value={weight.toFixed(1)}
                          onChange={(e) => handleInputChange(category, e.target.value)}
                          disabled={isLocked}
                          className={cn(
                            "h-8 text-right pr-7 font-medium",
                            isLocked && "opacity-70"
                          )}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          %
                        </span>
                      </div>
                      
                      {/* Increment Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={isLocked || weight >= 100}
                        onClick={() => incrementWeight(category)}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      {/* Weight Indicator Bar */}
                      <div className="flex-1 hidden sm:block">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isLocked ? "bg-primary/60" : "bg-primary",
                            )}
                            style={{ width: `${weight}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Warning for imbalanced weights */}
            {!isBalanced && Object.keys(weights).length > 0 && (
              <p className="text-xs text-destructive text-center pt-2">
                Weights do not sum to 100%.
              </p>
            )}
            
            {/* Instructions for weight adjustment */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Adjust the relative importance of each category. Higher percentages indicate greater importance in your overall assessment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Submit button */}
      {onSubmit && (
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onSubmit} disabled={loading || !isBalanced}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Questions
          </Button>
        </div>
      )}
    </div>
  );
} 
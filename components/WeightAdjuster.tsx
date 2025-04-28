import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertCircle, Plus, Minus } from "lucide-react";
import { CategoryWeights } from "@/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

// Helper function for precise rounding
const roundToOneDecimal = (num: number): number => {
  return Math.round(num * 10) / 10;
};

interface WeightAdjusterProps {
  weights: CategoryWeights;
  lockedCategories: Record<string, boolean>;
  categories: string[];
  recommendedWeights?: CategoryWeights;
  onWeightsChange: (newWeights: CategoryWeights) => void;
  onToggleLock: (pillar: string, category: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
}

/**
 * WeightAdjuster Component:
 * Provides numeric controls for adjusting weights with automatic redistribution.
 */
export function WeightAdjuster({
  weights,
  recommendedWeights,
  onWeightsChange,
  onSubmit,
  loading = false,
  lockedCategories,
  onToggleLock,
  categories
}: WeightAdjusterProps) {
  // Step size for increment/decrement buttons
  const STEP_SIZE = 5; // 5% increments for buttons

  // Simple weight adjustment handler that maintains total of 100%
  const handleWeightChange = useCallback((category: string, subcat: string, newValue: number) => {
    // Create a deep copy of the weights
    const updatedWeights = JSON.parse(JSON.stringify(weights));
    
    // Get all categories for this category
    const categoryWeights = updatedWeights[category] || {};
    const categories = Object.keys(categoryWeights);
    
    // Limit value to valid range
    newValue = roundToOneDecimal(Math.max(0, Math.min(100, newValue)));
    
    // If this is the only category in the category, it must be 100%
    if (categories.length === 1) {
      categoryWeights[subcat] = 100;
      updatedWeights[category] = categoryWeights;
      onWeightsChange(updatedWeights);
      return;
    }
    
    // Get locked status for all categories in this category
    const lockedCats = categories.filter(cat => lockedCategories[`${category}-${cat}`]);
    const unlockedCats = categories.filter(cat => !lockedCategories[`${category}-${cat}`]);
    const otherUnlockedCats = unlockedCats.filter(cat => cat !== subcat);
    
    // If all categories are locked except this one, we can't change it
    if (otherUnlockedCats.length === 0 && lockedCategories[`${category}-${subcat}`] === false) {
      // Calculate how much room is left after accounting for locked categories
      const lockedTotal = lockedCats.reduce((sum, cat) => sum + (categoryWeights[cat] || 0), 0);
      // Set this category to whatever remains to reach 100%
      categoryWeights[subcat] = roundToOneDecimal(100 - lockedTotal);
      updatedWeights[category] = categoryWeights;
      onWeightsChange(updatedWeights);
      return;
    }
    
    // Normal case: other categories can be adjusted
    
    // Store old value for reference
    const oldValue = categoryWeights[subcat] || 0;
    // Set new value
    categoryWeights[subcat] = newValue;
    
    // Calculate the difference that needs to be distributed
    const diff = newValue - oldValue;
    
    if (Math.abs(diff) > 0.01 && otherUnlockedCats.length > 0) {
      // Calculate the total weight of other unlocked categories
      const otherUnlockedTotal = otherUnlockedCats.reduce(
        (sum, cat) => sum + (categoryWeights[cat] || 0), 0
      );
      
      if (otherUnlockedTotal <= 0.01) {
        // If other unlocked weights sum to near-zero, distribute equally
        const adjustmentPerCat = roundToOneDecimal(-diff / otherUnlockedCats.length);
        otherUnlockedCats.forEach(cat => {
          categoryWeights[cat] = Math.max(0, adjustmentPerCat);
        });
      } else {
        // Distribute proportionally
        otherUnlockedCats.forEach(cat => {
          const currentWeight = categoryWeights[cat] || 0;
          const proportion = currentWeight / otherUnlockedTotal;
          const adjustment = roundToOneDecimal(-diff * proportion);
          categoryWeights[cat] = Math.max(0, roundToOneDecimal(currentWeight + adjustment));
        });
      }
    }
    
    // Final check to ensure exactly 100% total
    const total = categories.reduce((sum, cat) => sum + (categoryWeights[cat] || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      // Adjust the largest unlocked category to make the total exactly 100%
      const sortedUnlocked = [...otherUnlockedCats].sort(
        (a, b) => (categoryWeights[b] || 0) - (categoryWeights[a] || 0)
      );
      
      if (sortedUnlocked.length > 0) {
        const adjustment = 100 - total;
        const catToAdjust = sortedUnlocked[0];
        categoryWeights[catToAdjust] = Math.max(0, roundToOneDecimal(categoryWeights[catToAdjust] + adjustment));
      } else if (!lockedCategories[`${category}-${subcat}`]) {
        // If no other unlocked categories, adjust this one
        categoryWeights[subcat] = roundToOneDecimal(100 - (total - categoryWeights[subcat]));
      }
    }
    
    updatedWeights[category] = categoryWeights;
    onWeightsChange(updatedWeights);
  }, [weights, lockedCategories, onWeightsChange]);

  // Increment weight by step size
  const incrementWeight = useCallback((category: string, subcat: string, currentWeight: number) => {
    handleWeightChange(category, subcat, currentWeight + STEP_SIZE);
  }, [handleWeightChange, STEP_SIZE]);

  // Decrement weight by step size
  const decrementWeight = useCallback((category: string, subcat: string, currentWeight: number) => {
    handleWeightChange(category, subcat, currentWeight - STEP_SIZE);
  }, [handleWeightChange, STEP_SIZE]);

  // Handle direct input changes
  const handleInputChange = useCallback((category: string, subcat: string, valueStr: string) => {
    // Only process valid numbers
    if (/^\d+(\.\d*)?$/.test(valueStr)) {
      const newValue = parseFloat(valueStr);
      if (!isNaN(newValue)) {
        handleWeightChange(category, subcat, newValue);
      }
    }
  }, [handleWeightChange]);

  // Helper to calculate the total for a category
  const getCategoryTotal = useCallback((category: string): number => {
    if (!weights[category]) return 0;
    const categoryValues = weights[category];
    const sum = Object.values(categoryValues).reduce((acc, weight) => acc + (Number(weight) || 0), 0);
    return roundToOneDecimal(sum);
  }, [weights]);

  return (
    <div className="space-y-6">
      {/* Display loading placeholder if category list is empty */}
      {categories.length === 0 && (
         <Card>
            <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">Loading weight categories...</p>
            </CardContent>
         </Card>
      )}

      {/* Map through categories */}
      {categories.map((category) => {
        const categoryData = weights[category] || {};
        const categoriesInCategory = Object.keys(categoryData);
        const categoryTotal = getCategoryTotal(category);
        const isBalanced = Math.abs(categoryTotal - 100) < 0.05;

        return (
          <Card key={category} className="overflow-hidden border-border/70 shadow-sm">
            {/* Card Header: Category Title and Total */}
            <CardHeader className="bg-muted/30 px-4 py-3 md:px-6 md:py-4">
              <div className="flex justify-between items-center">
                 <CardTitle className="text-base font-semibold">{category}</CardTitle>
                 <CardDescription className={cn(
                     "text-sm",
                     !isBalanced && "flex items-center gap-1"
                 )}>
                    Total: <span className={cn(
                      "font-bold",
                      isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive animate-pulse'
                     )}>{categoryTotal.toFixed(1)}%</span> / 100%
                    {!isBalanced && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                 </CardDescription>
              </div>
            </CardHeader>

            {/* Card Content: Weight Controls for Categories */}
            <CardContent className="px-4 py-3 md:px-6">
              <div className="space-y-4">
                {categoriesInCategory.map((subcat) => {
                  const weight = categoryData[subcat] ?? 0;
                  const isLocked = lockedCategories[`${category}-${subcat}`] ?? false;
                  const recommendedWeight = recommendedWeights?.[category]?.[subcat];
                  
                  return (
                    <div key={subcat} className="space-y-2">
                      {/* Category Label and Lock Button */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-7 w-7 rounded-full",
                                    isLocked ? "text-amber-500" : "text-muted-foreground"
                                  )}
                                  onClick={() => onToggleLock(category, subcat)}
                                  disabled={loading || categoriesInCategory.length === 1}
                                  aria-label={isLocked ? `Unlock ${subcat}` : `Lock ${subcat}`}
                                >
                                  {isLocked ? (
                                    <Lock className="h-4 w-4" />
                                  ) : (
                                    <Unlock className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-sm">{isLocked 
                                  ? `Unlock ${subcat} weight to allow automatic adjustment`
                                  : `Lock ${subcat} weight to prevent automatic adjustment`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <span className="font-medium text-sm truncate" title={subcat}>{subcat}</span>
                        </div>
                        
                        {recommendedWeight !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-muted-foreground gap-1">
                                  <span className="text-xs">Suggested: {recommendedWeight.toFixed(1)}%</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-sm">AI-recommended weight based on your company profile</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      
                      {/* Weight adjustment controls */}
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => decrementWeight(category, subcat, weight)}
                          disabled={weight <= 0 || isLocked || loading || categoriesInCategory.length === 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex-1 mx-2">
                          <div className="relative">
                            <Input
                              type="text"
                              value={weight.toFixed(1)}
                              className={cn(
                                "h-8 pr-8 text-center font-medium",
                                isLocked && "bg-muted border-muted",
                                (weight === 0 || weight === 100) && "font-bold"
                              )}
                              disabled={isLocked || loading || categoriesInCategory.length === 1}
                              onChange={(e) => handleInputChange(category, subcat, e.target.value)}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementWeight(category, subcat, weight)}
                          disabled={weight >= 100 || isLocked || loading || categoriesInCategory.length === 1}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show a note when only one category exists */}
                {categoriesInCategory.length === 1 && (
                  <p className="text-xs text-muted-foreground italic">
                    This category has only one category, so it must be 100%.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Submit button if needed */}
      {onSubmit && (
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Weights & Proceed
          </Button>
        </div>
      )}
    </div>
  );
} 
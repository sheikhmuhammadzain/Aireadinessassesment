import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertCircle, Plus, Minus } from "lucide-react";
import { SubcategoryWeights } from "@/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

// Helper function for precise rounding
const roundToOneDecimal = (num: number): number => {
  return Math.round(num * 10) / 10;
};

interface WeightAdjusterProps {
  weights: SubcategoryWeights;
  lockedCategories: Record<string, boolean>;
  categories: string[];
  recommendedWeights?: SubcategoryWeights;
  onWeightsChange: (newWeights: SubcategoryWeights) => void;
  onToggleLock: (category: string, subcategory: string) => void;
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
  const handleWeightChange = useCallback((category: string, subcategory: string, newValue: number) => {
    // Create a deep copy of the weights
    const updatedWeights = JSON.parse(JSON.stringify(weights));
    
    // Get all subcategories for this category
    const categoryWeights = updatedWeights[category] || {};
    const subcategories = Object.keys(categoryWeights);
    
    // Limit value to valid range
    newValue = roundToOneDecimal(Math.max(0, Math.min(100, newValue)));
    
    // If this is the only subcategory in the category, it must be 100%
    if (subcategories.length === 1) {
      categoryWeights[subcategory] = 100;
      updatedWeights[category] = categoryWeights;
      onWeightsChange(updatedWeights);
      return;
    }
    
    // Get locked status for all subcategories in this category
    const lockedSubs = subcategories.filter(sub => lockedCategories[`${category}-${sub}`]);
    const unlockedSubs = subcategories.filter(sub => !lockedCategories[`${category}-${sub}`]);
    const otherUnlockedSubs = unlockedSubs.filter(sub => sub !== subcategory);
    
    // If all subcategories are locked except this one, we can't change it
    if (otherUnlockedSubs.length === 0 && lockedCategories[`${category}-${subcategory}`] === false) {
      // Calculate how much room is left after accounting for locked subcategories
      const lockedTotal = lockedSubs.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0);
      // Set this subcategory to whatever remains to reach 100%
      categoryWeights[subcategory] = roundToOneDecimal(100 - lockedTotal);
      updatedWeights[category] = categoryWeights;
      onWeightsChange(updatedWeights);
      return;
    }
    
    // Normal case: other subcategories can be adjusted
    
    // Store old value for reference
    const oldValue = categoryWeights[subcategory] || 0;
    // Set new value
    categoryWeights[subcategory] = newValue;
    
    // Calculate the difference that needs to be distributed
    const diff = newValue - oldValue;
    
    if (Math.abs(diff) > 0.01 && otherUnlockedSubs.length > 0) {
      // Calculate the total weight of other unlocked subcategories
      const otherUnlockedTotal = otherUnlockedSubs.reduce(
        (sum, sub) => sum + (categoryWeights[sub] || 0), 0
      );
      
      if (otherUnlockedTotal <= 0.01) {
        // If other unlocked weights sum to near-zero, distribute equally
        const adjustmentPerSub = roundToOneDecimal(-diff / otherUnlockedSubs.length);
        otherUnlockedSubs.forEach(sub => {
          categoryWeights[sub] = Math.max(0, adjustmentPerSub);
        });
      } else {
        // Distribute proportionally
        otherUnlockedSubs.forEach(sub => {
          const currentWeight = categoryWeights[sub] || 0;
          const proportion = currentWeight / otherUnlockedTotal;
          const adjustment = roundToOneDecimal(-diff * proportion);
          categoryWeights[sub] = Math.max(0, roundToOneDecimal(currentWeight + adjustment));
        });
      }
    }
    
    // Final check to ensure exactly 100% total
    const total = subcategories.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      // Adjust the largest unlocked subcategory to make the total exactly 100%
      const sortedUnlocked = [...otherUnlockedSubs].sort(
        (a, b) => (categoryWeights[b] || 0) - (categoryWeights[a] || 0)
      );
      
      if (sortedUnlocked.length > 0) {
        const adjustment = 100 - total;
        const subToAdjust = sortedUnlocked[0];
        categoryWeights[subToAdjust] = Math.max(0, roundToOneDecimal(categoryWeights[subToAdjust] + adjustment));
      } else if (!lockedCategories[`${category}-${subcategory}`]) {
        // If no other unlocked subcategories, adjust this one
        categoryWeights[subcategory] = roundToOneDecimal(100 - (total - categoryWeights[subcategory]));
      }
    }
    
    updatedWeights[category] = categoryWeights;
    onWeightsChange(updatedWeights);
  }, [weights, lockedCategories, onWeightsChange]);

  // Increment weight by step size
  const incrementWeight = useCallback((category: string, subcategory: string, currentWeight: number) => {
    handleWeightChange(category, subcategory, currentWeight + STEP_SIZE);
  }, [handleWeightChange, STEP_SIZE]);

  // Decrement weight by step size
  const decrementWeight = useCallback((category: string, subcategory: string, currentWeight: number) => {
    handleWeightChange(category, subcategory, currentWeight - STEP_SIZE);
  }, [handleWeightChange, STEP_SIZE]);

  // Handle direct input changes
  const handleInputChange = useCallback((category: string, subcategory: string, valueStr: string) => {
    // Only process valid numbers
    if (/^\d+(\.\d*)?$/.test(valueStr)) {
      const newValue = parseFloat(valueStr);
      if (!isNaN(newValue)) {
        handleWeightChange(category, subcategory, newValue);
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
        const subcategoriesInCategory = Object.keys(categoryData);
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

            {/* Card Content: Weight Controls for Subcategories */}
            <CardContent className="p-4 md:p-6">
              <div className="space-y-5">
                {subcategoriesInCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subcategories defined for {category}.</p>
                ) : (
                  subcategoriesInCategory.map((subcategory) => {
                    const weight = categoryData[subcategory] ?? 0;
                    const isLocked = lockedCategories[`${category}-${subcategory}`] ?? false;
                    const recommendedWeight = recommendedWeights?.[category]?.[subcategory];
                    const showRecommended = recommendedWeight !== undefined && Math.abs(recommendedWeight - weight) > 0.1;

                    return (
                      <div key={subcategory} className="space-y-2">
                        {/* Subcategory Label and Lock Button */}
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onToggleLock(category, subcategory)}
                                      className="h-7 w-7 flex-shrink-0"
                                      aria-label={isLocked ? `Unlock ${subcategory}` : `Lock ${subcategory}`}
                                    >
                                      {isLocked ? (
                                        <Lock className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Unlock className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                      )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isLocked 
                                    ? `Unlock ${subcategory} weight to allow automatic adjustment` 
                                    : `Lock ${subcategory} weight to prevent automatic adjustment`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium text-sm truncate" title={subcategory}>{subcategory}</span>
                          </div>

                          {/* Recommended Value */}
                          {showRecommended && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              (Rec: {recommendedWeight.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                        
                        {/* Weight Control Section */}
                        <div className="flex items-center space-x-2">
                          {/* Decrement Button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  disabled={isLocked || weight <= 0 || subcategoriesInCategory.length === 1}
                                  onClick={() => decrementWeight(category, subcategory, weight)}
                                  className="h-8 w-8 flex-shrink-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Decrease by {STEP_SIZE}%</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {/* Input Field */}
                          <div className="relative flex-1 max-w-[100px]">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={weight.toFixed(1)}
                              onChange={(e) => handleInputChange(category, subcategory, e.target.value)}
                              disabled={isLocked || subcategoriesInCategory.length === 1}
                              className={cn(
                                "h-8 text-right pr-7 font-medium tabular-nums",
                                (isLocked || subcategoriesInCategory.length === 1) && "opacity-70"
                              )}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              %
                            </span>
                          </div>
                          
                          {/* Increment Button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  disabled={isLocked || weight >= 100 || subcategoriesInCategory.length === 1}
                                  onClick={() => incrementWeight(category, subcategory, weight)}
                                  className="h-8 w-8 flex-shrink-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Increase by {STEP_SIZE}%</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {/* Visual Weight Indicator Bar */}
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

                {/* Show a note when only one subcategory exists */}
                {subcategoriesInCategory.length === 1 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    This category has only one subcategory, so it must be 100%.
                  </p>
                )}

                {/* Show a warning within the card if the total is off */}
                {!isBalanced && subcategoriesInCategory.length > 0 && (
                  <p className="text-xs text-destructive text-center pt-2">
                    Weights in this category do not sum to 100%.
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
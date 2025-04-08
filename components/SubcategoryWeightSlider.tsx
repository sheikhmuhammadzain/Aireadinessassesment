import { useCallback } from "react"; // Only need useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertCircle } from "lucide-react";
import { SubcategoryWeights } from "@/types"; // Ensure this path is correct for your project
import { cn } from "@/lib/utils"; // Ensure this path is correct for your project
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function for precise rounding (can be kept here or moved to a utils file)
const roundToOneDecimal = (num: number): number => {
  // Adding a small epsilon helps with floating point inaccuracies near .05
  return parseFloat((num + 1e-9).toFixed(1));
};

/**
 * Props for the SubcategoryWeightSlider component.
 * This component handles weight redistribution internally to ensure that
 * subcategory weights within each category always sum to 100%.
 */
interface SubcategoryWeightSliderProps {
  // --- Data Props (Controlled State from Parent) ---
  /** The current weights for all subcategories, grouped by category. */
  weights: SubcategoryWeights;
  /** The state of which subcategories are locked, preventing adjustment. Key format: `${category}-${subcategory}` */
  lockedCategories: Record<string, boolean>;
  /** An array of category names to be displayed in order. */
  categories: string[];
  /** Optional recommended weights to display alongside the current weights. */
  recommendedWeights?: SubcategoryWeights;

  // --- Callbacks to Parent ---
  /**
   * Callback function triggered when weights are adjusted.
   * The parent component receives the updated weights after
   * redistribution has been performed to ensure the total is 100%.
   */
  onWeightsChange: (newWeights: SubcategoryWeights) => void;
  /**
   * Callback function triggered when a lock/unlock button is clicked.
   * The parent MUST implement the logic to update the lock state.
   * @param category - The category of the subcategory being locked/unlocked.
   * @param subcategory - The specific subcategory being locked/unlocked.
   */
  onToggleLock: (category: string, subcategory: string) => void;

  // --- Optional UI/Action Props ---
  /** Optional function to call when a confirmation button (if displayed) is clicked. */
  onSubmit?: () => void;
  /** Optional flag to indicate a loading state (e.g., for the submit button). */
  loading?: boolean;
}

/**
 * SubcategoryWeightSlider Component:
 * Displays sliders for adjusting subcategory weights within categories with automatic redistribution.
 * Key features:
 * - Maintains 100% total within each category
 * - When one slider is adjusted, others automatically rebalance proportionally
 * - Support for locking specific subcategories to prevent automatic adjustment
 * - Automatic precision adjustment to ensure exact 100% sum
 */
export function SubcategoryWeightSlider({
  weights, // Directly use the prop for display
  recommendedWeights,
  onWeightsChange, // Callback to parent for handling changes
  onSubmit,
  loading = false,
  lockedCategories,
  onToggleLock,     // Callback to parent for handling lock changes
  categories
}: SubcategoryWeightSliderProps) {

  // No internal local state for weights is needed. This component is controlled by the parent.

  // Implement weight redistribution like the assessment page
  const handleSliderChange = useCallback((category: string, changedSubcategory: string, newValueInput: number) => {
    // Create a deep copy of the weights
    const updatedWeights = JSON.parse(JSON.stringify(weights));
    const categoryWeights = updatedWeights[category] || {};
    const subcategories = Object.keys(categoryWeights);
    
    // 1. Sanitize Input & Identify Subcategories
    const newValue = roundToOneDecimal(Math.max(0, Math.min(100, newValueInput)));
    const lockedSubs = subcategories.filter(sub => lockedCategories[`${category}-${sub}`]);
    const unlockedSubs = subcategories.filter(sub => !lockedCategories[`${category}-${sub}`]);
    const otherUnlockedSubs = unlockedSubs.filter(sub => sub !== changedSubcategory);
    
    // 2. Calculate Locked Total (weight that can't be redistributed)
    const lockedTotal = roundToOneDecimal(
      lockedSubs.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0)
    );
    
    // 3. Calculate Available Pool for Unlocked Items
    const targetTotalForUnlocked = roundToOneDecimal(Math.max(0, 100 - lockedTotal));
    
    // 4. Set the new value, making sure it doesn't exceed what's available
    const actualNewValue = roundToOneDecimal(Math.min(newValue, targetTotalForUnlocked));
    categoryWeights[changedSubcategory] = actualNewValue;
    
    // 5. Redistribute remaining weight among other unlocked sliders
    if (otherUnlockedSubs.length > 0) {
      // Calculate how much is left for other unlocked sliders
      const remainingForOthers = roundToOneDecimal(targetTotalForUnlocked - actualNewValue);
      
      // Calculate the current total of other unlocked sliders before adjustment
      const currentTotalOfOthers = roundToOneDecimal(
        otherUnlockedSubs.reduce((sum, sub) => sum + (weights[category]?.[sub] || 0), 0)
      );
      
      if (currentTotalOfOthers > 0) {
        // Proportional distribution based on current values
        const scalingFactor = remainingForOthers / currentTotalOfOthers;
        
        otherUnlockedSubs.forEach(sub => {
          const originalWeight = weights[category]?.[sub] || 0;
          categoryWeights[sub] = roundToOneDecimal(Math.max(0, originalWeight * scalingFactor));
        });
      } else {
        // Equal distribution if original values sum to zero
        const weightPerSub = roundToOneDecimal(remainingForOthers / otherUnlockedSubs.length);
        otherUnlockedSubs.forEach(sub => {
          categoryWeights[sub] = weightPerSub;
        });
      }
    }
    
    // 6. Final precision adjustment to ensure exact 100% total
    const finalSum = roundToOneDecimal(
      subcategories.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0)
    );
    const finalDifference = roundToOneDecimal(100 - finalSum);
    
    if (Math.abs(finalDifference) > 0.01 && unlockedSubs.length > 0) {
      // Prioritize adjusting the slider that was changed if it's unlocked
      const adjustmentTarget = unlockedSubs.includes(changedSubcategory) 
        ? changedSubcategory 
        : unlockedSubs[0];
      
      categoryWeights[adjustmentTarget] = roundToOneDecimal(
        Math.max(0, (categoryWeights[adjustmentTarget] || 0) + finalDifference)
      );
    }
    
    // 7. Update the category in the main weights object
    updatedWeights[category] = categoryWeights;
    
    // 8. Call the parent's callback with the updated weights
    onWeightsChange(updatedWeights);
  }, [weights, lockedCategories, onWeightsChange]);

  // Helper to calculate the total for a category based *only* on the current weights prop.
  const getCategoryTotal = useCallback((category: string): number => {
    if (!weights[category]) return 0;
    const categoryValues = weights[category];
    // Ensure values are numbers before summing
    const sum = Object.values(categoryValues).reduce((acc, weight) => acc + (Number(weight) || 0), 0);
    return roundToOneDecimal(sum);
  }, [weights]); // Depends only on the weights prop from the parent


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

      {/* Map through the categories provided by the parent */}
      {categories.map((category) => {
        // Get category data directly from the weights prop
        const categoryData = weights[category] || {};
        const subcategoriesInCategory = Object.keys(categoryData);
        const categoryTotal = getCategoryTotal(category);
        // Check if the total (based on current props) is close to 100
        const isBalanced = Math.abs(categoryTotal - 100) < 0.05; // Tolerance for float issues

        return (
          <Card key={category} className="overflow-hidden border-border/70 shadow-sm">
            {/* Card Header: Category Title and Total */}
            <CardHeader className="bg-muted/30 px-4 py-3 md:px-6 md:py-4"> {/* Slightly reduced padding */}
              <div className="flex justify-between items-center">
                 <CardTitle className="text-base font-semibold">{category}</CardTitle>
                 <CardDescription className={cn(
                     "text-sm", // Base size
                     !isBalanced && "flex items-center gap-1" // Add gap for icon if unbalanced
                 )}>
                    Total: <span className={cn(
                      "font-bold",
                      isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive animate-pulse'
                     )}>{categoryTotal.toFixed(1)}%</span> / 100%
                    {/* Show warning icon only if unbalanced */}
                    {!isBalanced && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                 </CardDescription>
              </div>
            </CardHeader>

            {/* Card Content: Sliders for Subcategories */}
            <CardContent className="p-4 md:p-6">
              <div className="space-y-5">
                {/* Handle case where a category might have no subcategories defined */}
                {subcategoriesInCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subcategories defined for {category}.</p>
                ) : (
                  // Map through subcategories within this category
                  subcategoriesInCategory.map((subcategory) => {
                    const weight = categoryData[subcategory] ?? 0; // Default to 0 if undefined
                    const isLocked = lockedCategories[`${category}-${subcategory}`] ?? false; // Check lock state from props
                    const recommendedWeight = recommendedWeights?.[category]?.[subcategory];
                    // Show recommended weight if it exists and differs noticeably from current
                    const showRecommended = recommendedWeight !== undefined && Math.abs(recommendedWeight - weight) > 0.1;

                    // Slider max is always 100 for the visual range.
                    // Actual effective maximum is enforced by the parent's logic.
                    const maxSliderValue = 100;

                    return (
                      <div key={subcategory} className="space-y-2">
                        {/* Subcategory Label, Lock Button, Value */}
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                          {/* Lock Button + Label Section (flex-1 allows label to truncate) */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button
                                      variant="ghost"
                                      size="icon"
                                      // Call parent's toggle lock handler directly
                                      onClick={() => onToggleLock(category, subcategory)}
                                      className="h-7 w-7 flex-shrink-0" // Slightly smaller button
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
                            {/* Label - allow truncation */}
                            <span className="font-medium text-sm truncate" title={subcategory}>{subcategory}</span>
                          </div>

                          {/* Value + Recommended Section (flex-shrink-0 prevents shrinking) */}
                          <div className="flex items-baseline gap-2 flex-shrink-0">
                            {/* Recommended Value (Optional) */}
                            {showRecommended && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                (Rec: {recommendedWeight.toFixed(1)}%)
                              </span>
                            )}
                            {/* Current Value Display */}
                             <span className={cn(
                                "text-base font-semibold w-16 text-right tabular-nums", // Fixed width, right-aligned numbers
                                isLocked && "text-primary/90" // Style locked value slightly
                                )}>
                              {/* Display the weight directly from the prop */}
                              {weight.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* The Slider Input */}
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Slider
                                value={[weight]} // Slider value controlled by the 'weights' prop
                                // Call the weight redistribution handler
                                onValueChange={([value]) => handleSliderChange(category, subcategory, value)}
                                min={0}
                                max={maxSliderValue} // Visual max is 100
                                step={0.1} // Fine-grained adjustment
                                disabled={isLocked} // Disable slider if locked
                                className={cn("w-full cursor-pointer", isLocked && 'opacity-50 cursor-not-allowed')}
                                aria-label={`Weight for ${subcategory}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="center">
                              <p className="max-w-[220px] text-center text-xs">
                                Adjusting this weight will automatically redistribute the remaining weight among unlocked subcategories
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })
                )}

                {/* Show a warning within the card if the parent's state indicates imbalance */}
                 {!isBalanced && subcategoriesInCategory.length > 0 && (
                    <p className="text-xs text-destructive text-center pt-2">
                         Weights in this category do not sum to 100%.
                         {/* Parent component should handle the actual adjustment logic */}
                    </p>
                 )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Optional Submit button (if used, likely for confirming weights before proceeding) */}
      {onSubmit && (
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Weights & Proceed {/* Example Text */}
          </Button>
        </div>
      )}
    </div>
  );
}
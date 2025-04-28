import { useCallback } from "react"; // Only need useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, AlertCircle } from "lucide-react";
import { CategoryWeights } from "@/types"; // Ensure this path is correct for your project
import { cn } from "@/lib/utils"; // Ensure this path is correct for your project
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function for precise rounding (can be kept here or moved to a utils file)
const roundToOneDecimal = (num: number): number => {
  // Adding a small epsilon helps with floating point inaccuracies near .05
  return parseFloat((num + 1e-9).toFixed(1));
};

/**
 * Props for the CategoryWeightSlider component.
 * This component handles weight redistribution internally to ensure that
 * category weights within each pillar always sum to 100%.
 */
interface CategoryWeightSliderProps {
  // --- Data Props (Controlled State from Parent) ---
  /** The current weights for all categories, grouped by pillar. */
  weights: CategoryWeights;
  /** The state of which categories are locked, preventing adjustment. Key format: `${pillar}-${category}` */
  lockedCategories: Record<string, boolean>;
  /** An array of pillar names to be displayed in order. */
  categories: string[];
  /** Optional recommended weights to display alongside the current weights. */
  recommendedWeights?: CategoryWeights;

  // --- Callbacks to Parent ---
  /**
   * Callback function triggered when weights are adjusted.
   * The parent component receives the updated weights after
   * redistribution has been performed to ensure the total is 100%.
   */
  onWeightsChange: (newWeights: CategoryWeights) => void;
  /**
   * Callback function triggered when a lock/unlock button is clicked.
   * The parent MUST implement the logic to update the lock state.
   * @param pillar - The pillar of the category being locked/unlocked.
   * @param category - The specific category being locked/unlocked.
   */
  onToggleLock: (pillar: string, category: string) => void;

  // --- Optional UI/Action Props ---
  /** Optional function to call when a confirmation button (if displayed) is clicked. */
  onSubmit?: () => void;
  /** Optional flag to indicate a loading state (e.g., for the submit button). */
  loading?: boolean;
}

/**
 * CategoryWeightSlider Component:
 * Displays sliders for adjusting category weights within pillars with automatic redistribution.
 * Key features:
 * - Maintains 100% total within each pillar
 * - When one slider is adjusted, others automatically rebalance proportionally
 * - Support for locking specific categories to prevent automatic adjustment
 * - Automatic precision adjustment to ensure exact 100% sum
 */
export function CategoryWeightSlider({
  weights, // Directly use the prop for display
  recommendedWeights,
  onWeightsChange, // Callback to parent for handling changes
  onSubmit,
  loading = false,
  lockedCategories,
  onToggleLock,     // Callback to parent for handling lock changes
  categories
}: CategoryWeightSliderProps) {

  // No internal local state for weights is needed. This component is controlled by the parent.

  // Implement weight redistribution like the assessment page
  const handleSliderChange = useCallback((pillar: string, changedCategory: string, newValueInput: number) => {
    // Create a deep copy of the weights
    const updatedWeights = JSON.parse(JSON.stringify(weights));
    const pillarWeights = updatedWeights[pillar] || {};
    const categories = Object.keys(pillarWeights);
    
    // 1. Sanitize Input & Identify Categories
    const newValue = roundToOneDecimal(Math.max(0, Math.min(100, newValueInput)));
    const lockedCats = categories.filter(cat => lockedCategories[`${pillar}-${cat}`]);
    const unlockedCats = categories.filter(cat => !lockedCategories[`${pillar}-${cat}`]);
    const otherUnlockedCats = unlockedCats.filter(cat => cat !== changedCategory);
    
    // 2. Calculate Locked Total (weight that can't be redistributed)
    const lockedTotal = roundToOneDecimal(
      lockedCats.reduce((sum, cat) => sum + (pillarWeights[cat] || 0), 0)
    );
    
    // 3. Calculate Available Pool for Unlocked Items
    const targetTotalForUnlocked = roundToOneDecimal(Math.max(0, 100 - lockedTotal));
    
    // 4. Set the new value, making sure it doesn't exceed what's available
    const actualNewValue = roundToOneDecimal(Math.min(newValue, targetTotalForUnlocked));
    pillarWeights[changedCategory] = actualNewValue;
    
    // 5. Redistribute remaining weight among other unlocked sliders
    if (otherUnlockedCats.length > 0) {
      // Calculate how much is left for other unlocked sliders
      const remainingForOthers = roundToOneDecimal(targetTotalForUnlocked - actualNewValue);
      
      // Calculate the current total of other unlocked sliders before adjustment
      const currentTotalOfOthers = roundToOneDecimal(
        otherUnlockedCats.reduce((sum, cat) => sum + (weights[pillar]?.[cat] || 0), 0)
      );
      
      if (currentTotalOfOthers > 0) {
        // Proportional distribution based on current values
        const scalingFactor = remainingForOthers / currentTotalOfOthers;
        
        otherUnlockedCats.forEach(cat => {
          const originalWeight = weights[pillar]?.[cat] || 0;
          pillarWeights[cat] = roundToOneDecimal(Math.max(0, originalWeight * scalingFactor));
        });
      } else {
        // Equal distribution if original values sum to zero
        const weightPerCat = roundToOneDecimal(remainingForOthers / otherUnlockedCats.length);
        otherUnlockedCats.forEach(cat => {
          pillarWeights[cat] = weightPerCat;
        });
      }
    }
    
    // 6. Final precision adjustment to ensure exact 100% total
    const finalSum = roundToOneDecimal(
      categories.reduce((sum, cat) => sum + (pillarWeights[cat] || 0), 0)
    );
    const finalDifference = roundToOneDecimal(100 - finalSum);
    
    if (Math.abs(finalDifference) > 0.01 && unlockedCats.length > 0) {
      // Prioritize adjusting the slider that was changed if it's unlocked
      const adjustmentTarget = unlockedCats.includes(changedCategory) 
        ? changedCategory 
        : unlockedCats[0];
      
      pillarWeights[adjustmentTarget] = roundToOneDecimal(
        Math.max(0, (pillarWeights[adjustmentTarget] || 0) + finalDifference)
      );
    }
    
    // 7. Update the pillar in the main weights object
    updatedWeights[pillar] = pillarWeights;
    
    // 8. Call the parent's callback with the updated weights
    onWeightsChange(updatedWeights);
  }, [weights, lockedCategories, onWeightsChange]);

  // Helper to calculate the total for a pillar based *only* on the current weights prop.
  const getPillarTotal = useCallback((pillar: string): number => {
    if (!weights[pillar]) return 0;
    const pillarValues = weights[pillar];
    // Ensure values are numbers before summing
    const sum = Object.values(pillarValues).reduce((acc, weight) => acc + (Number(weight) || 0), 0);
    return roundToOneDecimal(sum);
  }, [weights]); // Depends only on the weights prop from the parent


  return (
    <div className="space-y-6">
      {/* Display loading placeholder if pillar list is empty */}
      {categories.length === 0 && (
         <Card>
            <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">Loading weight categories...</p>
            </CardContent>
         </Card>
      )}

      {/* Map through the pillars provided by the parent */}
      {categories.map((pillar) => {
        // Get pillar data directly from the weights prop
        const pillarData = weights[pillar] || {};
        const categoriesInPillar = Object.keys(pillarData);
        const pillarTotal = getPillarTotal(pillar);
        // Check if the total (based on current props) is close to 100
        const isBalanced = Math.abs(pillarTotal - 100) < 0.05; // Tolerance for float issues

        return (
          <Card key={pillar} className="overflow-hidden border-border/70 shadow-sm">
            {/* Card Header: Pillar Title and Total */}
            <CardHeader className="bg-muted/30 px-4 py-3 md:px-6 md:py-4"> {/* Slightly reduced padding */}
              <div className="flex justify-between items-center">
                 <CardTitle className="text-base font-semibold">{pillar}</CardTitle>
                 <CardDescription className={cn(
                     "text-sm", // Base size
                     !isBalanced && "flex items-center gap-1" // Add gap for icon if unbalanced
                 )}>
                    Total: <span className={cn(
                      "font-bold",
                      isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive animate-pulse'
                     )}>{pillarTotal.toFixed(1)}%</span> / 100%
                    {/* Show warning icon only if unbalanced */}
                    {!isBalanced && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                 </CardDescription>
              </div>
            </CardHeader>

            {/* Card Content: Sliders for Categories */}
            <CardContent className="p-4 md:p-6">
              <div className="space-y-5">
                {/* Handle case where a pillar might have no categories defined */}
                {categoriesInPillar.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories defined for {pillar}.</p>
                ) : (
                  // Map through categories within this pillar
                  categoriesInPillar.map((category) => {
                    const weight = pillarData[category] ?? 0; // Default to 0 if undefined
                    const isLocked = lockedCategories[`${pillar}-${category}`] ?? false; // Check lock state from props
                    const recommendedWeight = recommendedWeights?.[pillar]?.[category];
                    // Show recommended weight if it exists and differs noticeably from current
                    const showRecommended = recommendedWeight !== undefined && Math.abs(recommendedWeight - weight) > 0.1;

                    // Slider max is always 100 for the visual range.
                    // Actual effective maximum is enforced by the parent's logic.
                    const maxSliderValue = 100;

                    return (
                      <div key={category} className="space-y-2">
                        {/* Category Label, Lock Button, Value */}
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
                                      onClick={() => onToggleLock(pillar, category)}
                                      className="h-7 w-7 flex-shrink-0" // Slightly smaller button
                                      aria-label={isLocked ? `Unlock ${category}` : `Lock ${category}`}
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
                                     ? `Unlock ${category} weight to allow automatic adjustment` 
                                     : `Lock ${category} weight to prevent automatic adjustment`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {/* Category name (truncate with ellipsis if too long) */}
                            <span 
                              className="font-medium truncate"
                              title={category} // Show full name on hover
                            >
                              {category}
                            </span>
                          </div>
                          
                          {/* Current value display (with optional recommended value) */}
                          <div className="flex items-center gap-1">
                            <span className="font-medium tabular-nums text-sm">
                              {weight.toFixed(1)}%
                            </span>
                            {showRecommended && (
                              <span className="text-xs text-muted-foreground opacity-75">
                                (rec: {recommendedWeight.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Slider itself - Visual weight control */}
                        <div className="flex items-center">
                          <div className="w-full">
                            <Slider 
                              value={[weight]} 
                              min={0}
                              max={maxSliderValue}
                              step={0.1}
                              disabled={isLocked || categoriesInPillar.length === 1}
                              onValueChange={(values) => {
                                if (values[0] !== weight) {
                                  handleSliderChange(pillar, category, values[0]);
                                }
                              }}
                              className={cn(
                                "cursor-pointer", 
                                isLocked && "opacity-60 cursor-not-allowed"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Show a note when only one category exists */}
                {categoriesInPillar.length === 1 && (
                  <p className="text-xs text-muted-foreground text-center">
                    This pillar has only one category, so it must be 100%.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Optional Submit Button - Show if onSubmit prop is provided */}
      {onSubmit && (
        <div className="flex justify-end mt-6">
          <Button 
            onClick={onSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Weights
          </Button>
        </div>
      )}
    </div>
  );
}
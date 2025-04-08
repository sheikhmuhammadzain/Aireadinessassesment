// SubcategoryWeightAdjustment.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock } from "lucide-react";
import { SubcategoryWeights } from "@/types"; // Import the type

// Helper function for precise rounding
const roundToOneDecimal = (num: number): number => {
  return parseFloat(num.toFixed(1));
};

interface SubcategoryWeightAdjustmentProps {
  weights: SubcategoryWeights;
  recommendedWeights?: SubcategoryWeights;
  onWeightsChange: (newWeights: SubcategoryWeights) => void;
  onSubmit?: () => void;
  loading?: boolean;
  lockedCategories: Record<string, boolean>; // Key format: `${category}-${subcategory}`
  onToggleLock: (category: string, subcategory: string) => void;
  categories: string[];
}

export function SubcategoryWeightAdjustment({
  weights,
  recommendedWeights,
  onWeightsChange,
  onSubmit,
  loading = false,
  lockedCategories,
  onToggleLock,
  categories
}: SubcategoryWeightAdjustmentProps) {
  // Initialize state with a deep copy
  const [localWeights, setLocalWeights] = useState<SubcategoryWeights>(() => 
    JSON.parse(JSON.stringify(weights))
  );
  
  // Use a ref to track if we're currently updating
  const isUpdatingRef = useRef(false);

  // Effect to sync local state when the input `weights` prop changes
  useEffect(() => {
    if (!isUpdatingRef.current) {
      setLocalWeights(JSON.parse(JSON.stringify(weights)));
    }
  }, [weights]);

  // The core logic for handling weight changes, memoized with useCallback
  const handleWeightChange = useCallback((category: string, changedSubcategory: string, newValue: number) => {
    // Mark that we're updating to prevent sync loops
    isUpdatingRef.current = true;
    
    // Create a deep copy to avoid mutation issues
    const updatedWeights = JSON.parse(JSON.stringify(localWeights));
    const categoryWeights = updatedWeights[category] || {};
    const subcategories = Object.keys(categoryWeights);

    // --- 1. Identify subcategory types ---
    const lockedSubs = subcategories.filter(sub => lockedCategories[`${category}-${sub}`]);
    const unlockedSubs = subcategories.filter(sub => !lockedCategories[`${category}-${sub}`]);
    const otherUnlockedSubs = unlockedSubs.filter(sub => sub !== changedSubcategory);

    // --- 2. Calculate locked total ---
    const lockedTotal = roundToOneDecimal(lockedSubs.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0));

    // --- 3. Determine target total for unlocked items ---
    const targetTotalForUnlocked = roundToOneDecimal(100 - lockedTotal);

    // --- 4. Clamp the input value for the changed slider ---
    // It cannot be less than 0 or more than the total available for unlocked items
    const clampedValue = roundToOneDecimal(Math.max(0, Math.min(newValue, targetTotalForUnlocked)));
    categoryWeights[changedSubcategory] = clampedValue; // Apply the clamped value

    // Handle the edge case where only one item is unlocked
    if (unlockedSubs.length === 1 && unlockedSubs[0] === changedSubcategory) {
      categoryWeights[changedSubcategory] = targetTotalForUnlocked; // It must take all available weight
      // Skip distribution logic as there are no others
    } else if (otherUnlockedSubs.length > 0) {
      // --- 5. Calculate remaining weight for *other* unlocked sliders ---
      const remainingWeightForOthers = roundToOneDecimal(targetTotalForUnlocked - clampedValue);

      // --- 6. Get the original total of *other* unlocked sliders (before this change) ---
      const originalTotalOfOthers = roundToOneDecimal(
        otherUnlockedSubs.reduce((sum, sub) => sum + (localWeights[category]?.[sub] || 0), 0)
      );

      // --- 7. Distribute remaining weight proportionally or equally ---
      if (originalTotalOfOthers > 0.05) {
        // Proportional distribution
        otherUnlockedSubs.forEach(sub => {
          const originalWeight = localWeights[category]?.[sub] || 0;
          const proportion = originalWeight / originalTotalOfOthers;
          categoryWeights[sub] = roundToOneDecimal(Math.max(0, proportion * remainingWeightForOthers));
        });
      } else {
        // Equal distribution (if original total was zero or negligible)
        const weightPerSub = roundToOneDecimal(remainingWeightForOthers / otherUnlockedSubs.length);
        otherUnlockedSubs.forEach(sub => {
          categoryWeights[sub] = Math.max(0, weightPerSub);
        });
      }
    }

    // --- 8. Final adjustment pass for precision ---
    // Sum up everything AFTER distribution/clamping
    let currentTotalAfterUpdate = roundToOneDecimal(Object.values(categoryWeights).reduce((sum: number, weight) => sum + (Number(weight) || 0), 0));
    let difference = roundToOneDecimal(100 - currentTotalAfterUpdate);

    // If there's a tiny difference and unlocked items exist, adjust one unlocked item
    if (Math.abs(difference) > 0.01 && unlockedSubs.length > 0) {
      // Prioritize adjusting the slider that was moved, if it's unlocked
      let adjustmentTarget = unlockedSubs.includes(changedSubcategory)
                            ? changedSubcategory
                            : unlockedSubs[unlockedSubs.length - 1]; // Fallback to the last one

      // Apply the difference, ensuring the target doesn't go below zero
      categoryWeights[adjustmentTarget] = roundToOneDecimal(Math.max(0, (categoryWeights[adjustmentTarget] || 0) + difference));
    }

    // Ensure the category exists in the updated object
    updatedWeights[category] = categoryWeights;

    // Update local state
    setLocalWeights(updatedWeights);
    
    // Use requestAnimationFrame to defer parent state update
    requestAnimationFrame(() => {
      onWeightsChange(updatedWeights);
      // Reset update flag after a small delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    });
  }, [localWeights, lockedCategories, onWeightsChange]);

  // Helper to get category total from local state
  const getCategoryTotal = useCallback((category: string): number => {
    if (!localWeights[category]) return 0;
    return roundToOneDecimal(Object.values(localWeights[category]).reduce((sum, weight) => sum + (Number(weight) || 0), 0));
  }, [localWeights]);

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryData = localWeights[category] || {}; 
        const subcategoriesInCategory = Object.keys(categoryData);
        const categoryTotal = getCategoryTotal(category);
        const isBalanced = Math.abs(categoryTotal - 100) < 0.05;

        // Calculate total weight of locked items *within this category* for slider max value logic
        const totalLockedInCategory = roundToOneDecimal(
          subcategoriesInCategory.reduce((sum, sub) => {
            return lockedCategories[`${category}-${sub}`] ? sum + (categoryData[sub] || 0) : sum;
          }, 0)
        );

        return (
          <Card key={category} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>
                Adjust weights for {category} subcategories. Total must equal 100%.
                Current total: <span className={`font-semibold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{categoryTotal.toFixed(1)}%</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subcategoriesInCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subcategories defined for {category}.</p>
                ) : (
                  subcategoriesInCategory.map((subcategory) => {
                    const weight = categoryData[subcategory] ?? 0;
                    const isLocked = lockedCategories[`${category}-${subcategory}`] ?? false;
                    const recommendedWeight = recommendedWeights?.[category]?.[subcategory];
                    const showRecommended = recommendedWeight !== undefined && Math.abs(recommendedWeight - weight) > 0.05;

                    // Max value an *unlocked* slider can reach is 100 minus the locked total
                    const sliderMaxValue = isLocked ? weight : roundToOneDecimal(100 - totalLockedInCategory + (isLocked ? weight : 0));

                    return (
                      <div key={subcategory} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onToggleLock(category, subcategory)}
                              className="h-6 w-6"
                              aria-label={isLocked ? `Unlock ${subcategory}` : `Lock ${subcategory}`}
                            >
                              {isLocked ? (
                                <Lock className="h-4 w-4 text-primary" />
                              ) : (
                                <Unlock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <span className="font-medium text-sm sm:text-base">{subcategory}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold w-16 text-right">
                              {weight.toFixed(1)}%
                            </span>
                            {showRecommended && (
                              <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
                                (Rec: {recommendedWeight.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={([value]) => handleWeightChange(category, subcategory, value)}
                          min={0}
                          max={sliderMaxValue}
                          step={0.1}
                          disabled={isLocked}
                          className={`w-full ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label={`Weight for ${subcategory}`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {onSubmit && (
        <div className="flex justify-end mt-6">
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Weights
          </Button>
        </div>
      )}
    </div>
  );
}
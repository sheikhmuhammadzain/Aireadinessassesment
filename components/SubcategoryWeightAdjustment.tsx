import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock } from "lucide-react";
import { SubcategoryWeights } from "@/types";

interface SubcategoryWeightAdjustmentProps {
  weights: SubcategoryWeights;
  recommendedWeights?: SubcategoryWeights;
  onWeightsChange: (newWeights: SubcategoryWeights) => void;
  onSubmit?: () => void;
  loading?: boolean;
  lockedCategories: Record<string, boolean>;
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
  const [localWeights, setLocalWeights] = useState<SubcategoryWeights>(weights);

  const handleWeightChange = (category: string, subcategory: string, value: number) => {
    const updatedWeights = { ...localWeights };
    if (!updatedWeights[category]) {
      updatedWeights[category] = {};
    }

    // Update the weight for the specific subcategory
    updatedWeights[category][subcategory] = value;

    // Calculate remaining weight for other subcategories
    const categoryWeights = updatedWeights[category];
    const subcategories = Object.keys(categoryWeights);
    const lockedSubcategories = subcategories.filter(sub => lockedCategories[`${category}-${sub}`]);
    const unlockedSubcategories = subcategories.filter(sub => !lockedCategories[`${category}-${sub}`]);

    // Calculate total weight of locked subcategories
    const lockedTotal = lockedSubcategories.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0);

    // Distribute remaining weight among unlocked subcategories
    if (unlockedSubcategories.length > 0) {
      const remainingWeight = 100 - lockedTotal;
      const weightPerUnlocked = remainingWeight / unlockedSubcategories.length;

      unlockedSubcategories.forEach(sub => {
        if (sub !== subcategory) { // Don't update the one being changed
          categoryWeights[sub] = parseFloat(weightPerUnlocked.toFixed(1));
        }
      });
    }

    // Ensure total is exactly 100
    const total = Object.values(categoryWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 100) > 0.1) {
      const factor = 100 / total;
      Object.keys(categoryWeights).forEach(sub => {
        categoryWeights[sub] = parseFloat((categoryWeights[sub] * factor).toFixed(1));
      });
    }

    setLocalWeights(updatedWeights);
    onWeightsChange(updatedWeights);
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>
              Adjust weights for {category} subcategories. Total must equal 100%.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(localWeights[category] || {}).map(([subcategory, weight]) => {
                const isLocked = lockedCategories[`${category}-${subcategory}`];
                const recommendedWeight = recommendedWeights?.[category]?.[subcategory];
                const showRecommended = recommendedWeight !== undefined && recommendedWeight !== weight;

                return (
                  <div key={subcategory} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subcategory}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleLock(category, subcategory)}
                          className="h-6 w-6"
                        >
                          {isLocked ? (
                            <Lock className="h-4 w-4 text-primary" />
                          ) : (
                            <Unlock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {weight.toFixed(1)}%
                        </span>
                        {showRecommended && (
                          <span className="text-sm text-muted-foreground">
                            (Recommended: {recommendedWeight.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={([value]) => handleWeightChange(category, subcategory, value)}
                      min={0}
                      max={100}
                      step={0.1}
                      disabled={isLocked}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      {onSubmit && (
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Weights
          </Button>
        </div>
      )}
    </div>
  );
} 
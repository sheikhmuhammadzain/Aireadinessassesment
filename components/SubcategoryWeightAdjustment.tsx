import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, Loader2, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubcategoryWeights } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface SubcategoryWeightAdjustmentProps {
  weights: SubcategoryWeights;
  recommendedWeights?: SubcategoryWeights;
  onWeightsChange: (weights: SubcategoryWeights) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function SubcategoryWeightAdjustment({ 
  weights, 
  recommendedWeights, 
  onWeightsChange, 
  onSubmit,
  loading = false
}: SubcategoryWeightAdjustmentProps) {
  const [localWeights, setLocalWeights] = useState<SubcategoryWeights>(weights);
  const [totalWeight, setTotalWeight] = useState(100);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    setLocalWeights(weights);
    calculateTotalWeight(weights);
  }, [weights]);

  const calculateTotalWeight = (weightObj: SubcategoryWeights) => {
    let total = 0;
    for (const category in weightObj) {
      for (const subcategory in weightObj[category]) {
        total += weightObj[category][subcategory];
      }
    }
    setTotalWeight(total);
    return total;
  };

  // Calculate the total weight for a specific category
  const getCategoryTotalWeight = (category: string) => {
    if (!localWeights[category]) return 0;
    
    return Object.values(localWeights[category]).reduce((sum, weight) => sum + weight, 0);
  };

  const handleSubcategoryWeightChange = (category: string, subcategory: string, value: number[]) => {
    const newValue = value[0];
    const oldValue = localWeights[category][subcategory];
    const difference = newValue - oldValue;
    
    // Create deep copy of weights
    const updatedWeights = JSON.parse(JSON.stringify(localWeights)) as SubcategoryWeights;
    
    // Update the weight for the selected subcategory
    updatedWeights[category][subcategory] = newValue;
    
    // Get all subcategories except the one being changed
    const allSubcategories: Array<{category: string, subcategory: string, weight: number}> = [];
    for (const cat in updatedWeights) {
      for (const subcat in updatedWeights[cat]) {
        if (cat === category && subcat === subcategory) continue;
        allSubcategories.push({
          category: cat,
          subcategory: subcat,
          weight: updatedWeights[cat][subcat]
        });
      }
    }
    
    // Calculate total weight of other subcategories
    const totalOtherWeights = allSubcategories.reduce((sum, item) => sum + item.weight, 0);
    
    // Distribute the difference proportionally among other subcategories
    if (totalOtherWeights > 0 && difference !== 0) {
      allSubcategories.forEach(item => {
        const proportion = item.weight / totalOtherWeights;
        updatedWeights[item.category][item.subcategory] = Math.max(0, item.weight - (difference * proportion));
      });
    }
    
    // Normalize to ensure total is 100
    const total = calculateTotalWeight(updatedWeights);
    if (Math.abs(total - 100) > 0.1) {
      const normalizationFactor = 100 / total;
      for (const cat in updatedWeights) {
        for (const subcat in updatedWeights[cat]) {
          updatedWeights[cat][subcat] = Math.round(updatedWeights[cat][subcat] * normalizationFactor * 10) / 10;
        }
      }
    }
    
    setLocalWeights(updatedWeights);
    onWeightsChange(updatedWeights);
  };

  const resetToRecommended = () => {
    if (recommendedWeights) {
      setLocalWeights(recommendedWeights);
      onWeightsChange(recommendedWeights);
    }
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(cat => cat !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Subcategory Weights</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Adjust the importance of each subcategory. The weights automatically balance to total 100%.
                    {recommendedWeights && " The recommended weights are based on your organization's profile."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Define how important each subcategory is to your assessment (total: {totalWeight.toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Accordion type="multiple" className="w-full" value={expandedCategories} 
            onValueChange={(value) => setExpandedCategories(value)}>
            {Object.keys(localWeights).map((category) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="py-4">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span>{category}</span>
                    <Badge className="ml-2 text-xs">
                      Total: {getCategoryTotalWeight(category).toFixed(1)}%
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 py-2 pl-2">
                    {Object.keys(localWeights[category] || {}).map((subcategory) => (
                      <div key={subcategory} className="space-y-2">
                        <div className="flex justify-between">
                          <Label>{subcategory}</Label>
                          <div className="flex items-center gap-2">
                            {recommendedWeights && (
                              <span className="text-xs text-muted-foreground">
                                (Rec: {recommendedWeights[category]?.[subcategory]?.toFixed(1) || 0}%)
                              </span>
                            )}
                            <span className="font-medium">{localWeights[category][subcategory].toFixed(1)}%</span>
                          </div>
                        </div>
                        <Slider
                          value={[localWeights[category][subcategory] || 0]}
                          min={1}
                          max={20}
                          step={0.1}
                          onValueChange={(value) => handleSubcategoryWeightChange(category, subcategory, value)}
                          className="cursor-pointer"
                        />
                        {subcategory !== Object.keys(localWeights[category]).pop() && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
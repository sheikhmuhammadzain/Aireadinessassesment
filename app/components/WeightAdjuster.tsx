const handleWeightChange = (subcategoryId: string, newValue: number) => {
  if (isNaN(newValue)) return;
  
  // Ensure newValue is between 0 and 100
  newValue = Math.max(0, Math.min(100, newValue));
  
  // Get all unlocked subcategories except the one being changed
  const unlockedSubcategories = Object.entries(weights)
    .filter(([id, { locked }]) => !locked && id !== subcategoryId);
  
  // If all other categories are locked, we can't adjust this one
  if (unlockedSubcategories.length === 0) {
    toast({
      title: "Cannot adjust weight",
      description: "Unlock at least one other category to adjust weights.",
      variant: "destructive"
    });
    return;
  }
  
  // Create new weights object
  const newWeights: SubcategoryWeights = { ...weights };
  
  // Store the old value for calculation
  const oldValue = newWeights[subcategoryId].weight;
  
  // Set the new value for the changed subcategory
  newWeights[subcategoryId].weight = newValue;
  
  // Calculate how much we need to distribute among other unlocked subcategories
  const difference = oldValue - newValue;
  
  // Distribute the difference proportionally among unlocked subcategories
  if (difference !== 0 && unlockedSubcategories.length > 0) {
    const distributionPerCategory = difference / unlockedSubcategories.length;
    
    unlockedSubcategories.forEach(([id]) => {
      newWeights[id].weight += distributionPerCategory;
      // Ensure we don't go below 0
      newWeights[id].weight = Math.max(0, newWeights[id].weight);
    });
  }
  
  // Ensure total is exactly 100% by adjusting the first unlocked category if needed
  const total = Object.values(newWeights).reduce((sum, { weight }) => sum + weight, 0);
  if (Math.abs(total - 100) > 0.01 && unlockedSubcategories.length > 0) {
    const firstUnlockedId = unlockedSubcategories[0][0];
    newWeights[firstUnlockedId].weight += (100 - total);
    // Ensure we don't go below 0
    newWeights[firstUnlockedId].weight = Math.max(0, newWeights[firstUnlockedId].weight);
  }
  
  // Round all values to 1 decimal place for cleaner display
  Object.keys(newWeights).forEach(id => {
    newWeights[id].weight = Math.round(newWeights[id].weight * 10) / 10;
  });
  
  onChange(newWeights);
};

const increaseWeight = (subcategoryId: string) => {
  const currentWeight = weights[subcategoryId].weight;
  handleWeightChange(subcategoryId, currentWeight + STEP_SIZE);
};

const decreaseWeight = (subcategoryId: string) => {
  const currentWeight = weights[subcategoryId].weight;
  handleWeightChange(subcategoryId, currentWeight - STEP_SIZE);
}; 
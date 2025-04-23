/**
 * Weight calculation utilities for consistent handling of weights throughout the application
 */

/**
 * Calculates softmax weights from Q-values
 * @param qValues Q-values representing learned importance
 * @returns Object with softmax weights (0-100 scale)
 */
export function calculateSoftmaxWeights(qValues: Record<string, number>): Record<string, number> {
  const keys = Object.keys(qValues);
  if (keys.length === 0) return {};
  
  // Apply softmax transformation with numerical stability
  const maxQValue = Math.max(...Object.values(qValues).map(v => Number(v) || 0));
  const expValues: Record<string, number> = {};
  let sumExp = 0;
  
  keys.forEach(key => {
    const qValue = Number(qValues[key]) || 0;
    // Use numerically stable softmax by subtracting the max
    const expValue = Math.exp(qValue - maxQValue);
    expValues[key] = expValue;
    sumExp += expValue;
  });
  
  // Calculate final softmax probabilities and convert to percentages
  const softmaxWeights: Record<string, number> = {};
  keys.forEach(key => {
    softmaxWeights[key] = parseFloat(((expValues[key] / sumExp) * 100).toFixed(1));
  });
  
  return softmaxWeights;
}

/**
 * Generates synthetic Q-values for testing/fallback
 * @param categories List of categories
 * @returns Object with synthetic Q-values
 */
export function generateSyntheticQValues(categories: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  categories.forEach(category => {
    // Generate random Q-values between 0.1 and 0.9
    result[category] = 0.1 + Math.random() * 0.8;
  });
  
  return result;
}

/**
 * Blends user weights with softmax weights to create adjusted weights
 * @param userWeights User-defined weights (0-100 scale)
 * @param softmaxWeights Softmax weights from Q-values (0-100 scale)
 * @param blendFactor How much to blend (0 = only user, 1 = only softmax)
 * @returns Blended weights that sum to 100
 */
export function blendWeights(
  userWeights: Record<string, number>,
  softmaxWeights: Record<string, number>,
  blendFactor: number = 0.3
): Record<string, number> {
  const categories = Object.keys(userWeights);
  if (categories.length === 0) return {};
  
  // Create adjusted weights by blending
  const blendedWeights: Record<string, number> = {};
  let totalWeight = 0;
  
  categories.forEach(category => {
    const userWeight = userWeights[category] || 0;
    const softmaxWeight = softmaxWeights[category] || 0;
    
    // Apply blending formula
    blendedWeights[category] = (1 - blendFactor) * userWeight + blendFactor * softmaxWeight;
    totalWeight += blendedWeights[category];
  });
  
  // Normalize to ensure sum is exactly 100
  if (totalWeight > 0) {
    categories.forEach(category => {
      blendedWeights[category] = parseFloat(((blendedWeights[category] / totalWeight) * 100).toFixed(1));
    });
  }
  
  // Final check to ensure exactly 100%
  const finalTotal = Object.values(blendedWeights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(finalTotal - 100) > 0.1 && categories.length > 0) {
    // Adjust the largest category to make the total exactly 100%
    const sorted = [...categories].sort((a, b) => blendedWeights[b] - blendedWeights[a]);
    const largestCategory = sorted[0];
    blendedWeights[largestCategory] += (100 - finalTotal);
  }
  
  return blendedWeights;
}

/**
 * Distribute weights evenly across categories
 * @param categories Array of category names
 * @returns Object with even weight distribution
 */
export function distributeEvenWeights(categories: string[]): Record<string, number> {
  if (categories.length === 0) return {};
  
  const weight = parseFloat((100 / categories.length).toFixed(1));
  const weights: Record<string, number> = {};
  
  // First pass - assign equal weights
  categories.forEach(category => {
    weights[category] = weight;
  });
  
  // Fix any rounding issues
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 100) > 0.01 && categories.length > 0) {
    weights[categories[0]] += (100 - total);
  }
  
  return weights;
}

/**
 * Round to one decimal place
 * @param value Number to round
 * @returns Rounded value
 */
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
} 
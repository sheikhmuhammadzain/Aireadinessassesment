import { GoogleGenerativeAI } from "@google/generative-ai";

// In Next.js, we should use process.env.NEXT_PUBLIC_ for client-side env vars
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
  throw new Error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateRecommendations(category: string, score: number) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `As an AI readiness expert, provide 4 specific, actionable recommendations for improving the "${category}" category where the current score is ${score}%. The recommendations should be tailored to this score level where:
    - Below 30% indicates critical needs requiring fundamental improvements
    - 30-60% suggests developing capabilities needing enhancement
    - 60-80% indicates established capabilities needing optimization
    - Above 80% suggests advanced capabilities needing innovation
    
    Provide the recommendations as a simple list, one per line, with no additional formatting, prefixes, or JSON structure. For example:
    Recommendation 1
    Recommendation 2
    Recommendation 3
    Recommendation 4
    
    Each recommendation should be specific to ${category} and the current maturity level.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract recommendations from the raw text
    const recommendations = text
      .split(/[\n\r]+/) // Split by newlines
      .map(line => line.trim()) // Clean up whitespace
      .filter(line => line.length > 0) // Remove empty lines
      .map(line => line
        .replace(/^[-*\d.\s]+/, '') // Remove leading bullets, numbers, or spaces
        .trim()
      )
      .slice(0, 4); // Take only the first 4 recommendations

    if (recommendations.length > 0) {
      return recommendations;
    }

    // Fallback if no valid recommendations are extracted
    throw new Error('Could not extract recommendations');
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Fallback recommendations if API fails
    return [
      `Establish formal ${category.toLowerCase()} governance framework`,
      `Develop comprehensive ${category.toLowerCase()} policies`,
      `Implement basic ${category.toLowerCase()} training program`,
      `Create ${category.toLowerCase()} risk assessment process`
    ];
  }
}

export async function generateOverallSummary(overallScore: number, categoryScores: Record<string, number>) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `As an AI readiness expert, provide a brief summary (2-3 sentences) of an organization's AI readiness based on:
    Overall Score: ${overallScore}%
    Category Scores: ${JSON.stringify(categoryScores)}
    
    Focus on key strengths and primary areas for improvement. Keep the tone professional and constructive.
    Provide ONLY the summary text, with no additional formatting or prefixes.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback summary if API fails
    return overallScore < 60 
      ? "Your organization needs to improve its AI readiness" 
      : "Your organization has good AI readiness foundations";
  }
}
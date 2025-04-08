import { GoogleGenerativeAI } from "@google/generative-ai";

// In Next.js, we should use process.env.NEXT_PUBLIC_ for client-side env vars
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
  throw new Error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Define queue item interface
interface QueueItem {
  modelName: string;
  prompt: string;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
  retryCount?: number;
}

// Track API requests to prevent rate limiting
const requestQueue: QueueItem[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

// Function to process the request queue
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    // Process the next request in the queue
    const nextRequest = requestQueue.shift();
    if (!nextRequest) return; // Should never happen due to the length check above, but TypeScript needs this
    
    const { modelName, prompt, resolve, reject, retryCount = 0 } = nextRequest;
    
    // Enforce rate limiting - wait if needed
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - timeElapsed));
    }
    
    // Make the API request
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      lastRequestTime = Date.now();
      resolve(result.response.text().trim());
    } catch (error: unknown) {
      console.warn(`Gemini API request failed (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a rate limit error (429) and retry if appropriate
      if (
        retryCount < 3 && 
        error instanceof Error &&
        error.toString().includes('429') && 
        error.toString().includes('quota')
      ) {
        // Calculate exponential backoff delay (1s, 2s, 4s)
        const retryDelay = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limit hit. Retrying in ${retryDelay}ms...`);
        
        // Add back to queue with incremented retry count
        requestQueue.unshift({
          modelName,
          prompt,
          resolve,
          reject,
          retryCount: retryCount + 1
        });
        
        // Wait before processing next item
        await new Promise(r => setTimeout(r, retryDelay));
      } else {
        // Max retries exceeded or different error
        reject(error);
      }
    }
  } catch (error) {
    console.error("Error in queue processing:", error);
  } finally {
    isProcessingQueue = false;
    
    // Continue processing queue if more items exist
    if (requestQueue.length > 0) {
      setTimeout(processQueue, MIN_REQUEST_INTERVAL);
    }
  }
}

// Helper function to queue a Gemini API request
function queueGeminiRequest(modelName: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Add request to queue
    requestQueue.push({ modelName, prompt, resolve, reject });
    
    // Start processing if not already in progress
    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

export async function generateRecommendations(category: string, score: number) {
  try {
    const prompt = `As an AI readiness expert, provide 4 specific, actionable, and detailed recommendations for improving the "${category}" category where the current score is ${score}%. 

The recommendations should be:
1. Tailored specifically to ${category} and the current maturity level
2. Highly detailed and actionable (2-3 sentences each)
3. Strategic but also practical
4. Appropriate for the current score level

Maturity levels:
- Below 30%: Critical needs requiring fundamental improvements
- 30-60%: Developing capabilities needing enhancement
- 60-80%: Established capabilities needing optimization
- Above 80%: Advanced capabilities needing innovation and refinement

For each recommendation, provide both a concise title (1 line) and an elaborative explanation (2-3 sentences of detailed guidance).

Format your response as follows (provide 4 recommendations):
Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]

Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]

And so on for all 4 recommendations...`;

    // Use the queuing mechanism
    const text = await queueGeminiRequest("gemini-2.0-flash-lite", prompt);

    // Parse the recommendations
    const recommendations = [];
    const blocks = text.split(/\n\s*\n/);
    
    for (const block of blocks) {
      const titleMatch = block.match(/Title:\s*(.*?)(?:\n|$)/i);
      const detailsMatch = block.match(/Details:\s*([\s\S]*?)(?=\n\s*Title:|\n\s*$|$)/i);
      
      if (titleMatch && detailsMatch) {
        recommendations.push({
          title: titleMatch[1].trim(),
          details: detailsMatch[1].trim().replace(/\n/g, ' ')
        });
      }
    }

    // Return the parsed recommendations (up to 4)
    if (recommendations.length > 0) {
      return recommendations.slice(0, 4);
    }

    // Fallback if no valid recommendations are extracted
    throw new Error('Could not extract recommendations');
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Fallback recommendations if API fails
    return [
      {
        title: `Establish formal ${category.toLowerCase()} governance framework`,
        details: `Create a comprehensive governance structure with clear roles, responsibilities, and decision-making processes specific to ${category.toLowerCase()}. Implement regular review mechanisms to ensure adherence to policies and effectiveness of the framework.`
      },
      {
        title: `Develop comprehensive ${category.toLowerCase()} policies`,
        details: `Create detailed guidelines and standards that address all aspects of ${category.toLowerCase()} within your organization. Ensure these policies are accessible to all stakeholders and include training on how to implement them effectively.`
      },
      {
        title: `Implement robust ${category.toLowerCase()} training program`,
        details: `Design a multi-tiered training curriculum that addresses different skill levels and roles within the organization related to ${category.toLowerCase()}. Include both theoretical concepts and hands-on practical exercises to ensure knowledge retention and application.`
      },
      {
        title: `Create ${category.toLowerCase()} risk assessment process`,
        details: `Develop a systematic approach to identify, evaluate, and mitigate risks associated with ${category.toLowerCase()} initiatives. Incorporate this assessment into all project planning phases and establish regular reassessment intervals.`
      }
    ];
  }
}

export async function generateOverallSummary(overallScore: number, categoryScores: Record<string, number>) {
  try {
    const prompt = `As an AI readiness expert, provide a comprehensive analysis (3-5 sentences) of an organization's AI readiness based on:
    Overall Score: ${overallScore}%
    Category Scores: ${JSON.stringify(categoryScores)}
    
    Include:
    1. An overall assessment of current maturity
    2. Key strengths based on highest-scoring categories
    3. Primary improvement areas based on lowest-scoring categories
    4. Strategic recommendations that could have the most significant impact
    
    Keep the tone professional, constructive, and forward-looking.
    Provide ONLY the summary text, with no additional formatting or prefixes.`;

    // Use the queuing mechanism
    const text = await queueGeminiRequest("gemini-2.0-flash", prompt);
    return text;
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback summary if API fails
    return overallScore < 60 
      ? "Your organization is in the early stages of AI readiness and requires fundamental improvements in key areas. Focus on establishing strong data governance practices and securing executive sponsorship for AI initiatives. Building a clear AI strategy aligned with business objectives should be your immediate priority." 
      : "Your organization demonstrates solid AI readiness with established capabilities across multiple dimensions. Your strongest areas show advanced practices, while there remain opportunities to optimize processes and governance structures. Consider focusing on scaling successful AI initiatives and enhancing cross-functional collaboration to reach the next level of AI maturity.";
  }
}
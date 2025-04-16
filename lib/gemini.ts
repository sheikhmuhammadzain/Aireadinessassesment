import { GoogleGenerativeAI } from "@google/generative-ai";

// In Next.js, we should use process.env.NEXT_PUBLIC_ for client-side env vars
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Better error handling for missing API key
let genAI: any = null;

try {
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables. Gemini features will be disabled.');
  } else {
    genAI = new GoogleGenerativeAI(apiKey);
  }
} catch (error) {
  console.error('Error initializing Gemini API client:', error);
}

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
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API request timed out after 15s')), 15000)
      );
      
      // Create the actual API request
      const model = genAI.getGenerativeModel({ model: modelName });
      const requestPromise = model.generateContent(prompt);
      
      // Race between the request and the timeout
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      // Check if response is valid with text content
      if (!result || !result.response || typeof result.response.text !== 'function') {
        throw new Error('Invalid response structure from Gemini API');
      }
      
      const responseText = result.response.text().trim();
      
      // Validate response content
      if (!responseText || responseText.length < 10) {
        throw new Error('Response from Gemini API is too short or empty');
      }
      
      lastRequestTime = Date.now();
      resolve(responseText);
    } catch (error: unknown) {
      console.warn(`Gemini API request failed (attempt ${retryCount + 1}):`, error);
      
      // Enhanced error classification and retry logic
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate');
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
      const isServerError = errorMessage.includes('5') || errorMessage.includes('server');
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('connection');
      
      // Determine if this error type is retriable
      const isRetriable = isRateLimit || isTimeout || isServerError || isNetworkError;
      
      if (retryCount < 3 && isRetriable) {
        // Calculate exponential backoff delay with jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 500; // Add up to 500ms of random jitter
        const retryDelay = baseDelay + jitter;
        
        console.log(`Gemini API request failed. Retrying in ${Math.round(retryDelay)}ms...`);
        
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
        // Max retries exceeded or non-retriable error
        reject(error);
      }
    }
  } catch (error) {
    console.error("Error in Gemini queue processing:", error);
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
    // Check if API key is available
    if (!apiKey) {
      console.error('No Gemini API key available');
      // Instead of failing, return a placeholder message
      return resolve("API key not configured. Using fallback response.");
    }
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return reject(new Error('Invalid or empty prompt provided to Gemini API'));
    }
    
    // Add request to queue
    requestQueue.push({ modelName, prompt, resolve, reject });
    
    // Start processing if not already in progress
    if (!isProcessingQueue) {
      processQueue().catch(err => {
        console.error('Unexpected error in Gemini queue processing:', err);
      });
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

IMPORTANT: Format your response EXACTLY as follows (provide exactly 4 recommendations):

Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]

Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]

Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]

Title: [concise recommendation title]
Details: [2-3 sentences with detailed, actionable guidance]`;

    // Use the queuing mechanism
    const text = await queueGeminiRequest("gemini-2.0-flash-lite", prompt);

    // Enhanced robust parsing with multiple approaches
    let recommendations = [];
    
    // First approach: Try parsing by block of text (most reliable)
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

    // Second approach: If first approach yielded no results, try line-by-line parsing
    if (recommendations.length === 0) {
      const lines = text.split('\n');
      let currentTitle = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.toLowerCase().startsWith('title:')) {
          currentTitle = line.substring(6).trim();
        } else if (line.toLowerCase().startsWith('details:') && currentTitle) {
          // Collect all lines until next "Title:" or end
          let details = line.substring(8).trim();
          let j = i + 1;
          
          while (j < lines.length && !lines[j].toLowerCase().startsWith('title:')) {
            if (lines[j].trim()) {
              details += ' ' + lines[j].trim();
            }
            j++;
          }
          
          recommendations.push({
            title: currentTitle,
            details: details
          });
          
          currentTitle = null;
        }
      }
    }
    
    // Third approach: If no structured format is detected, create basic recommendations from text paragraphs
    if (recommendations.length === 0 && text.length > 30) {
      // Fall back to creating basic recommendations from paragraphs
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      // Take up to 4 paragraphs and format them
      for (let i = 0; i < Math.min(paragraphs.length, 4); i++) {
        const para = paragraphs[i].trim();
        
        // Create a basic title by taking first few words
        const basicTitle = para.split(' ').slice(0, 5).join(' ') + '...';
        
        recommendations.push({
          title: `Strategy ${i+1}: ${basicTitle}`,
          details: para
        });
      }
    }

    // Return the parsed recommendations (up to 4)
    if (recommendations.length > 0) {
      return recommendations.slice(0, 4);
    }

    // All parsing methods failed, use fallback recommendations
    console.warn('Could not extract recommendations from text response:', text);
    throw new Error('Could not parse recommendations from model response');
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // Better fallback recommendations
    return generateFallbackRecommendations(category, score);
  }
}

// Moved fallback recommendations to a separate function for better organization
function generateFallbackRecommendations(category: string, score: number) {
  const lowerCategory = category.toLowerCase();
  
  // Different recommendations based on score range
  if (score < 30) {
    // Critical stage recommendations
    return [
      {
        title: `Establish basic ${lowerCategory} framework`,
        details: `Create a foundational governance structure with clearly defined roles and responsibilities specific to ${lowerCategory}. Start with the minimum viable processes and documentation needed to support your immediate AI initiatives.`
      },
      {
        title: `Conduct ${lowerCategory} readiness assessment`,
        details: `Perform a detailed gap analysis to identify critical shortcomings in your current ${lowerCategory} capabilities. Define measurable indicators and establish a baseline to track progress as you implement improvements.`
      },
      {
        title: `Develop essential ${lowerCategory} skills`,
        details: `Identify key team members who require immediate upskilling in ${lowerCategory} capabilities. Implement targeted training programs focusing on fundamental skills that will have the greatest impact on your primary use cases.`
      },
      {
        title: `Create ${lowerCategory} pilot initiative`,
        details: `Launch a small-scale pilot project to apply ${lowerCategory} principles in a controlled environment. Use this as a learning opportunity to identify practical challenges and refine your approach before broader implementation.`
      }
    ];
  } else if (score < 60) {
    // Developing stage recommendations
    return [
      {
        title: `Formalize ${lowerCategory} policies`,
        details: `Document comprehensive policies and guidelines for ${lowerCategory} that align with industry standards and best practices. Ensure these are accessible to all stakeholders and incorporate regular review mechanisms to keep them current.`
      },
      {
        title: `Implement ${lowerCategory} training program`,
        details: `Develop a structured training curriculum tailored to different roles and skill levels within your organization. Include both theoretical concepts and hands-on practice sessions to ensure knowledge is applied effectively.`
      },
      {
        title: `Establish ${lowerCategory} metrics`,
        details: `Define clear, measurable KPIs for ${lowerCategory} performance that align with business objectives. Implement monitoring systems to track these metrics and establish regular reporting mechanisms to drive accountability.`
      },
      {
        title: `Create cross-functional ${lowerCategory} team`,
        details: `Form a dedicated team with representatives from relevant departments to oversee ${lowerCategory} initiatives. Ensure this team has the authority and resources needed to drive changes and improvements across organizational boundaries.`
      }
    ];
  } else if (score < 80) {
    // Established stage recommendations
    return [
      {
        title: `Optimize ${lowerCategory} processes`,
        details: `Review and refine existing ${lowerCategory} workflows to eliminate bottlenecks and improve efficiency. Automate routine tasks where possible and implement continuous improvement mechanisms to adapt to changing requirements.`
      },
      {
        title: `Enhance ${lowerCategory} integration`,
        details: `Strengthen the connections between ${lowerCategory} and other business functions to create a cohesive ecosystem. Develop APIs and standardized interfaces to ensure seamless data flow and functionality across systems.`
      },
      {
        title: `Develop advanced ${lowerCategory} capabilities`,
        details: `Invest in specialized tools and techniques to take your ${lowerCategory} capabilities to the next level. Focus on areas that will create competitive advantage and enable new business opportunities.`
      },
      {
        title: `Establish ${lowerCategory} center of excellence`,
        details: `Create a dedicated center of excellence to promote innovation and best practices in ${lowerCategory}. This team should focus on research, experimentation, and knowledge sharing to drive continuous evolution of capabilities.`
      }
    ];
  } else {
    // Advanced stage recommendations
    return [
      {
        title: `Innovate ${lowerCategory} approaches`,
        details: `Explore cutting-edge methodologies and technologies to push the boundaries of what's possible with ${lowerCategory}. Allocate resources for experiments and proof-of-concepts that could lead to breakthrough capabilities.`
      },
      {
        title: `Develop ${lowerCategory} thought leadership`,
        details: `Position your organization as a thought leader in ${lowerCategory} through publications, speaking engagements, and participation in industry forums. Share insights and best practices to contribute to the broader community while enhancing your reputation.`
      },
      {
        title: `Create strategic ${lowerCategory} partnerships`,
        details: `Identify and cultivate relationships with external organizations that complement your ${lowerCategory} capabilities. These could include academic institutions, technology providers, or industry peers with whom you can collaborate on advanced initiatives.`
      },
      {
        title: `Implement predictive ${lowerCategory} management`,
        details: `Move beyond reactive approaches to develop predictive capabilities that anticipate future ${lowerCategory} needs and challenges. Use advanced analytics and modeling to forecast trends and prepare proactive responses.`
      }
    ];
  }
}

export async function generateOverallSummary(overallScore: number, categoryScores: Record<string, number>) {
  try {
    // Format category scores as a readable string
    const categoryScoresFormatted = Object.entries(categoryScores)
      .map(([category, score]) => `${category}: ${score.toFixed(1)}%`)
      .join('\n- ');

    const prompt = `As an AI readiness expert, provide a comprehensive analysis (3-5 sentences) of an organization's AI readiness based on:

Overall Score: ${overallScore.toFixed(1)}%

Category Scores:
- ${categoryScoresFormatted}

Your analysis MUST include:
1. An overall assessment of current maturity level
2. Key strengths based on highest-scoring categories
3. Primary improvement areas based on lowest-scoring categories
4. Strategic recommendations that could have the most significant impact

Keep the tone professional, constructive, and forward-looking.
IMPORTANT: Provide ONLY the summary text, with no additional formatting or prefixes.`;

    // Use the queuing mechanism
    const text = await queueGeminiRequest("gemini-2.0-flash", prompt);
    
    // Basic validation to ensure we have reasonable content
    if (!text || text.length < 50) {
      console.warn('Summary response is too short or empty:', text);
      throw new Error('Generated summary is insufficient');
    }

    // Clean up text - remove any unexpected formatting
    const cleanedText = text
      .replace(/^(\s*summary:|\s*analysis:|\s*ai readiness analysis:)/i, '')
      .replace(/^["']|["']$/g, '') // Remove quotes if the model added them
      .trim();
      
    return cleanedText;
  } catch (error) {
    console.error('Error generating summary:', error);
    // Improved fallback summary with more detail
    return generateFallbackSummary(overallScore, categoryScores);
  }
}

// Separate function for fallback summaries
function generateFallbackSummary(overallScore: number, categoryScores: Record<string, number>): string {
  // Sort categories by score to identify strengths and weaknesses
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);
  
  const strengths = sortedCategories.slice(0, 2).map(item => item[0]);
  const weaknesses = sortedCategories.slice(-2).map(item => item[0]);
  
  const strengthsText = strengths.join(' and ');
  const weaknessesText = weaknesses.join(' and ');
  
  // Tailored responses based on score ranges
  if (overallScore < 30) {
    return `Your organization is at the beginning of its AI readiness journey with a score of ${overallScore.toFixed(1)}%. While showing emerging capabilities in ${strengthsText}, significant opportunities exist to strengthen foundational elements, particularly in ${weaknessesText}. Establishing clear governance structures and building essential technical capabilities should be immediate priorities to create a solid foundation for AI adoption.`;
  } else if (overallScore < 60) {
    return `Your organization demonstrates developing AI readiness with a score of ${overallScore.toFixed(1)}%. Your relative strengths in ${strengthsText} provide a foundation to build upon, while focused improvement in ${weaknessesText} will address critical gaps. Prioritize formalizing processes, enhancing cross-functional collaboration, and implementing structured training programs to accelerate your AI maturity journey.`;
  } else if (overallScore < 80) {
    return `Your organization shows established AI readiness with a solid score of ${overallScore.toFixed(1)}%. You've developed advanced capabilities in ${strengthsText}, creating competitive advantage in these areas. To reach the next level of AI maturity, focus on optimizing ${weaknessesText} through process refinement, integration improvements, and scaling successful practices across the organization.`;
  } else {
    return `Your organization demonstrates exceptional AI readiness with an impressive score of ${overallScore.toFixed(1)}%. You've achieved advanced capabilities in ${strengthsText}, positioning you as a potential industry leader. Even at this high level of maturity, targeted enhancements in ${weaknessesText} can further strengthen your competitive position through innovation and strategic partnerships.`;
  }
}
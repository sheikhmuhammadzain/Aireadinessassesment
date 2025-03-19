import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
});

/**
 * Search for company information on the internet and suggest pillar weights
 * @param companyInfo Company information
 * @returns Promise with recommended weights and company insights
 */
export async function searchCompanyAndSuggestWeights(companyInfo: {
  name: string;
  size: string;
  industry: string;
  description?: string;
}) {
  try {
    // Create a prompt for the OpenAI API
    const prompt = `
      I need information about ${companyInfo.name}, a ${companyInfo.size} company in the ${companyInfo.industry} industry.
      ${companyInfo.description ? `Additional context: ${companyInfo.description}` : ''}
      
      Based on this company's profile, suggest appropriate weights for an AI readiness assessment across these 7 pillars:
      1. AI Governance
      2. AI Culture
      3. AI Infrastructure
      4. AI Strategy
      5. AI Data
      6. AI Talent
      7. AI Security
      
      The weights should sum to 100%. Consider the company's size, industry, and any other relevant factors.
      Also provide a brief explanation of why you assigned these weights.
      
      Format your response as a JSON object with the following structure:
      {
        "weights": {
          "AI Governance": number,
          "AI Culture": number,
          "AI Infrastructure": number,
          "AI Strategy": number,
          "AI Data": number,
          "AI Talent": number,
          "AI Security": number
        },
        "explanation": "string explaining the rationale",
        "companyInsights": "string with additional insights about the company's AI readiness"
      }
    `;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI readiness expert who helps companies assess their AI readiness. You have extensive knowledge about different industries and company sizes, and how they relate to AI readiness pillars."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error searching company and suggesting weights:", error);
    
    // Return default weights if the API call fails
    return {
      weights: {
        "AI Governance": 14.3,
        "AI Culture": 14.3,
        "AI Infrastructure": 14.3,
        "AI Strategy": 14.3,
        "AI Data": 14.3,
        "AI Talent": 14.3,
        "AI Security": 14.2
      },
      explanation: "Using default weights due to an error in the API call.",
      companyInsights: "Could not retrieve company insights."
    };
  }
}

/**
 * Generate detailed gap analysis for a category
 * @param category Category name
 * @param score Category score
 * @param weight Category weight
 * @returns Promise with gap analysis text
 */
export async function generateGapAnalysis(category: string, score: number, weight: number) {
  try {
    const prompt = `
      As an AI readiness expert, generate a detailed gap analysis for the "${category}" category where:
      - Current score: ${score}%
      - Category weight: ${weight}%
      
      The gap analysis should:
      1. Identify 2-3 specific gaps or limitations in this area based on the score
      2. For each gap, provide a brief explanation of its impact on the organization's AI readiness
      3. Be specific and detailed, using industry-standard terminology
      4. Format each gap as a bold heading followed by 2-3 sentences of explanation
      
      Example format:
      **Limited Real-Time Data Integration**
      While existing pipelines capture transactional data, most are batch-based, limiting the organization's ability to offer dynamic pricing, real-time fraud detection, or instant product recommendations. Delays in data ingestion reduce the effectiveness of AI models that rely on continuous updates.
      
      **Weak Data Lineage Tracking & Transparency**
      The organization lacks comprehensive tools to trace how data moves from capture to consumption within AI models. Without a clear view of data origins, transformations, and usage, it is difficult to maintain model interpretability.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI readiness expert who provides detailed, professional gap analyses for organizations. Your analyses are specific, actionable, and use industry-standard terminology."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return content;
  } catch (error) {
    console.error("Error generating gap analysis:", error);
    return `**${category} Needs Improvement**\nBased on the current score of ${score}%, there are significant opportunities for improvement in this area. A structured approach to enhancing capabilities would yield substantial benefits.`;
  }
}

/**
 * Generate recommendations for addressing gaps
 * @param category Category name
 * @param score Category score
 * @param gapAnalysis The gap analysis text
 * @returns Promise with recommendations text
 */
export async function generateRecommendations(category: string, score: number, gapAnalysis: string) {
  try {
    const prompt = `
      As an AI readiness expert, provide specific recommendations to address the gaps identified in the "${category}" category where the current score is ${score}%.
      
      Gap Analysis:
      ${gapAnalysis}
      
      Please provide:
      1. 3-4 short-term actions (0-6 months) with specific tools, frameworks, or approaches
      2. 2-3 long-term actions (6+ months) that build on the short-term actions
      3. For each recommendation, include an expected outcome
      
      Format as follows:
      
      **Short-Term (0-6 Months)**
      
      **Action 1: [Action Name]**
      Action: [Specific implementation details with named tools/frameworks]
      Outcome: [Expected result and business impact]
      
      **Action 2: [Action Name]**
      Action: [Specific implementation details with named tools/frameworks]
      Outcome: [Expected result and business impact]
      
      **Long-Term (6+ Months)**
      
      **Action 1: [Action Name]**
      Action: [Specific implementation details with named tools/frameworks]
      Outcome: [Expected result and business impact]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI readiness expert who provides specific, actionable recommendations to address gaps in organizational AI readiness. Your recommendations include specific tools, frameworks, and approaches, along with expected outcomes."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return content;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return `**Recommendations for ${category}**\n\n1. Establish a formal framework for ${category.toLowerCase()}\n2. Develop comprehensive training programs\n3. Implement regular assessments and feedback loops`;
  }
}

/**
 * Generate a comprehensive AI readiness report based on all assessment results
 * @param assessmentResults All assessment results
 * @returns Promise with HTML formatted report
 */
export async function generateDeepResearchReport(assessmentResults: Record<string, any>) {
  try {
    // Create a data summary for the prompt
    const categoriesData = Object.entries(assessmentResults).map(([type, result]) => {
      return {
        category: type,
        overallScore: result.overallScore,
        categoryScores: result.categoryScores
      };
    });

    const overallReadiness = categoriesData.length > 0
      ? Math.round(categoriesData.reduce((sum, cat) => sum + cat.overallScore, 0) / categoriesData.length)
      : 0;

    const prompt = `
      Generate a comprehensive AI Readiness Deep Research Report based on the following assessment data:
      
      Overall AI Readiness Score: ${overallReadiness}%
      
      Assessment Results:
      ${JSON.stringify(categoriesData, null, 2)}
      
      The report should include:
      
      1. Executive Summary
         - Key findings and overall AI readiness posture
         - Major strengths and weaknesses
         - Strategic recommendations
      
      2. Assessment Methodology
         - Methodology overview
         - Assessment categories and their significance
      
      3. Detailed Analysis by Category
         - For each category, provide:
           - Current state assessment
           - Detailed strengths and weaknesses
           - Specific bottlenecks and limitations
           - Industry benchmarking
      
      4. Gap Analysis
         - Identification of significant capability gaps
         - Risk assessment of these gaps
         - Impact on AI adoption and business outcomes
      
      5. Implementation Roadmap
         - Short-term actions (0-6 months)
         - Medium-term initiatives (6-18 months)
         - Long-term transformation (18+ months)
         - Key performance indicators for measuring progress
      
      6. Technology and Infrastructure Recommendations
         - Specific tools and platforms recommended
         - Integration considerations
         - Scalability planning
      
      7. Organizational and Cultural Considerations
         - Required organizational changes
         - Skills development strategy
         - Change management approach
      
      Format the report as a professional HTML document with proper headings, paragraphs, lists, and tables where appropriate.
      Include a table of contents at the beginning. Make it visually organized and easy to read.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an elite AI strategy consultant who specializes in creating comprehensive, actionable AI readiness reports for organizations. Your reports combine strategic insight with practical implementation guidance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Prepare the HTML document with basic styling
    const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Readiness Deep Research Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2C6F9B;
          border-bottom: 2px solid #8ECAE6;
          padding-bottom: 10px;
        }
        h2 {
          color: #2C6F9B;
          border-bottom: 1px solid #8ECAE6;
          padding-bottom: 5px;
          margin-top: 30px;
        }
        h3 {
          color: #4389B0;
          margin-top: 25px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f2f9ff;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .toc {
          background-color: #f2f9ff;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        .toc ul {
          list-style-type: none;
          padding-left: 0;
        }
        .toc ul ul {
          padding-left: 20px;
        }
        .toc a {
          text-decoration: none;
          color: #2C6F9B;
        }
        .toc a:hover {
          text-decoration: underline;
        }
        .executive-summary {
          background-color: #f0f7ff;
          padding: 20px;
          border-left: 4px solid #2C6F9B;
          margin: 20px 0;
        }
        .strength {
          color: #228B22;
        }
        .weakness {
          color: #B22222;
        }
        .roadmap {
          border-left: 4px solid #4389B0;
          padding-left: 15px;
        }
        footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>AI Readiness Deep Research Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </header>
      
      ${content}
      
      <footer>
        <p>© ${new Date().getFullYear()} AI Readiness Assessment Platform | Generated with AI-powered analysis</p>
      </footer>
    </body>
    </html>
    `;

    return htmlReport;
  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Error Generating Report</title>
    </head>
    <body>
      <h1>Error Generating Report</h1>
      <p>We encountered an error while generating your AI readiness report. Please try again later.</p>
      <p>Error details: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    </body>
    </html>
    `;
  }
} 
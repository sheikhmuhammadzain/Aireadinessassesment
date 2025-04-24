import OpenAI from 'openai';
import { calculateSoftmaxWeights } from './utils/weight-calculator';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
});

/**
 * Search for company information on the internet and suggest pillar weights
 * @param companyInfo Only company name is required now
 * @returns Promise with recommended weights and company insights
 */
export async function searchCompanyAndSuggestWeights(companyInfo: {
  name: string;
  size?: string;
  industry?: string;
  description?: string;
}) {
  try {
    // First, search for company information using Serper API
    const companyDetails = await fetchCompanyDetails(companyInfo.name);
    
    // Then, use OpenAI to analyze the results and suggest weights
    const prompt = `
      I need information analysis for ${companyInfo.name}, which is a ${companyDetails.size} company in the ${companyDetails.industry} industry.
      
      Here's what I know about the company:
      ${companyDetails.description}
      
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

    const result = JSON.parse(content);
    
    // Include the company details in the response
    return {
      companyDetails,
      weights: result.weights,
      explanation: result.explanation,
      companyInsights: result.companyInsights
    };
  } catch (error) {
    console.error("Error searching company and suggesting weights:", error);
    
    // Return default weights if the API call fails
    return {
      companyDetails: {
        name: companyInfo.name,
        industry: "Technology",
        size: "Mid-size (100-999 employees)",
        description: "No detailed information available."
      },
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
 * Fetch company details using Serper API
 * @param companyName The company name to search for
 * @returns Company details including industry, size, description and sources
 */
async function fetchCompanyDetails(companyName: string) {
  try {
    // Use the Serper API to search for company information
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.NEXT_PUBLIC_SERPER_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} company information industry size`,
        num: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the search results
    const organicResults = data.organic || [];
    const snippets = organicResults.map((result: any) => result.snippet || '').join(' ');
    
    // Collect sources (up to 3)
    const sources = organicResults.slice(0, 3).map((result: any) => ({
      title: result.title || 'Source',
      link: result.link || '#'
    }));
    
    // Use OpenAI to extract structured information from the search results
    const extractionPrompt = `
      Based on these search results about ${companyName}, extract the following information:
      1. Industry: What industry is the company in?
      2. Size: Estimate the company size (Startup, Small, Mid-size, or Enterprise)
      3. Description: Write a brief 2-3 sentence description of what the company does

      Search results:
      ${snippets}

      Format your response as a JSON object with the following structure:
      {
        "industry": "string - the industry name",
        "size": "string - company size category",
        "description": "string - brief company description"
      }

      If you can't find specific information, make your best guess based on the available data.
    `;

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts structured information about companies from search results."
        },
        {
          role: "user",
          content: extractionPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const extractionContent = extractionResponse.choices[0]?.message?.content;
    if (!extractionContent) {
      throw new Error("No content in extraction response");
    }

    const extractedInfo = JSON.parse(extractionContent);
    
    return {
      name: companyName,
      industry: extractedInfo.industry,
      size: extractedInfo.size,
      description: extractedInfo.description,
      sources: sources
    };
  } catch (error) {
    console.error("Error fetching company details:", error);
    
    // Return default information if the API call fails
    return {
      name: companyName,
      industry: "Technology", // Default assumption
      size: "Mid-size (100-999 employees)", // Default assumption
      description: "No detailed information available.",
      sources: []
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
 * Generates a comprehensive, professional AI Readiness Deep Research Report in HTML format.
 * @param assessmentResults - An object containing assessment data keyed by category type.
 * @param companyName - The name of the company for which to generate the report.
 * @returns A Promise resolving to the HTML report string or an error HTML string.
 */
export async function generateDeepResearchReport(
  assessmentResults: Record<string, any>,
  companyName: string = 'Valued Client'
): Promise<string> {
  try {
    // --- 1. Fetch Company Information ---
    let companyInfo;
    try {
      // Fetch company details using the existing function
      companyInfo = await searchCompanyAndSuggestWeights({ name: companyName });
      console.log("Successfully fetched company information:", companyInfo.companyDetails);
    } catch (error) {
      console.error("Error fetching company information:", error);
      // Create fallback company info if the API call fails
      companyInfo = {
        companyDetails: {
          name: companyName,
          industry: "Technology",
          size: "Mid-size (100-999 employees)",
          description: "No detailed information available.",
          sources: []
        },
        weights: {
          "AI Governance": 14.3,
          "AI Culture": 14.3,
          "AI Infrastructure": 14.3,
          "AI Strategy": 14.3,
          "AI Data": 14.3,
          "AI Talent": 14.3,
          "AI Security": 14.2
        },
        explanation: "Using default weights.",
        companyInsights: "Could not retrieve company insights."
      };
    }

    // --- 2. Data Preparation & Validation ---
    const categoriesData = Object.entries(assessmentResults).map(([type, result]) => {
      // Ensure nested objects exist, even if empty, and scores are numbers
      const safeResult = {
        overallScore: result?.overallScore ?? 0,
        categoryScores: result?.categoryScores ?? {},
        qValues: result?.qValues ?? {},
        adjustedWeights: result?.adjustedWeights ?? {},
        userWeights: result?.userWeights ?? {},
        softmaxWeights: result?.softmaxWeights ?? {}
      };
      
      // If softmaxWeights is empty but we have qValues, generate them using our utility
      if (Object.keys(safeResult.softmaxWeights).length === 0 && Object.keys(safeResult.qValues).length > 0) {
        safeResult.softmaxWeights = calculateSoftmaxWeights(safeResult.qValues);
      }
      
      return {
        category: type,
        overallScore: Number(safeResult.overallScore) || 0, // Ensure score is a number, default to 0
        categoryScores: safeResult.categoryScores,
        qValues: safeResult.qValues,
        adjustedWeights: safeResult.adjustedWeights,
        userWeights: safeResult.userWeights,
        softmaxWeights: safeResult.softmaxWeights
      };
    });

    // Calculate overall readiness score, ensuring division by zero is avoided
    const overallReadiness = categoriesData.length > 0
      ? Math.round(categoriesData.reduce((sum: number, cat: { overallScore: number }) => sum + cat.overallScore, 0) / categoriesData.length)
      : 0; // Default to 0 if no categories

    // --- 3. Enhanced Prompt Engineering ---
    const prompt = `
      Generate an exceptionally comprehensive, highly professional AI Readiness Deep Research Report (target length: 4000-5000 words) based on the following assessment data and company information. Structure the report precisely as outlined below, adhering strictly to the specified sections, content requirements, and word count guidelines. Ensure every data point provided (scores, all weights, Q-values for every subcategory) is explicitly referenced and synthesized into actionable strategic insights.

      Company Information:
      Company Name: ${companyInfo.companyDetails.name}
      Industry: ${companyInfo.companyDetails.industry}
      Size: ${companyInfo.companyDetails.size}
      Description: ${companyInfo.companyDetails.description}
      
      Industry-Specific AI Insights: ${companyInfo.companyInsights || "Not available."}
      Recommended Weight Distribution: ${JSON.stringify(companyInfo.weights)}
      Explanation for Recommended Weights: ${companyInfo.explanation || "Not available."}

      Overall AI Readiness Score: ${overallReadiness}%

      Assessment Data:
      \`\`\`json
      ${JSON.stringify(categoriesData, null, 2)}
      \`\`\`

      Report Structure and Requirements:

      0.  **Table of Contents**
          *   Generate automatically based on the H1 and H2 headings below. Ensure links correctly target the section IDs (using standard HTML heading IDs like \`<h1 id="executive-summary">...\`).

      1.  **<h1 id="executive-summary">Executive Summary</h1>**
          *   **Company-Specific Context:** Begin with a brief but insightful introduction that shows deep understanding of ${companyInfo.companyDetails.name}'s specific industry context (${companyInfo.companyDetails.industry}) and business challenges. Reference key facts about the company.
          *   **Comprehensive Key Findings:** Synthesize the most critical insights from the entire assessment, going beyond simple score reporting. Connect findings explicitly to ${companyInfo.companyDetails.name}'s industry and business context.
          *   **Detailed Overall AI Readiness Posture:** Provide a nuanced narrative of the organization's current position, integrating findings across categories. Benchmark against typical industry peers in ${companyInfo.companyDetails.industry}.
          *   **In-depth Analysis of Major Strengths and Weaknesses:** Identify the top 3-5 core strengths and critical weaknesses, explaining their root causes by referencing specific category/subcategory scores and weights. Quantify impact where possible. Relate specifically to ${companyInfo.companyDetails.name}'s business context.
          *   **Prioritized Strategic Recommendations:** Offer 3-5 high-level strategic recommendations tailored specifically to ${companyInfo.companyDetails.name}'s size (${companyInfo.companyDetails.size}) and industry context, clearly prioritized (e.g., Must Do, Should Do, Could Do) with suggested high-level timelines (e.g., Next 6 months, 6-18 months, 18+ months). Justify prioritization based on gap analysis and potential impact.
          *   **Business Impact Assessment:** Articulate the tangible business consequences (positive and negative) of the current AI readiness state (e.g., impact on efficiency, innovation, competitiveness, risk) within the specific context of ${companyInfo.companyDetails.industry}.

      2.  **<h1 id="assessment-methodology">Assessment Methodology </h1>**
          *   **Detailed Methodology Overview:** Explain the assessment framework, data collection methods (if inferrable), and the purpose of the readiness evaluation. Describe the scoring scale (e.g., 0-100%) and what different score levels imply (e.g., Nascent, Developing, Mature, Leading).
          *   **Industry Context:** Explain how this methodology applies specifically to ${companyInfo.companyDetails.name}'s industry and size class, noting any industry-specific considerations for AI readiness.
          *   **Score Calculation and Normalization:** Detail how category overall scores are derived from subcategory scores and adjusted weights. Mention any normalization techniques applied.
          *   **Comprehensive Breakdown of Assessment Categories:** For each major category assessed (e.g., Strategy, Data, Technology, Talent, Governance), explain its significance to overall AI readiness and successful business outcomes, with specific relevance to ${companyInfo.companyDetails.industry}.
          *   **Technical Explanation of Q-values:** Define Q-values in the context of this assessment (learned importance derived via ML/RL). Explain their significance in identifying empirically critical subcategories. Provide 2-3 numerical examples from the provided data, explaining *why* a specific Q-value might be high or low for a subcategory (e.g., "Subcategory 'Data Quality' under 'Data' has a high Q-value of ${categoriesData.find(c=>c.category === 'Data')?.qValues?.['Data Quality']?.toFixed(4) ?? 'X.XXXX'}, suggesting assessment patterns indicate its strong influence on successful AI outcomes, particularly in the ${companyInfo.companyDetails.industry} industry.").
          *   **Detailed Description of Weighting Mechanisms:**
              *   **User Weights:** Explain their purpose as user-defined strategic importance. Reference an example like "User assigned Y% weight to Subcategory A...".
              *   **Softmax Weights:** Explain they are derived from Q-values, representing *relative* learned importance within a category. Example: "The Softmax weight of Z% for Subcategory B indicates it has the highest learned importance within its category..."
              *   **Adjusted Weights:** Explain how they blend User Weights and Softmax Weights (mentioning the blending algorithm conceptually if possible, e.g., weighted average, or simply state it balances explicit priorities with learned importance). Example: "The final Adjusted Weight of W% for Subcategory C reflects..."
          *   **Validation and Confidence:** Discuss any validation steps taken (if known/inferrable) or the general confidence level in the assessment results. If not calculable, discuss conceptually.
          *   **Limitations:** Honestly address the limitations of this assessment methodology (e.g., based on self-reported data, point-in-time snapshot, potential biases). Guide the interpretation of results accordingly.

      3.  **<h1 id="detailed-analysis">Detailed Analysis by Category</h1>**
          *   For **each category** present in the \`categoriesData\`:
              *   Create a dedicated H2 heading: **<h2 id="category-${/* Generate a slug-like ID */ (cat: {category: string}) => cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}">${/* Display Category Name */ (cat: {category: string}) => cat.category} Analysis</h2>** (Ensure the LLM generates this heading with the correct ID for each category loop).
              *   **Industry Context:** Begin with an overview of why this category is particularly important in the ${companyInfo.companyDetails.industry} industry and for a company of ${companyInfo.companyDetails.size} size.
              *   **Current State Assessment (Score: ${/* Get score */ (cat: {overallScore: number}) => cat.overallScore.toFixed(1)}%)**: Start with the exact overall score and provide a qualitative interpretation (e.g., "significantly underdeveloped," "moderately capable," "area of strength"). Compare to typical industry norms for ${companyInfo.companyDetails.industry}.
              *   **Detailed Strengths (3-4 minimum):** Identify specific strengths *within this category*. For each strength: Reference the specific subcategory(ies), mention their **exact scores**, discuss the impact of their **adjusted weights**, and provide concrete examples relevant to ${companyInfo.companyDetails.name}'s business context.
              *   **Detailed Weaknesses (3-4 minimum):** Identify specific weaknesses *within this category*. For each weakness: Reference the specific subcategory(ies), mention their **exact scores**, analyze the **Q-value and Softmax weight**, and discuss concrete consequences for ${companyInfo.companyDetails.name}'s business objectives.
              *   **Specific Bottlenecks and Limitations:** Detail technical or process constraints relevant to ${companyInfo.companyDetails.industry}.
              *   **Impact of Weights and Q-Values:** Explicitly summarize how the interplay of all weights shaped the overall score for *this specific category*. Highlight discrepancies between User Weights and Adjusted Weights.
              *   **Industry Benchmarking:** Compare assessed state to general industry best practices for ${companyInfo.companyDetails.industry} and companies of ${companyInfo.companyDetails.size} size.
              *   **Potential Future Trajectory:** Describe likely evolution without intervention, with specific implications for ${companyInfo.companyDetails.name}.

      4.  **<h1 id="swot-analysis">SWOT Analysis </h1>**
          *   **Industry-Specific SWOT:** Focus on how each element relates specifically to ${companyInfo.companyDetails.name}'s position in the ${companyInfo.companyDetails.industry} industry.
          *   **Strengths:** List 4-5 key internal strengths. Reference key subcategories/scores and explain their specific advantage in ${companyInfo.companyDetails.industry}.
          *   **Weaknesses:** List 4-5 critical internal weaknesses. Reference key subcategories/scores/weights and explain their specific disadvantage in ${companyInfo.companyDetails.industry}.
          *   **Opportunities:** Identify 3-4 external opportunities related to AI that are particularly relevant to ${companyInfo.companyDetails.industry} and ${companyInfo.companyDetails.size} companies.
          *   **Threats:** Identify 3-4 external threats related to AI that are particularly concerning for ${companyInfo.companyDetails.name}'s industry position.

      5.  **<h1 id="gap-analysis">Gap Analysis </h1>**
          *   **${companyInfo.companyDetails.industry}-Specific Capability Gaps:** Systematically identify significant gaps between current and desired states, organized by category, with particular attention to crucial capabilities in ${companyInfo.companyDetails.industry}.
          *   **Comprehensive Risk Assessment:** Assess risks associated with major gaps (Likelihood/Impact concept) with specific reference to ${companyInfo.companyDetails.name}'s business context.
          *   **Quantifiable Impact:** Estimate quantifiable impact on business outcomes, using ${companyInfo.companyDetails.industry}-specific metrics and benchmarks where possible.
          *   **Competitive Disadvantages:** Link gaps to potential competitive disadvantages in ${companyInfo.companyDetails.industry}, especially compared to competitors who have stronger AI capabilities.
          *   **Regulatory and Compliance Implications:** Discuss risks related to regulations (e.g., GDPR, CCPA) with specific focus on ${companyInfo.companyDetails.industry} regulatory environment.

      6.  **<h1 id="implementation-roadmap">Implementation Roadmap </h1>**
          *   **Company-Specific Approach:** Tailor the roadmap specifically to ${companyInfo.companyDetails.name}'s current state, resources, and industry position.
          *   **Phased Approach:** Structure clear phases (Short-Term: 0-6 months, Medium-Term: 6-18 months, Long-Term: 18+ months) with milestones appropriate for a ${companyInfo.companyDetails.size} company in ${companyInfo.companyDetails.industry}.
          *   **Detailed Actions (per phase):** List specific steps, tools, platforms, methodologies, potential ownership, resource needs appropriate for ${companyInfo.companyDetails.name}'s context.
          *   **Extensive Key Performance Indicators (KPIs):** Define SMART KPIs for tracking progress in each phase, using industry-relevant metrics for ${companyInfo.companyDetails.industry}.
          *   **Cost-Benefit Analysis:** Discuss costs vs. benefits for major initiatives with specific reference to typical investment levels for a ${companyInfo.companyDetails.size} company.
          *   **Risk Mitigation Strategies:** Identify implementation risks and propose mitigations tailored to ${companyInfo.companyDetails.name}'s specific circumstances.

      7.  **<h1 id="tech-infra-recommendations">Technology and Infrastructure Recommendations </h1>**
          *   **Industry-Specific Tools and Platforms:** Recommend enterprise-grade AI/ML platforms, data tools, cloud services (e.g., AWS SageMaker, Azure ML, Google Vertex AI, Databricks, Snowflake) that are particularly well-suited to ${companyInfo.companyDetails.industry} and ${companyInfo.companyDetails.size} companies.
          *   **Comprehensive Integration Strategy:** Discuss integration with existing systems (ERP, CRM, etc.) typically found in ${companyInfo.companyDetails.industry} companies of ${companyInfo.companyDetails.size} size.
          *   **Detailed Scalability Planning:** Address scaling for future demands with specific attention to growth patterns in ${companyInfo.companyDetails.industry}.
          *   **Cost Estimates and ROI Projections:** Provide indicative costs and ROI potential calibrated to ${companyInfo.companyDetails.size} companies.
          *   **Technical Architecture Recommendations:** Describe a target state architecture conceptually (layers, components, data flows) optimized for ${companyInfo.companyDetails.industry}-specific AI applications.

      8.  **<h1 id="org-cultural-considerations">Organizational and Cultural Considerations </h1>**
          *   **Industry-Specific Organizational Changes:** Suggest structural adjustments (e.g., CoE, new roles, cross-functional teams) with specific reference to organizational patterns in ${companyInfo.companyDetails.industry}.
          *   **Comprehensive Skills Development Strategy:** Outline strategy, training programs, timelines appropriate for ${companyInfo.companyDetails.size} companies.
          *   **Detailed Change Management Approach:** Propose approach (e.g., Kotter, ADKAR), stakeholder analysis tailored to typical organizational structures in ${companyInfo.companyDetails.industry}.
          *   **Cultural Transformation Roadmap:** Outline steps and milestones for fostering an AI-positive culture appropriate for ${companyInfo.companyDetails.name}'s context.
          *   **Leadership Development:** Specify required leadership skills/mindset with particular attention to leadership challenges in ${companyInfo.companyDetails.industry}.
          *   **Performance Management Adaptations:** Discuss necessary changes to metrics/incentives in the context of ${companyInfo.companyDetails.industry} standards.

      9.  **<h1 id="detailed-score-breakdown-analysis">Detailed Score Breakdown and Weights Analysis </h1>**
          *   **(Note: The table itself is generated by the calling code, but this section requires textual analysis referencing it)**
          *   **Introduction:** Briefly introduce the purpose of the detailed breakdown table.
          *   **${companyInfo.companyDetails.industry}-Specific Analysis:** Discuss how the scores and weights relate to typical patterns seen in ${companyInfo.companyDetails.industry}.
          *   **Deep Dive into Q-Values:** Reiterate definition, analyze 2-3 specific examples from the table where Q-values significantly influenced Adjusted Weight. Explain the implication in the context of ${companyInfo.companyDetails.name}'s business priorities.
          *   **User Weights vs. Adjusted Weights Analysis:** Provide clear examples from the data table illustrating differences and explain what large deltas imply for ${companyInfo.companyDetails.name}'s strategic planning.
          *   **Statistical Analysis Commentary:** Briefly discuss score distribution, variance within categories, and significance with respect to ${companyInfo.companyDetails.industry} benchmarks.
          *   **Visual Representation Description (Text):** Describe 2-3 potential charts (e.g., Radar chart for categories, Stacked bar charts for subcategory contributions, Scatter plot for User vs. Adjusted Weights) that would be particularly insightful for ${companyInfo.companyDetails.name}'s leadership team.
          *   **Confidence Intervals/Margin of Error:** Discuss the concept conceptually, advising caution against over-interpreting small score differences, particularly in the context of a ${companyInfo.companyDetails.size} company in ${companyInfo.companyDetails.industry}.

      Final Instructions:
      *   Maintain a highly professional, analytical, and strategic tone suitable for a C-suite audience.
      *   Use clear headings (H1, H2, H3) and subheadings for structure. Ensure H1 and H2 have the correct 'id' attributes for TOC linking.
      *   Ensure seamless narrative flow and synthesis of data into actionable intelligence specifically tailored to ${companyInfo.companyDetails.name}'s context.
      *   Constantly reference and integrate the company's specific information (name, industry, size, description) throughout the report to make it deeply personalized.
      *   Strictly adhere to the requested HTML format.
      *   Double-check that *every* score, weight type, and Q-value for *every* subcategory is referenced somewhere in Section 3 or Section 9's analysis.
      *   Ensure the total word count substantially exceeds 4000 words.
    `;

    // --- 4. LLM Interaction ---
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Recommended model for complexity and context window
      messages: [
        {
          role: "system",
          content: "You are an elite AI strategy consultant and technical writer from a top-tier global consulting firm (e.g., McKinsey, BCG, Bain). You are crafting an in-depth AI Readiness Assessment report for a major enterprise client. Your analysis must be rigorous, data-driven, strategically insightful, and flawlessly professional. You MUST meticulously analyze and integrate *every* single provided data point (scores, user weights, Q-values, softmax weights, adjusted weights for *all* subcategories) into your narrative, explaining their significance and interplay. Follow the provided structure and formatting instructions precisely, including generating correct heading IDs for linking. The final output must be a comprehensive, actionable report in clean HTML, significantly exceeding 4000 words."
        },
        {
          role: "user",
          content: prompt // Pass the detailed prompt to the user role
        }
      ],
      temperature: 0.6, // Balance creativity and factuality
      // max_tokens: Consider setting if consistently hitting output limits, though GPT-4o is generous.
    });

    const llmGeneratedContent = response.choices[0]?.message?.content;
    if (!llmGeneratedContent) {
      throw new Error("No content received from OpenAI API response.");
    }

    // --- 5. HTML Assembly & Styling ---
    const reportCompanyName = companyInfo.companyDetails.name || 'Valued Client';
    const companyIndustry = companyInfo.companyDetails.industry || 'Technology';
    const companySize = companyInfo.companyDetails.size || 'Mid-size';

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Determine the primary assessment type if possible, else default
    const assessmentFocus = categoriesData.length > 0 ? categoriesData[0].category : "Comprehensive"; // Basic assumption

    // Check if any category had default weights applied (all user weights were zero or missing)
    const defaultWeightsAppliedNote = Object.values(categoriesData).some(cat => {
        const weights = cat.userWeights || {};
        const keys = Object.keys(weights);
        return keys.length === 0 || keys.every(k => Number(weights[k]) === 0);
    }) ? `<div class="highlight-box highlight-info">
           <p class="highlight-title">Note on Weight Application</p>
           <p>For one or more categories, initial user weights were uniformly zero or not provided. In these cases, default equal weighting (100% / number of subcategories) was used as a basis for calculating the Adjusted Weights and the Overall Category Score. This ensures all subcategories contribute meaningfully to the analysis in the absence of explicit user prioritization. The 'User Weight' column in the table below will indicate 'N/A (Default Applied)' for these subcategories.</p>
         </div>` : '';

    // Create a company profile section using the fetched information
    const companyProfileSection = `
    <section class="company-profile-section">
      <h2 id="company-profile">Company Profile</h2>
      <div class="company-profile-card">
        <div class="company-profile-header">
          <div class="company-profile-name">${reportCompanyName}</div>
          <div class="company-profile-meta">
            <span class="company-profile-industry">${companyIndustry}</span>
            <span class="company-profile-divider">•</span>
            <span class="company-profile-size">${companySize}</span>
          </div>
        </div>
        <div class="company-profile-description">
          ${companyInfo.companyDetails.description || 'No company description available.'}
        </div>
        ${companyInfo.companyInsights ? `
        <div class="company-profile-insights">
          <h4>AI Readiness Insights</h4>
          <p>${companyInfo.companyInsights}</p>
        </div>
        ` : ''}
        ${companyInfo.companyDetails.sources && companyInfo.companyDetails.sources.length > 0 ? `
        <div class="company-profile-sources">
          <h4>Information Sources</h4>
          <ul>
            ${companyInfo.companyDetails.sources.map((source: any) => `
              <li><a href="${source.link}" target="_blank" rel="noopener noreferrer">${source.title}</a></li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </section>
    `;

    // Generate the final HTML report string
    const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Readiness Report for ${reportCompanyName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --font-primary: 'Inter', sans-serif;
          --font-headings: 'Roboto Slab', serif;
          --color-primary: #0a4a7d; /* Deeper Blue */
          --color-secondary: #0c5a99;
          --color-accent: #4db8ff; /* Brighter Accent Blue */
          --color-text: #2c3e50; /* Dark Grey-Blue */
          --color-text-muted: #5a6a7a;
          --color-background: #f8f9fa;
          --color-white: #ffffff;
          --color-border: #dee2e6;
          --border-radius: 6px;
          --box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
          --box-shadow-light: 0 2px 8px rgba(0, 0, 0, 0.05);
          --heading-scroll-margin: 80px; /* Adjust as needed for fixed headers */
        }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-primary); line-height: 1.7; color: var(--color-text); background-color: var(--color-background); margin: 0; padding: 0; font-size: 16px; }
        .report-wrapper { max-width: 1200px; margin: 40px auto; background-color: var(--color-white); box-shadow: var(--box-shadow); border-radius: var(--border-radius); overflow: hidden; }
        .report-container { padding: 40px 50px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 1px solid var(--color-border); }
        .logo-container { text-align: right; padding-top: 5px; flex-shrink: 0; margin-left: 20px;}
        .logo-text { font-size: 28px; font-weight: 700; color: var(--color-accent); margin: 0; letter-spacing: -1px; }
        .logo-subtitle { font-size: 13px; color: var(--color-primary); margin: 0; font-weight: 600; }
        .report-title { font-family: var(--font-headings); font-size: 36px; color: var(--color-primary); margin: 0 0 10px 0; font-weight: 700; line-height: 1.2; }
        .report-meta { margin-top: 20px; font-size: 0.9em; color: var(--color-text-muted); }
        .meta-item { margin-bottom: 8px; display: flex;}
        .meta-label { font-weight: 600; display: inline-block; width: 150px; color: var(--color-text); flex-shrink: 0;}
        .meta-value { color: var(--color-text-muted); }
        h1, h2, h3, h4 { font-family: var(--font-headings); color: var(--color-primary); margin-top: 2em; margin-bottom: 1em; font-weight: 700; line-height: 1.3; scroll-margin-top: var(--heading-scroll-margin); }
        h1 { font-size: 30px; border-bottom: 2px solid var(--color-accent); padding-bottom: 10px; }
        h2 { font-size: 24px; color: var(--color-secondary); border-bottom: 1px solid #e0f2fe; padding-bottom: 8px; }
        h3 { font-size: 20px; color: var(--color-secondary); font-weight: 600; }
        h4 { font-size: 18px; color: var(--color-text); font-weight: 600; }
        p { margin-bottom: 1.2em; }
        ul, ol { margin-bottom: 1.5em; padding-left: 25px; }
        li { margin-bottom: 0.6em; }
        a { color: var(--color-secondary); text-decoration: none; font-weight: 600; }
        a:hover { color: var(--color-accent); text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; box-shadow: var(--box-shadow-light); border-radius: var(--border-radius); overflow: hidden; font-size: 0.95em; }
        th, td { padding: 14px 18px; border: 1px solid var(--color-border); text-align: left; vertical-align: top; }
        th { background-color: #f1f3f5; font-weight: 700; color: var(--color-primary); font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--color-accent); }
        tr:nth-child(even) td { background-color: #fcfdff; }
        tr:hover td { background-color: #e0f2fe; }
        /* Styles specific to the LLM generated content wrapper */
        .llm-content-wrapper .toc { background-color: #f8fafd; padding: 25px 35px; border-radius: var(--border-radius); margin: 40px 0; border: 1px solid var(--color-border); box-shadow: var(--box-shadow-light); }
        .llm-content-wrapper .toc-title { font-family: var(--font-headings); color: var(--color-primary); margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 700; }
        .llm-content-wrapper .toc ul { list-style-type: none; padding-left: 0; margin: 0; }
        .llm-content-wrapper .toc ul ul { padding-left: 25px; margin-top: 5px; }
        .llm-content-wrapper .toc li { margin-bottom: 8px; }
        .llm-content-wrapper .toc a { text-decoration: none; color: var(--color-secondary); font-weight: 400; font-size: 1em; }
        .llm-content-wrapper .toc a:hover { color: var(--color-accent); text-decoration: none; }
        .llm-content-wrapper .executive-summary { background-color: #e6f7ff; padding: 30px 35px; border-left: 5px solid var(--color-accent); margin: 35px 0; border-radius: 0 var(--border-radius) var(--border-radius) 0; box-shadow: var(--box-shadow-light); }
        .llm-content-wrapper strong { color: var(--color-primary); } /* Make bold text prominent */
        .llm-content-wrapper blockquote { border-left: 3px solid var(--color-accent); padding-left: 15px; margin: 1.5em 0; font-style: italic; color: var(--color-text-muted); }
        /* End LLM wrapper styles */
        .overall-score-panel { text-align: center; margin: 40px 0 50px 0; padding: 35px 20px; background: linear-gradient(135deg, var(--color-secondary), var(--color-primary)); border-radius: var(--border-radius); box-shadow: var(--box-shadow); color: var(--color-white); }
        .score-value { font-size: 72px; font-weight: 700; margin: 0; line-height: 1; letter-spacing: -2px; }
        .score-label { font-size: 20px; color: #d0eaff; margin: 10px 0 0 0; font-weight: 400; }
        .category-scores-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin: 40px 0; }
        .category-score-card { background-color: var(--color-white); border-radius: var(--border-radius); padding: 25px; box-shadow: var(--box-shadow-light); border: 1px solid var(--color-border); transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; display: flex; flex-direction: column; justify-content: space-between; }
        .category-score-card:hover { transform: translateY(-5px); box-shadow: var(--box-shadow); }
        .category-score-card h3 { margin-top: 0; margin-bottom: 15px; font-size: 18px; color: var(--color-primary); font-weight: 600; border-bottom: 1px solid var(--color-border); padding-bottom: 10px; }
        .category-score { font-size: 42px; font-weight: 700; margin: 10px 0; line-height: 1; text-align: center; }
        .progress-container { background-color: #e9ecef; border-radius: 10px; height: 12px; width: 100%; margin: 15px 0 5px 0; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 10px; transition: width 0.5s ease-in-out; background-image: linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent); background-size: 1rem 1rem; }
        .data-table { /* Styles defined above */ }
        .divider { height: 1px; background-color: var(--color-border); border: none; margin: 60px 0; }
        .detailed-scores-section { margin: 40px 0; scroll-margin-top: var(--heading-scroll-margin); } /* Added scroll margin */
        .explanation-box { background-color: #f8f9fa; padding: 20px 25px; border-radius: var(--border-radius); margin: 25px 0; border: 1px solid var(--color-border); font-size: 0.95em; color: var(--color-text-muted); }
        .explanation-box strong { color: var(--color-text); }
        .weight-explanation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 35px 0; }
        .weight-card { background-color: #f8fafd; border-radius: var(--border-radius); padding: 20px; box-shadow: var(--box-shadow-light); border: 1px solid var(--color-border); }
        .weight-card h4 { margin-top: 0; color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: 15px; font-size: 16px; font-weight: 600; }
        .weight-card p { font-size: 0.9em; color: var(--color-text-muted); margin-bottom: 0; }
        .highlight-box { padding: 25px 30px; margin: 30px 0; border-radius: var(--border-radius); border-left-width: 5px; border-left-style: solid; box-shadow: var(--box-shadow-light); }
        .highlight-info { background-color: #e6f7ff; border-left-color: var(--color-accent); }
        .highlight-success { background-color: #e6f9f0; border-left-color: #22c55e; }
        .highlight-warning { background-color: #fff9e6; border-left-color: #f59e0b; }
        .highlight-danger { background-color: #fdecec; border-left-color: #ef4444; }
        .highlight-title { font-weight: 700; color: var(--color-primary); margin-top: 0; margin-bottom: 10px; font-size: 1.1em; }
        .highlight-info .highlight-title { color: #005f8a; }
        .highlight-success .highlight-title { color: #1a7f37; }
        .highlight-warning .highlight-title { color: #b36d00; }
        .highlight-danger .highlight-title { color: #b91c1c; }
        
        /* Company Profile Styles */
        .company-profile-section { margin: 40px 0; }
        .company-profile-card { background-color: var(--color-white); border-radius: var(--border-radius); padding: 30px; box-shadow: var(--box-shadow-light); border: 1px solid var(--color-border); }
        .company-profile-header { margin-bottom: 20px; }
        .company-profile-name { font-size: 24px; font-weight: 700; color: var(--color-primary); margin-bottom: 5px; }
        .company-profile-meta { font-size: 0.9em; color: var(--color-text-muted); }
        .company-profile-divider { margin: 0 8px; }
        .company-profile-description { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
        .company-profile-insights { margin-bottom: 25px; }
        .company-profile-insights h4, .company-profile-sources h4 { margin-top: 0; margin-bottom: 10px; color: var(--color-secondary); font-size: 16px; }
        .company-profile-insights p { margin-bottom: 0; }
        .company-profile-sources ul { margin-bottom: 0; }
        .company-profile-sources li { margin-bottom: 5px; }
        
        footer { margin-top: 50px; padding: 25px 50px; border-top: 1px solid var(--color-border); text-align: center; font-size: 0.85em; color: var(--color-text-muted); background-color: #f8f9fa; }
        footer p { margin: 5px 0; }
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-muted { color: var(--color-text-muted) !important; }
        .font-bold { font-weight: 700; }
        .mt-0 { margin-top: 0 !important; }
      </style>
    </head>
    <body>
      <div class="report-wrapper">
        <div class="report-container">
          <header class="header">
            <div>
              <h1 class="report-title">AI Readiness Report for ${reportCompanyName}</h1>
              <div class="report-meta">
                <div class="meta-item"><span class="meta-label">Company:</span> <span class="meta-value">${reportCompanyName}</span></div>
                <div class="meta-item"><span class="meta-label">Industry:</span> <span class="meta-value">${companyIndustry}</span></div>
                <div class="meta-item"><span class="meta-label">Company Size:</span> <span class="meta-value">${companySize}</span></div>
                <div class="meta-item"><span class="meta-label">Assessment Date:</span> <span class="meta-value">${currentDate}</span></div>
                <div class="meta-item"><span class="meta-label">Report Version:</span> <span class="meta-value">1.0</span></div>
                <div class="meta-item"><span class="meta-label">Assessment Focus:</span> <span class="meta-value">${assessmentFocus} Readiness</span></div>
              </div>
            </div>
            <div class="logo-container">
              <p class="logo-text">CYBERGEN</p>
              <p class="logo-subtitle">Strategic AI Insights</p>
            </div>
          </header>

          <section class="overall-score-panel">
            <p class="score-label">Overall AI Readiness Score</p>
            <p class="score-value">${overallReadiness}%</p>
          </section>

          ${companyProfileSection}

          <section class="category-scores-container">
            ${categoriesData.map(cat => `
              <div class="category-score-card">
                <div>
                  <h3>${cat.category}</h3>
                  <div class="category-score" style="color: ${getColorForScore(cat.overallScore)};">${Math.round(cat.overallScore)}%</div>
                </div>
                <div>
                  <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.round(cat.overallScore)}%; background-color: ${getColorForScore(cat.overallScore)};"></div>
                  </div>
                  <p style="font-size: 0.85em; color: var(--color-text-muted); text-align: center; margin-top: 10px;">Readiness Level</p>
                </div>
              </div>
            `).join('')}
          </section>

          <hr class="divider">

          <main class="llm-content-wrapper">
            <!-- LLM generated content (including TOC, Sections 1-8, and textual analysis for Section 9) starts here -->
            ${llmGeneratedContent}
            <!-- LLM generated content ends here -->
          </main>

          <hr class="divider">

          <!-- Section 9: Detailed Score Breakdown Table (Generated by code for accuracy) -->
          <section class="detailed-scores-section" id="detailed-score-breakdown-table"> <!-- ID adjusted slightly to avoid collision if LLM creates its own #detailed-score-breakdown -->
            <h2 id="detailed-score-table-heading">Detailed Score Breakdown Table</h2> <!-- Heading for clarity -->

            ${defaultWeightsAppliedNote}

            <p>The following table provides a granular breakdown of the assessment results, showing the raw scores, various weights, and score contributions for each subcategory. This data underpins the analysis presented in the main report sections.</p>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Raw Score (%)</th>
                  <th>User Weight (%)</th>
                  <th>Q-Value</th>
                  <th>Adjusted Weight (%)</th>
                  <th>Score Contribution</th>
                </tr>
              </thead>
              <tbody>
                ${categoriesData.flatMap(cat => {
                  const categorySubcategories = Object.keys(cat.categoryScores || {});
                  if (categorySubcategories.length === 0) {
                    return `<tr><td colspan="8" class="text-center text-muted">No subcategory data available for ${cat.category}</td></tr>`;
                  }

                  // Determine if default weights were applied for this category
                  const weights = cat.userWeights || {};
                  const weightKeys = Object.keys(weights);
                  const useDefaultWeights = weightKeys.length === 0 || weightKeys.every(k => Number(weights[k]) === 0);

                  const subCategoryCount = categorySubcategories.length;
                  const defaultWeight = subCategoryCount > 0 ? (100 / subCategoryCount) : 0;

                  // Map over subcategories to create table rows
                  return Object.entries(cat.categoryScores).map(([subCategory, score]) => {
                    const numScore = Number(score) || 0; // Ensure numeric score
                    let userWeightDisplay: number | string;
                    let adjustedWeightValue: number;
                    const qValue = Number(cat.qValues?.[subCategory]) || 0;
                    const softmaxWeight = Number(cat.softmaxWeights?.[subCategory]) || 0;

                    // Determine displayed User Weight and calculated Adjusted Weight
                    if (useDefaultWeights) {
                      userWeightDisplay = 'N/A (Default Applied)';
                      // Use adjusted weight if valid, otherwise estimate (this estimation might vary based on exact blending logic)
                      adjustedWeightValue = (Number(cat.adjustedWeights?.[subCategory]) > 0)
                        ? Number(cat.adjustedWeights?.[subCategory])
                        : (softmaxWeight > 0 ? softmaxWeight : defaultWeight);
                    } else {
                      userWeightDisplay = (Number(cat.userWeights?.[subCategory]) || 0);
                      adjustedWeightValue = Number(cat.adjustedWeights?.[subCategory]) || 0;
                    }

                    // Ensure adjusted weight is a valid number for calculation, default to 0 if not
                    adjustedWeightValue = isNaN(adjustedWeightValue) ? 0 : adjustedWeightValue;

                    // Calculate score contribution
                    const scoreContribution = (numScore * adjustedWeightValue) / 100;

                    // Return the HTML table row
                    return `
                      <tr>
                        <td>${cat.category}</td>
                        <td>${subCategory}</td>
                        <td>${numScore.toFixed(1)}</td>
                        <td>${typeof userWeightDisplay === 'number' ? userWeightDisplay.toFixed(1) : userWeightDisplay}</td>
                        <td>${qValue.toFixed(4)}</td>
                        <td class="font-bold">${adjustedWeightValue.toFixed(1)}</td>
                        <td class="font-bold">${scoreContribution.toFixed(1)}</td>
                      </tr>
                    `;
                  });
                }).join('')}
              </tbody>
            </table>

            <!-- Weight Definitions -->
            <div class="weight-explanation-grid">
               <div class="weight-card"><h4>User Weights</h4><p>Reflect the initial strategic importance assigned by the user (target sum: 100% per category). 'N/A' indicates default equal weighting was applied.</p></div>
               <div class="weight-card"><h4>Q-Values</h4><p>Machine-learned values indicating empirical importance/impact on overall readiness derived from assessment patterns. Higher values suggest greater learned criticality.</p></div>
               <div class="weight-card"><h4>Softmax Weights</h4><p>Normalized Q-Values (probability distribution) showing *relative* learned importance among subcategories within a category (sum to 100% per category).</p></div>
               <div class="weight-card"><h4>Adjusted Weights</h4><p>Final weights used for scoring, blending User Weights and learned importance (Softmax Weights), balancing stated priorities with data-driven significance.</p></div>
            </div>

           
             <!-- Interpretation guidance moved to LLM prompt Section 9 for integrated analysis -->

          </section>

          <footer>
             <p>Confidential AI Readiness Assessment Report for ${reportCompanyName}</p>
             <p>© ${new Date().getFullYear()} Cybergen Strategic AI Insights. All rights reserved.</p>
             <p>This report was generated leveraging advanced AI analysis based on the provided assessment data. Findings and recommendations are based on the data available at the time of assessment.</p>
          </footer>
        </div>
      </div>
    </body>
    </html>
    `;

    return htmlReport; // Return the complete HTML string

  } catch (error) {
    console.error("Error generating comprehensive report:", error); // Log the detailed error
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    const errorStack = error instanceof Error && error.stack ? error.stack : 'No stack trace available.';

    // Return a user-friendly, styled error message HTML
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Error Generating Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 30px; background-color: #f8f9fa; color: #212529;}
        .error-container { background-color: #fff; border: 1px solid #dee2e6; border-left: 5px solid #dc3545; padding: 25px 35px; border-radius: 6px; max-width: 900px; margin: 40px auto; box-shadow: 0 4px 15px rgba(0,0,0,0.07); }
        h1 { color: #dc3545; margin-top: 0; font-size: 24px; border-bottom: 1px solid #f5c6cb; padding-bottom: 10px; margin-bottom: 20px; }
        p { margin-bottom: 1em; }
        code { background-color: #e9ecef; padding: 3px 6px; border-radius: 4px; font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.9em; color: #495057;}
        pre { background-color: #f1f3f5; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; font-size: 0.85em; color: #6c757d; margin-top: 15px; white-space: pre-wrap; word-wrap: break-word; max-height: 300px; overflow-y: auto;}
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>Report Generation Failed</h1>
        <p>An unexpected error occurred while generating the AI Readiness Deep Research Report. Please review the details below. This could be due to issues with the input data, connection problems, API limits, or an internal error in the generation process.</p>
        <p><strong>Error Message:</strong></p>
        <code>${errorMessage}</code>
        ${errorStack ? `<p style="margin-top: 20px;"><strong>Technical Details (Stack Trace):</strong></p><pre>${errorStack}</pre>` : ''}
        <p style="margin-top: 20px;">Please ensure the input assessment data is correctly formatted and that the API key is valid and has sufficient quota. Try again later. If the issue persists, contact technical support.</p>
      </div>
    </body>
    </html>`;
  }
}

/**
 * Utility function to get color based on score
 */
function getColorForScore(score: number): string {
  if (score < 30) return '#73BFDC'; // Medium blue
  if (score < 60) return '#4389B0'; // Deeper blue
  if (score < 80) return '#2C6F9B'; // Rich blue
  return '#0A4570'; // Darkest blue
} 
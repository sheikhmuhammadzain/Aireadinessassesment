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
// import { OpenAI } from 'openai';

// // Assume 'openai' is initialized elsewhere (e.g., const openai = new OpenAI({ apiKey: 'YOUR_API_KEY' });)
// declare const openai: OpenAI; // Placeholder for your OpenAI client instance

// // Helper function to determine progress bar color based on score
// function getColorForScore(score: number): string {
//   if (score < 40) return '#ef4444'; // Red
//   if (score < 70) return '#f59e0b'; // Amber
//   return '#22c55e'; // Green
// }

export async function generateDeepResearchReport(assessmentResults: Record<string, any>) {
  try {
    // Create a data summary for the prompt
    const categoriesData = Object.entries(assessmentResults).map(([type, result]) => {
      return {
        category: type,
        overallScore: result.overallScore,
        categoryScores: result.categoryScores || {}, // Ensure it's an object
        qValues: result.qValues || {},
        adjustedWeights: result.adjustedWeights || {},
        userWeights: result.userWeights || {},
        softmaxWeights: result.softmaxWeights || {}
      };
    });

    // Calculate overall readiness score - ensure scores are numbers
    const overallReadiness = categoriesData.length > 0
      ? Math.round(categoriesData.reduce((sum, cat) => sum + (Number(cat.overallScore) || 0), 0) / categoriesData.length)
      : 0;

    const prompt = `
      Generate a comprehensive AI Readiness Deep Research Report (at least 3500 words in length) based on the following assessment data:

      Overall AI Readiness Score: ${overallReadiness}%

      Assessment Results:
      ${JSON.stringify(categoriesData, null, 2)}

      The report should include:

      0. Table of Contents (Generated based on the following sections)

      1. Executive Summary (500+ words)
         - Comprehensive key findings and detailed overall AI readiness posture
         - In-depth analysis of major strengths and weaknesses
         - Prioritized strategic recommendations with implementation timelines
         - Business impact assessment of current AI readiness state

      2. Assessment Methodology (400+ words)
         - Detailed methodology overview including score calculation and normalization algorithms
         - Comprehensive breakdown of assessment categories and their significance to business outcomes
         - Explicit technical explanation of Q-values and their significance with numerical examples from the results
         - Detailed description of all weight adjustment methods (user weights, softmax weights, adjusted weights)
         - Validation methodology and confidence levels
         - Limitations of the assessment approach and how to interpret results

      3. Detailed Analysis by Category
         - For each category, provide an extensive section with:
           - Current state assessment with exact score percentage
           - At least 3-4 detailed strengths with examples
           - At least 3-4 detailed weaknesses with concrete examples and consequences
           - Specific bottlenecks and limitations with technical details
           - Comprehensive industry benchmarking including competitor comparisons
           - Detailed analysis of the impact of Q-values and weights on the overall assessment
           - Potential future trajectory of this category without intervention
           - Make sure to explicitly reference the specific Q-values and weights for each category's subcategories

      4. Gap Analysis (500+ words)
         - Detailed identification of significant capability gaps for each category
         - Comprehensive risk assessment of these gaps with probability and impact ratings
         - Quantifiable impact on AI adoption and business outcomes
         - Competitive disadvantages resulting from identified gaps
         - Regulatory and compliance implications of gaps

      5. Implementation Roadmap (500+ words)
         - Detailed short-term actions (0-6 months) with specific tools, platforms, and methodologies
         - Comprehensive medium-term initiatives (6-18 months) with resource requirements
         - Strategic long-term transformation (18+ months) with expected organizational outcomes
         - Extensive key performance indicators for measuring progress at each stage
         - Cost-benefit analysis for major initiatives
         - Risk mitigation strategies for implementation

      6. Technology and Infrastructure Recommendations (400+ words)
         - Specific enterprise-grade tools and platforms recommended with version details
         - Comprehensive integration considerations with existing systems
         - Detailed scalability planning with capacity recommendations
         - Cost estimates and ROI projections for recommended technologies
         - Technical architecture recommendations with diagrams (described in text)

      7. Organizational and Cultural Considerations (400+ words)
         - Required organizational changes with detailed org chart implications
         - Comprehensive skills development strategy with training programs and timelines
         - Detailed change management approach with stakeholder analysis
         - Cultural transformation roadmap with specific milestones
         - Leadership development requirements
         - Performance management adaptations for AI-driven operations

      8. Detailed Score Breakdown and Weights Analysis (300+ words)
         - Comprehensive table showing each subcategory with its category, raw score, user weight, q-value, softmax weight, adjusted weight and contribution to overall category score
         - Detailed explanation of Q-values and their algorithmic impact on the final assessment
         - Thorough explanation of how user weights differ from adjusted weights with clear examples from the data
         - Statistical analysis of score distribution and significance
         - Visual representation of scores (describe charts as text that would be shown, e.g., 'A bar chart visualizing category scores...' or 'A radar chart showing strengths across dimensions...')
         - Confidence intervals and margin of error analysis (if applicable/calculable from input, otherwise discuss conceptually)

      Throughout the report, maintain a highly professional, analytical, and strategic tone. Consistently reference exact scores, weights (user, Q-value, softmax, adjusted), and provide specific, actionable insights derived directly from the data. Avoid generalizations. Use clear headings and subheadings for each section as outlined above. Ensure the total word count significantly exceeds 3500 words.

      Format the report as clean, well-structured HTML. Use appropriate tags like <h1>, <h2>, <h3>, <p>, <ul>, <ol>, and <table>. Ensure the Table of Contents links correctly to the corresponding H1/H2 sections (use appropriate id attributes for headings).

      IMPORTANT: Ensure that ALL data fields provided in the assessment results (including ALL categoryScores, Q-values, user weights, adjusted weights, softmax weights for *every subcategory*) are explicitly referenced and analyzed within the 'Detailed Analysis by Category' and 'Detailed Score Breakdown' sections. Do not leave any data points unmentioned or unanalyzed. Provide context for the weight values (e.g., 'Subcategory X has a high adjusted weight of Y%, driven by a strong Q-value of Z, indicating its critical learned importance despite a moderate user weight of W%.').
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Or your preferred high-capability model
      messages: [
        {
          role: "system",
          content: "You are an elite AI strategy consultant and technical writer from a top-tier consulting firm. You specialize in creating comprehensive, data-driven, actionable AI readiness reports for Fortune 500 companies. Your reports are known for their depth, clarity, strategic insight, and meticulous attention to detail. You must analyze and reference *every* provided data point (scores, all weight types, Q-values) for *every* category and subcategory. Structure the report exactly as requested, using precise language and a highly professional tone. Ensure the final output is well-formatted HTML exceeding 3500 words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // max_tokens: 12000 // Consider adjusting based on typical report length and model limits. GPT-4o has a large context window.
      temperature: 0.6 // Slightly creative but still factual
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Get company name from localStorage if available, provide a default
    const companyName = typeof window !== 'undefined' ?
      localStorage.getItem('companyName') || 'Valued Client' : 'Valued Client';

    // Format current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare the HTML document with enhanced professional styling
    const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Readiness Assessment Report - ${companyName}</title>
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
        }

        body {
          font-family: var(--font-primary);
          line-height: 1.7;
          color: var(--color-text);
          background-color: var(--color-background);
          margin: 0;
          padding: 0;
          font-size: 16px;
        }

        .report-wrapper {
            max-width: 1200px;
            margin: 40px auto;
            background-color: var(--color-white);
            box-shadow: var(--box-shadow);
            border-radius: var(--border-radius);
            overflow: hidden; /* Contain child elements */
        }

        .report-container {
          padding: 40px 50px; /* More padding */
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--color-border);
        }

        .logo-container {
          text-align: right;
          padding-top: 5px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-accent);
          margin: 0;
          letter-spacing: -1px;
        }
        .logo-subtitle {
          font-size: 13px;
          color: var(--color-primary);
          margin: 0;
          font-weight: 600;
        }

        .report-title {
          font-family: var(--font-headings);
          font-size: 36px; /* Larger */
          color: var(--color-primary);
          margin: 0 0 10px 0;
          font-weight: 700;
        }
        .report-meta {
          margin-top: 20px;
          font-size: 0.9em;
          color: var(--color-text-muted);
        }
        .meta-item {
          margin-bottom: 8px;
        }
        .meta-label {
          font-weight: 600;
          display: inline-block;
          width: 140px; /* Adjusted width */
          color: var(--color-text);
        }

        h1, h2, h3, h4 {
          font-family: var(--font-headings);
          color: var(--color-primary);
          margin-top: 1.8em;
          margin-bottom: 0.8em;
          font-weight: 700;
          line-height: 1.3;
        }

        h1 {
          font-size: 30px;
          border-bottom: 2px solid var(--color-accent);
          padding-bottom: 10px;
        }
        h2 {
          font-size: 24px;
          color: var(--color-secondary);
          border-bottom: 1px solid #e0f2fe; /* Lighter border */
          padding-bottom: 8px;
        }
        h3 {
          font-size: 20px;
          color: var(--color-secondary);
          font-weight: 600;
        }
        h4 {
          font-size: 18px;
          color: var(--color-text);
           font-weight: 600;
        }

        p {
          margin-bottom: 1.2em;
        }

        ul, ol {
          margin-bottom: 1.5em;
          padding-left: 25px;
        }
        li {
          margin-bottom: 0.6em;
        }

        a {
          color: var(--color-secondary);
          text-decoration: none;
          font-weight: 600;
        }
        a:hover {
          color: var(--color-accent);
          text-decoration: underline;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: var(--box-shadow-light);
          border-radius: var(--border-radius);
          overflow: hidden; /* Ensures border-radius applies to corners */
          font-size: 0.95em;
        }
        th, td {
          padding: 14px 18px; /* More padding */
          border: 1px solid var(--color-border);
          text-align: left;
          vertical-align: top; /* Align content top */
        }
        th {
          background-color: #f1f3f5; /* Lighter grey header */
          font-weight: 600;
          color: var(--color-primary);
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--color-accent);
        }
        tr:nth-child(even) td {
          background-color: #fcfdff; /* Very subtle striping */
        }
         tr:hover td {
           background-color: #e0f2fe; /* Light blue hover */
         }

        .toc {
          background-color: #f8fafd;
          padding: 25px 35px;
          border-radius: var(--border-radius);
          margin: 40px 0;
          border: 1px solid var(--color-border);
          box-shadow: var(--box-shadow-light);
        }
        .toc-title {
          font-family: var(--font-headings);
          color: var(--color-primary);
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 22px;
          font-weight: 700;
        }
        .toc ul {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }
        .toc ul ul {
          padding-left: 25px; /* Indent sub-items */
          margin-top: 5px;
        }
        .toc li { margin-bottom: 8px; }
        .toc a {
          text-decoration: none;
          color: var(--color-secondary);
          font-weight: 400; /* Regular weight for TOC items */
          font-size: 1em;
        }
        .toc a:hover {
          color: var(--color-accent);
          text-decoration: none;
        }

        .executive-summary {
          background-color: #e6f7ff; /* Light blue background */
          padding: 30px 35px;
          border-left: 5px solid var(--color-accent);
          margin: 35px 0;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          box-shadow: var(--box-shadow-light);
        }

        .overall-score-panel {
          text-align: center;
          margin: 40px 0 50px 0;
          padding: 35px 20px;
          background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          color: var(--color-white);
        }
        .score-value {
          font-size: 72px; /* Larger score */
          font-weight: 700;
          margin: 0;
          line-height: 1;
          letter-spacing: -2px;
        }
        .score-label {
          font-size: 20px;
          color: #d0eaff; /* Lighter text for label */
          margin: 10px 0 0 0;
          font-weight: 400;
        }

        .category-scores-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive grid */
          gap: 25px;
          margin: 40px 0;
        }
        .category-score-card {
          background-color: var(--color-white);
          border-radius: var(--border-radius);
          padding: 25px;
          box-shadow: var(--box-shadow-light);
          border: 1px solid var(--color-border);
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .category-score-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--box-shadow);
        }
        .category-score-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px; /* Slightly smaller category titles */
          color: var(--color-primary);
          font-weight: 600;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 10px;
        }
        .category-score {
          font-size: 36px; /* Larger score */
          font-weight: 700;
          margin: 10px 0;
          line-height: 1;
        }
        .progress-container {
          background-color: #e9ecef;
          border-radius: 10px;
          height: 12px; /* Thicker bar */
          width: 100%;
          margin: 15px 0 5px 0;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          border-radius: 10px;
          transition: width 0.5s ease-in-out;
          background-image: linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
          background-size: 1rem 1rem;
        }
        .strength { color: #1a7f37; font-weight: 600; } /* Darker Green */
        .weakness { color: #c82333; font-weight: 600; } /* Darker Red */

        .roadmap { border-left: 4px solid var(--color-accent); padding-left: 25px; margin: 30px 0; }
        .roadmap h3 { color: var(--color-secondary); margin-bottom: 15px; }
        .roadmap ul { padding-left: 20px; list-style-type: disc; }
        .roadmap li { margin-bottom: 12px; }

        .data-table { /* Already styled above, keeping class name consistent */ }

        .divider {
          height: 1px;
          background-color: var(--color-border);
          border: none;
          margin: 60px 0; /* More vertical space */
        }

        .detailed-scores-section { margin: 40px 0; }

        .explanation-box {
          background-color: #f8f9fa;
          padding: 20px 25px;
          border-radius: var(--border-radius);
          margin: 25px 0;
          border: 1px solid var(--color-border);
          font-size: 0.95em;
          color: var(--color-text-muted);
        }
        .explanation-box strong { color: var(--color-text); }


        .weight-explanation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 35px 0;
        }
        .weight-card {
          background-color: #f8fafd; /* Slightly different background */
          border-radius: var(--border-radius);
          padding: 20px;
          box-shadow: var(--box-shadow-light);
          border: 1px solid var(--color-border);
        }
        .weight-card h4 {
          margin-top: 0;
          color: var(--color-primary);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 16px;
          font-weight: 600;
        }
        .weight-card p { font-size: 0.9em; color: var(--color-text-muted); margin-bottom: 0; }

        .highlight-box {
          padding: 25px 30px;
          margin: 30px 0;
          border-radius: var(--border-radius);
          border-left-width: 5px;
          border-left-style: solid;
          box-shadow: var(--box-shadow-light);
        }
        .highlight-info { background-color: #e6f7ff; border-left-color: var(--color-accent); }
        .highlight-success { background-color: #e6f9f0; border-left-color: #22c55e; }
        .highlight-warning { background-color: #fff9e6; border-left-color: #f59e0b; }
        .highlight-danger { background-color: #fdece C; border-left-color: #ef4444; }

        .highlight-title {
          font-weight: 700;
          color: var(--color-primary); /* Default title color */
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.1em;
        }
        .highlight-info .highlight-title { color: #005f8a; }
        .highlight-success .highlight-title { color: #1a7f37; }
        .highlight-warning .highlight-title { color: #b36d00; }
        .highlight-danger .highlight-title { color: #b91c1c; }


        footer {
          margin-top: 50px;
          padding: 25px 50px;
          border-top: 1px solid var(--color-border);
          text-align: center;
          font-size: 0.85em;
          color: var(--color-text-muted);
          background-color: #f8f9fa; /* Match body background */
        }
        footer p { margin: 0; }

        /* Utility Classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .mt-0 { margin-top: 0 !important; }

        /* Specific styling for LLM generated content if needed */
        .llm-content-wrapper strong {
            /* Example: Make LLM bold text stand out more */
            color: var(--color-primary);
        }
        .llm-content-wrapper blockquote {
            border-left: 3px solid var(--color-accent);
            padding-left: 15px;
            margin-left: 0;
            font-style: italic;
            color: var(--color-text-muted);
        }

      </style>
    </head>
    <body>
      <div class="report-wrapper">
        <div class="report-container">
          <header class="header">
            <div>
              <h1 class="report-title">AI Readiness Deep Research Report</h1>
              <div class="report-meta">
                <div class="meta-item"><span class="meta-label">Prepared for:</span> ${companyName}</div>
                <div class="meta-item"><span class="meta-label">Assessment Date:</span> ${currentDate}</div>
                <div class="meta-item"><span class="meta-label">Report Version:</span> 1.0</div>
                 <div class="meta-item"><span class="meta-label">Assessment Type:</span> ${categoriesData.length > 0 ? categoriesData[0].category : "Comprehensive"} Readiness</div>
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

          <section class="category-scores-container">
            ${categoriesData.map(cat => `
              <div class="category-score-card">
                <h3>${cat.category}</h3>
                <div class="category-score" style="color: ${getColorForScore(cat.overallScore)};">${Math.round(cat.overallScore)}%</div>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${Math.round(cat.overallScore)}%; background-color: ${getColorForScore(cat.overallScore)};"></div>
                </div>
                 <p style="font-size: 0.85em; color: var(--color-text-muted); text-align: center; margin-top: 10px;">Readiness Level</p>
              </div>
            `).join('')}
          </section>

          <hr class="divider">

          <main class="llm-content-wrapper">
            ${content}
            <!-- The LLM-generated content, including TOC, Executive Summary, Methodology, etc., goes here -->
          </main>

          <hr class="divider">

          <section class="detailed-scores-section" id="detailed-score-breakdown"> <!-- Added ID for potential TOC link -->
            <h2>Detailed Score Breakdown and Weights Analysis</h2>

            ${Object.values(categoriesData).some(cat => Object.values(cat.userWeights || {}).length > 0 && Object.values(cat.userWeights || {}).every(w => w === 0)) ? `
            <div class="highlight-box highlight-info">
              <p class="highlight-title">Note on Weight Application</p>
              <p>For categories where initial user weights were uniformly zero, equal weighting (100% / number of subcategories) has been applied to calculate the Adjusted Weights and Overall Category Score. This ensures all subcategories contribute meaningfully to the analysis in the absence of specific user prioritization.</p>
            </div>
            ` : ''}

            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Raw Score (%)</th>
                  <th>User Weight (%)</th>
                  <th>Q-Value</th>
                  <th>Softmax Weight (%)</th>
                  <th>Adjusted Weight (%)</th>
                  <th>Score Contribution</th>
                </tr>
              </thead>
              <tbody>
                ${categoriesData.flatMap(cat => {
                  const categorySubcategories = Object.keys(cat.categoryScores || {});
                  if (categorySubcategories.length === 0) {
                    return `<tr><td colspan="8">No subcategory data available for ${cat.category}</td></tr>`;
                  }

                  // Check if all user weights are zero OR if userWeights is empty/undefined
                  const userWeightsProvided = cat.userWeights && Object.keys(cat.userWeights).length > 0;
                  const allUserWeightsZero = userWeightsProvided && Object.values(cat.userWeights).every(w => Number(w) === 0);
                  const useDefaultWeights = !userWeightsProvided || allUserWeightsZero;

                  const subCategoryCount = categorySubcategories.length;
                  const defaultWeight = subCategoryCount > 0 ? (100 / subCategoryCount) : 0;

                  return Object.entries(cat.categoryScores).map(([subCategory, score]) => {
                    const numScore = Number(score) || 0; // Ensure score is a number

                    // Determine the weight to use for calculation and display
                    let userWeightDisplay: number | string;
                    let adjustedWeightValue: number;

                    if (useDefaultWeights) {
                      userWeightDisplay = 'N/A (Default Applied)';
                      // Use the actual adjusted weight if available and seems calculated, otherwise use default
                      adjustedWeightValue = Number(cat.adjustedWeights?.[subCategory]) || defaultWeight;
                      // Recalculate Softmax based on Q-values if available, otherwise show 0
                      // Note: Accurate recalculation needs all Q-values for the category. Assuming pre-calculated is best here.
                    } else {
                      userWeightDisplay = (Number(cat.userWeights?.[subCategory]) || 0);
                      adjustedWeightValue = Number(cat.adjustedWeights?.[subCategory]) || 0; // Use provided adjusted weight
                    }

                    const qValue = Number(cat.qValues?.[subCategory]) || 0;
                    const softmaxWeight = Number(cat.softmaxWeights?.[subCategory]) || 0; // Use provided softmax weight

                    // Recalculate score contribution using the determined adjusted weight
                    const scoreContribution = (numScore * adjustedWeightValue) / 100;

                    return `
                      <tr>
                        <td>${cat.category}</td>
                        <td>${subCategory}</td>
                        <td>${numScore.toFixed(2)}</td>
                        <td>${typeof userWeightDisplay === 'number' ? userWeightDisplay.toFixed(2) : userWeightDisplay}</td>
                        <td>${qValue.toFixed(4)}</td>
                        <td>${softmaxWeight.toFixed(2)}</td>
                        <td>${adjustedWeightValue.toFixed(2)}</td>
                        <td class="font-bold">${scoreContribution.toFixed(2)}</td>
                      </tr>
                    `;
                  });
                }).join('')}
              </tbody>
            </table>

            <div class="weight-explanation-grid">
              <div class="weight-card">
                <h4>User Weights</h4>
                <p>Reflect the initial strategic importance assigned by the user to each subcategory within its parent category (sum to 100% per category). If N/A, indicates default equal weighting was applied.</p>
              </div>
              <div class="weight-card">
                <h4>Q-Values</h4>
                <p>Machine-learned values indicating the learned importance or impact of a subcategory on overall readiness, derived via reinforcement learning from assessment patterns. Higher values suggest greater impact.</p>
              </div>
              <div class="weight-card">
                <h4>Softmax Weights</h4>
                <p>Normalized Q-Values (transformed into a probability distribution using the Softmax function) highlighting the *relative* learned importance among subcategories within the same category.</p>
              </div>
              <div class="weight-card">
                <h4>Adjusted Weights</h4>
                <p>The final weights used for scoring, calculated by blending User Weights and learned importance (via Softmax Weights). These provide a balanced view of stated priorities and data-driven significance.</p>
              </div>
            </div>

             <div class="explanation-box">
                <strong>Score Contribution:</strong> This value represents the subcategory's Raw Score multiplied by its Adjusted Weight, indicating its contribution to the overall category score. Summing these contributions for all subcategories within a category yields the Category Overall Score.
             </div>

             <div class="highlight-box highlight-info">
                <p class="highlight-title">Interpreting Weights and Q-Values</p>
                <p>Analyze discrepancies between User Weights and Adjusted/Softmax Weights. A high Adjusted Weight despite a low User Weight (often driven by a high Q-Value/Softmax Weight) suggests the subcategory is empirically more critical to AI readiness than initially perceived. Conversely, a low Adjusted Weight despite a high User Weight may indicate the subcategory, while strategically desired, has less impact based on current data patterns or scoring dynamics.</p>
             </div>
          </section>

          <footer>
             <p>Confidential AI Readiness Assessment Report for ${companyName}</p>
             <p>© ${new Date().getFullYear()} Cybergen Strategic AI Insights. All rights reserved.</p>
             <p>This report was generated leveraging advanced AI analysis based on the provided assessment data.</p>
          </footer>
        </div>
      </div>
    </body>
    </html>
    `;

    return htmlReport;

  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    // Return a styled error message
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Error Generating Report</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 30px; background-color: #f8f9fa; }
        .error-container { background-color: #fff; border: 1px solid #dee2e6; border-left: 5px solid #dc3545; padding: 25px; border-radius: 6px; max-width: 800px; margin: 40px auto; box-shadow: 0 4px 15px rgba(0,0,0,0.07); }
        h1 { color: #dc3545; margin-top: 0; font-size: 24px; }
        p { color: #2c3e50; }
        code { background-color: #e9ecef; padding: 2px 5px; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>Report Generation Failed</h1>
        <p>An unexpected error occurred while generating the AI Readiness Deep Research Report. Please review the details below and try again later. If the issue persists, contact support.</p>
        <p><strong>Error Details:</strong></p>
        <code>${error instanceof Error ? error.message : 'An unknown error occurred.'}</code>
        ${error instanceof Error && error.stack ? `<pre style="font-size: 0.8em; color: #6c757d; margin-top: 15px; white-space: pre-wrap; word-wrap: break-word;">${error.stack}</pre>` : ''}
      </div>
    </body>
    </html>
    `;
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
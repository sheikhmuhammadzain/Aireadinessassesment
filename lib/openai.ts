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
        categoryScores: result.categoryScores,
        qValues: result.qValues || {},
        adjustedWeights: result.adjustedWeights || {},
        userWeights: result.userWeights || {},
        softmaxWeights: result.softmaxWeights || {}
      };
    });

    const overallReadiness = categoriesData.length > 0
      ? Math.round(categoriesData.reduce((sum, cat) => sum + cat.overallScore, 0) / categoriesData.length)
      : 0;

    const prompt = `
      Generate a comprehensive AI Readiness Deep Research Report (at least 3500 words in length) based on the following assessment data:
      
      Overall AI Readiness Score: ${overallReadiness}%
      
      Assessment Results:
      ${JSON.stringify(categoriesData, null, 2)}
      
      The report should include:
      
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
           - Make sure to explicitly reference the specific Q-values and weights for each category
      
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
         - Comprehensive table showing each category with its raw score, user weight, q-value, softmax weight, adjusted weight and contribution to overall score
         - Detailed explanation of Q-values and their algorithmic impact on the final assessment
         - Thorough explanation of how user weights differ from adjusted weights with clear examples from the data
         - Statistical analysis of score distribution and significance
         - Visual representation of scores (describe charts as text that would be shown)
         - Confidence intervals and margin of error analysis
      
      Throughout the report, maintain a highly professional tone. Consistently reference exact scores, weights, 
      and Q-values. For each category, explicitly state the score percentage and how it compares to benchmarks.
      
      Ensure that the total report content contains at least 3500 words with comprehensive coverage of each topic.
      Each section should be thoroughly detailed with specific, actionable insights rather than general statements.
      
      Format the report as a professional HTML document with proper headings, paragraphs, lists, and tables where appropriate.
      Use clear section headings and subheadings. Include a table of contents at the beginning. Make it visually organized and easy to read.
      
      IMPORTANT: Ensure that ALL data fields provided in the assessment results (including ALL Q-values, user weights, adjusted weights, softmax weights) 
      are explicitly referenced and analyzed in the report. Do not leave any data points unmentioned or unanalyzed.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an elite AI strategy consultant who specializes in creating comprehensive, actionable AI readiness reports for organizations. Your reports combine strategic insight with practical implementation guidance, always referencing specific data points, scores, metrics, and mathematical weights from the assessment. You must include all data points in your analysis, especially q-values, user weights, adjusted weights, and softmax weights for every category and subcategory."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 12000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Get company name from localStorage if available
    const companyName = typeof window !== 'undefined' ? 
      localStorage.getItem('companyName') || 'Your Company' : 'Your Company';
    
    // Format current date in a readable format
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Prepare the HTML document with professional styling
    const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Readiness Assessment Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .report-container {
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 40px;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 20px;
        }
        .logo-container {
          text-align: right;
        }
        .logo-text {
          font-size: 24px;
          font-weight: bold;
          color: #38bdf8;
          margin: 0;
        }
        .logo-subtitle {
          font-size: 12px;
          color: #0369a1;
          margin: 0;
        }
        .report-title {
          font-size: 32px;
          color: #333;
          margin: 0 0 15px 0;
          font-weight: bold;
        }
        .report-subtitle {
          font-size: 18px;
          color: #666;
          margin: 0 0 20px 0;
        }
        .report-meta {
          margin-top: 30px;
        }
        .meta-item {
          margin-bottom: 10px;
        }
        .meta-label {
          font-weight: bold;
          display: inline-block;
          width: 130px;
        }
        h1 {
          color: #0369a1;
          border-bottom: 2px solid #38bdf8;
          padding-bottom: 10px;
          font-size: 28px;
          margin-top: 40px;
        }
        h2 {
          color: #0369a1;
          border-bottom: 1px solid #bae6fd;
          padding-bottom: 5px;
          margin-top: 30px;
          font-size: 22px;
        }
        h3 {
          color: #0284c7;
          margin-top: 25px;
          font-size: 18px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          box-shadow: 0 0 5px rgba(0,0,0,0.05);
        }
        th, td {
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
          text-align: left;
        }
        th {
          background-color: #f0f9ff;
          font-weight: bold;
          color: #0284c7;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .toc {
          background-color: #f0f9ff;
          padding: 20px 30px;
          border-radius: 8px;
          margin: 30px 0;
          box-shadow: 0 0 5px rgba(0,0,0,0.05);
        }
        .toc-title {
          color: #0369a1;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 20px;
        }
        .toc ul {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }
        .toc ul ul {
          padding-left: 20px;
        }
        .toc a {
          text-decoration: none;
          color: #0284c7;
          line-height: 1.8;
        }
        .toc a:hover {
          text-decoration: underline;
        }
        .executive-summary {
          background-color: #f0f9ff;
          padding: 25px;
          border-left: 4px solid #38bdf8;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .overall-score {
          text-align: center;
          margin: 40px 0;
          padding: 30px;
          background-color: #f0f9ff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        .score-value {
          font-size: 60px;
          font-weight: bold;
          color: #0369a1;
          margin: 0;
        }
        .score-label {
          font-size: 18px;
          color: #64748b;
          margin: 10px 0 0 0;
        }
        .category-scores {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 30px 0;
        }
        .category-score-card {
          flex: 1 0 calc(50% - 20px);
          min-width: 250px;
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }
        .category-score-card h3 {
          margin-top: 0;
          color: #0284c7;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 10px;
        }
        .category-score {
          font-size: 24px;
          font-weight: bold;
          margin: 15px 0;
        }
        .progress-container {
          background-color: #e0e0e0;
          border-radius: 5px;
          height: 10px;
          width: 100%;
          margin: 10px 0;
        }
        .progress-bar {
          height: 10px;
          border-radius: 5px;
        }
        .strength {
          color: #15803d;
          margin-bottom: 5px;
        }
        .weakness {
          color: #b91c1c;
          margin-bottom: 5px;
        }
        .roadmap {
          border-left: 4px solid #38bdf8;
          padding-left: 20px;
          margin: 20px 0;
        }
        .roadmap h3 {
          color: #0284c7;
          margin-bottom: 15px;
        }
        .roadmap ul {
          padding-left: 20px;
        }
        .roadmap li {
          margin-bottom: 10px;
        }
        .data-table {
          width: 100%;
          margin: 25px 0;
          font-size: 14px;
        }
        .data-table th {
          background-color: #0284c7;
          color: white;
        }
        .data-table tr:hover {
          background-color: #f0f9ff;
        }
        footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 0.9em;
          color: #64748b;
        }
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 40px 0;
        }
        .detailed-scores {
          margin: 30px 0;
        }
        .q-value-explanation {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          font-style: italic;
          color: #64748b;
        }
        .weight-explanation {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 30px 0;
        }
        .weight-card {
          flex: 1 0 calc(50% - 20px);
          min-width: 250px;
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 0 5px rgba(0,0,0,0.05);
        }
        .weight-card h4 {
          margin-top: 0;
          color: #0284c7;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .highlight-box {
          background-color: #ecfdf5;
          border-left: 4px solid #10b981;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .highlight-title {
          font-weight: bold;
          color: #065f46;
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div>
            <h1 class="report-title">AI Readiness Assessment Report</h1>
            <div class="report-meta">
              <div class="meta-item"><span class="meta-label">Assessment Type:</span> ${categoriesData[0]?.category || "Comprehensive Assessment"}</div>
              <div class="meta-item"><span class="meta-label">Date:</span> ${currentDate}</div>
              <div class="meta-item"><span class="meta-label">Prepared for:</span> ${companyName}</div>
            </div>
          </div>
          
          <div class="logo-container">
            <p class="logo-text">CYBERGEN</p>
            <p class="logo-subtitle">One Team</p>
          </div>
        </div>
        
        <div class="overall-score">
          <p class="score-value">${overallReadiness}%</p>
          <p class="score-label">Overall AI Readiness Score</p>
        </div>
        
        <div class="category-scores">
          ${categoriesData.map(cat => `
            <div class="category-score-card">
              <h3>${cat.category}</h3>
              <div class="category-score">${Math.round(cat.overallScore)}%</div>
              <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.round(cat.overallScore)}%; background-color: ${getColorForScore(cat.overallScore)};"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${content}
        
        <div class="divider"></div>
        
        <div class="detailed-scores">
          <h2 id="detailed-scores">Detailed Scoring Information</h2>
          
          ${Object.values(categoriesData).some(cat => Object.values(cat.userWeights || {}).every(w => w === 0)) ? `
          <div class="highlight-box" style="background-color: #f0f7ff; border-left-color: #38bdf8;">
            <p class="highlight-title" style="color: #0369a1;">Note About Weights</p>
            <p>Some categories had all zero weights in the original assessment. For these categories, equal weights have been automatically calculated for all subcategories to provide a more meaningful analysis.</p>
          </div>
          ` : ''}
          
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Raw Score</th>
                <th>User Weight (%)</th>
                <th>Q Value</th>
                <th>Softmax Weight (%)</th>
                <th>Adjusted Weight (%)</th>
                <th>Weighted Score</th>
              </tr>
            </thead>
            <tbody>
              ${categoriesData.flatMap(cat => {
                // Check if all user weights are zero for this category
                const allWeightsZero = Object.values(cat.userWeights || {}).every(w => w === 0);
                const subCategoryCount = Object.keys(cat.categoryScores || {}).length;
                const defaultWeight = subCategoryCount > 0 ? (100 / subCategoryCount) : 0;
                
                return Object.entries(cat.categoryScores || {}).map(([subCategory, score]) => {
                  // Use default weight if all weights are zero
                  const userWeight = allWeightsZero ? defaultWeight : (cat.userWeights?.[subCategory] || 0);
                  const qValue = cat.qValues?.[subCategory] || 0;
                  const softmaxWeight = cat.softmaxWeights?.[subCategory] || 0;
                  const adjustedWeight = allWeightsZero ? defaultWeight : (cat.adjustedWeights?.[subCategory] || 0);
                  const weightedScore = ((score as number) * adjustedWeight) / 100;
                  
                  return `
                    <tr>
                      <td>${cat.category}</td>
                      <td>${subCategory}</td>
                      <td>${(score as number).toFixed(2)}%</td>
                      <td>${userWeight.toFixed(2)}</td>
                      <td>${qValue.toFixed(4)}</td>
                      <td>${softmaxWeight.toFixed(2)}</td>
                      <td>${adjustedWeight.toFixed(2)}</td>
                      <td>${weightedScore.toFixed(2)}</td>
                    </tr>
                  `;
                });
              }).join('')}
            </tbody>
          </table>
          
          <div class="weight-explanation">
            <div class="weight-card">
              <h4>User Weights</h4>
              <p>These are the original weights specified for each category, representing the initial assessment of relative importance. User weights sum to 100% within each assessment category.</p>
            </div>
            
            <div class="weight-card">
              <h4>Q Values</h4>
              <p>Q values represent the learned importance of each category through reinforcement learning algorithms. Higher Q values indicate categories that have greater impact on overall AI readiness based on assessment data.</p>
            </div>
            
            <div class="weight-card">
              <h4>Softmax Weights</h4>
              <p>Softmax weights are derived by applying a softmax function to the Q values, which normalizes them into a probability distribution. This helps highlight the relative importance between categories.</p>
            </div>
            
            <div class="weight-card">
              <h4>Adjusted Weights</h4>
              <p>The final weights used in scoring, combining both user weights and learned importance (Q values). These are optimized to reflect both strategic priorities and empirical significance.</p>
            </div>
          </div>
          
          <div class="highlight-box">
            <p class="highlight-title">Weight Calculation Methodology</p>
            <p>The assessment uses a sophisticated multi-stage weighting system that combines human expertise (user weights) with machine learning (Q values) to create optimized adjusted weights:</p>
            <ol>
              <li><strong>User weights</strong> are collected during the assessment setup</li>
              <li><strong>Q values</strong> are calculated through reinforcement learning based on assessment patterns</li>
              <li><strong>Softmax transformation</strong> is applied to normalize Q values into a probability distribution</li>
              <li><strong>Adjusted weights</strong> are computed by blending user weights with softmax weights</li>
              <li>The final score is calculated using these adjusted weights to provide a more accurate representation of AI readiness</li>
            </ol>
          </div>
        </div>
      
        <footer>
          <p>© ${new Date().getFullYear()} Cybergen | AI Readiness Assessment Platform | Generated with AI-powered analysis</p>
        </footer>
      </div>
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
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #b91c1c;
        }
      </style>
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

/**
 * Utility function to get color based on score
 */
function getColorForScore(score: number): string {
  if (score < 30) return '#73BFDC'; // Medium blue
  if (score < 60) return '#4389B0'; // Deeper blue
  if (score < 80) return '#2C6F9B'; // Rich blue
  return '#0A4570'; // Darkest blue
} 
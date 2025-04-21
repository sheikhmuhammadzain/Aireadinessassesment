/**
 * Fallback questionnaire data for when the API is unavailable
 * This allows the application to function offline or when the backend is down
 */

export const fallbackQuestionnaires = {
  "AI Culture": {
    "Leadership and Vision": [
      "Our leadership team has a clear vision for AI adoption within the organization",
      "Leaders actively communicate and champion AI initiatives across the organization",
      "Our organization's leadership understands the strategic value of AI"
    ],
    "Communication and Collaboration": [
      "We have open communication channels for discussing AI opportunities and challenges",
      "Cross-functional teams collaborate effectively on AI projects",
      "Knowledge about AI initiatives is shared consistently throughout the organization"
    ],
    "Risk and Innovation": [
      "Our organization encourages responsible risk-taking in AI innovation",
      "We have a culture that supports experimentation with AI technologies",
      "Failures in AI initiatives are treated as learning opportunities"
    ],
    "Ethics and Values": [
      "Our organization has clearly articulated values regarding ethical AI use",
      "Ethical considerations are explicitly discussed in AI project planning",
      "We have processes to ensure AI systems align with our organizational values"
    ]
  },
  "AI Governance": {
    "Policies and Procedures": [
      "We have formal AI governance policies in place",
      "AI decision-making processes are clearly defined",
      "We regularly review and update our AI governance framework"
    ],
    "Oversight and Accountability": [
      "There are clear roles and responsibilities for AI oversight",
      "We have established accountability measures for AI systems",
      "Regular audits of AI systems are conducted"
    ],
    "Risk Management": [
      "We have a structured approach to AI risk assessment",
      "Mitigation strategies for AI risks are documented and implemented",
      "AI risk assessments influence decision-making processes"
    ],
    "Compliance and Ethics": [
      "We have mechanisms to ensure AI compliance with relevant regulations",
      "Our AI systems are designed with ethical principles in mind",
      "We have a process for addressing ethical concerns with AI systems"
    ]
  },
  "AI Infrastructure": {
    "Computing Resources": [
      "We have sufficient computational resources for AI workloads",
      "Our infrastructure can scale to meet growing AI demands",
      "We have appropriate hardware for AI model training and inference"
    ],
    "Data Infrastructure": [
      "Our data infrastructure effectively supports AI workloads",
      "We have reliable data pipelines for AI systems",
      "Our data storage solutions are optimized for AI applications"
    ],
    "Development Environment": [
      "We have standardized development environments for AI projects",
      "Our AI development tools are current and well-maintained",
      "We use version control and CI/CD pipelines for AI projects"
    ],
    "Deployment and Monitoring": [
      "We have robust systems for deploying AI models to production",
      "Our monitoring solutions can effectively track AI system performance",
      "We can quickly identify and address issues in deployed AI systems"
    ]
  },
  "AI Strategy": {
    "Vision and Goals": [
      "We have a clear AI strategy aligned with business objectives",
      "Specific, measurable goals for AI initiatives have been established",
      "Our AI strategy is regularly reviewed and updated"
    ],
    "Resource Allocation": [
      "We dedicate appropriate resources to AI initiatives",
      "Budget allocation for AI projects is adequate and sustainable",
      "Resource allocation decisions are aligned with AI strategic priorities"
    ],
    "Roadmap and Planning": [
      "We have a clearly defined roadmap for AI implementation",
      "Our AI roadmap includes short and long-term objectives",
      "We prioritize AI initiatives based on strategic impact"
    ],
    "Measurement and KPIs": [
      "We have established KPIs to measure the success of AI initiatives",
      "We regularly track and report on AI performance metrics",
      "AI metrics influence strategic decision-making"
    ]
  },
  "AI Data": {
    "Data Quality": [
      "We have processes to ensure high-quality data for AI systems",
      "Data quality is regularly assessed and improved",
      "We have clear data quality standards for AI applications"
    ],
    "Data Governance": [
      "We have established data governance practices for AI",
      "Data ownership and stewardship are clearly defined",
      "We maintain comprehensive data documentation"
    ],
    "Data Privacy and Security": [
      "We have robust data privacy measures for AI systems",
      "Data security protocols are implemented for AI data",
      "We regularly audit data privacy and security compliance"
    ],
    "Data Acquisition and Management": [
      "We have effective processes for acquiring relevant data for AI",
      "Our data management practices support AI initiatives",
      "We can efficiently integrate data from multiple sources for AI use"
    ]
  },
  "AI Talent": {
    "Skills and Expertise": [
      "We have the necessary AI technical expertise in our organization",
      "Our AI professionals have appropriate domain knowledge",
      "We maintain an inventory of AI skills and capabilities"
    ],
    "Talent Development": [
      "We have training programs to develop AI capabilities",
      "Career paths for AI professionals are clearly defined",
      "We provide continuous learning opportunities for AI skills"
    ],
    "Recruitment and Retention": [
      "We have effective strategies for recruiting AI talent",
      "Our retention strategies for AI professionals are successful",
      "We offer competitive compensation for AI roles"
    ],
    "Collaboration and Structure": [
      "Our organizational structure effectively supports AI talent",
      "AI professionals collaborate effectively with other teams",
      "We have mechanisms to share AI knowledge across the organization"
    ]
  },
  "AI Security": {
    "Threat Assessment": [
      "We regularly assess security threats to our AI systems",
      "Potential vulnerabilities in AI systems are proactively identified",
      "Security considerations are integrated into AI development processes"
    ],
    "Protection Measures": [
      "We have implemented appropriate security controls for AI systems",
      "Access to AI models and data is properly restricted",
      "We use encryption and other security measures to protect AI assets"
    ],
    "Incident Response": [
      "We have established AI security incident response procedures",
      "Our team is prepared to address AI security breaches",
      "We conduct regular drills for AI security incidents"
    ],
    "Continuous Improvement": [
      "We regularly update AI security measures based on new threats",
      "Security lessons learned are incorporated into future AI projects",
      "We participate in AI security knowledge sharing with peers"
    ]
  }
};

/**
 * Default weights to use as fallback when API recommendations fail
 */
export const defaultCategoryWeights = {
  "AI Governance": 14.3,
  "AI Culture": 14.3,
  "AI Infrastructure": 14.3,
  "AI Strategy": 14.3,
  "AI Data": 14.3,
  "AI Talent": 14.3,
  "AI Security": 14.2
};

/**
 * Default subcategory weights per assessment type
 */
export const defaultSubcategoryWeights = {
  "AI Culture": {
    "Leadership and Vision": 25,
    "Communication and Collaboration": 25,
    "Risk and Innovation": 25,
    "Ethics and Values": 25
  },
  "AI Governance": {
    "Policies and Procedures": 25,
    "Oversight and Accountability": 25,
    "Risk Management": 25,
    "Compliance and Ethics": 25
  },
  "AI Infrastructure": {
    "Computing Resources": 25,
    "Data Infrastructure": 25,
    "Development Environment": 25,
    "Deployment and Monitoring": 25
  },
  "AI Strategy": {
    "Vision and Goals": 25,
    "Resource Allocation": 25,
    "Roadmap and Planning": 25,
    "Measurement and KPIs": 25
  },
  "AI Data": {
    "Data Quality": 25,
    "Data Governance": 25,
    "Data Privacy and Security": 25,
    "Data Acquisition and Management": 25
  },
  "AI Talent": {
    "Skills and Expertise": 25,
    "Talent Development": 25,
    "Recruitment and Retention": 25,
    "Collaboration and Structure": 25
  },
  "AI Security": {
    "Threat Assessment": 25,
    "Protection Measures": 25,
    "Incident Response": 25,
    "Continuous Improvement": 25
  }
}; 
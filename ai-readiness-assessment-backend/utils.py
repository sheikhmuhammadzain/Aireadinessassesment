import os
import requests
import json
from typing import Dict, List, Optional
import logging

# Add new imports for OpenAI integration
import openai
from dotenv import load_dotenv

# Add import for Company model
from models import Company

# Setup logger
logger = logging.getLogger("api.utils")

# Load environment variables
load_dotenv()

# Setup OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_color_for_score(score):
    """
    Returns an appropriate color based on the score range
    """
    if score < 30:
        return "#EF4444"  # Red
    elif score < 60:
        return "#F59E0B"  # Amber
    elif score < 80:
        return "#10B981"  # Green
    else:
        return "#3B82F6"  # Blue

def get_strength_comment(category, score):
    """
    Return a customized strength comment based on the category and score
    """
    if "Governance" in category:
        return "Your organization has established strong AI governance processes with clear policies and accountability structures."
    elif "Data" in category:
        return "You have robust data management practices, with high-quality data that is well organized and accessible."
    elif "Infrastructure" in category:
        return "Your technical infrastructure is well-equipped to support AI initiatives with adequate compute and scalable environments."
    elif "Strategy" in category:
        return "Your organization has a clear AI strategy that aligns with business objectives and includes effective security measures."
    elif "Talent" in category:
        return "Your organization has effectively built AI capabilities through talent acquisition and training programs."
    elif "Culture" in category:
        return "Your organization has cultivated a strong culture of AI adoption with leadership support and collaborative practices."
    else:
        return f"Your organization demonstrates strength in {category} with a score of {score:.1f}%."

def get_improvement_comment(category, score):
    """
    Return a customized improvement comment based on the category and score
    """
    if "Governance" in category:
        return "Focus on developing structured AI governance policies and clearer accountability frameworks."
    elif "Data" in category:
        return "Improve data quality, accessibility, and implement better data governance practices."
    elif "Infrastructure" in category:
        return "Invest in more robust AI infrastructure and MLOps capabilities to support AI initiatives."
    elif "Strategy" in category:
        return "Develop a more comprehensive AI strategy with stronger security measures and better alignment with business goals."
    elif "Talent" in category:
        return "Implement more targeted AI talent acquisition and training programs to build necessary capabilities."
    elif "Culture" in category:
        return "Work on fostering a more AI-friendly culture with stronger leadership support and more collaborative practices."
    else:
        return f"Focus on enhancing capabilities in {category} from the current score of {score:.1f}%."

def get_recommendations(category, score):
    """
    Return a list of customized recommendations based on the category and score
    """
    recommendations = []
    
    if "Governance" in category:
        recommendations = [
            "Establish clear policies for ethical AI development and usage",
            "Create explicit roles for algorithmic accountability and oversight",
            "Develop a comprehensive AI risk management framework",
            "Implement regular AI ethics and governance training for all teams",
            "Set up an AI review board to evaluate high-risk AI initiatives"
        ]
    elif "Data" in category:
        recommendations = [
            "Implement a centralized data catalog for better data discovery",
            "Establish strong data quality assurance processes",
            "Create clear data governance policies and documentation",
            "Improve data pipeline efficiency with automation",
            "Implement bias detection and mitigation strategies"
        ]
    elif "Infrastructure" in category:
        recommendations = [
            "Invest in cloud-based AI infrastructure for scalability",
            "Develop containerized environments for consistent AI deployment",
            "Implement automated ML pipelines for faster experimentation",
            "Establish robust monitoring for AI system performance",
            "Create standardized environments for development and production"
        ]
    elif "Strategy" in category:
        recommendations = [
            "Define clear business objectives for AI initiatives",
            "Align AI projects with overall organizational strategy",
            "Implement robust security measures for all AI assets",
            "Create a roadmap for AI implementation with clear milestones",
            "Establish metrics to track ROI from AI investments"
        ]
    elif "Talent" in category:
        recommendations = [
            "Create dedicated AI roles and clear career paths",
            "Establish regular AI training programs for existing staff",
            "Partner with academic institutions for talent pipeline",
            "Implement knowledge sharing mechanisms across teams",
            "Develop specialized AI skills in domain experts"
        ]
    elif "Culture" in category:
        recommendations = [
            "Secure executive sponsorship for AI initiatives",
            "Create spaces for AI experimentation and innovation",
            "Implement regular AI awareness sessions for all employees",
            "Recognize and reward AI champions within the organization",
            "Foster cross-functional collaboration on AI projects"
        ]
    
    # Return top 5 or fewer recommendations based on score
    num_recommendations = 5 if score < 30 else (3 if score < 60 else 2)
    return recommendations[:num_recommendations]

def generate_personalized_questions(company_info: Dict, pillar: str, category: str, num_questions: int = 5) -> List[Dict]:
    """
    Generate personalized assessment questions for a specific company based on their profile,
    for a specific pillar and category.
    
    Args:
        company_info: Company details including name, industry, size, etc.
        pillar: The assessment pillar (e.g., "AI Governance", "AI Culture")
        category: The category within the pillar
        num_questions: Number of questions to generate (default: 5)
        
    Returns:
        List of question objects with custom options and explanations
    """
    logger.info(f"Generating mock personalized questions for {company_info.get('name')}, pillar: {pillar}, category: {category}")
    
    try:
        # Instead of calling OpenAI, use mock questions based on category
        mock_questions = {
            "Talent Acquisition": [
                {
                    "text": f"How would you describe {company_info.get('name', 'your company')}'s approach to AI talent acquisition?",
                    "options": [
                        {"id": "option1", "text": "We don't have a specific AI talent strategy"},
                        {"id": "option2", "text": "We occasionally hire for AI roles when needed"},
                        {"id": "option3", "text": "We have a dedicated AI hiring pipeline"},
                        {"id": "option4", "text": "We have a comprehensive AI talent acquisition strategy integrated with our business goals"}
                    ]
                },
                {
                    "text": "How competitive is your compensation for AI specialists compared to market rates?",
                    "options": [
                        {"id": "option1", "text": "Below market average"},
                        {"id": "option2", "text": "At market average"},
                        {"id": "option3", "text": "Above market average"},
                        {"id": "option4", "text": "Top of the market with additional incentives"}
                    ]
                }
            ],
            "Training & Development": [
                {
                    "text": "What AI upskilling opportunities do you provide for existing employees?",
                    "options": [
                        {"id": "option1", "text": "No formal upskilling opportunities"},
                        {"id": "option2", "text": "Basic online courses available upon request"},
                        {"id": "option3", "text": "Structured learning paths with regular training sessions"},
                        {"id": "option4", "text": "Comprehensive AI academy with certification paths and practical projects"}
                    ]
                },
                {
                    "text": "How do you measure the effectiveness of your AI training programs?",
                    "options": [
                        {"id": "option1", "text": "We don't formally measure effectiveness"},
                        {"id": "option2", "text": "Basic completion metrics"},
                        {"id": "option3", "text": "Knowledge assessments and skill evaluations"},
                        {"id": "option4", "text": "Comprehensive impact metrics including project outcomes and business value"}
                    ]
                }
            ],
            "Retention & Culture": [
                {
                    "text": "What strategies do you use to retain AI talent?",
                    "options": [
                        {"id": "option1", "text": "Standard company-wide retention policies"},
                        {"id": "option2", "text": "Competitive compensation packages"},
                        {"id": "option3", "text": "Technical growth paths and challenging projects"},
                        {"id": "option4", "text": "Comprehensive approach including research opportunities, conference participation, and innovation time"}
                    ]
                },
                {
                    "text": "How integrated are AI specialists with the rest of your organization?",
                    "options": [
                        {"id": "option1", "text": "Siloed in separate technical teams"},
                        {"id": "option2", "text": "Limited cross-functional collaboration"},
                        {"id": "option3", "text": "Regular collaboration with business units"},
                        {"id": "option4", "text": "Deeply embedded across all functions with clear paths for knowledge sharing"}
                    ]
                }
            ],
            "Data Quality": [
                {
                    "text": f"How would you rate the overall quality of {company_info.get('name', 'your organization')}'s data assets?",
                    "options": [
                        {"id": "option1", "text": "Poor - Significant data quality issues are common"},
                        {"id": "option2", "text": "Fair - Some data quality issues exist"},
                        {"id": "option3", "text": "Good - Generally high quality with occasional issues"},
                        {"id": "option4", "text": "Excellent - Consistently high quality data across the organization"}
                    ]
                },
                {
                    "text": "What processes do you have in place for data validation and cleaning?",
                    "options": [
                        {"id": "option1", "text": "No formal processes"},
                        {"id": "option2", "text": "Basic data cleaning during analysis"},
                        {"id": "option3", "text": "Standardized validation and cleaning workflows"},
                        {"id": "option4", "text": "Automated data quality monitoring and remediation pipelines"}
                    ]
                }
            ],
            "Data Governance": [
                {
                    "text": "How mature is your organization's data governance framework?",
                    "options": [
                        {"id": "option1", "text": "No formal governance framework"},
                        {"id": "option2", "text": "Basic policies exist but implementation is inconsistent"},
                        {"id": "option3", "text": "Established framework with clear roles and responsibilities"},
                        {"id": "option4", "text": "Comprehensive framework integrated with business operations"}
                    ]
                },
                {
                    "text": "How do you manage data access and security?",
                    "options": [
                        {"id": "option1", "text": "Limited controls, primarily open access"},
                        {"id": "option2", "text": "Basic role-based access controls"},
                        {"id": "option3", "text": "Fine-grained access policies with regular audits"},
                        {"id": "option4", "text": "Zero-trust model with continuous monitoring and adaptive controls"}
                    ]
                }
            ],
            "AI-Ready Infrastructure": [
                {
                    "text": "How would you describe your data infrastructure's readiness for AI applications?",
                    "options": [
                        {"id": "option1", "text": "Not designed for AI workloads"},
                        {"id": "option2", "text": "Basic capabilities with significant limitations"},
                        {"id": "option3", "text": "Capable infrastructure that handles most AI needs"},
                        {"id": "option4", "text": "Purpose-built for advanced AI with scalability and flexibility"}
                    ]
                },
                {
                    "text": "What level of integration exists between your data systems?",
                    "options": [
                        {"id": "option1", "text": "Mostly siloed data systems"},
                        {"id": "option2", "text": "Some integration but significant manual effort required"},
                        {"id": "option3", "text": "Well-integrated systems with standardized data flows"},
                        {"id": "option4", "text": "Fully connected data ecosystem with real-time synchronization"}
                    ]
                }
            ]
        }
        
        # Default questions for any other category
        default_questions = [
            {
                "text": f"How would you rate {company_info.get('name', 'your company')}'s maturity in {category}?",
                "options": [
                    {"id": "option1", "text": "Very basic - just starting out"},
                    {"id": "option2", "text": "Developing - some progress but significant gaps"},
                    {"id": "option3", "text": "Established - good practices with room for improvement"},
                    {"id": "option4", "text": "Advanced - industry-leading practices"}
                ]
            },
            {
                "text": f"What are your biggest challenges in {category}?",
                "options": [
                    {"id": "option1", "text": "Lack of expertise and knowledge"},
                    {"id": "option2", "text": "Limited resources and budget"},
                    {"id": "option3", "text": "Integration with existing systems"},
                    {"id": "option4", "text": "Scaling successful implementations"}
                ]
            }
        ]
        
        # Get questions for this category or use default
        questions = mock_questions.get(category, default_questions)
        
        # Limit to the requested number of questions
        return questions[:num_questions]
        
    except Exception as e:
        logger.error(f"Error generating personalized questions: {str(e)}")
        return []

def get_personalized_assessment(company_id: str, pillar: str, db) -> Dict:
    """
    Get a complete personalized assessment for a specific company and pillar.
    
    Args:
        company_id: The ID of the company
        pillar: The assessment pillar (e.g., "AI Governance")
        db: Database session
        
    Returns:
        Dictionary containing the complete assessment with personalized questions
    """
    try:
        # Get company info from database
        company = db.query(Company).filter(Company.id == company_id).first()
        
        if not company:
            return {"error": "Company not found"}
            
        company_info = {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "size": company.size,
            "region": company.region,
            "ai_maturity": company.ai_maturity
        }
        
        # Load questionnaires directly from file
        try:
            with open("data/questionnaires.json", "r") as f:
                questionnaires = json.load(f)
        except FileNotFoundError:
            # Create default categories if questionnaires file doesn't exist
            logger.warning("questionnaires.json not found, using default categories")
            if pillar == "AI Talent":
                questionnaires = {
                    "AI Talent": ["Talent Acquisition", "Training & Development", "Retention & Culture"]
                }
            elif pillar == "AI Data":
                questionnaires = {
                    "AI Data": ["Data Quality", "Data Governance", "AI-Ready Infrastructure"]
                }
            else:
                questionnaires = {pillar: ["Strategy", "Implementation", "Monitoring"]}
        
        # Get the categories for this pillar from the questionnaires data
        if pillar not in questionnaires:
            return {"error": f"Pillar '{pillar}' not found"}
            
        categories = questionnaires[pillar]
        logger.info(f"Found {len(categories)} categories for pillar {pillar}")
        
        # Generate questions for each category
        assessment = {
            "pillar": pillar,
            "company": company_info,
            "categories": []
        }
        
        for category_name in categories:
            logger.info(f"Generating questions for category: {category_name}")
            # Generate personalized questions for this category
            questions = generate_personalized_questions(
                company_info=company_info,
                pillar=pillar,
                category=category_name,
                num_questions=3  # Generate 3 questions per category
            )
            
            assessment["categories"].append({
                "name": category_name,
                "questions": questions
            })
        
        return assessment
        
    except Exception as e:
        logger.error(f"Error generating personalized assessment: {str(e)}")
        return {"error": str(e)}
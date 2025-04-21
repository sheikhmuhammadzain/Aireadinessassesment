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
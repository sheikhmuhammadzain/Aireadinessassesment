import numpy as np

# ✅ Hardcoded Questionnaire (Categorized)
questionnaire = {
    "Data Accessibility & Cataloging": [
        "Is your data catalogued for easy access by AI teams?",
        "Do you maintain data dictionaries to standardize metadata?",
        "How frequent is your data updated for AI use cases?",
        "Do you support multi-modal data integration for AI?",
    ],
    "Data Governance & Compliance": [
        "Is your data governance aligned with AI requirements?",
        "How secure is your external data ingestion process?",
        "Do you audit external data sources for quality and reliability?",
        "Do you use version control for data sets used in AI?",
        "How comprehensive is your data anonymization process?",
        "Do you conduct regular data lineage audits?",
    ],
    "Data Quality & Processing": [
        "Do you have automated data cleansing pipelines?",
        "Are labeling processes standardized for supervised learning?",
        "How prepared are your data formats for new AI applications?",
        "Do you assess the energy consumption of data processing?",
        "Are duplicate records identified and removed from the dataset?",
        "What mechanisms do you use to detect and manage outliers in structured datasets?",
    ],
    "Bias & Fairness in AI Data": [
        "Do you have tools to identify biases in data pipelines?",
        "How is the data checked for biases (e.g., gender, race, class imbalance)?",
        "Do you use tools to calculate fairness metrics, such as the Gini-Simpson Index or P-Difference metrics?",
        "Are mechanisms like synthetic data generation used, and how is closeness to real data evaluated?",
        "Is your data aligned with FAIR principles (Findable, Accessible, Interoperable, Reusable)?",
    ],
    "Data Infrastructure & Security": [
        "Do you have internal tools for synthetic data generation?",
        "Is your data pipeline automated for repeatable experiments?",
        "Do you use cloud-native data tools for AI processing?",
        "Are there contingency plans for data breaches in AI systems?",
        "How do you ensure that datasets used for training are current and relevant?",
        "Are advanced ETL workflows and data lakes in place to centralize fragmented datasets?",
    ],
}

# ✅ Dictionary to store responses
user_responses = {category: [] for category in questionnaire.keys()}

# ✅ Asking Questions and Storing Responses
for category, questions in questionnaire.items():
    print(f"\n🔹 **Category: {category}**")
    for question in questions:
        while True:
            try:
                response = int(
                    input(f"{question}\nEnter your response (1-4, where 1 = Strongly Disagree, 4 = Strongly Agree): "))

                if response < 1 or response > 4:
                    print("⚠️ Invalid input. Please enter a number between 1 and 4.")
                    continue

                user_responses[category].append(response)
                break
            except ValueError:
                print("⚠️ Invalid input. Please enter a valid number (1-4).")

# ✅ Compute Category Scores (Mean of Responses)
category_scores = {category: np.mean(scores) for category, scores in user_responses.items()}

# ✅ Allow User to Set Weightages for Each Category (out of 100)
user_weightages = {}
print("\n🔹 **Set Weightage for Each Category (out of 100, total should sum to 100):**")
for category in questionnaire.keys():
    while True:
        try:
            weight = float(input(f"Set weightage for {category} (0 to 100): "))
            if weight < 0 or weight > 100:
                print("⚠️ Invalid input. Enter a number between 0 and 100.")
                continue
            user_weightages[category] = weight
            break
        except ValueError:
            print("⚠️ Invalid input. Enter a valid number.")

# ✅ Normalize User-defined Weights (Convert to Range 0-1)
total_weight = sum(user_weightages.values())
user_weightages = {category: weight / total_weight for category, weight in user_weightages.items()}

# ✅ Initialize Q-values
q_values = {category: np.random.uniform(0, 1) for category in questionnaire.keys()}

# ✅ Reinforcement Learning Parameters
alpha = 0.1  # Learning rate
gamma = 0.9  # Discount factor

# ✅ Updating Q-values iteratively based on reinforcement learning and user-defined weights
for _ in range(10):  # Simulate multiple learning iterations
    for category in questionnaire.keys():
        # Reward is now based on both user weightage and category score
        reward = user_weightages[category] * category_scores[category]  
        
        # Q-value update incorporating user weightage and category score
        q_values[category] += alpha * (reward + gamma * max(q_values.values()) - q_values[category])

# ✅ Compute Softmax Weights Using User Weightages and Q-values
eta = 1.0  # Softmax scaling parameter
exp_q_values = np.exp(eta * np.array([q_values[cat] * user_weightages[cat] * category_scores[cat] for cat in questionnaire.keys()]))
softmax_weights = exp_q_values / np.sum(exp_q_values)

# ✅ Apply Constraint: Ensure Weightage Doesn't Deviate More Than ±2% from User Defined Weights
adjusted_weights = {}
for category in questionnaire.keys():
    min_limit = (user_weightages[category] * 100) - 2  # Minimum allowed value (in percentage)
    max_limit = (user_weightages[category] * 100) + 2  # Maximum allowed value (in percentage)
    
    # Convert softmax weight to percentage
    adjusted_weight = softmax_weights[list(questionnaire.keys()).index(category)] * 100
    
    # Apply constraint
    adjusted_weights[category] = max(min_limit, min(adjusted_weight, max_limit))

# ✅ Normalize Adjusted Weights to Sum to 100%
total_adjusted_weight = sum(adjusted_weights.values())
adjusted_weights = {category: (weight / total_adjusted_weight) * 100 for category, weight in adjusted_weights.items()}

# ✅ Compute Final AI Data Readiness Score (Weighted Sum)
overall_score = sum(category_scores[cat] * (adjusted_weights[cat] / 100) for cat in questionnaire.keys())

# ✅ Display Results
print("\n🏆 **AI Data Readiness Scores:**")
for category in questionnaire.keys():
    print(f"{category}: {category_scores[category]:.2f}")

print("\n🔹 **User-defined Weights (out of 100):**")
for category, weight in user_weightages.items():
    print(f"{category}: {weight * 100:.1f}%")  # Convert back to display as percentage

print("\n🔹 **Updated Q-values after Learning:**")
for category, q_val in q_values.items():
    print(f"{category}: {q_val:.3f}")

print("\n🔹 **Final Adjusted Softmax Weights (with ±2% Constraint, in %):**")
for category, weight in adjusted_weights.items():
    print(f"{category}: {weight:.1f}%")

print("\n🔹 **Final AI Data Readiness Score:**", round(overall_score, 2))

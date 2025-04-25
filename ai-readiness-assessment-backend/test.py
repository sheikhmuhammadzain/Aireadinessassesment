from pydantic import BaseModel, RootModel
from typing import List
import json

# Define a model for each individual question
class Question(BaseModel):
    category: str
    subcategory: str
    question: str
    options: List[str]

# Define a model for a list of questions (a group or section)
class QuestionGroup(RootModel[List[Question]]):
    pass

# Define the root model for the entire questionnaire (list of groups)
class Questionnaire(RootModel[List[QuestionGroup]]):
    pass

# Example usage
if __name__ == "__main__":
    # Replace this with the actual file path or JSON source
    with open("/home/cybergenai/PycharmProjects/ai-readiness-assessment-backend/data/questionnair_2.json", "r", encoding="utf-8") as file:
        raw_data = json.load(file)

    # Parse and validate using Pydantic
    questionnaire = Questionnaire.model_validate(raw_data)

    # Accessing a specific question
    first_group = questionnaire.root[0]            # First group
    first_question = first_group.root[0]           # First question in first group

    print("First Question:")
    print("Category:", first_question.category)
    print("Subcategory:", first_question.subcategory)
    print("Question:", first_question.question)
    print("Options:", first_question.options)

    # Example: print all questions from all groups
    print("\n--- All Questions ---")
    for group_index, group in enumerate(questionnaire.root):
        for question_index, question in enumerate(group.root):
            print(f"[Group {group_index} | Q{question_index + 1}] {question.question}")

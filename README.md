# AI Readiness Assessment Application

A full-stack application for evaluating an organization's readiness for AI adoption across six key dimensions.

## Features

- **Comprehensive Assessment Framework**: Evaluate AI readiness across Governance, Culture, Infrastructure, Strategy, Data, and Talent dimensions
- **Interactive Questionnaires**: Answer questions on a 4-point scale for each category
- **Advanced Scoring Algorithm**: Uses reinforcement learning techniques to weight different categories
- **Visualized Results**: View results through various charts and visualizations
- **Personalized Recommendations**: Get tailored recommendations based on assessment scores
- **Dashboard**: Track progress across multiple assessments

## Tech Stack

- **Frontend**: Next.js with shadcn/ui components and Tailwind CSS
- **Backend**: FastAPI with NumPy for calculations
- **Visualization**: Recharts for interactive charts
- **Containerization**: Docker and Docker Compose for easy deployment

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose (optional)

### Running with Docker

```bash
# Clone the repository
git clone <repository-url>
cd ai-readiness-assessment

# Start the application with Docker Compose
docker-compose up
```

### Running Locally

```bash
# Start the backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# In a new terminal, start the frontend
npm install
npm run dev
```

## Usage

1. Visit http://localhost:3000 to access the application
2. Select an assessment dimension to begin
3. Answer all questions in each category
4. View your results and recommendations
5. Track your progress in the dashboard

## Project Structure

- `/app`: Next.js frontend application
- `/components`: Reusable UI components
- `/backend`: FastAPI backend application
- `/backend/data`: Assessment questionnaires and data
- `/backend/utils.py`: Utility functions for recommendations and visualizations

## License

MIT
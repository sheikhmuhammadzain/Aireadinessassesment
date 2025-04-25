# AI Readiness Assessment Backend

This backend service powers the AI Readiness Assessment platform, allowing companies to evaluate their AI readiness across multiple dimensions.

## Features

- User authentication and authorization
- Company management
- Standard assessments based on predefined questionnaires
- **Personalized assessments with dynamic questions** generated specifically for each company
- Assessment scoring and recommendations
- Weight customization for categories and pillars

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to enable personalized question generation

4. Start the server:
   ```
   uvicorn main:app --reload
   ```

## Personalized Assessments

The platform now supports generating personalized assessment questions for companies based on their profile, industry, and AI maturity level.

### How it works

1. When a company is selected for assessment, the system uses their profile data (industry, size, region, etc.)
2. The OpenAI API generates custom questions specific to that company's context
3. Each question includes:
   - Context-specific question text relevant to the company's industry
   - Four unique answer options reflecting different levels of AI readiness
   - Explanation of the correct answer
   - Optional remarks with advice specific to the company

### API Endpoints

#### Get Personalized Assessment

```
GET /questionnaire/{assessment_type}/personalized/{company_id}
```

Returns a complete personalized assessment for the specified company and assessment type (pillar).

#### Submit Personalized Assessment

```
POST /assessments/personalized
```

Submit responses for a personalized assessment. The responses are scored based on the correct answers identified during question generation.

## Standard Assessments

The system still supports the standard assessment format with fixed questions from the questionnaires.json file.

## API Documentation

Explore the full API at `/docs` after starting the server.

## License

[License Information]

## Available Endpoints

### Authentication

- `POST /token` - Login and get access token
- `POST /users` - Create a new user

### Users

- `GET /users` - Get all users (admin only)
- `GET /users/me` - Get current user
- `GET /users/{user_id}` - Get a specific user

### Companies

- `GET /companies` - Get all companies
- `POST /companies` - Create a new company
- `GET /companies/{company_id}` - Get a specific company
- `PUT /companies/{company_id}` - Update a company
- `DELETE /companies/{company_id}` - Delete a company

### User-Company Assignments

- `POST /companies/{company_id}/assign-users` - Assign users to a company
- `GET /companies/{company_id}/users` - Get users assigned to a company

### Assessments

- `POST /assessments` - Create a new assessment
- `GET /companies/{company_id}/assessments` - Get all assessments for a company
- `GET /assessments/{assessment_id}` - Get a specific assessment
- `PUT /assessments/{assessment_id}` - Update an assessment

### Questionnaires

- `GET /questionnaires` - Get all questionnaires
- `GET /questionnaire/{assessment_type}` - Get a specific questionnaire

## Default Users

After running the setup script, the following users will be available:

- **Admin**: 
  - Email: admin@cybergen.com
  - Password: admin123
  - Role: admin

- **Role-specific users**: 
  - Multiple users with specific roles (governance, culture, etc.)
  - Email format: role@cybergen.com (e.g., governance@cybergen.com)
  - Password: password123

## Database

The application uses SQLite for data storage. The database file is created as `app.db` in the backend directory. 
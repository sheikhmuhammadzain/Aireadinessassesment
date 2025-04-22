# AI Readiness Backend API

This is the backend server for the AI Readiness Assessment application. It's built with FastAPI and uses SQLite for data persistence.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Initialize the database with sample data:

```bash
python setup_db.py
```

3. Start the server:

```bash
uvicorn main:app --reload
```

The API will be available at http://103.18.20.205:8090

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://103.18.20.205:8090/docs
- ReDoc: http://103.18.20.205:8090/redoc

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
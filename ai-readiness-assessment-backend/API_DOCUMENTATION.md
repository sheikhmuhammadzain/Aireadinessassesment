# AI Readiness Assessment API Documentation

This document provides details about the available API endpoints for the AI Readiness Assessment application.

## Base URL

```
http://localhost:8000
```

## Endpoints

### Health Check

```
GET /
```

Returns a simple message to verify the API is running.

**Response:**
```json
{
  "message": "AI Readiness Assessment API is running"
}
```

### Get All Questionnaires

```
GET /questionnaires
```

Returns all available questionnaire types.

**Response:**
```json
{
  "standard": {
    "name": "Standard Assessment",
    "description": "A comprehensive assessment of AI readiness across all dimensions"
  },
  "quick": {
    "name": "Quick Assessment",
    "description": "A brief assessment focusing on key AI readiness factors"
  }
}
```

### Get Questionnaire by Type

```
GET /questionnaire/{assessment_type}
```

Returns a specific questionnaire by its type.

**Parameters:**
- `assessment_type` (path): The type of assessment (e.g., "standard", "quick")

**Response:**
```json
{
  "AI Governance": {
    "AI Ethics and Responsible AI": [
      {
        "id": "gov_ethics_1",
        "question": "Does your organization have a documented AI ethics policy?",
        "options": [
          "No policy exists",
          "Policy is in development",
          "Basic policy exists",
          "Comprehensive policy exists and is regularly reviewed"
        ]
      },
      // More questions...
    ],
    // More subcategories...
  },
  // More categories...
}
```

### Submit Assessment

```
POST /submit-assessment
```

Submits assessment responses and calculates results.

**Request Body:**
```json
{
  "company_info": {
    "name": "Example Corp",
    "size": "Mid-size (100-999 employees)",
    "industry": "Technology",
    "description": "A technology company focused on AI solutions"
  },
  "responses": {
    "gov_ethics_1": 3,
    "gov_ethics_2": 2,
    // More responses...
  },
  "weights": {
    "AI Governance": 20,
    "AI Culture": 15,
    "AI Infrastructure": 20,
    "AI Strategy": 15,
    "AI Data": 15,
    "AI Talent": 10,
    "AI Security": 5
  }
}
```

**Response:**
```json
{
  "overall_score": 68.5,
  "category_scores": {
    "AI Governance": 75.0,
    "AI Culture": 62.5,
    "AI Infrastructure": 70.0,
    "AI Strategy": 80.0,
    "AI Data": 65.0,
    "AI Talent": 55.0,
    "AI Security": 72.0
  },
  "recommendations": [
    {
      "category": "AI Talent",
      "recommendation": "Consider investing in AI training programs for existing staff"
    },
    // More recommendations...
  ]
}
```

### Get Recommended Weights

```
POST /recommend-weights
```

Gets recommended category weights based on company information.

**Request Body:**
```json
{
  "name": "Example Corp",
  "size": "Mid-size (100-999 employees)",
  "industry": "Technology",
  "description": "A technology company focused on AI solutions"
}
```

**Response:**
```json
{
  "weights": {
    "AI Governance": 20,
    "AI Culture": 15,
    "AI Infrastructure": 20,
    "AI Strategy": 15,
    "AI Data": 15,
    "AI Talent": 10,
    "AI Security": 5
  }
}
```

### Get Recommendations

```
POST /recommendations
```

Gets detailed recommendations based on assessment results.

**Request Body:**
```json
{
  "category_scores": {
    "AI Governance": 75.0,
    "AI Culture": 62.5,
    "AI Infrastructure": 70.0,
    "AI Strategy": 80.0,
    "AI Data": 65.0,
    "AI Talent": 55.0,
    "AI Security": 72.0
  },
  "company_info": {
    "name": "Example Corp",
    "size": "Mid-size (100-999 employees)",
    "industry": "Technology",
    "description": "A technology company focused on AI solutions"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "category": "AI Talent",
      "score": 55.0,
      "recommendation": "Consider investing in AI training programs for existing staff",
      "priority": "High",
      "resources": [
        "https://example.com/ai-training-resources",
        "https://example.com/talent-development"
      ]
    },
    // More recommendations...
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "An internal server error occurred"
}
```

# Weight Management Endpoints

## Get Default Weights

**Endpoint**: `GET /weights/defaults`

**Description**: Get the default weights for all assessment pillars. If no default weights exist, they will be created with equal distribution.

**Response**:
```json
{
  "AI Governance": 14.3,
  "AI Culture": 14.3,
  "AI Infrastructure": 14.3,
  "AI Strategy": 14.3,
  "AI Data": 14.3,
  "AI Talent": 14.3,
  "AI Security": 14.2
}
```

## Update Default Weights

**Endpoint**: `PUT /weights/defaults`

**Description**: Update the default weights for all assessment pillars. Only admins can do this.

**Request Body**:
```json
{
  "weights": {
    "AI Governance": 15.0,
    "AI Culture": 15.0,
    "AI Infrastructure": 15.0,
    "AI Strategy": 15.0,
    "AI Data": 15.0,
    "AI Talent": 15.0,
    "AI Security": 10.0
  }
}
```

**Response**: Returns the updated default weights.

## Get Company Weights

**Endpoint**: `GET /companies/{company_id}/weights`

**Description**: Get the weights for all assessment pillars for a specific company. If no company-specific weights exist, default weights are returned.

**Response**:
```json
{
  "AI Governance": 20.0,
  "AI Culture": 10.0,
  "AI Infrastructure": 15.0,
  "AI Strategy": 15.0,
  "AI Data": 15.0,
  "AI Talent": 15.0,
  "AI Security": 10.0
}
```

## Update Company Weights

**Endpoint**: `PUT /companies/{company_id}/weights`

**Description**: Update the weights for all assessment pillars for a specific company.

**Request Body**:
```json
{
  "weights": {
    "AI Governance": 20.0,
    "AI Culture": 10.0,
    "AI Infrastructure": 15.0,
    "AI Strategy": 15.0,
    "AI Data": 15.0,
    "AI Talent": 15.0,
    "AI Security": 10.0
  }
}
```

**Response**: Returns the updated company weights.

## Get Category Weights

**Endpoint**: `GET /companies/{company_id}/weights/{pillar}`

**Description**: Get the weights for all categories within a specific pillar for a company.

**Response**:
```json
{
  "AI Governance": {
    "Policy Development": 25.0,
    "Governance Structure": 25.0,
    "Risk Management": 25.0,
    "Compliance": 25.0
  }
}
```

## Update Category Weights

**Endpoint**: `PUT /companies/{company_id}/weights/{pillar}`

**Description**: Update the weights for all categories within a specific pillar for a company.

**Request Body**:
```json
{
  "Policy Development": 30.0,
  "Governance Structure": 30.0,
  "Risk Management": 20.0,
  "Compliance": 20.0
}
```

**Response**: Returns the updated category weights for the pillar. 
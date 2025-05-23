from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator, model_validator, Field, ConfigDict
from typing import Dict, List, Optional, Any
import numpy as np
import json
import uuid
import logging
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Import models
from models import Base, User, Company, Assessment
from models import UserCreate, UserResponse, CompanyCreate, CompanyResponse
from models import AssessmentCreate, AssessmentResponse, CompanyUserAssignment
from models import DefaultPillarWeight, CompanyPillarWeight, CategoryWeight, CompanyWeightsUpdate

# Add import for the new utility functions
from utils import get_color_for_score, get_strength_comment, get_improvement_comment, get_recommendations
from utils import generate_personalized_questions, get_personalized_assessment

# Add UserUpdate model import if it exists, otherwise we'll create it
try:
    from models import UserUpdate
except ImportError:
    # Define UserUpdate model here for use in the update endpoint
    class UserUpdate(BaseModel):
        email: str
        name: str
        role: str
        password: Optional[str] = None  # Password is optional for updates

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "a_very_secret_key_that_should_be_kept_secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# OAuth2 with password flow
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")
logger.setLevel(logging.DEBUG)

app = FastAPI(title="AI Readiness Assessment API")

# Properly configure CORS to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Load questionnaires
try:
    with open("data/questionnaires.json", "r") as f:
        questionnaires = json.load(f)
except FileNotFoundError:
    # Fallback with an empty dict if file doesn't exist yet
    questionnaires = {}

class ResponseItem(BaseModel):
    question: str
    answer: int = Field(..., ge=1, le=4)  # Ensure answer is between 1-4

    @validator('answer')
    def validate_answer(cls, v):
        if not 1 <= v <= 4:
            raise ValueError("Answer must be between 1 and 4")
        return v

class CategoryResponses(BaseModel):
    category: str
    responses: List[ResponseItem]
    weight: float = Field(..., ge=0, le=100)  # User-defined weight for the category (0-100)
    
    @validator('weight')
    def validate_weight(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("Weight must be between 0 and 100")
        return v

class AssessmentResponse(BaseModel):
    assessmentType: str
    categoryResponses: List[CategoryResponses]
    
    @model_validator(mode='after')
    def validate_total_weight(self) -> 'AssessmentResponse':
        if not self.categoryResponses:
            raise ValueError("Category responses cannot be empty")
        total_weight = sum(cat.weight for cat in self.categoryResponses)
        if not 98 <= total_weight <= 102:  # More lenient range for total weights
            raise ValueError(f"Total weights must sum to approximately 100 (current: {total_weight})")
        return self

class AssessmentResult(BaseModel):
    assessmentType: str
    categoryScores: Dict[str, float]
    userWeights: Dict[str, float]  # Original user-defined weights
    qValues: Dict[str, float]
    adjustedWeights: Dict[str, float]  # Final adjusted weights
    overallScore: float

# New models for auth
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict

class TokenData(BaseModel):
    email: Optional[str] = None

# Helper functions for auth
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# Helper function to parse roles for all user objects
def parse_user_roles(user_obj):
    """
    Parse the roles field of a user object to ensure it's properly formatted.
    This should be called before returning user objects to the API.
    """
    # If user doesn't have roles attribute, return as is
    if not hasattr(user_obj, 'roles'):
        return user_obj
    
    # Parse roles from JSON string if needed
    if isinstance(user_obj.roles, str):
        try:
            user_obj.roles = json.loads(user_obj.roles)
        except:
            user_obj.roles = []
    
    # Set default roles from legacy role if needed
    if (not user_obj.roles or len(user_obj.roles) == 0) and hasattr(user_obj, 'role') and user_obj.role:
        user_obj.roles = [user_obj.role]
    
    return user_obj

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    # Parse roles before returning
    return parse_user_roles(user)

@app.get("/")
def read_root():
    return {"message": "AI Readiness Assessment API"}

@app.get("/questionnaires")
def get_questionnaires():
    return questionnaires

@app.get("/questionnaire/{assessment_type}")
def get_questionnaire(assessment_type: str):
    if assessment_type not in questionnaires:
        raise HTTPException(status_code=404, detail=f"Assessment type '{assessment_type}' not found")
    return questionnaires[assessment_type]

@app.get("/questionnaire/{assessment_type}/personalized/{company_id}")
def get_personalized_questionnaire(assessment_type: str, company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get a personalized questionnaire with dynamic options for a specific company.
    Questions are generated using OpenAI based on the company's profile and industry.
    """
    # Debug logging
    logger.info(f"Request for personalized questionnaire: assessment_type={assessment_type}, company_id={company_id}")
    logger.info(f"User requesting: {current_user.email}, role: {current_user.role}")
    
    try:
        # Check if user has access to this company
        has_access = current_user.role == "admin" or any(c.id == company_id for c in current_user.companies)
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to view this company's assessment")
        
        # Check if assessment type exists
        if assessment_type not in questionnaires:
            raise HTTPException(status_code=404, detail=f"Assessment type '{assessment_type}' not found")
        
        # Debug log before company query
        logger.info(f"Querying for company with ID: {company_id}")
        
        # Check if company exists
        db_company = db.query(Company).filter(Company.id == company_id).first()
        
        if db_company is None:
            raise HTTPException(status_code=404, detail="Company not found")
            
        logger.info(f"Found company: {db_company.name}")
        
        # Get personalized assessment
        assessment = get_personalized_assessment(company_id, assessment_type, db)
        
        if "error" in assessment:
            logger.error(f"Error in personalized assessment: {assessment['error']}")
            raise HTTPException(status_code=500, detail=assessment["error"])
        
        return assessment
    except Exception as e:
        # Catch and log any unexpected errors
        logger.error(f"Exception in get_personalized_questionnaire: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-results", response_model=AssessmentResult)
async def calculate_results(assessment_response: AssessmentResponse):
    try:
        assessment_type = assessment_response.assessmentType
        
        if assessment_type not in questionnaires:
            raise HTTPException(status_code=404, detail=f"Assessment type '{assessment_type}' not found")
        
        # Process responses and weights with validation
        user_responses = {}
        user_weightages = {}
        
        for category_response in assessment_response.categoryResponses:
            category = category_response.category
            if category not in questionnaires[assessment_type]:
                raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
            if len(category_response.responses) == 0:
                raise HTTPException(status_code=400, detail=f"No responses provided for category {category}")
            user_responses[category] = [resp.answer for resp in category_response.responses]
            user_weightages[category] = category_response.weight / 100  # Convert to proportion immediately

        # Normalize User-defined Weights (Convert to Range 0-1)
        total_weight = sum(user_weightages.values())
        normalized_user_weightages = {category: weight / total_weight for category, weight in user_weightages.items()}
        
        # Compute category scores
        category_scores = {category: float(np.mean(scores)) for category, scores in user_responses.items()}
        
        # Initialize Q-values with reproducibility
        np.random.seed(42)
        q_values = {category: float(np.random.uniform(0, 1)) for category in user_responses.keys()}
        
        # Reinforcement Learning Parameters
        alpha = 0.1  # Learning rate
        gamma = 0.9  # Discount factor
        
        # Updating Q-values iteratively based on reinforcement learning and user-defined weights
        for _ in range(10):
            for category in user_responses.keys():
                # Reward is now based on both user weightage and category score
                reward = normalized_user_weightages[category] * category_scores[category]
                
                # Q-value update incorporating user weightage and category score
                q_values[category] += alpha * (reward + gamma * max(q_values.values()) - q_values[category])
        
        # Compute Softmax Weights Using User Weightages and Q-values
        eta = 1.0  # Softmax scaling parameter
        exp_q_values = np.exp(eta * np.array([
            q_values[cat] * normalized_user_weightages[cat] * category_scores[cat] 
            for cat in user_responses.keys()
        ]))
        softmax_weights_array = exp_q_values / np.sum(exp_q_values)
        
        # Convert to dictionary and apply constraints
        adjusted_weights = {}
        category_list = list(user_responses.keys())
        
        for i, category in enumerate(category_list):
            # Original user weight as percentage
            original_weight_pct = normalized_user_weightages[category] * 100
            
            # Convert softmax weight to percentage
            softmax_weight_pct = softmax_weights_array[i] * 100
            
            # Apply ±2% constraint
            min_limit = original_weight_pct - 2
            max_limit = original_weight_pct + 2
            adjusted_weights[category] = max(min_limit, min(softmax_weight_pct, max_limit))
        
        # Normalize Adjusted Weights to Sum to 100%
        total_adjusted_weight = sum(adjusted_weights.values())
        adjusted_weights = {category: (weight / total_adjusted_weight) * 100 for category, weight in adjusted_weights.items()}
        
        # Convert back to proportion (0-1) for calculation
        adjusted_weights_prop = {category: weight / 100 for category, weight in adjusted_weights.items()}
        
        # Compute Final AI Data Readiness Score (Weighted Sum)
        overall_score = sum(category_scores[cat] * adjusted_weights_prop[cat] for cat in user_responses.keys())
        
        # Scale scores to percentages (0-100)
        category_scores = {k: v * 25 for k, v in category_scores.items()}  # Scale from 1-4 to 25-100
        overall_score = overall_score * 25  # Scale from 1-4 to 25-100
        
        # Convert user_weightages back to percentages for the response
        user_weights_pct = {category: weight * 100 for category, weight in normalized_user_weightages.items()}
        
        return AssessmentResult(
            assessmentType=assessment_type,
            categoryScores=category_scores,
            userWeights=user_weights_pct,
            qValues=q_values,
            adjustedWeights=adjusted_weights,
            overallScore=overall_score
        )
    
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/recommendations/{assessment_type}/{category}")
def get_recommendations(assessment_type: str, category: str, score: float):
    # Note: Implement recommendations or import from proper module
    try:
        from backend.utils import get_recommendations
        return get_recommendations(category, score)
    except ImportError:
        # Fallback if module doesn't exist
        return {
            "low": ["Recommendation for low scores"],
            "medium": ["Recommendation for medium scores"],
            "high": ["Recommendation for high scores"]
        }

# User management endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Convert user.roles to a Python list if it's stored as JSON string
    user_roles = []
    if hasattr(user, 'roles') and user.roles:
        if isinstance(user.roles, str):
            try:
                user_roles = json.loads(user.roles)
            except:
                user_roles = []
        else:
            user_roles = user.roles
    
    # Use legacy role as fallback
    if not user_roles and user.role:
        user_roles = [user.role]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,  # Include legacy role for backward compatibility
            "roles": user_roles
        }
    }

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4()}"
    hashed_password = get_password_hash(user.password)
    
    # Handle the roles field
    roles = user.roles if user.roles else []
    # For backward compatibility, if no roles are provided but a role is, use that
    if not roles and hasattr(user, 'role') and user.role:
        roles = [user.role]
    
    # Set a primary role for backward compatibility
    primary_role = roles[0] if roles else None
    
    # Convert roles to JSON string for storage
    roles_json = json.dumps(roles)
    
    db_user = User(
        id=user_id,
        email=user.email,
        name=user.name,
        role=primary_role,  # Legacy field, set to first role for compatibility
        roles=roles_json,   # Store as JSON string
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return parse_user_roles(db_user)

@app.get("/users", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role in their roles list
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view all users")
    
    users = db.query(User).offset(skip).limit(limit).all()
    # Parse roles for each user
    return [parse_user_roles(user) for user in users]

@app.get("/users/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    # No need to parse roles again as get_current_user already does it
    return current_user

@app.get("/users/{user_id}", response_model=UserResponse)
def read_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role in their roles list
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return parse_user_roles(db_user)

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only admins can update any user, regular users can only update themselves
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    # Check if user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it already exists
    if user.email != db_user.email:
        existing_user = get_user(db, email=user.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update user fields
    db_user.email = user.email
    db_user.name = user.name
    
    # Update roles
    if hasattr(user, 'roles') and user.roles:
        # Store roles as JSON string
        db_user.roles = json.dumps(user.roles)
        # Update legacy role field for backward compatibility
        db_user.role = user.roles[0] if user.roles else None
    
    # Update password only if provided
    if user.password:
        db_user.hashed_password = get_password_hash(user.password)
    
    db_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_user)
    return parse_user_roles(db_user)

@app.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only admins can delete users
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
    
    # Prevent admins from deleting their own account
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Check if user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user
    db.delete(db_user)
    db.commit()
    return {"detail": "User deleted successfully"}

# Company management endpoints
@app.get("/companies/public")
def get_public_companies(db: Session = Depends(get_db)):
    """Get a simple list of companies without requiring authentication.
    This is useful for debugging and initial setup."""
    companies = db.query(Company).all()
    return [{"id": company.id, "name": company.name} for company in companies]

@app.post("/companies", response_model=CompanyResponse)
def create_company(company: CompanyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create companies")
    
    # Get the highest existing company ID
    highest_company = db.query(Company).order_by(Company.id.desc()).first()
    
    # If no companies exist, start with ID 1, otherwise increment the highest ID
    if highest_company is None:
        next_id = 1
    else:
        try:
            next_id = int(highest_company.id) + 1
        except ValueError:
            # If the ID is not a number (e.g. old UUID format), start with 1
            next_id = 1
    
    company_id = str(next_id)
    
    # Check if this ID already exists (just to be safe)
    existing = db.query(Company).filter(Company.id == company_id).first()
    if existing:
        # In the unlikely case of an ID collision, append a timestamp
        company_id = f"{next_id}_{int(datetime.now().timestamp())}"
    
    db_company = Company(
        id=company_id,
        name=company.name,
        industry=company.industry,
        size=company.size,
        region=company.region,
        ai_maturity=company.ai_maturity,
        notes=company.notes
    )
    
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@app.get("/companies", response_model=List[CompanyResponse])
def read_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role in their roles list
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    # Add logging to troubleshoot
    logger.info(f"User {current_user.id} ({current_user.email}) requesting companies. Is admin: {is_admin}")
    
    # Admin can see all companies
    if is_admin:
        companies = db.query(Company).offset(skip).limit(limit).all()
        logger.info(f"Admin user. Returning all {len(companies)} companies")
    else:
        # Other users can only see companies they're explicitly assigned to in the company_user_association table
        # This uses the relationship defined in the User model
        companies = db.query(Company).join(Company.users).filter(User.id == current_user.id).offset(skip).limit(limit).all()
        logger.info(f"Non-admin user. Returning {len(companies)} companies that user is assigned to")
    
    return companies

@app.get("/companies/{company_id}", response_model=CompanyResponse)
def read_company(company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role or is assigned to this company
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    has_access = is_admin or any(c.id == company_id for c in current_user.companies)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view this company")
    
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return db_company

@app.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(company_id: str, company: CompanyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update companies")
    
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update company fields
    db_company.name = company.name
    db_company.industry = company.industry
    db_company.size = company.size
    db_company.region = company.region
    db_company.ai_maturity = company.ai_maturity
    db_company.notes = company.notes
    db_company.updated_at = datetime.now()
    
    db.commit()
    db.refresh(db_company)
    return db_company

@app.delete("/companies/{company_id}")
def delete_company(company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role in their roles array
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete companies")
    
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(db_company)
    db.commit()
    return {"detail": "Company deleted successfully"}

# Company-User assignment endpoints
@app.post("/companies/{company_id}/assign-users")
def assign_users_to_company(company_id: str, assignment: CompanyUserAssignment, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has admin role in their roles array
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to assign users")
    
    # Validate company exists
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Log the current assignment for debugging
    current_users = db.query(User).join(User.companies).filter(Company.id == company_id).all()
    logger.info(f"Company {company_id} current assigned users: {[u.id for u in current_users]}")
    logger.info(f"New user assignments: {assignment.user_ids}")
    
    # Validate all users exist
    for user_id in assignment.user_ids:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    
    # Clear existing assignments
    db_company.users = []
    db.flush()  # Flush to ensure the association table is cleared
    
    # Add new assignments
    for user_id in assignment.user_ids:
        db_user = db.query(User).filter(User.id == user_id).first()
        db_company.users.append(db_user)
    
    # Log after update for verification
    logger.info(f"Updated company {company_id} with new user assignments: {assignment.user_ids}")
    
    try:
        db.commit()
        logger.info(f"Successfully committed user assignments for company {company_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing user assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save user assignments: {str(e)}")
    
    return {"detail": "Users assigned successfully"}

@app.get("/companies/{company_id}/users", response_model=List[UserResponse])
def get_company_users(company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has access to this company
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    has_access = is_admin or any(c.id == company_id for c in current_user.companies)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view users for this company")
    
    # Get the company
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get users associated with this company
    users = db_company.users
    
    # Parse roles for each user
    return [parse_user_roles(user) for user in users]

class AssessmentCreate(BaseModel):
    """
    Pydantic model for creating new Assessment records.  This is used
    for the request body in your POST endpoint.
    """
    company_id: str
    assessment_type: str
    status: str
    score: Optional[float] = None
    data: Optional[Dict] = None
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class AssessmentResponseNew(BaseModel):
    """
    Pydantic model for the full Assessment record, including the ID
    and timestamps generated by the database.  This is used for the
    response body in your GET/POST endpoints.
    """
    id: str
    company_id: str
    assessment_type: str
    status: str
    score: Optional[float] = None
    data: Optional[Dict] = None
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

@app.post("/assessments", response_model=AssessmentResponseNew)
def create_assessment(assessment: AssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ... (authorization and company existence checks) ...

    assessment_id = f"assessment_{uuid.uuid4()}"
    db_assessment = Assessment(
        id=assessment_id,
        company_id=assessment.company_id,
        assessment_type=assessment.assessment_type,
        status=assessment.status,
        score=assessment.score,
        data=assessment.data,
        completed_at=assessment.completed_at,
        completed_by_id=current_user.id if assessment.status == "completed" else None,
        created_at=datetime.utcnow(),  # Explicitly set created_at
        updated_at=datetime.utcnow()   # Explicitly set updated_at
    )

    db.add(db_assessment)
    db.flush()  # Try flushing before commit to see the generated SQL (for debugging)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

# Assessment management endpoints
# @app.post("/assessments", response_model=AssessmentResponse)
# def create_assessment(assessment: AssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     # Check if user has access to this company
#     has_access = current_user.role == "admin" or any(c.id == assessment.company_id for c in current_user.companies)
#
#     if not has_access:
#         raise HTTPException(status_code=403, detail="Not authorized to create assessments for this company")
#
#     # Check if company exists
#     db_company = db.query(Company).filter(Company.id == assessment.company_id).first()
#     if db_company is None:
#         raise HTTPException(status_code=404, detail="Company not found")
#
#
#     assessment_id = f"assessment_{uuid.uuid4()}"
#     db_assessment = Assessment(
#         id=assessment_id,
#         company_id=assessment.company_id,
#         assessment_type=assessment.assessment_type,
#         status=assessment.status,
#         score=assessment.score,
#         data=assessment.data,
#         # completed_at=assessment.completed_at,
#         completed_by_id=current_user.id if assessment.status == "completed" else None
#     )
#
#     db.add(db_assessment)
#     db.commit()
#     db.refresh(db_assessment)
#     return db_assessment

@app.get("/companies/{company_id}/assessments")
def get_company_assessments(company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user has access to this company
    logger.info(f"User {current_user.id} ({current_user.email}) requesting assessments for company {company_id}")
    
    # Check if user has admin role in their roles array
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    logger.info(f"User is admin: {is_admin}")
    
    # List user's assigned companies for debugging
    user_company_ids = [c.id for c in current_user.companies]
    logger.info(f"User is assigned to companies: {user_company_ids}")
    
    # Check if user has access to this company
    has_access = is_admin or any(c.id == company_id for c in current_user.companies)
    
    if not has_access:
        logger.warning(f"User {current_user.id} denied access to assessments for company {company_id}")
        raise HTTPException(status_code=403, detail="Not authorized to view assessments for this company")
    
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company is None:
        logger.warning(f"Company {company_id} not found")
        raise HTTPException(status_code=404, detail="Company not found")
    
    logger.info(f"Found company {company_id}, retrieving assessments")
    try:
        # Manual serialization
        assessments = []
        for assessment in db_company.assessments:
            try:
                assessment_data = {
                    "id": assessment.id,
                    "company_id": assessment.company_id,
                    "assessment_type": assessment.assessment_type,
                    "status": assessment.status,
                    "score": assessment.score,
                    "data": assessment.data,
                    "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
                    "updated_at": assessment.updated_at.isoformat() if assessment.updated_at else None,
                    "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None,
                    "completed_by_id": assessment.completed_by_id
                }
                assessments.append(assessment_data)
            except Exception as e:
                logger.error(f"Error processing assessment {assessment.id}: {str(e)}")
                # Continue with next assessment instead of failing
        
        logger.info(f"Returning {len(assessments)} assessments for company {company_id}")
        return assessments
    except Exception as e:
        logger.error(f"Error fetching assessments for company {company_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if user has admin role in their roles array
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    # Check if user has access to this company
    has_access = is_admin or any(c.id == db_assessment.company_id for c in current_user.companies)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view this assessment")
    
    return db_assessment

@app.put("/assessments/{assessment_id}", response_model=AssessmentResponse)
def update_assessment(assessment_id: str, assessment: AssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if user has admin role in their roles array
    is_admin = 'admin' in (current_user.roles if hasattr(current_user, 'roles') and current_user.roles else [current_user.role])
    
    # Check if user has access to this company
    has_access = is_admin or any(c.id == db_assessment.company_id for c in current_user.companies)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to update this assessment")
    
    # Update assessment fields
    db_assessment.assessment_type = assessment.assessment_type
    db_assessment.status = assessment.status
    db_assessment.score = assessment.score
    db_assessment.data = assessment.data
    
    if assessment.status == "completed" and db_assessment.status != "completed":
        db_assessment.completed_at = datetime.now()
        db_assessment.completed_by_id = current_user.id
    
    db_assessment.updated_at = datetime.now()
    
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

# Weight Management Endpoints

# Get default weights
@app.get("/weights/defaults")
def get_default_weights(db: Session = Depends(get_db)):
    default_weights = db.query(DefaultPillarWeight).all()
    
    # If no default weights exist, create them with equal distribution
    if not default_weights:
        default_pillars = ["AI Governance", "AI Culture", "AI Infrastructure", "AI Strategy", 
                          "AI Data", "AI Talent", "AI Security"]
        equal_weight = 100.0 / len(default_pillars)
        rounded_weight = round(equal_weight, 1)
        
        # Create default weights
        for pillar in default_pillars:
            db_weight = DefaultPillarWeight(
                id=str(uuid.uuid4()),
                pillar=pillar,
                weight=rounded_weight
            )
            db.add(db_weight)
        
        # Adjust last weight if necessary to ensure sum is exactly 100
        default_weights = db.query(DefaultPillarWeight).all()
        total_weight = sum(w.weight for w in default_weights)
        if abs(total_weight - 100.0) > 0.01:
            last_weight = default_weights[-1]
            adjustment = 100.0 - (total_weight - last_weight.weight)
            last_weight.weight = round(adjustment, 1)
        
        db.commit()
        default_weights = db.query(DefaultPillarWeight).all()
    
    # Convert to dictionary for API response
    result = {}
    for weight in default_weights:
        result[weight.pillar] = weight.weight
    
    return result

# Update default weights
@app.put("/weights/defaults")
def update_default_weights(weights: CompanyWeightsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only admin can update default weights
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update default weights")
    
    # Validate total weight is approximately 100
    total_weight = sum(weights.weights.values())
    if abs(total_weight - 100.0) > 0.1:
        raise HTTPException(status_code=400, detail=f"Total weights must sum to 100% (current: {total_weight})")
    
    # Update or create default weights
    for pillar, weight in weights.weights.items():
        db_weight = db.query(DefaultPillarWeight).filter(DefaultPillarWeight.pillar == pillar).first()
        if db_weight:
            db_weight.weight = weight
            db_weight.updated_at = datetime.utcnow()
        else:
            db_weight = DefaultPillarWeight(
                id=str(uuid.uuid4()),
                pillar=pillar,
                weight=weight
            )
            db.add(db_weight)
    
    db.commit()
    
    # Return updated weights
    return get_default_weights(db)

# Get company weights
@app.get("/companies/{company_id}/weights")
def get_company_weights(company_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if company exists and user has access
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Admin can access any company, others only their assigned companies
    if current_user.role != "admin" and company not in current_user.companies:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    # Get company pillar weights
    db_weights = db.query(CompanyPillarWeight).filter(CompanyPillarWeight.company_id == company_id).all()
    
    # If no company weights, use default weights
    if not db_weights:
        default_weights = get_default_weights(db)
        return default_weights
    
    # Convert to dictionary for API response
    result = {}
    for weight in db_weights:
        result[weight.pillar] = weight.weight
    
    return result

# Update company weights
@app.put("/companies/{company_id}/weights")
def update_company_weights(company_id: str, weights: CompanyWeightsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if company exists and user has access
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Admin can access any company, others only their assigned companies
    if current_user.role != "admin" and company not in current_user.companies:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    # Validate total weight is approximately 100
    total_weight = sum(weights.weights.values())
    if abs(total_weight - 100.0) > 0.1:
        raise HTTPException(status_code=400, detail=f"Total weights must sum to 100% (current: {total_weight})")
    
    # First delete all existing weights for this company
    db.query(CompanyPillarWeight).filter(CompanyPillarWeight.company_id == company_id).delete()
    
    # Create new weights
    for pillar, weight in weights.weights.items():
        db_weight = CompanyPillarWeight(
            id=str(uuid.uuid4()),
            company_id=company_id,
            pillar=pillar,
            weight=weight
        )
        db.add(db_weight)
    
    db.commit()
    
    # Return updated weights
    return get_company_weights(company_id, db, current_user)

# Get category weights for a specific pillar
@app.get("/companies/{company_id}/weights/{pillar}")
def get_category_weights(company_id: str, pillar: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if company exists and user has access
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Admin can access any company, others only their assigned companies
    if current_user.role != "admin" and company not in current_user.companies:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    # Get category weights for this pillar
    db_weights = db.query(CategoryWeight).filter(
        CategoryWeight.company_id == company_id,
        CategoryWeight.pillar == pillar
    ).all()
    
    # Convert to dictionary for API response
    result = {}
    for weight in db_weights:
        result[weight.category] = weight.weight
    
    return {pillar: result}

# Update category weights for a specific pillar
@app.put("/companies/{company_id}/weights/{pillar}")
def update_category_weights(company_id: str, pillar: str, request: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if company exists and user has access
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Admin can access any company, others only their assigned companies
    if current_user.role != "admin" and company not in current_user.companies:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    
    # Handle different input formats - weights could be directly in the body or under a 'weights' key
    weights_data = {}
    if 'weights' in request and isinstance(request['weights'], dict):
        weights_data = request['weights']
    else:
        # If 'weights' is not in the request, assume the entire body is the weights
        weights_data = request
    
    logger.info(f"Updating weights for company {company_id}, pillar {pillar}, weights: {weights_data}")
    
    # Validate total weight for categories is approximately 100
    if weights_data:
        total_weight = sum(weights_data.values())
        if abs(total_weight - 100.0) > 0.1:
            raise HTTPException(status_code=400, detail=f"Total category weights must sum to 100% (current: {total_weight})")
    
    # First delete all existing category weights for this company and pillar
    db.query(CategoryWeight).filter(
        CategoryWeight.company_id == company_id,
        CategoryWeight.pillar == pillar
    ).delete()
    
    # Create new category weights
    for category, weight in weights_data.items():
        db_weight = CategoryWeight(
            id=str(uuid.uuid4()),
            company_id=company_id,
            pillar=pillar,
            category=category,
            weight=weight
        )
        db.add(db_weight)
    
    db.commit()
    
    # Return updated weights
    return get_category_weights(company_id, pillar, db, current_user)

# Add a new endpoint to submit personalized assessment responses
@app.post("/assessments/personalized")
def submit_personalized_assessment(
    assessment: Dict, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Submit responses for a personalized assessment with custom questions and options.
    """
    try:
        company_id = assessment.get("company_id")
        assessment_type = assessment.get("assessment_type")
        responses = assessment.get("responses", [])
        
        # Check if user has access to this company
        has_access = current_user.role == "admin" or any(c.id == company_id for c in current_user.companies)
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to submit assessments for this company")
        
        # Calculate score
        # For personalized assessments with custom options, we calculate score based on 
        # correct answers (each correct answer gives 4 points, every other option gives
        # a proportionally lower score)
        
        total_questions = 0
        total_score = 0
        
        for category in responses:
            category_name = category.get("category")
            questions = category.get("questions", [])
            
            for question in questions:
                total_questions += 1
                selected_option = question.get("selected_option")
                correct_option = question.get("correct_option")
                
                # Award points: 4 for correct, 3, 2, or 1 for others based on option ID
                if selected_option == correct_option:
                    # If selected the correct option
                    total_score += 4
                else:
                    # Calculate points based on how far the selection is from correct
                    option_values = {"a": 1, "b": 2, "c": 3, "d": 4}
                    correct_value = option_values.get(correct_option, 4)
                    selected_value = option_values.get(selected_option, 1)
                    
                    # Distance-based scoring
                    distance = abs(correct_value - selected_value)
                    if distance == 1:
                        total_score += 3  # One option away from correct
                    elif distance == 2:
                        total_score += 2  # Two options away from correct
                    else:
                        total_score += 1  # Three options away from correct
        
        # Calculate average score on 1-4 scale
        average_score = total_score / total_questions if total_questions > 0 else 0
        
        # Create the assessment record
        assessment_id = f"assessment_{uuid.uuid4()}"
        db_assessment = Assessment(
            id=assessment_id,
            company_id=company_id,
            assessment_type=assessment_type,
            status="completed",
            score=average_score,
            data=assessment,  # Store the full assessment data
            completed_at=datetime.utcnow(),
            completed_by_id=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)
        
        # Return the assessment result
        return {
            "id": db_assessment.id,
            "company_id": company_id,
            "assessment_type": assessment_type,
            "score": average_score * 25,  # Scale to 0-100
            "completed_at": db_assessment.completed_at,
            "completed_by": current_user.name
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting assessment: {str(e)}")

  # {
  #   "name": "TechInnovate Solutions",
  #   "industry": "Technology",
  #   "size": "Enterprise (1000+ employees)",
  #   "region": "North America",
  #   "ai_maturity": "Exploring",
  #   "notes": "Global tech firm focused on cloud solutions",
  #   "id": "1",
  #   "created_at": "2025-04-20T14:34:14",
  #   "updated_at": "2025-04-20T14:34:14"
  # },
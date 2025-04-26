from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Table, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import List, Dict, Optional
from pydantic import BaseModel
import datetime
import json

Base = declarative_base()

# Association table for company-user relationships
company_user_association = Table(
    "company_user_association",
    Base.metadata,
    Column("company_id", String, ForeignKey("companies.id")),
    Column("user_id", String, ForeignKey("users.id")),
)

# Association table for user-role relationships (new)
user_role_association = Table(
    "user_role_association",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id")),
    Column("role", String),  # One of: admin, ai_governance, ai_culture, etc.
)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String, nullable=True)  # Legacy field, kept for backward compatibility
    roles = Column(JSON, default=list)  # New field to store multiple roles
    hashed_password = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    companies = relationship("Company", secondary=company_user_association, back_populates="users")
    completed_assessments = relationship("Assessment", back_populates="completed_by")

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    industry = Column(String)
    size = Column(String)
    region = Column(String)
    ai_maturity = Column(String)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", secondary=company_user_association, back_populates="companies")
    assessments = relationship("Assessment", back_populates="company")
    pillar_weights = relationship("CompanyPillarWeight", back_populates="company", cascade="all, delete-orphan")
    category_weights = relationship("CategoryWeight", back_populates="company", cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"))
    assessment_type = Column(String)  # AI Governance, AI Culture, etc.
    status = Column(String)  # not-started, in-progress, completed
    score = Column(Float, nullable=True)
    data = Column(JSON, nullable=True)  # Store assessment data as JSON
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="assessments")
    completed_by = relationship("User", back_populates="completed_assessments")

# New model for storing company pillar weights
class CompanyPillarWeight(Base):
    __tablename__ = "company_pillar_weights"
    
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"))
    pillar = Column(String)  # AI Governance, AI Culture, etc.
    weight = Column(Float)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="pillar_weights")

# New model for storing category weights within each pillar
class CategoryWeight(Base):
    __tablename__ = "category_weights"
    
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"))
    pillar = Column(String)  # AI Governance, AI Culture, etc.
    category = Column(String)  # Subcategory name within a pillar
    weight = Column(Float)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="category_weights")

# Default weights for all pillars (global defaults)
class DefaultPillarWeight(Base):
    __tablename__ = "default_pillar_weights"
    
    id = Column(String, primary_key=True, index=True)
    pillar = Column(String, unique=True)  # AI Governance, AI Culture, etc.
    weight = Column(Float)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Pydantic models for API
class UserBase(BaseModel):
    email: str
    name: str
    roles: List[str]  # Changed from single role to multiple roles

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Handle roles field - convert JSON string to list
        if hasattr(obj, 'roles') and isinstance(obj.roles, str):
            try:
                obj.roles = json.loads(obj.roles)
            except:
                obj.roles = [obj.role] if obj.role else []
        elif not hasattr(obj, 'roles') or obj.roles is None:
            obj.roles = [obj.role] if hasattr(obj, 'role') and obj.role else []
        
        return super().model_validate(obj, *args, **kwargs)

class UserUpdate(UserBase):
    password: Optional[str] = None

    class Config:
        orm_mode = True

class CompanyBase(BaseModel):
    name: str
    industry: str
    size: str
    region: str
    ai_maturity: str
    notes: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class AssessmentBase(BaseModel):
    assessment_type: str
    status: str
    score: Optional[float] = None
    data: Optional[Dict] = None
    completed_at: Optional[datetime.datetime] = None

class AssessmentCreate(AssessmentBase):
    company_id: str
    completed_by_id: Optional[str] = None

class AssessmentResponse(AssessmentBase):
    id: str
    company_id: str
    completed_by_id: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    assessmentType: str  # Added to match the error message
    # categoryResponses: Optional[list] = None # Assuming it's a list; adjust type as needed

    class Config:
        orm_mode = True

class CompanyUserAssignment(BaseModel):
    company_id: str
    user_ids: List[str]

# Models for weights management
class PillarWeightBase(BaseModel):
    pillar: str
    weight: float

class PillarWeightCreate(PillarWeightBase):
    pass

class PillarWeightResponse(PillarWeightBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True

class CategoryWeightBase(BaseModel):
    pillar: str
    category: str
    weight: float

class CategoryWeightCreate(CategoryWeightBase):
    pass

class CategoryWeightResponse(CategoryWeightBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True

class CompanyWeightsUpdate(BaseModel):
    weights: Dict[str, float]  # Mapping of pillar to weight

class CategoryWeightsUpdate(BaseModel):
    weights: Dict[str, Dict[str, float] | float]  # Can be either direct mapping of category to weight or a nested structure 
import os
import uuid
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company, Assessment, DefaultPillarWeight, CompanyPillarWeight, CategoryWeight

# Password encryption
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database setup - use a new database file
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_fresh.db"

# Create a new engine and database
print("Creating new database...")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Get a database session
db = SessionLocal()

# Define default users directly in this script
DEFAULT_USERS = [
    {
        "email": "admin@cybergen.com",
        "name": "Admin User",
        "role": "admin",
        "password": "admin123"
    },
    {
        "email": "governance@cybergen.com",
        "name": "Governance Manager",
        "role": "ai_governance",
        "password": "password123"
    },
    {
        "email": "culture@cybergen.com",
        "name": "Culture Director",
        "role": "ai_culture",
        "password": "password123"
    },
    {
        "email": "infrastructure@cybergen.com",
        "name": "Infrastructure Lead",
        "role": "ai_infrastructure",
        "password": "password123"
    },
    {
        "email": "strategy@cybergen.com",
        "name": "Strategy Officer",
        "role": "ai_strategy",
        "password": "password123"
    },
    {
        "email": "dataengineer@cybergen.com",
        "name": "Data Engineer",
        "role": "ai_data",
        "password": "password123"
    },
    {
        "email": "talent@cybergen.com",
        "name": "Talent Manager",
        "role": "ai_talent",
        "password": "password123"
    },
    {
        "email": "security@cybergen.com",
        "name": "Security Specialist",
        "role": "ai_security",
        "password": "password123"
    }
]

# Sample companies
SAMPLE_COMPANIES = [
    {
        "name": "TechInnovate Solutions",
        "industry": "Technology",
        "size": "Enterprise (1000+ employees)",
        "region": "North America",
        "ai_maturity": "Exploring",
        "notes": "Global tech firm focused on cloud solutions"
    },
    {
        "name": "FinServe Global",
        "industry": "Financial Services",
        "size": "Enterprise (1000+ employees)",
        "region": "Europe",
        "ai_maturity": "Expanding",
        "notes": "International banking corporation"
    },
    {
        "name": "HealthPlus Medical",
        "industry": "Healthcare",
        "size": "Mid-size (100-999 employees)",
        "region": "Asia Pacific",
        "ai_maturity": "Exploring",
        "notes": "Medical equipment manufacturer"
    },
    {
        "name": "GreenEnergy Co",
        "industry": "Energy",
        "size": "Mid-size (100-999 employees)",
        "region": "North America",
        "ai_maturity": "Initial",
        "notes": "Renewable energy provider"
    },
    {
        "name": "RetailNow",
        "industry": "Retail",
        "size": "Small (10-99 employees)",
        "region": "Europe",
        "ai_maturity": "Initial",
        "notes": "E-commerce company for fashion products"
    }
]

print("Creating users...")
created_users = []

for user_data in DEFAULT_USERS:
    user_id = f"user_{len(created_users) + 1}"
    db_user = User(
        id=user_id,
        email=user_data["email"],
        name=user_data["name"],
        role=user_data["role"],
        hashed_password=pwd_context.hash(user_data["password"])
    )
    db.add(db_user)
    created_users.append(db_user)

db.commit()

print("Creating companies with simple numeric IDs...")
created_companies = []

for i, company_data in enumerate(SAMPLE_COMPANIES, 1):
    # Use simple numeric ID (1, 2, 3, etc.)
    company_id = str(i)
    db_company = Company(
        id=company_id,
        name=company_data["name"],
        industry=company_data["industry"],
        size=company_data["size"],
        region=company_data["region"],
        ai_maturity=company_data["ai_maturity"],
        notes=company_data["notes"]
    )
    db.add(db_company)
    created_companies.append(db_company)

db.commit()

# Assign admin to all companies
admin_user = created_users[0]  # First user is admin

for company in created_companies:
    company.users.append(admin_user)

db.commit()

# Create some default assessments for each company
assessment_types = [
    "AI Governance", "AI Culture", "AI Infrastructure", 
    "AI Strategy", "AI Data", "AI Talent", "AI Security"
]

print("Creating assessments...")
for company in created_companies:
    for i, assessment_type in enumerate(assessment_types, 1):
        # Use simple ID format: company_id + "_" + sequential_number
        assessment_id = f"{company.id}_{i}"
        db_assessment = Assessment(
            id=assessment_id,
            company_id=company.id,
            assessment_type=assessment_type,
            status="not-started"
        )
        db.add(db_assessment)

db.commit()

# Create default pillar weights
print("Creating default weights...")
default_pillars = [
    {"pillar": "AI Governance", "weight": 14.3},
    {"pillar": "AI Culture", "weight": 14.3},
    {"pillar": "AI Infrastructure", "weight": 14.3},
    {"pillar": "AI Strategy", "weight": 14.3},
    {"pillar": "AI Data", "weight": 14.3},
    {"pillar": "AI Talent", "weight": 14.3},
    {"pillar": "AI Security", "weight": 14.2},
]

for pillar_data in default_pillars:
    pillar_id = f"pillar_{len(default_pillars)}"
    db_pillar = DefaultPillarWeight(
        id=pillar_id,
        pillar=pillar_data["pillar"],
        weight=pillar_data["weight"]
    )
    db.add(db_pillar)

db.commit()

print("Database has been created with simple numeric IDs for companies.")
print("Company IDs: " + ", ".join([company.id for company in created_companies]))
print("New database file: app_fresh.db")
print("You'll need to update main.py to use this new database file.") 
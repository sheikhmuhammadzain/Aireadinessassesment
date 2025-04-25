import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company, Assessment, DefaultPillarWeight, CompanyPillarWeight, CategoryWeight
from setup_db import pwd_context, DEFAULT_USERS, SAMPLE_COMPANIES
from datetime import datetime
import time

# Wait for any connections to close
print("Waiting for database connections to close...")
time.sleep(1)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

# Try to remove the existing database file
try:
    if os.path.exists("app.db"):
        os.remove("app.db")
        print("Deleted existing database.")
    else:
        print("No existing database found.")
except Exception as e:
    print(f"Could not delete database: {str(e)}")
    print("Please close any applications that might be using the database.")
    exit(1)

# Create a new engine and database
print("Creating new database...")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Get a database session
db = SessionLocal()

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

print("Database has been reset with simple numeric IDs for companies.")
print("Company IDs: " + ", ".join([company.id for company in created_companies])) 
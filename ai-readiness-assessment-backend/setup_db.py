import uuid
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company, Assessment, DefaultPillarWeight, CompanyPillarWeight, CategoryWeight

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Get a database session
db = SessionLocal()

# Default users with roles
DEFAULT_USERS = [
    {
        "email": "admin@cybergen.com",
        "name": "Admin User",
        "role": "admin",
        "roles": ["admin"],
        "password": "admin123"
    },
    {
        "email": "governance@cybergen.com",
        "name": "Governance Manager",
        "role": "ai_governance",
        "roles": ["ai_governance"],
        "password": "password123"
    },
    {
        "email": "culture@cybergen.com",
        "name": "Culture Director",
        "role": "ai_culture",
        "roles": ["ai_culture"],
        "password": "password123"
    },
    {
        "email": "infrastructure@cybergen.com",
        "name": "Infrastructure Lead",
        "role": "ai_infrastructure",
        "roles": ["ai_infrastructure"],
        "password": "password123"
    },
    {
        "email": "strategy@cybergen.com",
        "name": "Strategy Officer",
        "role": "ai_strategy",
        "roles": ["ai_strategy"],
        "password": "password123"
    },
    {
        "email": "dataengineer@cybergen.com",
        "name": "Data Engineer",
        "role": "ai_data",
        "roles": ["ai_data"],
        "password": "password123"
    },
    {
        "email": "talent@cybergen.com",
        "name": "Talent Manager",
        "role": "ai_talent",
        "roles": ["ai_talent"],
        "password": "password123"
    },
    {
        "email": "security@cybergen.com",
        "name": "Security Specialist",
        "role": "ai_security",
        "roles": ["ai_security"],
        "password": "password123"
    },
    # Multi-role users
    {
        "email": "multi1@cybergen.com",
        "name": "Multi Role User 1",
        "role": "ai_governance",  # Primary role
        "roles": ["ai_governance", "ai_culture", "ai_security"],
        "password": "password123"
    },
    {
        "email": "multi2@cybergen.com",
        "name": "Multi Role User 2",
        "role": "ai_data",  # Primary role
        "roles": ["ai_data", "ai_infrastructure"],
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

# Ensure the roles column exists
try:
    # Check if users table exists
    result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'"))
    if result.fetchone():
        # Check if roles column exists
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'roles' not in columns:
            print("Adding 'roles' column to users table...")
            db.execute(text("ALTER TABLE users ADD COLUMN roles JSON DEFAULT NULL"))
            db.commit()
            print("Added 'roles' column to users table")
except Exception as e:
    print(f"Error checking/adding roles column: {e}")
    
# Check if we need to create default users
existing_users = db.query(User).count()

if existing_users == 0:
    print("Creating default users...")
    created_users = []
    
    for user_data in DEFAULT_USERS:
        user_id = f"user_{uuid.uuid4()}"
        
        # Convert roles to JSON string for storage
        roles_json = json.dumps(user_data.get("roles", [user_data["role"]]))
        
        db_user = User(
            id=user_id,
            email=user_data["email"],
            name=user_data["name"],
            role=user_data["role"],  # Legacy role field for backward compatibility
            roles=roles_json,        # New multiple roles field as JSON
            hashed_password=pwd_context.hash(user_data["password"])
        )
        db.add(db_user)
        created_users.append(db_user)
    
    db.commit()
    
    # Do we need to create sample companies?
    existing_companies = db.query(Company).count()
    
    if existing_companies == 0:
        print("Creating sample companies...")
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
        
        # Assign multi-role users to some companies
        if len(created_users) >= 10:  # Make sure we have enough users
            multi_user1 = created_users[8]  # First multi-role user
            multi_user2 = created_users[9]  # Second multi-role user
            
            # Assign multi-role users to first three companies
            for i in range(min(3, len(created_companies))):
                created_companies[i].users.append(multi_user1)
                
            # Assign second multi-role user to companies 3-5
            for i in range(2, min(5, len(created_companies))):
                created_companies[i].users.append(multi_user2)
        
        db.commit()
        
        # Create some default assessments for each company
        assessment_types = [
            "AI Governance", "AI Culture", "AI Infrastructure", 
            "AI Strategy", "AI Data", "AI Talent", "AI Security"
        ]
        
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
        
        print(f"Created {len(created_companies)} sample companies with {len(assessment_types)} assessments each")
else:
    # If users exist, make sure they have the roles field populated
    print("Checking existing users for roles field...")
    users_without_roles = db.query(User).filter(User.roles == None).all()
    updated_count = 0
    
    for user in users_without_roles:
        if user.role:
            # Set roles from single role
            user.roles = json.dumps([user.role])
            updated_count += 1
    
    if updated_count > 0:
        db.commit()
        print(f"Updated {updated_count} existing users with roles field")

# Create default pillar weights
def create_default_weights(db):
    # Check if default weights already exist
    existing_weights = db.query(DefaultPillarWeight).all()
    if existing_weights:
        print("Default weights already exist, skipping...")
        return
    
    print("Creating default pillar weights...")
    default_pillars = [
        "AI Governance",
        "AI Culture",
        "AI Infrastructure",
        "AI Strategy",
        "AI Data",
        "AI Talent",
        "AI Security"
    ]
    
    # Equal weight distribution
    weight_per_pillar = 100.0 / len(default_pillars)
    rounded_weight = round(weight_per_pillar, 1)
    
    for pillar in default_pillars:
        db_weight = DefaultPillarWeight(
            id=str(uuid.uuid4()),
            pillar=pillar,
            weight=rounded_weight
        )
        db.add(db_weight)
    
    # Adjust last weight to ensure total is exactly 100
    db.commit()
    all_weights = db.query(DefaultPillarWeight).all()
    total_weight = sum(w.weight for w in all_weights)
    
    if abs(total_weight - 100.0) > 0.01:
        last_weight = all_weights[-1]
        adjustment = 100.0 - (total_weight - last_weight.weight)
        last_weight.weight = round(adjustment, 1)
        db.commit()

# Call this function in the main setup
create_default_weights(db)

print("Setup completed.") 
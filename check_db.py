from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Get all companies and their assigned users
print("Companies and their assigned users:")
companies = db.query(Company).all()
for company in companies:
    print(f"Company: {company.id} - {company.name}")
    print(f"  Assigned users: {len(company.users)}")
    for user in company.users:
        print(f"    - {user.id}: {user.email} (role: {user.role}, roles: {user.roles})")
    print("")

# Get all users and their assigned companies
print("\nUsers and their assigned companies:")
users = db.query(User).all()
for user in users:
    print(f"User: {user.id} - {user.email} (role: {user.role}, roles: {user.roles})")
    print(f"  Assigned companies: {len(user.companies)}")
    for company in user.companies:
        print(f"    - {company.id}: {company.name}")
    print("")

# Look specifically for multi1 user
print("\nMulti1 user details:")
multi_user = db.query(User).filter(User.email == "multi1@cybergen.com").first()
if multi_user:
    print(f"User ID: {multi_user.id}")
    print(f"Email: {multi_user.email}")
    print(f"Role: {multi_user.role}")
    print(f"Roles: {multi_user.roles}")
    
    print("\nAssigned companies:")
    for company in multi_user.companies:
        print(f"- {company.id}: {company.name}")
else:
    print("Multi1 user not found!")

# Check for TechInnovate Solutions company
print("\nTechInnovate Solutions company details:")
tech_company = db.query(Company).filter(Company.name == "TechInnovate Solutions").first()
if tech_company:
    print(f"Company ID: {tech_company.id}")
    print(f"Name: {tech_company.name}")
    
    print("\nAssigned users:")
    for user in tech_company.users:
        print(f"- {user.id}: {user.email} (role: {user.role})")
else:
    print("TechInnovate Solutions not found!")

# Close the database session
db.close() 
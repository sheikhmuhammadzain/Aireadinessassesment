from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("Fixing company-user associations...")

# Find multi1 user ID
result = db.execute(text("SELECT id FROM users WHERE email = 'multi1@cybergen.com'"))
user_id = result.fetchone()
if not user_id:
    print("Multi1 user not found")
    exit(1)
user_id = user_id[0]
print(f"Found multi1 user with ID: {user_id}")

# Find TechInnovate Solutions company ID
result = db.execute(text("SELECT id FROM companies WHERE name = 'TechInnovate Solutions'"))
company_id = result.fetchone()
if not company_id:
    print("TechInnovate Solutions company not found")
    exit(1)
company_id = company_id[0]
print(f"Found TechInnovate Solutions with ID: {company_id}")

# Check current associations
result = db.execute(text(
    "SELECT * FROM company_user_association WHERE user_id = :user_id AND company_id = :company_id"),
    {"user_id": user_id, "company_id": company_id})
associations = result.fetchall()
print(f"Current associations for this user and company: {associations}")

# Delete any existing associations
if associations:
    db.execute(text(
        "DELETE FROM company_user_association WHERE user_id = :user_id AND company_id = :company_id"),
        {"user_id": user_id, "company_id": company_id})
    db.commit()
    print(f"Removed association between user {user_id} and company {company_id}")
else:
    print("No direct association found in the association table")

# Setup_db.py might be assigning this automatically in the code
# Let's check what companies the Multi1 user has in the users table
result = db.execute(text("SELECT companies FROM users WHERE id = :user_id"), {"user_id": user_id})
user_companies = result.fetchone()
if user_companies and user_companies[0]:
    print(f"Companies directly in the user record: {user_companies[0]}")

# Check setup_db.py logic for assigning multi-role users to companies
print("\nChecking if setup_db.py might be auto-assigning users...")
result = db.execute(text("SELECT id, email, role, roles FROM users WHERE email LIKE '%multi%'"))
multi_users = result.fetchall()
print("Multi-role users:")
for user in multi_users:
    print(f"User: {user}")

# Show all companies to verify which ones exist
print("\nAll companies:")
result = db.execute(text("SELECT id, name FROM companies"))
companies = result.fetchall()
for company in companies:
    print(f"Company: {company}")

print("\nDone.")
db.close() 
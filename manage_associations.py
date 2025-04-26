from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import argparse
import json

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_all_associations():
    """List all company-user associations"""
    db = SessionLocal()
    try:
        print("\n=== All Company-User Associations ===")
        result = db.execute(text("""
            SELECT cua.id, u.email, c.name 
            FROM company_user_association cua
            JOIN users u ON u.id = cua.user_id
            JOIN companies c ON c.id = cua.company_id
        """))
        associations = result.fetchall()
        if not associations:
            print("No associations found.")
        else:
            for assoc in associations:
                print(f"ID: {assoc[0]} | User: {assoc[1]} | Company: {assoc[2]}")
    finally:
        db.close()

def list_user_associations(email):
    """List associations for a specific user"""
    db = SessionLocal()
    try:
        print(f"\n=== Associations for user: {email} ===")
        result = db.execute(text("""
            SELECT cua.id, c.name 
            FROM company_user_association cua
            JOIN users u ON u.id = cua.user_id
            JOIN companies c ON c.id = cua.company_id
            WHERE u.email = :email
        """), {"email": email})
        associations = result.fetchall()
        if not associations:
            print(f"No associations found for user: {email}")
        else:
            for assoc in associations:
                print(f"ID: {assoc[0]} | Company: {assoc[1]}")
        
        # Check if user has companies directly in the users table
        result = db.execute(text("""
            SELECT id, companies, roles FROM users WHERE email = :email
        """), {"email": email})
        user = result.fetchone()
        if user:
            print(f"\nUser ID: {user[0]}")
            print(f"Roles: {user[2]}")
            if user[1]:
                print(f"Companies directly in user record: {user[1]}")
            else:
                print("No companies directly in user record")
    finally:
        db.close()

def list_company_associations(company_name):
    """List associations for a specific company"""
    db = SessionLocal()
    try:
        print(f"\n=== Associations for company: {company_name} ===")
        result = db.execute(text("""
            SELECT cua.id, u.email, u.roles 
            FROM company_user_association cua
            JOIN users u ON u.id = cua.user_id
            JOIN companies c ON c.id = cua.company_id
            WHERE c.name = :company_name
        """), {"company_name": company_name})
        associations = result.fetchall()
        if not associations:
            print(f"No associations found for company: {company_name}")
        else:
            for assoc in associations:
                print(f"ID: {assoc[0]} | User: {assoc[1]} | Roles: {assoc[2]}")
    finally:
        db.close()

def add_association(user_email, company_name):
    """Add an association between a user and a company"""
    db = SessionLocal()
    try:
        # Get user ID
        result = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user_email})
        user = result.fetchone()
        if not user:
            print(f"User with email {user_email} not found")
            return
        user_id = user[0]
        
        # Get company ID
        result = db.execute(text("SELECT id FROM companies WHERE name = :name"), {"name": company_name})
        company = result.fetchone()
        if not company:
            print(f"Company with name {company_name} not found")
            return
        company_id = company[0]
        
        # Check if association already exists
        result = db.execute(text("""
            SELECT id FROM company_user_association 
            WHERE user_id = :user_id AND company_id = :company_id
        """), {"user_id": user_id, "company_id": company_id})
        if result.fetchone():
            print(f"Association between {user_email} and {company_name} already exists")
            return
        
        # Add association
        db.execute(text("""
            INSERT INTO company_user_association (user_id, company_id)
            VALUES (:user_id, :company_id)
        """), {"user_id": user_id, "company_id": company_id})
        db.commit()
        print(f"Added association between user {user_email} and company {company_name}")
    finally:
        db.close()

def remove_association(user_email, company_name):
    """Remove an association between a user and a company"""
    db = SessionLocal()
    try:
        # Get user ID
        result = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user_email})
        user = result.fetchone()
        if not user:
            print(f"User with email {user_email} not found")
            return
        user_id = user[0]
        
        # Get company ID
        result = db.execute(text("SELECT id FROM companies WHERE name = :name"), {"name": company_name})
        company = result.fetchone()
        if not company:
            print(f"Company with name {company_name} not found")
            return
        company_id = company[0]
        
        # Check if association exists
        result = db.execute(text("""
            SELECT id FROM company_user_association 
            WHERE user_id = :user_id AND company_id = :company_id
        """), {"user_id": user_id, "company_id": company_id})
        association = result.fetchone()
        if not association:
            print(f"No association found between {user_email} and {company_name}")
            return
        
        # Remove association
        db.execute(text("""
            DELETE FROM company_user_association 
            WHERE user_id = :user_id AND company_id = :company_id
        """), {"user_id": user_id, "company_id": company_id})
        db.commit()
        print(f"Removed association between user {user_email} and company {company_name}")
    finally:
        db.close()

def list_users():
    """List all users"""
    db = SessionLocal()
    try:
        print("\n=== All Users ===")
        result = db.execute(text("SELECT id, email, role, roles FROM users"))
        users = result.fetchall()
        for user in users:
            print(f"ID: {user[0]} | Email: {user[1]} | Legacy Role: {user[2]} | Roles: {user[3]}")
    finally:
        db.close()

def list_companies():
    """List all companies"""
    db = SessionLocal()
    try:
        print("\n=== All Companies ===")
        result = db.execute(text("SELECT id, name FROM companies"))
        companies = result.fetchall()
        for company in companies:
            print(f"ID: {company[0]} | Name: {company[1]}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage company-user associations")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # List all associations
    list_all_parser = subparsers.add_parser("list-all", help="List all associations")
    
    # List user associations
    list_user_parser = subparsers.add_parser("list-user", help="List associations for a user")
    list_user_parser.add_argument("email", help="User email")
    
    # List company associations
    list_company_parser = subparsers.add_parser("list-company", help="List associations for a company")
    list_company_parser.add_argument("company_name", help="Company name")
    
    # Add association
    add_parser = subparsers.add_parser("add", help="Add an association")
    add_parser.add_argument("email", help="User email")
    add_parser.add_argument("company_name", help="Company name")
    
    # Remove association
    remove_parser = subparsers.add_parser("remove", help="Remove an association")
    remove_parser.add_argument("email", help="User email")
    remove_parser.add_argument("company_name", help="Company name")
    
    # List users
    list_users_parser = subparsers.add_parser("list-users", help="List all users")
    
    # List companies
    list_companies_parser = subparsers.add_parser("list-companies", help="List all companies")
    
    args = parser.parse_args()
    
    if args.command == "list-all":
        list_all_associations()
    elif args.command == "list-user":
        list_user_associations(args.email)
    elif args.command == "list-company":
        list_company_associations(args.company_name)
    elif args.command == "add":
        add_association(args.email, args.company_name)
    elif args.command == "remove":
        remove_association(args.email, args.company_name)
    elif args.command == "list-users":
        list_users()
    elif args.command == "list-companies":
        list_companies()
    else:
        parser.print_help() 
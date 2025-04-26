"""
Migration script to add multiple roles support to the User model.

This migration:
1. Adds a new JSON 'roles' column to the users table if needed
2. Populates the roles column with the existing role value
3. Creates the user-role association table if needed

Run this script directly to apply the migration:
python migrations/multiple_roles.py
"""

import sys
import os
import json
from sqlalchemy import create_engine, Column, String, Table, MetaData, JSON, ForeignKey, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from the main app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database connection string from config
from database import DATABASE_URL, SessionLocal

# Initialize SQLAlchemy components
engine = create_engine(DATABASE_URL)
Base = declarative_base()
metadata = MetaData()
Session = sessionmaker(bind=engine)

def run_migration():
    print("Starting migration to add multiple roles support...")
    
    # Create a session
    session = SessionLocal()
    
    try:
        # Get inspector for checking schema
        inspector = inspect(engine)
        
        # 1. First check if the users table exists
        print("Checking users table...")
        result = session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'"))
        if not result.fetchone():
            print("Users table doesn't exist yet, creating tables...")
            from models import Base
            Base.metadata.create_all(bind=engine)
            print("Database tables created successfully!")
            return
        
        # 2. Check and add the 'roles' column to the users table if needed
        print("Checking 'roles' column in users table...")
        result = session.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'roles' not in columns:
            print("Adding 'roles' column to users table...")
            session.execute(text("ALTER TABLE users ADD COLUMN roles JSON DEFAULT NULL"))
            session.commit()
            print("Added 'roles' column to users table")
        else:
            print("Column 'roles' already exists, skipping")
        
        # 3. Populate the roles column with the existing role value
        print("Populating 'roles' column with existing role values...")
        users = session.execute(text("SELECT id, role FROM users WHERE roles IS NULL AND role IS NOT NULL")).fetchall()
        
        for user in users:
            user_id, role = user
            if role:
                # Create a JSON array with the current role
                roles_json = json.dumps([role])
                # Update the user's roles field
                session.execute(
                    text(f"UPDATE users SET roles = :roles WHERE id = :id"),
                    {"roles": roles_json, "id": user_id}
                )
        
        session.commit()
        print(f"Updated {len(users)} users with their existing roles")
        
        # 4. Check and create the user-role association table if needed
        print("Checking user-role association table...")
        result = session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='user_role_association'"))
        if not result.fetchone():
            print("Creating user-role association table...")
            session.execute(text("""
                CREATE TABLE user_role_association (
                    user_id VARCHAR(255) NOT NULL,
                    role VARCHAR(255) NOT NULL,
                    PRIMARY KEY (user_id, role),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            session.commit()
            print("Created user_role_association table")
        else:
            print("Table user_role_association already exists, skipping")
        
        # 5. Populate the association table with existing role values
        print("Populating user-role association table with existing roles...")
        users_with_roles = session.execute(text("SELECT id, role FROM users WHERE role IS NOT NULL")).fetchall()
        
        association_count = 0
        for user in users_with_roles:
            user_id, role = user
            if role:
                # Check if the association already exists
                existing = session.execute(
                    text("SELECT * FROM user_role_association WHERE user_id = :user_id AND role = :role"),
                    {"user_id": user_id, "role": role}
                ).fetchone()
                
                if not existing:
                    session.execute(
                        text("INSERT INTO user_role_association (user_id, role) VALUES (:user_id, :role)"),
                        {"user_id": user_id, "role": role}
                    )
                    association_count += 1
        
        session.commit()
        print(f"Added {association_count} user-role associations")
        
        print("Multiple roles migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    run_migration() 
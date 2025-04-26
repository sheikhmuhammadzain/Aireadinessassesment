"""
Create database tables script.

This script initializes the database with all tables from the models.
"""

import os
import sys
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models and database config
from models import Base
from database import engine, SessionLocal

def init_db():
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Check if users table exists and add roles column if needed
    session = SessionLocal()
    try:
        # Check if users table exists
        result = session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'"))
        if result.fetchone():
            # Check if roles column exists
            result = session.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'roles' not in columns:
                print("Adding 'roles' column to users table...")
                session.execute(text("ALTER TABLE users ADD COLUMN roles JSON DEFAULT NULL"))
                session.commit()
                print("Added 'roles' column to users table")
        
        print("Database initialization completed successfully!")
    except Exception as e:
        print(f"Error during database initialization: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_db() 
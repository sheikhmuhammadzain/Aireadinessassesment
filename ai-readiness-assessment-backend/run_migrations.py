"""
Migration runner script.

Run this script to apply all pending migrations in the correct order.
"""

import sys
import os
import importlib.util
from pathlib import Path

def import_module_from_file(module_name, file_path):
    """Import a module from a file path."""
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def run_migrations():
    """Run all migrations in the migrations directory."""
    print("Starting database migrations...")
    
    # Get migrations directory
    migrations_dir = Path(__file__).parent / 'migrations'
    if not migrations_dir.exists():
        migrations_dir.mkdir(exist_ok=True)
        print(f"Created migrations directory: {migrations_dir}")
    
    # Get all Python files in the migrations directory
    migration_files = sorted([f for f in migrations_dir.glob('*.py') if f.name != '__init__.py'])
    
    if not migration_files:
        print("No migration files found.")
        return
    
    print(f"Found {len(migration_files)} migration files.")
    
    # Run each migration
    for migration_file in migration_files:
        migration_name = migration_file.stem
        print(f"Running migration: {migration_name}")
        
        try:
            # Import the migration module
            migration_module = import_module_from_file(migration_name, migration_file)
            
            # Run the migration
            if hasattr(migration_module, 'run_migration'):
                migration_module.run_migration()
            else:
                print(f"Migration {migration_name} doesn't have a run_migration function.")
        
        except Exception as e:
            print(f"Error running migration {migration_name}: {e}")
            return False
    
    print("All migrations completed successfully!")
    return True

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1) 
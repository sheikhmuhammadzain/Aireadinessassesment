# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_new.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Get a database session
db = SessionLocal()

# Check if we need to create default users
existing_users = db.query(User).count()

# Try to remove the existing database file
try:
    if os.path.exists("app_new.db"):
        os.remove("app_new.db")
        print("Deleted existing database.")
    else:
        print("No existing database found.")
except Exception as e:
    print(f"Could not delete database: {str(e)}")
    print("Please close any applications that might be using the database.")
    exit(1) 
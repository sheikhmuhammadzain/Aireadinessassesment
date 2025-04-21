# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_fresh.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 
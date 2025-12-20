"""Database configuration and session management"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
# Default to SQLite for development (file: vose_movies.db)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./vose_movies.db"
)

# Determine if using SQLite or PostgreSQL based on URL
is_sqlite = DATABASE_URL.startswith("sqlite")

# Create SQLAlchemy engine with appropriate configuration
if is_sqlite:
    # SQLite configuration: no connection pooling needed
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
        echo=False  # Set to True for SQL query logging
    )
    print(f"📂 Using SQLite database: {DATABASE_URL.replace('sqlite:///', '')}")
else:
    # PostgreSQL configuration: use connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=10,
        max_overflow=20
    )
    print(f"🐘 Using PostgreSQL database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'configured'}")

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

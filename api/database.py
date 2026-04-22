from sqlalchemy import create_engine  # Import tool to establish database connections
from sqlalchemy.ext.declarative import declarative_base  # Import tool to define database models
from sqlalchemy.orm import sessionmaker  # Import tool to manage database sessions

# Define the location of the SQLite database file on the local filesystem
SQLALCHEMY_DATABASE_URL = "sqlite:///./atmosync.db"  # Path relative to the uvicorn start directory

# Create the SQL engine that will manage the communication with the database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,  # Provide the database URL
    connect_args={"check_same_thread": False}  # Required for SQLite to allow multiple threads
)

# Create a session factory to generate new database sessions for every request
SessionLocal = sessionmaker(
    autocommit=False,  # Disable automatic commits to ensure transaction integrity
    autoflush=False,  # Disable automatic flushing to control database writes
    bind=engine  # Bind the session maker to our SQL engine
)

# Create a base class that our database models will inherit from
Base = declarative_base()  # Standard base class for SQLAlchemy models

# Dependency function to provide a database session to our API routes
def get_db():  # Generator for database sessions
    db = SessionLocal()  # Create a new session instance
    try:  # Ensure the session is handled safely
        yield db  # Provide the session to the requesting route
    finally:  # Execution block after the request is finished
        db.close()  # Close the session to free up system resources

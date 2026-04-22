from sqlalchemy import Column, Integer, String, Boolean  # Import column types for model definition
from database import Base  # Import the base class from our database configuration

# Define the User model which represents the 'users' table in our database
class User(Base):  # Inherit from SQLAlchemy Base
    __tablename__ = "users"  # Name of the table in the database

    id = Column(Integer, primary_key=True, index=True)  # Unique identifier for each user
    username = Column(String, unique=True, index=True)  # User's chosen login name (must be unique)
    email = Column(String, unique=True, index=True)  # User's email address (must be unique)
    hashed_password = Column(String)  # The secure, hashed version of the user's password
    is_active = Column(Boolean, default=True)  # Flag to enable or disable user accounts
    
    # Store user-specific preferences directly on the account
    preferred_city = Column(String, default="Lagos")  # User's favorite location for weather
    preferred_unit = Column(String, default="C")  # Temperature unit preference (Celsius/Fahrenheit)

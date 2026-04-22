import os  # Import os to access environment variables for security keys
from datetime import datetime, timedelta  # Import time tools for token expiration
from typing import Union  # Import typing for type hinting flexibility
from jose import jwt  # Import tool to generate and verify JSON Web Tokens
from passlib.context import CryptContext  # Import tool for secure password hashing

# Configure the password hashing context using PBKDF2
# We switch to pbkdf2_sha256 because it is highly secure and has NO character limits,
# unlike bcrypt which is limited to 72 bytes.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto") 

# Define security constants for JWT generation
SECRET_KEY = os.getenv("SESSION_SECRET", "atmosync-super-secret-key-2026")  # Secret key for signing
ALGORITHM = "HS256"  # Hashing algorithm for tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Tokens expire after 24 hours

# Function to generate a secure hash from a plain-text password
def get_password_hash(password):  # Hash generator
    return pwd_context.hash(password)  # Return the hashed string

# Function to verify if a plain-text password matches a stored hash
def verify_password(plain_password, hashed_password):  # Password validator
    return pwd_context.verify(plain_password, hashed_password)  # Return true if matched

# Function to create a JWT access token for an authenticated user
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):  # Token generator
    to_encode = data.copy()  # Create a copy of the data payload
    if expires_delta:  # Check if a custom expiration was provided
        expire = datetime.utcnow() + expires_delta  # Calculate custom expiry
    else:  # Fallback to default expiration
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  # Use 24h default
    
    to_encode.update({"exp": expire})  # Add expiration claim to the payload
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # Sign and encode the token
    return encoded_jwt  # Return the final JWT string

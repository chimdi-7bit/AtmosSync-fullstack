import os  # Import the os module to access environment variables and handle file paths
import requests  # Import the requests library to make HTTP requests to external APIs
from fastapi import FastAPI, HTTPException, Request, Depends, status  # Import core components and security dependencies
from fastapi.middleware.cors import CORSMiddleware  # Import CORS middleware for cross-origin resource sharing
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm  # Import security schemes
from pydantic import BaseModel, EmailStr, Field  # Import Pydantic for data validation and email schemas
from sqlalchemy.orm import Session  # Import Session for database transaction management
from dotenv import load_dotenv  # Import load_dotenv to read configuration from .env files
from datetime import datetime  # Import datetime for timestamp conversion and moon phase calculation
from jose import JWTError, jwt  # Import tools for handling JWT decoding and errors

# Import Local Modules for Database and Authentication
import models  # Import database table definitions
from database import engine, get_db  # Import engine for init and session dependency
from auth_utils import verify_password, get_password_hash, create_access_token, ALGORITHM, SECRET_KEY, pwd_context  # Security helpers
from services.spotify_service import SpotifyService  # Custom service for Spotify data extraction logic
from services.ytmusic_service import YTMusicService  # Custom service for YouTube Music playlist creation

load_dotenv()  # Load all environment variables defined in the .env file into the system environment

# Initialize the database by creating all defined tables if they don't exist
models.Base.metadata.create_all(bind=engine)  # Sync models with the SQLite database file

app = FastAPI()  # Initialize the main FastAPI application instance

# Add CORS middleware to allow the React frontend to communicate with this backend securely
app.add_middleware(
    CORSMiddleware,  # Use the standard CORSMiddleware class from FastAPI
    allow_origins=["*"],  # Allow requests from any origin during the development phase
    allow_credentials=True,  # Allow browser credentials like cookies to be sent with requests
    allow_methods=["*"],  # Allow all standard HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all custom and standard HTTP headers in requests
)

# Define OAuth2 scheme for retrieving tokens from the 'Authorization' header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # Endpoint where tokens are issued

# Pydantic Schemas for Authentication and User Data
class UserCreate(BaseModel):  # Schema for account registration
    username: str  # Unique chosen username
    email: EmailStr  # Validated email address
    password: str = Field(..., min_length=1) 

class Token(BaseModel):  # Schema for successful login response
    access_token: str  # The signed JWT string
    token_type: str  # Usually "bearer"

class TokenData(BaseModel):  # Schema for decoded token payload
    username: str | None = None  # Extracted username from JWT

# Helper function to identify and validate the current user from a JWT token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):  # User dependency
    credentials_exception = HTTPException(  # Standard error for invalid credentials
        status_code=status.HTTP_401_UNAUTHORIZED,  # 401 Unauthorized status
        detail="Could not validate credentials",  # Error message
        headers={"WWW-Authenticate": "Bearer"},  # Auth header hint
    )
    try:  # Attempt to decode the provided token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # Verify signature and expiry
        username: str = payload.get("sub")  # Extract the 'sub' (username) claim
        if username is None:  # Check if username exists in payload
            raise credentials_exception  # Reject if missing
        token_data = TokenData(username=username)  # Create data object
    except JWTError:  # Handle invalid or expired tokens
        raise credentials_exception  # Reject access
    
    # Query the database for the user matching the token's username
    user = db.query(models.User).filter(models.User.username == token_data.username).first()  # SQL lookup
    if user is None:  # Check if user actually exists in database
        raise credentials_exception  # Reject if account deleted/missing
    return user  # Return the authenticated user object

# Registration Endpoint: Creates a new user account
@app.post("/register", response_model=Token)  # POST route for user creation
def register(user: UserCreate, db: Session = Depends(get_db)):  # Registration handler
    # Check if a user with the same email or username already exists
    db_user_email = db.query(models.User).filter(models.User.email == user.email).first()  # Email check
    db_user_username = db.query(models.User).filter(models.User.username == user.username).first() # Username check
    if db_user_email:  # If email is taken
        raise HTTPException(status_code=400, detail="Email already registered")  # Return error
    if db_user_username: # If username is taken
        raise HTTPException(status_code=400, detail="Username already registered") # Return error
    
    # Create the new user record with a secure hashed password
    try:
        # Use get_password_hash (now using pbkdf2 which has no length limit)
        hashed_pwd = get_password_hash(user.password) 
    except Exception as e:
        print(f"Hashing error during registration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Security engine error: {str(e)}")
        
    new_user = models.User(  # Construct model instance
        username=user.username,  # Set username
        email=user.email,  # Set email
        hashed_password=hashed_pwd  # Set secure hash
    )
    db.add(new_user)  # Add to database session
    db.commit()  # Save changes to the database file
    db.refresh(new_user)  # Reload object with database-generated ID
    
    # Generate an access token for the newly created user
    access_token = create_access_token(data={"sub": new_user.username})  # Create JWT
    return {"access_token": access_token, "token_type": "bearer"}  # Return token to frontend

# Login Endpoint: Authenticates users and issues tokens
@app.post("/login", response_model=Token)  # POST route for authentication
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):  # Login handler
    # Fetch the user from the database by username
    user = db.query(models.User).filter(models.User.username == form_data.username).first()  # Lookup user
    
    # Validate the user existence and the provided password hash
    try:
        is_valid = verify_password(form_data.password, user.hashed_password) if user else False
    except Exception as e:
        print(f"Verification error during login: {str(e)}")
        is_valid = False

    if not user or not is_valid:  # Security check
        raise HTTPException(  # Reject invalid attempts
            status_code=status.HTTP_401_UNAUTHORIZED,  # 401 status
            detail="Incorrect username or password",  # Generic error message for security
            headers={"WWW-Authenticate": "Bearer"},  # Auth hint
        )
    
    # Issue a new access token for the successful login
    access_token = create_access_token(data={"sub": user.username})  # Generate JWT
    return {"access_token": access_token, "token_type": "bearer"}  # Return token

# Profile Endpoint: Returns the authenticated user's information
@app.get("/me")  # GET route for current user info
def read_users_me(current_user: models.User = Depends(get_current_user)):  # Protected handler
    return {  # Return a subset of user data (never return hashes)
        "username": current_user.username,  # Account name
        "email": current_user.email,  # Account email
        "preferred_city": current_user.preferred_city,  # Saved preference
        "preferred_unit": current_user.preferred_unit  # Saved preference
    }

# Load API keys from environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")  # OpenWeatherMap API key
NEWS_API_KEY = os.getenv("NEWS_API_KEY")  # NewsAPI key
EXCHANGE_RATE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY")  # ExchangeRate-API key
YT_MUSIC_AUTH_FILE = os.getenv("YT_MUSIC_AUTH_FILE", "oauth.json")  # YTMusic auth file path

def get_moon_phase(date_obj):  # Helper function to calculate moon phase based on a given date
    # Simple moon phase calculation logic (Synodic Month: ~29.53 days)
    diff = date_obj - datetime(2000, 1, 6)  # Days since reference New Moon in 2000
    days = diff.days + diff.seconds / 86400.0  # Calculate total decimal days elapsed
    lunation = (days % 29.530588853) / 29.530588853  # Determine the progress through the current cycle
    
    # Categorize the lunation into standard moon phases
    if lunation < 0.06: return "New Moon"  # Dark moon phase
    if lunation < 0.19: return "Waxing Crescent"  # Increasing sliver
    if lunation < 0.31: return "First Quarter"  # Half moon visible
    if lunation < 0.44: return "Waxing Gibbous"  # More than half visible
    if lunation < 0.56: return "Full Moon"  # Full illumination
    if lunation < 0.69: return "Waning Gibbous"  # Decreasing illumination
    if lunation < 0.81: return "Last Quarter"  # Final half moon
    if lunation < 0.94: return "Waning Crescent"  # Final sliver
    return "New Moon"  # Cycle restart

@app.get("/")  # Define the root endpoint for health checks
def home():  # Root handler function
    return {"message": "AtmosSync API is fully operational with Multi-User support."}  # Return status

@app.get("/weather")  # Define a GET route to retrieve current weather conditions
def get_weather(city: str = None, lat: float = None, lon: float = None):  # Handler for weather lookups
    try:  # Wrap in try-except block for error handling
        # Determine whether to search by coordinates or city name
        if lat is not None and lon is not None:  # If coordinates are provided
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"  # Construct coords URL
        else:  # Fallback to city search
            search_query = f"{city},NG" if city else "Lagos,NG"  # Default to Lagos, Nigeria if no city specified
            url = f"http://api.openweathermap.org/data/2.5/weather?q={search_query}&appid={OPENWEATHER_API_KEY}&units=metric"  # Construct city URL
        
        response = requests.get(url)  # Execute the HTTP GET request to OpenWeatherMap
        data = response.json()  # Parse the JSON response body
        
        if response.status_code != 200:  # Check for API-level errors
            raise HTTPException(status_code=response.status_code, detail=data.get("message", "Weather API Error"))  # Forward error
        
        # Enrich the response with calculated astronomical data
        sunrise_ts = data.get('sys', {}).get('sunrise')  # Extract sunrise timestamp
        sunset_ts = data.get('sys', {}).get('sunset')  # Extract sunset timestamp
        current_date = datetime.now()  # Get the current system time
        phase = get_moon_phase(current_date)  # Calculate the current moon phase
        
        data['astro'] = {  # Append custom astronomical intelligence block
            'sunrise': datetime.fromtimestamp(sunrise_ts).strftime('%H:%M') if sunrise_ts else 'N/A',  # Format sunrise time
            'sunset': datetime.fromtimestamp(sunset_ts).strftime('%H:%M') if sunset_ts else 'N/A',  # Format sunset time
            'moon_phase': phase,  # Include the phase name
            'moon_status': f"Today, {current_date.strftime('%A, %B %d, %Y')}, the Moon is in its {phase} phase."  # Narrative status
        }
        return data  # Return the enriched data to the frontend
    except Exception as e:  # Catch unexpected processing errors
        if isinstance(e, HTTPException): raise e  # Re-raise known HTTP exceptions
        raise HTTPException(status_code=500, detail=str(e))  # Return generic server error

@app.get("/forecast")  # Define a GET route for obtaining a multi-day weather forecast
def get_forecast(city: str = None, lat: float = None, lon: float = None):  # Handler for forecast lookups
    try:  # Error handling wrapper
        if lat is not None and lon is not None:  # Check for coordinates
            url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"  # Coords URL
        else:  # Use city name
            search_query = f"{city},NG" if city else "Lagos,NG"  # Default city logic
            url = f"http://api.openweathermap.org/data/2.5/forecast?q={search_query}&appid={OPENWEATHER_API_KEY}&units=metric"  # City URL
        
        response = requests.get(url)  # Fetch forecast data from OpenWeatherMap
        return response.json()  # Return the raw JSON forecast list
    except Exception as e:  # Handle failures
        raise HTTPException(status_code=500, detail=str(e))  # Return error details

@app.get("/news")  # Define a GET route for retrieving high-priority local news headlines
def get_news():  # Handler for Nigerian intel feed
    try:  # Error handling wrapper for network or API failures
        # Construct a reliable search query targeting Nigerian current affairs
        query = "Nigeria"  # Broad geographic keyword for maximum reach
        url = f"https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&language=en&apiKey={NEWS_API_KEY}"  # Targeted Nigerian feed
        response = requests.get(url)  # Fetch the most recent news articles from the provider
        return response.json()  # Return the curated Nigerian news data to the frontend
    except Exception as e:  # Catch unexpected failures during the fetch process
        raise HTTPException(status_code=500, detail=str(e))  # Return server-side error details

@app.get("/exchange-rate")  # Define a GET route to check currency exchange rates with a focus on global base values
def get_exchange_rate(base: str = "USD"):  # Default base currency is now US Dollar for intuitive NGN conversion
    try:  # Error handling wrapper for financial data retrieval
        # Construct ExchangeRate-API URL using the specified base currency (defaults to USD)
        url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_RATE_API_KEY}/latest/{base}"  # Real-time financial intelligence
        response = requests.get(url)  # Fetch the latest global exchange rates from the provider
        return response.json()  # Return the currency mapping including the NGN rate to the frontend
    except Exception as e:  # Catch unexpected failures during the financial data fetch
        raise HTTPException(status_code=500, detail=str(e))  # Return server-side error details

# Define a Pydantic model for music transfer requests to ensure type safety
class TransferRequest(BaseModel):  # Request schema definition
    spotify_playlist_id: str  # Unique identifier for the source Spotify playlist
    target_playlist_name: str = "Transferred from Spotify"  # Optional name for the new YTM playlist

@app.post("/transfer")  # Music transfer endpoint to migrate tracks across platforms
def transfer_music(request: TransferRequest):  # Handler for migration requests
    try:  # Wrap in try-except for robust execution
        # 1. Initialize the Spotify service with credentials from environment variables
        spotify = SpotifyService(
            client_id=os.getenv("SPOTIFY_CLIENT_ID"),  # Spotify API client ID
            client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),  # Spotify API client secret
            redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8888/callback")  # Auth redirect URI
        )
        
        # 2. Extract track metadata from the specified Spotify playlist
        tracks = spotify.get_playlist_tracks(request.spotify_playlist_id)  # Fetch all tracks from the source
        
        # 3. Initialize the YouTube Music service using the authenticated session file
        ytm = YTMusicService(YT_MUSIC_AUTH_FILE)  # Load YTM authentication state
        
        # 4. Create the new playlist on YouTube Music and populate it with matched tracks
        playlist_id = ytm.create_playlist(
            name=request.target_playlist_name,  # User-defined or default name
            description="Automated transfer via BridgeBeat Sync Engine",  # System description
            tracks=tracks  # Metadata list for searching and adding
        )
        
        return {  # Return success response with execution details
            "status": "success",  # Overall state
            "playlist_id": playlist_id,  # New YTM playlist ID
            "tracks_moved": len(tracks)  # Total count of processed tracks
        }
    except Exception as e:  # Catch and handle transfer failures
        raise HTTPException(status_code=500, detail=f"Transfer Failed: {str(e)}")  # Return failure message

if __name__ == "__main__":  # Direct execution block
    import uvicorn  # Import uvicorn server for local development
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Start the server on all local network interfaces

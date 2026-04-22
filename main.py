from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable your frontend to talk to this local server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "SkyCast API is active locally"}

@app.get("/weather")
def get_weather(city: str = "Lagos"):
    return {
        "city": city.capitalize(),
        "temp": "30°C",
        "condition": "Partly Cloudy",
        "location": f"{city.capitalize()}, Nigeria"
    }

@app.get("/forecast")
def get_forecast(city: str = "Lagos"):
    return {"city": city, "forecast": "Expect high humidity across Lagos districts."}

@app.get("/news")
def get_news():
    return {"articles": [{"title": "Meteorology Update", "content": "Local weather patterns are stabilizing."}]}

@app.get("/exchange-rate")
def get_exchange_rate():
    return {"base": "NGN", "rates": {"USD": 0.00065}}

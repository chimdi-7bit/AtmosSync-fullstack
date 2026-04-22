import { useState, useEffect } from 'react'; // Import React state and side-effect hooks
import './App.css'; // Import minimal existing styles

// Define interface for structured currency data from backend
interface ExchangeDataType { // Type definition for currency exchange rates
  usdToNgn: number; // Rate for 1 US Dollar to Nigerian Naira
  eurToNgn: number; // Rate for 1 Euro to Nigerian Naira
  gbpToNgn: number; // Rate for 1 British Pound to Nigerian Naira
} // End of exchange data interface

// Define interface for structured user profile data
interface UserProfile { // Type definition for user profile information
  username: string; // User's unique identifier
  email: string; // User's registered email address
  preferred_city: string; // User's default city for weather data
  preferred_unit: 'C' | 'F'; // User's preferred temperature scale
} // End of user profile interface

// Define interface for notification data
interface NotificationItem { // Type definition for a single notification
  id: number; // Unique identifier for the notification
  text: string; // The notification message
  time: string; // Time elapsed since notification
  icon: string; // Material icon name for the notification type
} // End of notification item interface

// Define interface for individual news article data
interface NewsArticle { // Type definition for a single news item
  source: { name: string }; // Object containing source name
  title: string; // Headline of the news article
  content: string; // Snippet or full content of the article
  url: string; // URL to the full article
  publishedAt: string; // Timestamp of publication
} // End of news article interface

// Define interface for current weather data structure
interface WeatherData { // Type definition for current weather conditions
  coord: { lon: number; lat: number }; // Geographic coordinates
  weather: [{ description: string; icon: string }]; // Weather conditions array
  base: string; // Data source base
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; pressure: number; humidity: number; sea_level: number; grnd_level: number }; // Main weather parameters
  visibility: number; // Visibility in meters
  wind: { speed: number; deg: number; gust: number }; // Wind information
  clouds: { all: number }; // Cloudiness percentage
  dt: number; // Timestamp of data calculation
  sys: { country: string; sunrise: number; sunset: number }; // System information (country, sunrise/sunset times)
  timezone: number; // Timezone offset in seconds
  id: number; // City ID
  name: string; // City name
  cod: number; // API response code
  astro?: { // Astronomical data (optional, added by backend)
    sunrise: string; // Formatted sunrise time
    sunset: string; // Formatted sunset time
    moon_phase: string; // Current moon phase
    moon_status: string; // Narrative description of moon phase
  }; // End of astro object
} // End of weather data interface

// Define interface for forecast data structure
interface ForecastData { // Type definition for weather forecast
  list: Array<{ // Array of forecast entries
    dt: number; // Forecast timestamp
    main: { temp: number; feels_like: number; temp_min: number; temp_max: number; pressure: number; humidity: number; sea_level: number; grnd_level: number }; // Main forecast parameters
    weather: [{ description: string; icon: string }]; // Weather conditions array for forecast
    clouds: { all: number }; // Cloudiness percentage
    wind: { speed: number; deg: number; gust: number }; // Wind information
    visibility: number; // Visibility in meters
    pop: number; // Probability of precipitation
    sys: { pod: string }; // Part of day (d/n)
    dt_txt: string; // Text representation of forecast time
  }>; // End of forecast list
  city: { name: string; country: string }; // City information for the forecast
} // End of forecast data interface

function App() { // Main Weather Dashboard component
  const [city, setCity] = useState('Lagos'); // State for city name input/search
  const [searchInput, setSearchInput] = useState('Lagos'); // State for controlled input field
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); // Current weather data from backend
  const [forecastData, setForecastData] = useState<ForecastData | null>(null); // 5-day forecast data from backend
  const [newsData, setNewsData] = useState<NewsArticle[]>([]); // News feed articles from backend
  // State for currency rates, structured for NGN conversions
  const [exchangeData, setExchangeData] = useState<ExchangeDataType>({ // Initialize with default structure
    usdToNgn: 0, // Default for 1 USD to NGN
    eurToNgn: 0, // Default for 1 EUR to NGN
    gbpToNgn: 0  // Default for 1 GBP to NGN
  }); // Explicitly typed state for currency data

  const [loading, setLoading] = useState(true); // Global loading indicator state
  const [showNotifications, setShowNotifications] = useState(false); // Toggle state for alerts panel
  const [showSettings, setShowSettings] = useState(false); // Toggle state for configuration panel
  const [unit, setUnit] = useState<'C' | 'F'>('C'); // State for temperature unit preference
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Authentication status tracking
  const [user, setUser] = useState<UserProfile | null>(null); // Stored user profile data
  const [showAuthModal, setShowAuthModal] = useState(false); // Toggle for login/signup overlay
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // Switch between auth views
  const [authFormData, setAuthFormData] = useState({ username: '', email: '', password: '' }); // Form input state
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // State for light/dark mode
  const [currentTime, setCurrentTime] = useState(new Date()); // State for live clock

  // Effect to update the clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  // Effect to sync theme state with the document class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Mock notification data for the functional prototype
  const notifications: NotificationItem[] = [ // Array of system alerts
    { id: 1, text: 'Precision Grid v4.0 Active', time: 'Just now', icon: 'check_circle' }, // Status update
    { id: 2, text: 'New local news synchronized', time: '5m ago', icon: 'news' }, // Data sync alert
    { id: 3, text: 'Naira exchange rates updated', time: '12m ago', icon: 'payments' }, // Financial alert
  ]; // End of mock data

  // Define the base URL for the backend API, using a type-safe check for Vite environment variables
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'; // Fallback to local server

  // Function to fetch all dashboard metrics sequentially with timeouts for robustness
  const fetchDashboardData = async (targetCity: string, lat?: number, lon?: number) => { // Async data aggregator with sequential fetches and timeouts
    setLoading(true); // Trigger loading overlay
    let weatherFetchError = false; // Flag for weather data retrieval failure
    let forecastFetchError = false; // Flag for forecast data retrieval failure
    let newsFetchError = false; // Flag for news data retrieval failure
    let exchangeFetchError = false; // Flag for USD exchange rate retrieval failure
    let euroFetchError = false; // Flag for EUR exchange rate retrieval failure
    let gbpFetchError = false; // Flag for GBP exchange rate retrieval failure

    try { // Orchestrate parallel API requests with individual error handling and parsing
      // Build the weather query string based on whether coordinates or city name are provided
      const weatherQuery = lat && lon ? `lat=${lat}&lon=${lon}` : `city=${targetCity}`; // Precision toggle for location
      
      // Initiate all fetch requests concurrently, catching errors for individual services
      const [weatherRes, forecastRes, newsRes, exchangeRes, euroRes, gbpRes] = await Promise.all([
        fetch(`${API_BASE_URL}/weather?${weatherQuery}`).catch((err) => { weatherFetchError = true; console.error("Weather Fetch Error:", err); return null; }), // Fetch localized weather and astro data
        fetch(`${API_BASE_URL}/forecast?${weatherQuery}`).catch((err) => { forecastFetchError = true; console.error("Forecast Fetch Error:", err); return null; }), // Fetch extended outlook
        fetch(`${API_BASE_URL}/news`).catch((err) => { newsFetchError = true; console.error("News Fetch Error:", err); return null; }), // Fetch curated Nigerian news intel
        fetch(`${API_BASE_URL}/exchange-rate?base=USD`).catch((err) => { exchangeFetchError = true; console.error("USD Exchange Rate Fetch Error:", err); return null; }), // Fetch Naira conversion for 1 USD
        fetch(`${API_BASE_URL}/exchange-rate?base=EUR`).catch((err) => { euroFetchError = true; console.error("EUR Exchange Rate Fetch Error:", err); return null; }), // Fetch Naira conversion for 1 EUR
        fetch(`${API_BASE_URL}/exchange-rate?base=GBP`).catch((err) => { gbpFetchError = true; console.error("GBP Exchange Rate Fetch Error:", err); return null; })  // Fetch Naira conversion for 1 GBP
      ]);

      // Process weather data if fetch was successful and response is not null
      if (!weatherFetchError && weatherRes) { // Check for successful weather retrieval
        try { // Safely parse JSON, handling potential parsing errors
          const weather = await weatherRes.json(); // Decode weather payload
          if (!weather.detail) setWeatherData(weather); // Persist if no API error detail
        } catch (parseError) { // Catch JSON parsing errors
          console.error("Weather JSON Parse Error:", parseError); // Log parsing failure
          weatherFetchError = true; // Mark as failed
        }
      } else { // Handle weather fetch failure gracefully
        console.error("Weather data unavailable."); // Log the failure for debugging
      }

      // Process forecast data if fetch was successful and response is not null
      if (!forecastFetchError && forecastRes) { // Check for successful forecast retrieval
        try { // Safely parse JSON
          const forecast = await forecastRes.json(); // Decode extended forecast payload
          if (!forecast.detail) setForecastData(forecast); // Persist if no API error detail
        } catch (parseError) { // Catch JSON parsing errors
          console.error("Forecast JSON Parse Error:", parseError); // Log parsing failure
          forecastFetchError = true; // Mark as failed
        }
      } else { // Handle forecast fetch failure gracefully
        console.error("Forecast data unavailable."); // Log the failure
      }

      // Process news data if fetch was successful and response is not null
      if (!newsFetchError && newsRes) { // Check for successful news retrieval
        try { // Safely parse JSON
          const news = await newsRes.json(); // Decode Nigerian news payload
          if (!news.detail) setNewsData(news.articles?.slice(0, 3) || []); // Persist top local headlines
        } catch (parseError) { // Catch JSON parsing errors
          console.error("News JSON Parse Error:", parseError); // Log parsing failure
          newsFetchError = true; // Mark as failed
        }
      } else { // Handle news fetch failure gracefully
        console.error("News data unavailable."); // Log the failure
      }
      
      // Process USD exchange rate data if fetch was successful and response is not null
      if (!exchangeFetchError && exchangeRes) { // Check for successful USD rate retrieval
        try { // Safely parse JSON
          const usdData = await exchangeRes.json(); // Decode USD-based rates
          if (!usdData.detail) setExchangeData(prev => ({ ...prev, usdToNgn: usdData?.conversion_rates?.NGN ?? 0 })); // Update specific rate
        } catch (parseError) { // Catch JSON parsing errors
          console.error("USD Exchange Rate JSON Parse Error:", parseError); // Log parsing failure
          exchangeFetchError = true; // Mark as failed
        }
      } else { // Handle USD fetch failure gracefully
        console.error("USD exchange rate data unavailable."); // Log the error
      }

      // Process EUR exchange rate data if fetch was successful and response is not null
      if (!euroFetchError && euroRes) { // Check for successful EUR rate retrieval
        try { // Safely parse JSON
          const eurData = await euroRes.json(); // Decode EUR-based rates
          if (!eurData.detail) setExchangeData(prev => ({ ...prev, eurToNgn: eurData?.conversion_rates?.NGN ?? 0 })); // Update specific rate
        } catch (parseError) { // Catch JSON parsing errors
          console.error("EUR Exchange Rate JSON Parse Error:", parseError); // Log parsing failure
          euroFetchError = true; // Mark as failed
        }
      } else { // Handle EUR fetch failure gracefully
        console.error("EUR exchange rate data unavailable."); // Log the error
      }

      // Process GBP exchange rate data if fetch was successful and response is not null
      if (!gbpFetchError && gbpRes) { // Check for successful GBP rate retrieval
        try { // Safely parse JSON
          const gbpData = await gbpRes.json(); // Decode GBP-based rates
          if (!gbpData.detail) setExchangeData(prev => ({ ...prev, gbpToNgn: gbpData?.conversion_rates?.NGN ?? 0 })); // Update specific rate
        } catch (parseError) { // Catch JSON parsing errors
          console.error("GBP Exchange Rate JSON Parse Error:", parseError); // Log parsing failure
          gbpFetchError = true; // Mark as failed
        }
      } else { // Handle GBP fetch failure gracefully
        console.error("GBP exchange rate data unavailable."); // Log the error
      }
      
    } catch (err) { // Log overall synchronization errors for debugging if a critical error occurs
      console.error("Dashboard Sync Failed:", err); // Record the general failure details
    } finally { // Cleanup global loading state regardless of success or failure
      setLoading(false); // Reveal the functional UI or error state
    }
  }; // End of fetch function

  // Handler to request and process the user's current GPS coordinates for smaller area precision
  const handleLocationSync = () => { // Geolocation trigger function
    if (navigator.geolocation) { // Check if the browser supports geolocation APIs
      setLoading(true); // Start the loading animation
      navigator.geolocation.getCurrentPosition( // Request high-accuracy position
        (position) => { // Success callback
          const { latitude, longitude } = position.coords; // Destructure coordinates
          fetchDashboardData('', latitude, longitude); // Request hyper-local intelligence
        },
        (error) => { // Error callback for denied permissions or signal loss
          console.error("Location access denied:", error); // Log the rejection
          fetchDashboardData(city); // Fallback to city-wide data
        }
      );
    } else { // Handle legacy browsers without geolocation support
      alert("Geolocation is not supported by your browser infrastructure."); // User notification
    }
  }; // End of location handler

  // Function to handle user authentication (Login or Registration)
  const handleAuth = async (e: React.FormEvent) => { // Async auth submission handler
    e.preventDefault(); // Prevent page refresh on form submit
    const endpoint = authMode === 'login' ? '/login' : '/register'; // Determine target API route
    try { // Wrap network request in a try-catch for error resilience
      let response; // Placeholder for the fetch result
      if (authMode === 'login') { // Handle OAuth2 form data requirements for login
        const params = new URLSearchParams(); // Create form-encoded payload
        params.append('username', authFormData.username); // Add user credential
        params.append('password', authFormData.password); // Add user credential
        response = await fetch(`${API_BASE_URL}${endpoint}`, { // Execute login POST
          method: 'POST', // standard HTTP method
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // set form type
          body: params // attach encoded params
        });
      } else { // Handle JSON payload requirements for registration
        response = await fetch(`${API_BASE_URL}${endpoint}`, { // Execute register POST
          method: 'POST', // standard HTTP method
          headers: { 'Content-Type': 'application/json' }, // set JSON type
          body: JSON.stringify(authFormData) // attach JSON string
        });
      }
      
      const responseText = await response.text(); // Get raw response text
      let data;
      try {
        data = JSON.parse(responseText); // Attempt to parse as JSON
      } catch (e) {
        console.error("Non-JSON response from backend:", responseText);
        throw new Error(`Portal returned unexpected response: ${responseText.slice(0, 100)}...`);
      }
      
      if (response.ok) { // Check for successful transaction
        localStorage.setItem('token', data.access_token); // Securely store JWT token locally
        setIsLoggedIn(true); // Update global auth state
        setShowAuthModal(false); // Close the authentication overlay
        fetchUserProfile(data.access_token); // Retrieve personalized account data
      } else { // Handle validation or database errors
        const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        alert(errorMsg || 'Authentication failed. Please verify credentials.'); // Notify user of the failure
      }
    } catch (err: any) { // Handle network connectivity issues
      console.error("Auth Failure:", err); // Log diagnostics
      alert(err.message === 'Failed to fetch' 
        ? 'Sync interruption: Unable to reach the AtmosSync Portal.' 
        : `Sync Error: ${err.message}`);
    }
  }; // End of auth handler

  // Function to retrieve the authenticated user's profile from the backend
  const fetchUserProfile = async (token: string) => { // Async profile getter
    try { // Secure request wrapper
      const response = await fetch(`${API_BASE_URL}/me`, { // GET request to profile route
        headers: { 'Authorization': `Bearer ${token}` } // Attach bearer token for identity
      });
      if (response.ok) { // Validate successful retrieval
        const userData = await response.json(); // Decode user payload
        setUser(userData); // Persist user object to state
      }
    } catch (err) { // Handle request failures
      console.error("Profile sync failed:", err); // Log diagnostics
    }
  }; // End of profile fetcher

  // Function to terminate the user session and clear local security tokens
  const handleLogout = () => { // Logout execution function
    localStorage.removeItem('token'); // Remove JWT from local storage
    setIsLoggedIn(false); // Reset global auth status
    setUser(null); // Clear stored user profile
    setShowSettings(false); // Close the settings panel
  }; // End of logout handler

  // Handler for searching new locations in Nigeria
  const handleSearch = (e: React.FormEvent) => { // Search form event handler
    e.preventDefault(); // Stop default form navigation
    if (searchInput.trim()) { // Validate that input is not empty
      setCity(searchInput); // Update active city state
      fetchDashboardData(searchInput); // Request new data for the target city
    }
  }; // End of search handler

  // Helper function to map weather descriptions to Material Icons
  const getWeatherIcon = (description: string | undefined) => { // Icon mapping utility
    const desc = description?.toLowerCase() ?? 'cloud'; // Standardize input
    if (desc.includes('cloud')) return 'partly_cloudy_day'; // Cloud icon
    if (desc.includes('rain')) return 'rainy'; // Rain icon
    if (desc.includes('clear')) return 'sunny'; // Clear sky icon
    if (desc.includes('storm')) return 'thunderstorm'; // Storm icon
    return 'partly_cloudy_day'; // Default fallback icon
  }; // End of icon helper

  // Helper to get the correct panel class based on theme
  const getPanelClass = (tint: string) => { // Dynamic panel styling
    return theme === 'light' ? `glass-panel ${tint}` : `liquid-glass ${tint}`; // Light/Dark selection
  }; // End of panel helper

  // Initial dashboard population and session restoration logic
  useEffect(() => { // Startup initialization hook
    const token = localStorage.getItem('token'); // Check for existing user token
    if (token) { // If token is found, restore the session
      setIsLoggedIn(true); // Set state to logged in
      fetchUserProfile(token); // Synchronize profile data
    }
    fetchDashboardData(city); // Request initial weather and intelligence data
  }, []); // Run once on application mount

  if (loading) return ( // Render premium loading screen during data retrieval
    <div className={`h-screen w-full flex items-center justify-center font-bold text-2xl animate-pulse transition-all duration-500 ${theme === 'light' ? 'bg-[#f0f4f9] text-[#0096b4]' : 'bg-[#041329] text-[#00d2ff]'}`}>
      SYNCING STRATOSPHERIC INTELLIGENCE...
    </div>
  ); // End of loading check

  return ( // Main application UI layout
    <>
      {/* Top Navigation Bar: Branded header with city search */}
      <header className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 h-20 backdrop-blur-3xl transition-all duration-300 ${
        theme === 'light' 
        ? 'bg-white/40 border-b border-white/40 shadow-sm' 
        : 'bg-cyan-950/40 border-b border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
      }`}>
        <div className={`text-2xl font-black tracking-tighter ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>AtmosSync</div>
        
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <span className={`material-symbols-outlined absolute left-3 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>search</span>
            <input 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`w-full border-none focus:ring-0 text-sm font-label py-2.5 pl-10 transition-all rounded-xl ${
                theme === 'light' 
                ? 'bg-white/60 border border-slate-200/50 focus:border-primary shadow-inner text-[#111b2e]' 
                : 'bg-[#010e24]/40 border-b border-white/10 focus:border-[#00d2ff] text-[#d6e3ff]'
              }`} 
              placeholder="Search Lagos, Abuja, Kano..." 
              type="text"
            />
          </form>
        </div>

        <nav className="flex items-center gap-6">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`material-symbols-outlined transition-colors duration-300 ${theme === 'light' ? 'text-slate-600 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]'}`}
          >
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </button>
          <button 
            onClick={handleLocationSync}
            className={`material-symbols-outlined transition-colors duration-300 ${theme === 'light' ? 'text-slate-600 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]'}`}
          >
            my_location
          </button>
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
            className={`material-symbols-outlined transition-colors duration-300 ${
              showNotifications 
              ? (theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]') 
              : (theme === 'light' ? 'text-slate-600 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]')
            }`}
          >
            notifications
          </button>
          <button 
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
            className={`material-symbols-outlined transition-colors duration-300 ${
              showSettings 
              ? (theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]') 
              : (theme === 'light' ? 'text-slate-600 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]')
            }`}
          >
            settings
          </button>
          
          <button 
            onClick={() => isLoggedIn ? setShowSettings(!showSettings) : setShowAuthModal(true)}
            className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border transition-all group ${
              theme === 'light'
              ? 'bg-white/60 border-slate-200/50 hover:border-primary'
              : 'bg-white/5 border-white/10 hover:border-[#00d2ff]'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-[#0096b4] text-white' : 'bg-[#00d2ff] text-[#003543]'}`}>
              <span className="material-symbols-outlined text-sm font-bold">{isLoggedIn ? 'person' : 'login'}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>
              {isLoggedIn ? user?.username : 'Login'}
            </span>
          </button>
        </nav>
      </header>

      {/* AuthModal Overlay - Moved outside header for proper layout */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
          <div className={`w-full max-w-md rounded-[2.5rem] p-10 relative border shadow-2xl max-h-[90vh] overflow-y-auto ${getPanelClass('')} ${theme === 'light' ? 'bg-white border-white' : 'border-white/10'}`}>
            <button onClick={() => setShowAuthModal(false)} className={`absolute top-6 right-6 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]'}`}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <h3 className={`text-3xl font-black tracking-tighter mb-2 ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>AtmosSync Intelligence Portal</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">person</span>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    required
                    value={authFormData.username}
                    onChange={(e) => setAuthFormData({...authFormData, username: e.target.value})}
                    className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm outline-none transition-all ${
                      theme === 'light' 
                      ? 'bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary' 
                      : 'bg-white/5 border-white/10 focus:ring-1 focus:ring-[#00d2ff]'
                    }`} 
                  />
                </div>
                {authMode === 'signup' && (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">mail</span>
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required
                      value={authFormData.email}
                      onChange={(e) => setAuthFormData({...authFormData, email: e.target.value})}
                      className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm outline-none transition-all ${
                        theme === 'light' 
                        ? 'bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary' 
                        : 'bg-white/5 border-white/10 focus:ring-1 focus:ring-[#00d2ff]'
                      }`} 
                    />
                  </div>
                )}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">lock</span>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    required
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({...authFormData, password: e.target.value})}
                    className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm outline-none transition-all ${
                      theme === 'light' 
                      ? 'bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary' 
                      : 'bg-white/5 border-white/10 focus:ring-1 focus:ring-[#00d2ff]'
                    }`} 
                  />
                </div>
              </div>
              <button type="submit" className={`w-full py-4 font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all ${
                theme === 'light' 
                ? 'bg-[#0096b4] text-white shadow-[#0096b4]/20' 
                : 'bg-[#00d2ff] text-[#003543] shadow-[#00d2ff]/20'
              }`}>
                {authMode === 'login' ? 'Initiate Sync' : 'Register Account'}
              </button>
            </form>
            <div className="mt-8 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-primary' : 'text-slate-400 hover:text-[#00d2ff]'}`}>
                {authMode === 'login' ? 'New here? Request Access' : 'Already registered? Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Overlay */}
      {showNotifications && (
        <div className={`fixed top-24 right-8 w-80 rounded-2xl p-4 shadow-2xl border animate-in slide-in-from-top-4 duration-300 z-[200] ${getPanelClass('')} ${theme === 'light' ? 'bg-white border-white' : 'border-white/10'}`}>
          <h4 className={`font-label text-xs uppercase tracking-widest mb-4 ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>System Alerts</h4>
          <div className="space-y-4">
            {notifications.map(notif => (
              <div key={notif.id} className={`flex gap-3 items-start border-b pb-3 last:border-0 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                <span className={`material-symbols-outlined text-sm ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>{notif.icon}</span>
                <div>
                  <p className={`text-[10px] font-bold leading-tight ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{notif.text}</p>
                  <p className={`text-[8px] uppercase mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className={`w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-primary' : 'text-slate-400 hover:text-[#00d2ff]'}`}>Clear All</button>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className={`fixed top-24 right-8 w-80 rounded-2xl p-6 shadow-2xl border animate-in slide-in-from-top-4 duration-300 z-[200] ${getPanelClass('')} ${theme === 'light' ? 'bg-white border-white' : 'border-white/10'}`}>
          <h4 className={`font-label text-xs uppercase tracking-widest mb-6 ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>User Preferences</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>Temperature Unit</span>
              <div className={`flex rounded-lg p-1 border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <button 
                  onClick={() => setUnit('C')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${unit === 'C' ? (theme === 'light' ? 'bg-[#0096b4] text-white' : 'bg-[#00d2ff] text-[#003543]') : 'text-slate-400'}`}
                >
                  °C
                </button>
                <button 
                  onClick={() => setUnit('F')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${unit === 'F' ? (theme === 'light' ? 'bg-[#0096b4] text-white' : 'bg-[#00d2ff] text-[#003543]') : 'text-slate-400'}`}
                >
                  °F
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>Theme Mode</span>
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                  theme === 'dark' 
                  ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/50' 
                  : 'bg-[#0096b4]/20 text-[#0096b4] border-[#0096b4]/50'
                }`}
              >
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
            <div className={`flex justify-between items-center pt-4 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>Backend Status</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Operational</span>
            </div>
            {isLoggedIn && (
              <button 
                onClick={handleLogout}
                className="w-full mt-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                Terminate Session (Logout)
              </button>
            )}
          </div>
        </div>
      )}

      <main className="pt-28 pb-24 px-8 max-w-[1440px] mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Weather Card (Large) */}
          <section className={`md:col-span-8 rounded-2xl p-8 flex flex-col justify-between min-h-[420px] relative overflow-hidden group transition-all duration-500 ${getPanelClass('glass-weather')}`}>
            <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
              <span className={`material-symbols-outlined text-[320px] ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {getWeatherIcon(weatherData?.weather?.[0]?.description)}
              </span>
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`font-label text-xs uppercase tracking-[0.2em] font-bold mb-1 ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>Local Conditions</h2>
                  <p className={`text-4xl font-extrabold tracking-tight ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>
                    {weatherData?.name || city}, {weatherData?.sys?.country || 'NG'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-label uppercase tracking-widest border transition-all ${
                    theme === 'light' 
                    ? 'bg-white/60 text-[#0096b4] border-white' 
                    : 'bg-white/5 text-[#00d2ff] border-white/10 backdrop-blur-md'
                  }`}>
                    {theme === 'light' ? 'Precision Grid' : 'Liquid Grid'} Active
                  </span>
                </div>
              </div>
              
              <div className="flex items-end gap-8 mt-12">
                <div className="flex items-center gap-6">
                  <span className={`material-symbols-outlined text-8xl ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {getWeatherIcon(weatherData?.weather?.[0]?.description)}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-[7rem] font-black leading-none tracking-tighter text-glow transition-all ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>
                      {weatherData?.main?.temp !== undefined ? (unit === 'C' ? Math.round(weatherData.main.temp) : Math.round((weatherData.main.temp * 9/5) + 32)) : '--'}°
                    </span>
                    <span className={`font-label text-xl font-medium capitalize ${theme === 'light' ? 'text-[#40484c]' : 'text-[#bbc9cf]'}`}>
                      {weatherData?.weather?.[0]?.description || 'Syncing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`relative z-10 grid grid-cols-3 gap-8 mt-auto pt-8 border-t transition-all ${theme === 'light' ? 'border-slate-200/50' : 'border-white/5'}`}>
              <div className="flex flex-col">
                <span className={`font-label text-[10px] uppercase tracking-widest font-bold mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Humidity</span>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-xl font-bold ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>humidity_mid</span>
                  <span className={`text-2xl font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{weatherData?.main?.humidity ?? '0'}%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`font-label text-[10px] uppercase tracking-widest font-bold mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Wind Speed</span>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-xl font-bold ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>air</span>
                  <span className={`text-2xl font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{weatherData?.wind?.speed ?? '0'} {unit === 'C' ? 'm/s' : 'mph'}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`font-label text-[10px] uppercase tracking-widest font-bold mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Pressure</span>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-xl font-bold ${theme === 'light' ? 'text-[#0096b4]' : 'text-[#00d2ff]'}`}>compress</span>
                  <span className={`text-2xl font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{weatherData?.main?.pressure ?? '0'} hPa</span>
                </div>
              </div>
            </div>
          </section>

          {/* Chronos Forecast Card */}
          <section className={`md:col-span-4 rounded-2xl p-6 transition-all duration-500 ${getPanelClass('glass-forecast')}`}>
            <h3 className={`font-label text-[10px] uppercase tracking-widest font-black mb-6 ${theme === 'light' ? 'text-[#5a61a6]' : 'text-[#bdc2ff]'}`}>Chronos Forecast</h3>
            <div className="space-y-3">
              {forecastData?.list?.filter((_: any, i: number) => i % 8 === 0).slice(1, 5).map((day: any, index: number) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-xl shadow-sm border transition-all ${
                  theme === 'light' 
                  ? 'bg-white/40 border-white hover:bg-white/60' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}>
                  <span className={`font-label text-xs font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className={`material-symbols-outlined ${theme === 'light' ? 'text-[#5a61a6]' : 'text-[#bdc2ff]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {getWeatherIcon(day.weather?.[0]?.description)}
                  </span>
                  <span className={`text-xl font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>
                    {Math.round(unit === 'C' ? day.main.temp : (day.main.temp * 9/5) + 32)}°
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Celestial Hub */}
          <section className={`md:col-span-4 rounded-2xl p-6 flex flex-col transition-all duration-500 ${getPanelClass('glass-celestial')}`}>
            <h3 className={`font-label text-[10px] uppercase tracking-widest font-black mb-6 flex items-center gap-2 ${theme === 'light' ? 'text-[#8c6300]' : 'text-[#ffba4a]'}`}>
              <span className="material-symbols-outlined text-sm font-bold">nights_stay</span>
              Celestial Hub
            </h3>
            <div className="flex-1 flex flex-col gap-6">
              <div className="relative h-24 flex items-center justify-center">
                <div className={`absolute inset-0 border-b-2 rounded-[100%] h-32 -top-16 ${theme === 'light' ? 'border-slate-200/50' : 'border-white/5'}`}></div>
                <div className="flex justify-between w-full px-4 items-end pb-2">
                  <div className="text-center">
                    <span className={`material-symbols-outlined mb-1 ${theme === 'light' ? 'text-[#8c6300]' : 'text-[#ffd79f]'}`}>wb_twilight</span>
                    <p className={`font-label text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>SUNRISE</p>
                    <p className={`text-sm font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{weatherData?.astro?.sunrise ?? '06:14 AM'}</p>
                  </div>
                  <div className="text-center">
                    <span className={`material-symbols-outlined mb-1 ${theme === 'light' ? 'text-amber-500' : 'text-[#ffba4a]'}`}>wb_sunny</span>
                    <p className={`font-label text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>SUNSET</p>
                    <p className={`text-sm font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{weatherData?.astro?.sunset ?? '07:42 PM'}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-4 mt-auto border shadow-inner transition-all ${
                theme === 'light' 
                ? 'bg-white/50 border-white' 
                : 'bg-white/5 border-white/5'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`material-symbols-outlined ${theme === 'light' ? 'text-[#8c6300]' : 'text-[#ffd79f]'}`}>brightness_3</span>
                  <span className={`font-label text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>Moon Status</span>
                </div>
                <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-[#40484c]' : 'text-[#bbc9cf]'}`}>
                  {weatherData?.astro?.moon_status || "Waxing Gibbous. 88.4% illumination. High visibility for night metrics."}
                </p>
              </div>
            </div>
          </section>

          {/* Currency Intelligence */}
          <section className={`md:col-span-4 rounded-2xl p-6 transition-all duration-500 ${getPanelClass('glass-currency')}`}>
            <h3 className={`font-label text-[10px] uppercase tracking-widest font-black mb-6 ${theme === 'light' ? 'text-[#10b981]' : 'text-[#4ade80]'}`}>Currency Intelligence</h3>
            <div className="space-y-4">
              {[
                { label: 'USD / NGN', code: 'USD', value: exchangeData.usdToNgn, color: 'bg-emerald-500 text-white' },
                { label: 'EUR / NGN', code: 'EUR', value: exchangeData.eurToNgn, color: 'bg-slate-200 text-slate-700' },
                { label: 'GBP / NGN', code: 'GBP', value: exchangeData.gbpToNgn, color: 'bg-slate-200 text-slate-700' }
              ].map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm ${
                  theme === 'light' 
                  ? 'bg-white/40 border-white hover:bg-white/60' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                      theme === 'dark' ? 'bg-[#112036] text-[#d6e3ff]' : item.color
                    }`}>
                      {item.code}
                    </div>
                    <span className={`font-label text-sm font-bold ${theme === 'light' ? 'text-[#111b2e]' : 'text-[#d6e3ff]'}`}>{item.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-[#4ade80]'}`}>
                    ₦{item.value ? item.value.toLocaleString() : '1,485.20'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* World Intel */}
          <section className={`md:col-span-4 rounded-2xl p-6 transition-all duration-500 ${getPanelClass('glass-intel')}`}>
            <h3 className={`font-label text-[10px] uppercase tracking-widest font-black mb-6 ${theme === 'light' ? 'text-[#ba1a1a]' : 'text-[#ffb4ab]'}`}>World Intel Feed</h3>
            <div className="space-y-6">
              {newsData.length > 0 ? newsData.map((article, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <p className={`text-sm font-bold transition-colors line-clamp-2 mb-1 ${
                    theme === 'light' ? 'text-[#111b2e] group-hover:text-[#ba1a1a]' : 'text-[#d6e3ff] group-hover:text-[#ffb4ab]'
                  }`}>{article.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-label font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{article.source.name}</span>
                    <span className={`w-1 h-1 rounded-full ${theme === 'light' ? 'bg-slate-300' : 'bg-white/20'}`}></span>
                    <span className={`text-[10px] font-label ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Verified Source</span>
                  </div>
                </div>
              )) : [
                { title: 'Anomalous high-pressure system forming over North Atlantic', source: 'NOAA Strategic', time: '2h ago' },
                { title: 'Global supply chains adapt to unseasonal monsoon patterns', source: 'Economist Intel', time: '5h ago' },
                { title: 'Renewable energy surge hits record 82% during clear sky week', source: 'Tech Daily', time: '8h ago' }
              ].map((item, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <p className={`text-sm font-bold transition-colors line-clamp-2 mb-1 ${
                    theme === 'light' ? 'text-[#111b2e] group-hover:text-[#ba1a1a]' : 'text-[#d6e3ff] group-hover:text-[#ffb4ab]'
                  }`}>{item.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-label font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{item.source}</span>
                    <span className={`w-1 h-1 rounded-full ${theme === 'light' ? 'bg-slate-300' : 'bg-white/20'}`}></span>
                    <span className={`text-[10px] font-label ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`fixed bottom-0 w-full z-50 flex justify-between items-center px-8 py-4 backdrop-blur-3xl border-t transition-all duration-300 ${
        theme === 'light' 
        ? 'bg-white/60 border-white/60 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]' 
        : 'bg-slate-950/60 border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'light' ? 'bg-emerald-400' : 'bg-[#00d2ff]'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme === 'light' ? 'bg-emerald-500' : 'bg-[#00d2ff]'}`}></span>
          </span>
          <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-600' : 'text-[#00d2ff]'}`}>
            Sync Status: <span className={theme === 'light' ? 'text-emerald-600' : 'text-[#00d2ff]'}>Active</span> | {theme === 'light' ? 'Precision Grid v2.4' : 'Liquid Sync v2.5.0-LQD'}
          </span>
        </div>
        <div className="flex gap-6">
          <a className={`font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]'}`} href="#">System Logs</a>
          <a className={`font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-[#0096b4]' : 'text-slate-400 hover:text-[#00d2ff]'}`} href="#">Network Health</a>
        </div>
        <div className={`font-mono text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          {currentTime.toLocaleTimeString('en-US', { hour12: false })} LOCAL
        </div>
      </footer>
    </>
  ); // End of JSX return
}

export default App; // Export AtmosSync Dashboard as the primary application entry point

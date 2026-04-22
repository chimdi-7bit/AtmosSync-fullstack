import { useState } from 'react'  // Import React state management hook

function App() {  // Main dashboard component for BridgeBeat music transfer
  const [isSyncing, setIsSyncing] = useState(false)  // State for transfer status tracking
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState('') // Source playlist identifier
  const [targetName, setTargetName] = useState('') // Custom destination playlist name
  const [transferStatus, setTransferStatus] = useState<string | null>(null) // Feedback status for users
  const [totalTracksMoved, setTotalTracksMoved] = useState(0) // Global counter for all tracks transferred across sessions
  const [connectedServices, setConnectedServices] = useState<any[]>([]) // Registry of authenticated streaming platforms
  const [transferHistory, setTransferHistory] = useState<any[]>([]) // Registry of past music migrations
  const [userProfile, setUserProfile] = useState<any>(null) // State to store the authenticated user's profile

  // Use the current machine's hostname for the API URL so other devices can connect
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname}:8000`;

  // Function to initiate OAuth flow by redirecting to the backend login endpoint
  const handleConnect = (provider: string) => { // Generic handler for different auth providers
    window.location.href = `${API_BASE_URL}/login/${provider}`; // Browser redirect to start handshake
  }; // End of connection handler function

  // Function to execute the backend transfer process
  const handleTransfer = async () => { // Async trigger for music migration engine
    if (!spotifyPlaylistId) { // Validate that a source ID is provided
        alert("Please enter a Spotify Playlist ID to begin the migration."); // Notify user of missing input
        return; // Abort transfer attempt
    }

    setIsSyncing(true); // Toggle UI into syncing state
    setTransferStatus("Initiating sync engine..."); // Provide immediate visual feedback

    try {
      const response = await fetch(`${API_BASE_URL}/transfer`, { // POST request to music-agent backend

        method: 'POST', // standard REST method for creating resources
        headers: { 'Content-Type': 'application/json' }, // ensure server parses as JSON
        body: JSON.stringify({ // transmit required parameters to server
          spotify_playlist_id: spotifyPlaylistId,
          target_playlist_name: targetName || "New Sync Playlist" // default name if none provided
        })
      });
      
      const data = await response.json(); // extract response payload
      
      if (response.ok) { // check for 2xx status code
        const movedCount = data.tracks_moved || 0; // safely get track count from response
        setTransferStatus(`Success! Moved ${movedCount} tracks with surgical precision.`); // inform user of success
        setTotalTracksMoved(prev => prev + movedCount); // increment global counter
        setTransferHistory(prev => [ // append new record to history log
          {
            id: Date.now(), // unique identifier for keying React elements
            name: targetName || "New Sync Playlist", // name used for the migration
            from: 'Spotify', // source platform
            to: 'YouTube Music', // target platform
            tracks: movedCount, // number of successful matches
            time: 'Just now', // relative timestamp for UI
            status: 'Completed' // final execution state
          },
          ...prev // maintain newest-first order
        ]);
      } else { // handle server-side validation or execution errors
        setTransferStatus(`Error: ${data.detail || 'The migration failed.'}`); // display specific error from backend
      }
    } catch (error) { // handle network timeouts or connection refused errors
      setTransferStatus("Failed to reach the sync server. Please try again."); // prompt user to retry
    } finally {
      setIsSyncing(false); // return UI to idle state
    }
  };

  return (  // Core UI layout wrapper
    <>
      {/* SideNavBar: Fixed left navigation for primary actions and settings */}
      <aside className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-[#0e0e0e] flex flex-col py-8 shadow-[0_0_40px_rgba(114,254,143,0.06)] font-['Manrope'] tracking-tight z-[100]">
        <div className="px-6 mb-10">  {/* Dashboard branding and tier display */}
          <h1 className="text-xl font-bold tracking-tighter text-[#ffffff]">BridgeBeat</h1>  {/* App Logo */}
          <p className="text-xs text-on-surface-variant font-medium mt-1">Free Tier</p>  {/* User tier badge */}
        </div>
        <nav className="flex-1 space-y-1">  {/* Navigation link container */}
          <a className="flex items-center px-6 py-3 text-[#72fe8f] font-semibold bg-[#1a1a1a] rounded-r-full active:scale-95 transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center px-6 py-3 text-[#adaaaa] hover:text-[#ffffff] hover:bg-[#2c2c2c] active:scale-95 transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">sync_alt</span>
            <span>Connect Services</span>
          </a>
          <a className="flex items-center px-6 py-3 text-[#adaaaa] hover:text-[#ffffff] hover:bg-[#2c2c2c] active:scale-95 transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">history</span>
            <span>Transfer History</span>
          </a>
          <a className="flex items-center px-6 py-3 text-[#adaaaa] hover:text-[#ffffff] hover:bg-[#2c2c2c] active:scale-95 transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span>Settings</span>
          </a>
        </nav>
        <div className="px-6 mt-6">  {/* Primary Action: New Transfer Initiation Area */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
            <input 
                type="text" 
                placeholder="Spotify Playlist ID"
                value={spotifyPlaylistId}
                onChange={(e) => setSpotifyPlaylistId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
            <button 
                disabled={isSyncing}
                onClick={handleTransfer}  // Execute the migration on click
                className="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
            >
                <span className="material-symbols-outlined text-xl">{isSyncing ? "sync" : "add"}</span>
                {isSyncing ? "Syncing..." : "New Transfer"}
            </button>
          </div>
        </div>
        <div className="mt-auto space-y-1 pt-6">  {/* Bottom secondary navigation links */}
          <a className="flex items-center px-6 py-3 text-[#adaaaa] hover:text-[#ffffff] hover:bg-[#2c2c2c] transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">help_outline</span>
            <span>Help</span>
          </a>
          <a className="flex items-center px-6 py-3 text-[#adaaaa] hover:text-[#ffffff] hover:bg-[#2c2c2c] transition-all duration-300" href="#">
            <span className="material-symbols-outlined mr-3">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* TopNavBar: Secondary search and profile navigation area */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-50 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-between items-center px-8 h-20">
        <div className="flex items-center gap-8">  {/* Library and Discovery tab navigation */}
          <nav className="flex gap-6 font-['Inter'] text-sm font-medium">
            <a className="text-[#ffffff] border-b-2 border-[#72fe8f] pb-2 cursor-pointer transition-all" href="#">My Library</a>
            <a className="text-[#adaaaa] hover:text-[#ffffff] cursor-pointer transition-all" href="#">Discover</a>
          </nav>
        </div>
        <div className="flex items-center gap-6">  {/* Global Search and Notifications */}
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input className="bg-surface-container border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary" placeholder="Search curated lists..." type="text"/>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-on-surface transition-opacity cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container-highest cursor-pointer border border-outline-variant/20">  {/* User Avatar Placeholder */}
              <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Responsive bento grid layout for music stats and tools */}
      <main className="ml-64 pt-24 px-8 pb-12 min-h-screen">
        <div className="grid grid-cols-12 gap-6 mb-12">  {/* Editorial Bento Grid for Hero section */}
          {/* Main CTA Hero Card with visual effects */}
          <div className="col-span-12 lg:col-span-8 relative overflow-hidden rounded-xl bg-surface-container-low min-h-[400px] flex flex-col justify-end p-10 group">
            <div className="absolute inset-0 z-0">  {/* Hero Background image with gradient overlay */}
              <img className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiadBcNdnxz4dMH2BchaVx6TaNCULWe8lGpuOf8DETDyCyfmwMBYN-p3OSEyjIxBhhY9Ufrq4hGt-1r2ivmsjge-sIicGKCb2YgJob8NnzNgJb2fMnd61yshOBBxGAZpyp02dWVB5r6px2eeKPen4X-yXLnM35h_mvU333pbQPncWheLVh_BAlfVs3Mh7tAZlbGYWcnnIFkaoeQrEl91abNFSOX8DSrEXaBxN-Tq84zjtMar8jMzBywDd-JTkD7IsG7vI348FlFLl3"/>
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-lg">  {/* Hero content area */}
              <span className="font-['Inter'] font-semibold text-xs tracking-[0.2em] text-primary uppercase mb-4 block">New Sync Engine v4.0</span>
              <h2 className="font-['Manrope'] text-5xl font-bold tracking-tight mb-6 leading-[1.1]">The art of seamless <br/><span className="text-primary">curation.</span></h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">Effortlessly bridge your musical worlds. Move playlists, liked songs, and metadata between premium services with surgical precision.</p>
              <div className="flex gap-4">
                <button 
                    disabled={isSyncing}
                    onClick={handleTransfer}
                    className="px-8 py-4 bg-primary text-on-primary-container rounded-full font-extrabold text-sm tracking-tight active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                    {isSyncing ? "Syncing Library..." : "Start New Transfer"}
                </button>
                {transferStatus && ( // Show feedback toast style status message
                    <div className="px-6 py-4 bg-surface-container rounded-full border border-primary/20 flex items-center animate-pulse">
                        <p className="text-xs font-bold text-primary">{transferStatus}</p>
                    </div>
                )}
              </div>
            </div>
          </div>
          {/* VU Meter and Statistics Side Panel */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 rounded-xl bg-surface-container p-8 relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">  {/* Top stats display */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-1">Total Tracks Moved</p>
                    <p className="text-4xl font-['Manrope'] font-bold">{totalTracksMoved.toLocaleString()}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-3xl">trending_up</span>
                </div>
                {/* Visual VU Meters for signal strength and peak monitoring */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-tighter">
                      <span>PEAK</span>
                      <span>-3DB</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden flex gap-[2px]">
                      <div className="h-full w-[70%] bg-primary"></div>
                      <div className="h-full w-[15%] bg-secondary"></div>
                      <div className="h-full w-[5%] bg-outline-variant/30"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-tighter">
                      <span>SIGNAL STRENGTH</span>
                      <span>HIGH</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden flex gap-[2px]">
                      <div className="h-full w-[85%] bg-primary"></div>
                      <div className="h-full w-[5%] bg-outline-variant/30"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 p-4 opacity-5">  {/* Background decoration icon */}
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
              </div>
            </div>
            <div className="h-32 rounded-xl bg-surface-container-high p-6 flex items-center gap-4">  {/* Turbo Mode feature highlight */}
              <div className="h-12 w-12 rounded-lg bg-surface-bright flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">flash_on</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Turbo Mode Active</p>
                <p className="text-xs text-on-surface-variant">Transfers are 3x faster today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Services Management Section */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-8">  {/* Section header */}
            <div>
              <h3 className="font-['Manrope'] text-2xl font-bold tracking-tight">Connected Services</h3>
              <p className="text-on-surface-variant text-sm mt-1">Manage your active streaming endpoints</p>
            </div>
            <button className="text-primary text-sm font-semibold hover:underline">Link New Service</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  {/* Service cards container */}
            {connectedServices.length > 0 ? connectedServices.map((service, index) => ( // Render each connected account
              <div key={index} className="bg-surface-container rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden border border-outline-variant/10 hover:bg-surface-bright transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${service.color || 'bg-primary'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{service.icon || 'brand_awareness'}</span>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">{service.status}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{service.name}</h4>
                  <p className="text-on-surface-variant text-sm">{service.username}</p>
                </div>
                <div className="flex gap-4 pt-2 border-t border-outline-variant/10 text-xs">  {/* Service statistics */}
                  <div><span className="text-on-surface-variant">Playlists:</span> <span className="font-bold">{service.playlists}</span></div>
                  <div><span className="text-on-surface-variant">Library:</span> <span className="font-bold">{service.libraryCount}</span></div>
                </div>
              </div>
            )) : ( // Prompt user to connect their first service if none exist
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl mb-3">link_off</span>
                <p className="text-sm font-medium">No services connected yet. Link an account to start syncing.</p>
              </div>
            )}
            {/* Interactive 'Add New Service' buttons for different providers */}
            <div className="bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-on-surface-variant transition-all">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Connect Service</p> {/* Instruction text */}
              <div className="flex gap-4"> {/* Flexbox for button layout */}
                <button onClick={() => handleConnect('spotify')} className="h-12 w-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>brand_awareness</span> {/* Spotify icon */}
                </button> {/* End of Spotify button */}
                <button onClick={() => handleConnect('google')} className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>google_home</span> {/* Google icon placeholder */}
                </button> {/* End of Google button */}
                <button onClick={() => handleConnect('apple')} className="h-12 w-12 rounded-full bg-[#555555] text-white flex items-center justify-center hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apple</span> {/* Apple icon placeholder */}
                </button> {/* End of Apple button */}
              </div> {/* End of button row */}
              <p className="text-[10px] font-medium opacity-50">Select a provider to authenticate</p> {/* Helper hint */}
            </div> {/* End of connection panel container */}
          </div>
        </section>

        {/* Detailed Transfer History Logs */}
        <section>
          <div className="flex justify-between items-end mb-8">  {/* Section header */}
            <div>
              <h3 className="font-['Manrope'] text-2xl font-bold tracking-tight">Transfer History</h3>
              <p className="text-on-surface-variant text-sm mt-1">Logs of your recent sonic migrations</p>
            </div>
            <button className="text-on-surface-variant text-sm font-semibold flex items-center gap-1 hover:text-on-surface">
              View Full History
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="space-y-2">  {/* History item list container */}
            {transferHistory.length > 0 ? transferHistory.map((item) => ( // Map through validated history state
              <div key={item.id} className="group flex items-center gap-6 p-4 rounded-xl bg-surface-container-low hover:bg-surface-bright transition-all duration-300">
                <div className="flex -space-x-3 shrink-0">  {/* Source and destination platform indicators */}
                  <div className="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-surface overflow-hidden">
                    <span className="material-symbols-outlined text-[#1DB954] text-sm">{item.from === 'Spotify' ? 'brand_awareness' : 'play_circle'}</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-surface overflow-hidden">
                    <span className="material-symbols-outlined text-[#FF0000] text-sm">{item.to === 'YouTube Music' ? 'play_circle' : 'brand_awareness'}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">  {/* Metadata: Migration name and platform flow */}
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-on-surface-variant">{item.from} → {item.to}</p>
                </div>
                <div className="hidden md:block w-32">  {/* Count of successfully matched tracks */}
                  <p className="text-xs text-on-surface-variant">{item.tracks} tracks moved</p>
                </div>
                <div className="hidden md:block w-32">  {/* Elapsed time since execution completion */}
                  <p className="text-xs text-on-surface-variant italic">{item.time}</p>
                </div>
                <div className="flex items-center gap-2">  {/* Final status badge with color coding */}
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'Completed' ? 'bg-primary' : 'bg-secondary'}`}></span>
                  <span className={`text-xs font-bold tracking-tighter uppercase ${item.status === 'Completed' ? 'text-primary' : 'text-secondary'}`}>{item.status}</span>
                </div>
                <button className="p-2 text-on-surface-variant hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            )) : ( // Feedback for empty history state
              <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-50">
                <span className="material-symbols-outlined text-5xl mb-4">history_toggle_off</span>
                <p className="font-medium">No recent migrations found. Start a transfer to see it here.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Dynamic Feedback Panel for status monitoring and micro-interactions */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-6 py-4 rounded-full flex items-center gap-8 shadow-2xl border border-outline-variant/10 z-[200]">
        <div className="flex items-center gap-4">  {/* Current activity/track display */}
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest flex items-center justify-center">  {/* Status icon or progress indicator */}
            <span className={`material-symbols-outlined ${isSyncing ? 'animate-spin text-primary' : 'text-on-surface-variant'}`}>
              {isSyncing ? 'sync' : 'music_note'}
            </span>
          </div>
          <div>  {/* Activity status text */}
            <p className="text-sm font-bold truncate w-32">{isSyncing ? "Syncing..." : "System Idle"}</p>
            <p className="text-[10px] text-on-surface-variant tracking-[0.1em] uppercase font-bold">{isSyncing ? "Transfer in progress" : "Ready for command"}</p>
          </div>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant/30"></div>  {/* Visual vertical separator */}
        <div className="flex items-center gap-4">  {/* Global transfer control buttons */}
          <button className="text-on-surface-variant hover:text-on-surface disabled:opacity-30" disabled><span className="material-symbols-outlined">skip_previous</span></button>
          <button 
            onClick={handleTransfer}
            disabled={isSyncing}
            className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{isSyncing ? "pause" : "play_arrow"}</span>
          </button>
          <button className="text-on-surface-variant hover:text-on-surface disabled:opacity-30" disabled><span className="material-symbols-outlined">skip_next</span></button>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant/30"></div>
        <button className="text-primary hover:text-primary-container"><span className="material-symbols-outlined">queue_music</span></button>
      </div>
    </>
  )
}

export default App  // Export the BridgeBeat dashboard as the default application entry

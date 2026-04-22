import os
from services.spotify_service import SpotifyService
from services.ytmusic_service import YTMusicService
from utils.matcher import TrackMatcher

def transfer_spotify_to_ytm(spotify_playlist_id, spotify_creds, ytm_auth):
    # Initialize services
    spotify = SpotifyService(
        client_id=spotify_creds['client_id'],
        client_secret=spotify_creds['client_secret'],
        redirect_uri=spotify_creds['redirect_uri']
    )
    ytm = YTMusicService(ytm_auth)
    matcher = TrackMatcher()

    # Step 1: Extract tracks from Spotify
    print(f"Fetching tracks from Spotify playlist: {spotify_playlist_id}")
    spotify_tracks = spotify.get_playlist_tracks(spotify_playlist_id)
    print(f"Extracted {len(spotify_tracks)} tracks.")

    # Step 2: Transfer (Reconstruct) on YouTube Music
    print(f"Transferring to YouTube Music...")
    playlist_id = ytm.create_playlist(
        name="Transferred from Spotify",
        description="A playlist transferred using my music-agent.",
        tracks=spotify_tracks
    )
    print(f"Success! New playlist created on YouTube Music: {playlist_id}")

if __name__ == "__main__":
    # Example placeholder for running the script.
    # Replace these with real credentials.
    SPOTIFY_CREDS = {
        'client_id': 'YOUR_SPOTIFY_CLIENT_ID',
        'client_secret': 'YOUR_SPOTIFY_CLIENT_SECRET',
        'redirect_uri': 'http://localhost:8888/callback'
    }
    
    YTM_AUTH = 'oauth.json' # Or header string/JSON file path
    
    SPOTIFY_PLAYLIST_ID = 'YOUR_PLAYLIST_ID'
    
    # To run this, you'd call:
    # transfer_spotify_to_ytm(SPOTIFY_PLAYLIST_ID, SPOTIFY_CREDS, YTM_AUTH)
    print("Agent setup complete. To run, add your credentials to main.py.")

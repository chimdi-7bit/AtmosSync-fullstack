import spotipy
from spotipy.oauth2 import SpotifyOAuth

class SpotifyService:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            scope="playlist-read-private"
        ))

    def get_playlist_tracks(self, playlist_id):
        results = self.sp.playlist_tracks(playlist_id)
        tracks = results['items']
        while results['next']:
            results = self.sp.next(results)
            tracks.extend(results['items'])
        
        extracted_tracks = []
        for item in tracks:
            track = item['track']
            extracted_tracks.append({
                'name': track['name'],
                'artist': track['artists'][0]['name'],
                'album': track['album']['name'],
                'isrc': track.get('external_ids', {}).get('isrc'),
                'duration_ms': track['duration_ms']
            })
        return extracted_tracks

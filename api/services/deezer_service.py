import deezer

class DeezerService:
    def __init__(self, access_token=None):
        # Deezer access token is needed to modify user playlists.
        self.client = deezer.Client(access_token=access_token)

    def get_playlist_tracks(self, playlist_id):
        playlist = self.client.get_playlist(playlist_id)
        tracks = []
        for track in playlist.tracks:
            tracks.append({
                'name': track.title,
                'artist': track.artist.name,
                'album': track.album.title,
                'isrc': track.isrc,
                'duration_ms': track.duration * 1000
            })
        return tracks

    def create_playlist(self, user_id, name, tracks):
        # Deezer's SDK doesn't always have simple "create_playlist" methods; 
        # this would usually involve a POST to /user/{user_id}/playlists
        # but for simplicity, let's assume we search and match first.
        matched_track_ids = []
        for track in tracks:
            results = self.client.search(f"artist:\"{track['artist']}\" track:\"{track['name']}\"")
            if results:
                matched_track_ids.append(results[0].id)
        
        # Implementation for creating a playlist and adding tracks via Deezer API
        # would require further OAuth-based POST requests.
        return f"Playlist '{name}' with {len(matched_track_ids)} tracks would be created."

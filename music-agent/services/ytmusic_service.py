from ytmusicapi import YTMusic

class YTMusicService:
    def __init__(self, auth_header_or_file):
        # ytmusicapi can take either a JSON string, a path to a JSON file, or an OAuth response.
        # This implementation assumes the user has already set up their auth file.
        self.ytm = YTMusic(auth_header_or_file)

    def create_playlist(self, name, description, tracks):
        video_ids = []
        for track in tracks:
            search_query = f"{track['name']} {track['artist']}"
            if track.get('isrc'):
                # Prioritize ISRC search
                search_results = self.ytm.search(track['isrc'], filter="songs")
                if search_results:
                    video_ids.append(search_results[0]['videoId'])
                    continue

            # Fallback to name/artist search
            search_results = self.ytm.search(search_query, filter="songs")
            if search_results:
                video_ids.append(search_results[0]['videoId'])
        
        playlist_id = self.ytm.create_playlist(name, description, video_ids=video_ids)
        return playlist_id

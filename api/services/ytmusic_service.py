from ytmusicapi import YTMusic
from concurrent.futures import ThreadPoolExecutor, as_completed # Import for parallel execution

class YTMusicService:
    def __init__(self, auth_header_or_file):
        # ytmusicapi can take either a JSON string, a path to a JSON file, or an OAuth response.
        # This implementation assumes the user has already set up their auth file.
        self.ytm = YTMusic(auth_header_or_file)

    def _search_single_track(self, track):
        # Internal helper to search for a single track on YouTube Music
        try:
            search_query = f"{track['name']} {track['artist']}"
            if track.get('isrc'):
                # Prioritize ISRC search for high precision (International Standard Recording Code)
                search_results = self.ytm.search(track['isrc'], filter="songs")
                if search_results:
                    return search_results[0]['videoId']

            # Fallback to name/artist search if ISRC fails or is missing
            search_results = self.ytm.search(search_query, filter="songs")
            if search_results:
                return search_results[0]['videoId']
        except Exception as e:
            print(f"Error searching for track {track.get('name')}: {e}")
        return None

    def create_playlist(self, name, description, tracks):
        video_ids = []
        
        # Using a ThreadPoolExecutor to run searches in parallel.
        # This bypasses the sequential bottleneck of one-by-one searching.
        # max_workers=10 provides a good balance between speed and avoiding rate limits.
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Map search tasks to the executor
            future_to_track = {executor.submit(self._search_single_track, track): track for track in tracks}
            
            # As each search completes, collect the video ID if found
            for future in as_completed(future_to_track):
                result = future.result()
                if result:
                    video_ids.append(result)
        
        # Bulk create the playlist with all found video IDs in a single final API call
        playlist_id = self.ytm.create_playlist(name, description, video_ids=video_ids)
        return playlist_id

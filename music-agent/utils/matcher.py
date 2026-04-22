from rapidfuzz import fuzz

class TrackMatcher:
    def __init__(self, threshold=85):
        self.threshold = threshold

    def is_match(self, source_track, candidate_track):
        # 1. Primary Match: ISRC (The Gold Standard)
        source_isrc = source_track.get('isrc')
        candidate_isrc = candidate_track.get('isrc')
        if source_isrc and candidate_isrc and source_isrc == candidate_isrc:
            return True

        # 2. Secondary Match: Fuzzy Title + Artist
        source_str = f"{source_track['artist']} {source_track['name']}".lower()
        candidate_str = f"{candidate_track['artist']} {candidate_track['name']}".lower()
        
        similarity = fuzz.token_sort_ratio(source_str, candidate_str)
        if similarity >= self.threshold:
            # Check duration similarity (within 5 seconds)
            if 'duration_ms' in source_track and 'duration_ms' in candidate_track:
                duration_diff = abs(source_track['duration_ms'] - candidate_track['duration_ms'])
                if duration_diff <= 5000:
                    return True
        return False

    def find_best_match(self, source_track, candidate_tracks):
        best_match = None
        highest_score = 0
        
        for candidate in candidate_tracks:
            source_str = f"{source_track['artist']} {source_track['name']}".lower()
            candidate_str = f"{candidate['artist']} {candidate['name']}".lower()
            score = fuzz.token_sort_ratio(source_str, candidate_str)
            
            if score > highest_score and score >= self.threshold:
                highest_score = score
                best_match = candidate
        return best_match

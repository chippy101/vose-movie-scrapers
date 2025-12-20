"""TMDB (The Movie Database) API service for fetching movie metadata"""
import os
import requests
import logging
from typing import Optional, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

# TMDB API key from environment variable
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"


class TMDBService:
    """Service for fetching movie metadata from TMDB API"""

    def __init__(self, api_key: str = TMDB_API_KEY):
        self.api_key = api_key
        if not self.api_key:
            logger.warning("TMDB_API_KEY not set. Movie metadata will not be fetched.")

    def search_movie(self, title: str, year: Optional[int] = None) -> Optional[Dict]:
        """
        Search for a movie by title

        Args:
            title: Movie title to search for
            year: Optional release year to narrow search

        Returns:
            Movie data dict if found, None otherwise
        """
        if not self.api_key:
            return None

        try:
            # Clean up title for better search results
            clean_title = self._clean_title(title)

            params = {
                "api_key": self.api_key,
                "query": clean_title,
                "language": "en-US",
                "include_adult": False
            }

            if year:
                params["year"] = year

            response = requests.get(
                f"{TMDB_BASE_URL}/search/movie",
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()

            if data.get("results") and len(data["results"]) > 0:
                # Return the first (most relevant) result
                return data["results"][0]

            return None

        except Exception as e:
            logger.error(f"Error searching TMDB for '{title}': {e}")
            return None

    def get_movie_details(self, tmdb_id: int) -> Optional[Dict]:
        """
        Get detailed movie information

        Args:
            tmdb_id: TMDB movie ID

        Returns:
            Detailed movie data dict if found, None otherwise
        """
        if not self.api_key:
            return None

        try:
            response = requests.get(
                f"{TMDB_BASE_URL}/movie/{tmdb_id}",
                params={"api_key": self.api_key, "language": "en-US"},
                timeout=10
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Error getting TMDB details for ID {tmdb_id}: {e}")
            return None

    def is_english_movie(self, title: str, year: Optional[int] = None) -> bool:
        """
        Check if a movie's original language is English

        Args:
            title: Movie title to search for
            year: Optional release year to narrow search

        Returns:
            True if movie's original language is English, False otherwise
        """
        if not self.api_key:
            logger.warning("TMDB_API_KEY not set. Cannot verify movie language.")
            return True  # Default to accepting if no API key

        try:
            # Search for the movie
            search_result = self.search_movie(title, year)
            if not search_result:
                logger.info(f"No TMDB results for '{title}' - cannot verify language")
                return True  # Accept unknown movies by default

            # Check original_language field
            original_language = search_result.get("original_language", "").lower()
            is_english = original_language == "en"

            if is_english:
                logger.info(f"✓ '{title}' is in English (original_language: {original_language})")
            else:
                logger.info(f"✗ '{title}' is NOT in English (original_language: {original_language})")

            return is_english

        except Exception as e:
            logger.error(f"Error checking language for '{title}': {e}")
            return True  # Accept on error to avoid blocking valid movies

    def get_movie_certification(self, tmdb_id: int) -> Optional[str]:
        """
        Get movie certification/age rating (PG, PG-13, R, etc.)

        Args:
            tmdb_id: TMDB movie ID

        Returns:
            US certification string (e.g., "PG-13") or None if not found
        """
        if not self.api_key:
            return None

        try:
            response = requests.get(
                f"{TMDB_BASE_URL}/movie/{tmdb_id}/release_dates",
                params={"api_key": self.api_key},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            # Look for US certification
            for country_data in data.get("results", []):
                if country_data.get("iso_3166_1") == "US":
                    # Get the first available certification
                    for release in country_data.get("release_dates", []):
                        cert = release.get("certification", "").strip()
                        if cert:
                            return cert

            # Fallback: try to find any English-speaking country certification
            for country_code in ["GB", "CA", "AU"]:
                for country_data in data.get("results", []):
                    if country_data.get("iso_3166_1") == country_code:
                        for release in country_data.get("release_dates", []):
                            cert = release.get("certification", "").strip()
                            if cert:
                                return cert

            return None

        except Exception as e:
            logger.error(f"Error getting certification for TMDB ID {tmdb_id}: {e}")
            return None

    def get_movie_trailer(self, tmdb_id: int) -> Optional[str]:
        """
        Get YouTube trailer key for a movie

        Args:
            tmdb_id: TMDB movie ID

        Returns:
            YouTube video key (e.g., "dQw4w9WgXcQ") or None if not found
        """
        if not self.api_key:
            return None

        try:
            response = requests.get(
                f"{TMDB_BASE_URL}/movie/{tmdb_id}/videos",
                params={"api_key": self.api_key, "language": "en-US"},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            # Look for official trailer on YouTube
            videos = data.get("results", [])

            # Priority 1: Official Trailer
            for video in videos:
                if (video.get("site") == "YouTube" and
                    video.get("type") == "Trailer" and
                    "official" in video.get("name", "").lower()):
                    return video.get("key")

            # Priority 2: Any Trailer
            for video in videos:
                if (video.get("site") == "YouTube" and
                    video.get("type") == "Trailer"):
                    return video.get("key")

            # Priority 3: Teaser
            for video in videos:
                if (video.get("site") == "YouTube" and
                    video.get("type") == "Teaser"):
                    return video.get("key")

            return None

        except Exception as e:
            logger.error(f"Error getting trailer for TMDB ID {tmdb_id}: {e}")
            return None

    def get_movie_credits(self, tmdb_id: int) -> Dict[str, Optional[str]]:
        """
        Get cast and director information for a movie

        Args:
            tmdb_id: TMDB movie ID

        Returns:
            Dict with 'director' and 'cast_members' keys
        """
        if not self.api_key:
            return {"director": None, "cast_members": None}

        try:
            response = requests.get(
                f"{TMDB_BASE_URL}/movie/{tmdb_id}/credits",
                params={"api_key": self.api_key},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            # Find director from crew
            director = None
            for crew_member in data.get("crew", []):
                if crew_member.get("job") == "Director":
                    director = crew_member.get("name")
                    break

            # Get top 5 cast members
            cast_list = data.get("cast", [])[:5]
            cast_members = ", ".join([actor.get("name", "") for actor in cast_list if actor.get("name")])

            return {
                "director": director,
                "cast_members": cast_members if cast_members else None
            }

        except Exception as e:
            logger.error(f"Error getting credits for TMDB ID {tmdb_id}: {e}")
            return {"director": None, "cast_members": None}

    def get_movie_metadata(self, title: str, year: Optional[int] = None) -> Optional[Dict]:
        """
        Get complete movie metadata including poster, rating, etc.

        Args:
            title: Movie title
            year: Optional release year

        Returns:
            Dict with movie metadata or None if not found
        """
        if not self.api_key:
            return None

        try:
            # Search for the movie
            search_result = self.search_movie(title, year)
            if not search_result:
                logger.info(f"No TMDB results for '{title}'")
                return None

            tmdb_id = search_result["id"]

            # Get detailed information
            details = self.get_movie_details(tmdb_id)
            if not details:
                return None

            # Get certification (age rating)
            certification = self.get_movie_certification(tmdb_id)

            # Get trailer video key
            trailer_key = self.get_movie_trailer(tmdb_id)

            # Get cast and director
            credits = self.get_movie_credits(tmdb_id)

            # Extract relevant metadata
            metadata = {
                "tmdb_id": tmdb_id,
                "original_title": details.get("original_title"),
                "poster_url": self._get_poster_url(details.get("poster_path")),
                "backdrop_url": self._get_backdrop_url(details.get("backdrop_path")),
                "overview": details.get("overview"),
                "rating": details.get("vote_average"),
                "release_year": self._extract_year(details.get("release_date")),
                "runtime": details.get("runtime"),
                "genres": self._extract_genres(details.get("genres", [])),
                "certification": certification,
                "trailer_key": trailer_key,
                "director": credits.get("director"),
                "cast_members": credits.get("cast_members")
            }

            logger.info(f"Found TMDB metadata for '{title}': ID={tmdb_id}, rating={metadata['rating']}")
            return metadata

        except Exception as e:
            logger.error(f"Error getting metadata for '{title}': {e}")
            return None

    def _get_poster_url(self, poster_path: Optional[str], size: str = "w500") -> Optional[str]:
        """Convert TMDB poster path to full URL"""
        if not poster_path:
            return None
        return f"{TMDB_IMAGE_BASE_URL}/{size}{poster_path}"

    def _get_backdrop_url(self, backdrop_path: Optional[str], size: str = "w780") -> Optional[str]:
        """Convert TMDB backdrop path to full URL"""
        if not backdrop_path:
            return None
        return f"{TMDB_IMAGE_BASE_URL}/{size}{backdrop_path}"

    def _extract_year(self, release_date: Optional[str]) -> Optional[int]:
        """Extract year from release date string (YYYY-MM-DD)"""
        if not release_date:
            return None
        try:
            return int(release_date.split("-")[0])
        except (ValueError, IndexError):
            return None

    def _extract_genres(self, genres: list) -> Optional[str]:
        """Convert genres list to comma-separated string"""
        if not genres:
            return None
        return ", ".join([g["name"] for g in genres])

    def _clean_title(self, title: str) -> str:
        """
        Clean movie title for better search results
        Remove common patterns that interfere with search
        """
        # Convert to uppercase for consistency
        title = title.upper()

        # Remove trailing dots/periods
        title = title.rstrip(".")

        # Remove subtitle separators and everything after
        for separator in [": ", " - ", " – "]:
            if separator in title:
                title = title.split(separator)[0]

        return title.strip()

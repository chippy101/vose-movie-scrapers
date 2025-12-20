
#!/usr/bin/env python3
"""
Fetch TMDB metadata (posters, ratings, etc.) for all movies in the database
Run this script to backfill movie metadata after adding TMDB integration
"""
import sys
import os
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from api.database import SessionLocal
from api.models import Movie
from api.services.tmdb_service import TMDBService


def fetch_metadata_for_all_movies():
    """Fetch TMDB metadata for all movies that don't have it yet"""
    db = SessionLocal()
    tmdb_service = TMDBService()

    if not tmdb_service.api_key:
        print("❌ ERROR: TMDB_API_KEY not set in environment")
        print("Please set TMDB_API_KEY in .env file or environment variables")
        print("Get an API key from: https://www.themoviedb.org/settings/api")
        return

    try:
        # Get all movies without TMDB metadata (including director/cast)
        movies = db.query(Movie).filter(
            (Movie.tmdb_id == None) |
            (Movie.poster_url == None) |
            (Movie.director == None) |
            (Movie.cast_members == None)
        ).all()

        if not movies:
            print("✓ All movies already have TMDB metadata")
            return

        print(f"Found {len(movies)} movies without metadata")
        print("-" * 80)

        success_count = 0
        fail_count = 0

        for i, movie in enumerate(movies, 1):
            print(f"\n[{i}/{len(movies)}] Fetching metadata for: {movie.title}")

            # Fetch metadata from TMDB
            metadata = tmdb_service.get_movie_metadata(movie.title, movie.release_year)

            if metadata:
                # Update movie with metadata
                movie.tmdb_id = metadata.get("tmdb_id")
                movie.original_title = metadata.get("original_title") or movie.original_title
                movie.poster_url = metadata.get("poster_url")
                movie.backdrop_url = metadata.get("backdrop_url")
                movie.overview = metadata.get("overview")
                movie.rating = metadata.get("rating")
                movie.release_year = metadata.get("release_year") or movie.release_year
                movie.runtime = metadata.get("runtime")
                movie.genres = metadata.get("genres")
                movie.certification = metadata.get("certification")
                movie.trailer_key = metadata.get("trailer_key")
                movie.director = metadata.get("director")
                movie.cast_members = metadata.get("cast_members")

                db.commit()

                print(f"  ✓ Success! TMDB ID: {metadata['tmdb_id']}, Rating: {metadata['rating']}")
                if metadata.get("certification"):
                    print(f"  🔞 Certification: {metadata['certification']}")
                if metadata.get("trailer_key"):
                    print(f"  🎬 Trailer: https://www.youtube.com/watch?v={metadata['trailer_key']}")
                if metadata.get("poster_url"):
                    print(f"  📷 Poster: {metadata['poster_url']}")
                if metadata.get("director"):
                    print(f"  🎬 Director: {metadata['director']}")
                if metadata.get("cast_members"):
                    print(f"  🎭 Cast: {metadata['cast_members'][:100]}...")

                success_count += 1
            else:
                print(f"  ✗ No metadata found")
                fail_count += 1

        print("\n" + "=" * 80)
        print(f"Metadata fetch complete:")
        print(f"  ✓ Success: {success_count} movies")
        print(f"  ✗ Failed: {fail_count} movies")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    fetch_metadata_for_all_movies()

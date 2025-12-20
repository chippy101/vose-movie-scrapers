#!/usr/bin/env python3
"""
Update trailer keys for movies that don't have them yet
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


def update_trailer_keys():
    """Fetch trailer keys for all movies that don't have them yet"""
    db = SessionLocal()
    tmdb_service = TMDBService()

    if not tmdb_service.api_key:
        print("❌ ERROR: TMDB_API_KEY not set in environment")
        print("Please set TMDB_API_KEY in .env file or environment variables")
        print("Get an API key from: https://www.themoviedb.org/settings/api")
        return

    try:
        # Get all movies without trailer keys that have tmdb_id
        movies = db.query(Movie).filter(
            (Movie.trailer_key == None) & (Movie.tmdb_id != None)
        ).all()

        if not movies:
            print("✓ All movies already have trailer keys")
            return

        print(f"Found {len(movies)} movies without trailer keys")
        print("-" * 80)

        success_count = 0
        fail_count = 0
        no_trailer_count = 0

        for i, movie in enumerate(movies, 1):
            print(f"\n[{i}/{len(movies)}] Fetching trailer for: {movie.title} (TMDB ID: {movie.tmdb_id})")

            # Fetch trailer from TMDB
            trailer_key = tmdb_service.get_movie_trailer(movie.tmdb_id)

            if trailer_key:
                movie.trailer_key = trailer_key
                db.commit()

                print(f"  ✓ Trailer found!")
                print(f"  🎬 YouTube: https://www.youtube.com/watch?v={trailer_key}")
                success_count += 1
            else:
                print(f"  ✗ No trailer available on TMDB")
                no_trailer_count += 1

        print("\n" + "=" * 80)
        print(f"Trailer update complete:")
        print(f"  ✓ Trailers found: {success_count} movies")
        print(f"  ✗ No trailers: {no_trailer_count} movies")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    update_trailer_keys()

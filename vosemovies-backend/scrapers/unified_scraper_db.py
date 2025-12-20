#!/usr/bin/env python3
"""
Unified VOSE Movie Scraper with PostgreSQL Integration
Combines CineCiutat + Aficine scrapers and writes to database

Usage:
    python unified_scraper_db.py              # Run all scrapers
    python unified_scraper_db.py --cineciutat # Run only CineCiutat
    python unified_scraper_db.py --aficine    # Run only Aficine
"""

import argparse
import sys
import os
from datetime import datetime
from typing import List, Dict

# Add parent directory to path to import scrapers
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Add api directory to path for database access
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import individual scrapers
try:
    from cineciutat_scraper import CineCiutatScraper
    from aficine_scraper import AficineScraper
    from moix_negre_scraper import CinesMoixNegreScraper
    from majorca_bulletin_scraper import MajorcaDailyBulletinScraper
except ImportError as e:
    print(f"Error: Make sure scraper files are in the same directory: {e}")
    sys.exit(1)

# Import database components
try:
    from api.database.config import SessionLocal
    from api.services import ScraperService
    from api.utils import ScraperDataValidator
except ImportError as e:
    print(f"Error: Make sure the API package is available: {e}")
    print("Tip: Run from the project root or ensure api/ is in PYTHONPATH")
    sys.exit(1)


class UnifiedVOSEScraperDB:
    """Unified scraper that writes to PostgreSQL database"""

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.all_movies = []

    def scrape_all(self, include_cineciutat: bool = True, include_aficine: bool = True,
                   include_moix_negre: bool = True, include_bulletin: bool = True):
        """Run all enabled scrapers"""
        print("="*80)
        print("UNIFIED VOSE MOVIE SCRAPER FOR BALEARIC ISLANDS")
        print("Database Mode - Writing to Database")
        print("="*80)

        started_at = datetime.now()

        # Scrape CineCiutat
        if include_cineciutat:
            print("\n" + "-"*80)
            print("SCRAPING: CineCiutat (Palma)")
            print("-"*80)
            try:
                scraper = CineCiutatScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ CineCiutat: {len(movies)} VOSE movies found")
            except Exception as e:
                print(f"✗ CineCiutat scraper failed: {e}")

        # Scrape Aficine
        if include_aficine:
            print("\n" + "-"*80)
            print("SCRAPING: Aficine (All Balearic Islands)")
            print("-"*80)
            try:
                scraper = AficineScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ Aficine: {len(movies)} VOSE movie entries found")
            except Exception as e:
                print(f"✗ Aficine scraper failed: {e}")

        # Scrape Cines Moix Negre
        if include_moix_negre:
            print("\n" + "-"*80)
            print("SCRAPING: Cines Moix Negre")
            print("-"*80)
            try:
                scraper = CinesMoixNegreScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ Cines Moix Negre: {len(movies)} VOSE movies found")
            except Exception as e:
                print(f"✗ Cines Moix Negre scraper failed: {e}")

        # Scrape Majorca Daily Bulletin
        if include_bulletin:
            print("\n" + "-"*80)
            print("SCRAPING: Majorca Daily Bulletin (Films in English)")
            print("-"*80)
            try:
                scraper = MajorcaDailyBulletinScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ Majorca Daily Bulletin: {len(movies)} movie listings found")
            except Exception as e:
                print(f"✗ Majorca Daily Bulletin scraper failed: {e}")

        completed_at = datetime.now()
        duration = (completed_at - started_at).total_seconds()

        print(f"\n→ Total scraped: {len(self.all_movies)} movie entries in {duration:.1f}s")

        return self.all_movies, started_at, completed_at

    def save_to_database(self, movies: List[Dict], scraper_name: str = "unified"):
        """Save scraped data to PostgreSQL database with validation"""
        print("\n" + "="*80)
        print("SAVING TO DATABASE")
        print("="*80)

        # Validate scraped data with Pydantic schemas
        print("\n→ Validating scraped data...")
        validator = ScraperDataValidator()
        valid_movies, validation_result = validator.validate_movies(movies)

        # Print validation summary
        print(validator.get_validation_summary(validation_result))

        if validation_result.invalid_items > 0:
            print(f"\n⚠️  Warning: {validation_result.invalid_items} invalid movies will be skipped")

        # Convert validated Pydantic models back to dicts for service
        validated_movie_dicts = [movie.model_dump() for movie in valid_movies]

        db = SessionLocal()
        service = ScraperService(db)

        try:
            # Mark old showtimes as inactive
            print("\n→ Marking old showtimes as inactive...")
            inactive_count = service.mark_old_showtimes_inactive()
            print(f"✓ Marked {inactive_count} old showtimes as inactive")

            # Process validated data
            print(f"\n→ Processing {len(validated_movie_dicts)} validated movie entries...")
            stats = service.process_scraped_data(validated_movie_dicts)

            # Add validation stats to results
            stats['validation'] = {
                'total_scraped': validation_result.total_items,
                'valid': validation_result.valid_items,
                'invalid': validation_result.invalid_items,
                'validation_errors': len(validation_result.errors)
            }

            print("\n" + "-"*80)
            print("DATABASE SAVE RESULTS")
            print("-"*80)
            print(f"Movies processed: {stats['movies_processed']}")
            print(f"Cinemas processed: {stats['cinemas_processed']}")
            print(f"Showtimes added: {stats['showtimes_added']}")

            if stats['errors']:
                print(f"\nErrors encountered: {len(stats['errors'])}")
                for error in stats['errors'][:5]:  # Show first 5 errors
                    print(f"  - {error}")

            return stats

        except Exception as e:
            print(f"\n✗ Database error: {e}")
            db.rollback()
            raise
        finally:
            db.close()

    def log_run(
        self,
        scraper_name: str,
        status: str,
        movies_found: int,
        showtimes_found: int,
        started_at: datetime,
        completed_at: datetime,
        error_message: str = None
    ):
        """Log scraper run for monitoring"""
        db = SessionLocal()
        service = ScraperService(db)

        try:
            service.log_scraper_run(
                scraper_name=scraper_name,
                status=status,
                movies_found=movies_found,
                showtimes_found=showtimes_found,
                error_message=error_message,
                started_at=started_at,
                completed_at=completed_at
            )
            print(f"\n✓ Logged scraper run: {scraper_name} - {status}")
        except Exception as e:
            print(f"\n✗ Failed to log scraper run: {e}")
        finally:
            db.close()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Scrape VOSE movies and save to database')
    parser.add_argument('--cineciutat', action='store_true', help='Scrape only CineCiutat')
    parser.add_argument('--aficine', action='store_true', help='Scrape only Aficine')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')

    args = parser.parse_args()

    # Determine which scrapers to run
    include_cineciutat = True
    include_aficine = True

    if args.cineciutat or args.aficine:
        include_cineciutat = args.cineciutat
        include_aficine = args.aficine

    # Run scrapers
    scraper = UnifiedVOSEScraperDB(headless=args.headless)

    try:
        movies, started_at, completed_at = scraper.scrape_all(
            include_cineciutat=include_cineciutat,
            include_aficine=include_aficine
        )

        # Save to database
        stats = scraper.save_to_database(movies, scraper_name="unified")

        # Log the run
        scraper.log_run(
            scraper_name="unified",
            status="success",
            movies_found=stats['movies_processed'],
            showtimes_found=stats['showtimes_added'],
            started_at=started_at,
            completed_at=completed_at
        )

        print("\n" + "="*80)
        print("✓ SCRAPING COMPLETE - DATA SAVED TO DATABASE")
        print("="*80)

    except Exception as e:
        print(f"\n✗ Scraping failed: {e}")
        import traceback
        traceback.print_exc()

        # Log the failure
        try:
            scraper.log_run(
                scraper_name="unified",
                status="failed",
                movies_found=0,
                showtimes_found=0,
                started_at=datetime.now(),
                completed_at=datetime.now(),
                error_message=str(e)
            )
        except:
            pass

        sys.exit(1)


if __name__ == "__main__":
    main()

"""Service layer for scraper-to-database operations"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date, time as dt_time
from typing import List, Dict, Optional
import logging

from api.models import Movie, Cinema, Showtime, ScraperRun

logger = logging.getLogger(__name__)


class ScraperService:
    """Handle scraper data insertion and updates"""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_movie(self, title: str, link: Optional[str] = None) -> Movie:
        """Get existing movie or create new one"""
        movie = self.db.query(Movie).filter(Movie.title == title).first()

        if not movie:
            movie = Movie(title=title, link=link)
            self.db.add(movie)
            self.db.flush()  # Get the ID without committing
            logger.info(f"Created new movie: {title}")
        elif link and not movie.link:
            # Update link if movie exists but has no link
            movie.link = link
            self.db.flush()

        return movie

    def get_or_create_cinema(
        self,
        name: str,
        location: str,
        island: str,
        address: Optional[str] = None,
        website: Optional[str] = None
    ) -> Cinema:
        """Get existing cinema or create new one"""
        cinema = self.db.query(Cinema).filter(
            Cinema.name == name,
            Cinema.location == location
        ).first()

        if not cinema:
            cinema = Cinema(
                name=name,
                location=location,
                island=island,
                address=address,
                website=website
            )
            self.db.add(cinema)
            self.db.flush()
            logger.info(f"Created new cinema: {name} in {location}")

        return cinema

    def add_showtime(
        self,
        movie: Movie,
        cinema: Cinema,
        showtime_date: date,
        showtime_time: dt_time,
        version: str = "VOSE"
    ) -> Optional[Showtime]:
        """Add a new showtime (or skip if duplicate)"""
        # Check if showtime already exists
        existing = self.db.query(Showtime).filter(
            Showtime.movie_id == movie.id,
            Showtime.cinema_id == cinema.id,
            Showtime.showtime_date == showtime_date,
            Showtime.showtime_time == showtime_time
        ).first()

        if existing:
            # Update scraped_at timestamp and mark as active
            existing.scraped_at = datetime.now()
            existing.is_active = True
            return existing

        # Create new showtime
        showtime = Showtime(
            movie_id=movie.id,
            cinema_id=cinema.id,
            showtime_date=showtime_date,
            showtime_time=showtime_time,
            version=version,
            is_active=True
        )

        self.db.add(showtime)
        logger.debug(f"Added showtime: {movie.title} at {cinema.name} on {showtime_date} {showtime_time}")
        return showtime

    def process_scraped_data(self, scraped_movies: List[Dict]) -> Dict:
        """
        Process scraped movie data and insert into database

        Expected format:
        [
            {
                "title": "Movie Title",
                "cinema": "Cinema Name",
                "location": "City Name",
                "island": "Mallorca",
                "version": "VOSE",
                "showtimes": [
                    {"date": "2025-11-07", "time": "18:00"},
                    {"date": "2025-11-08", "time": "20:30"}
                ],
                "link": "https://...",
                "scraped_at": "2025-10-30T14:30:00"
            }
        ]
        """
        stats = {
            "movies_processed": 0,
            "cinemas_processed": 0,
            "showtimes_added": 0,
            "errors": []
        }

        movies_seen = set()
        cinemas_seen = set()

        for item in scraped_movies:
            try:
                # Extract data
                title = item.get("title")
                cinema_name = item.get("cinema")
                location = item.get("location")
                island = item.get("island")
                version = item.get("version", "VOSE")
                showtimes = item.get("showtimes", [])
                link = item.get("link")

                if not all([title, cinema_name, location, island]):
                    logger.warning(f"Skipping incomplete data: {item}")
                    continue

                # Get or create movie
                movie = self.get_or_create_movie(title, link)
                if movie.id not in movies_seen:
                    movies_seen.add(movie.id)
                    stats["movies_processed"] += 1

                # Get or create cinema
                cinema = self.get_or_create_cinema(cinema_name, location, island)
                if cinema.id not in cinemas_seen:
                    cinemas_seen.add(cinema.id)
                    stats["cinemas_processed"] += 1

                # Parse and add showtimes
                for showtime_item in showtimes:
                    try:
                        # Handle both old format (string) and new format (dict with date/time)
                        if isinstance(showtime_item, dict):
                            # New format: {"date": "2025-11-07", "time": "18:00"}
                            date_str = showtime_item.get('date')
                            time_str = showtime_item.get('time')

                            if not date_str or not time_str:
                                logger.warning(f"Skipping incomplete showtime: {showtime_item}")
                                continue

                            # Parse date from YYYY-MM-DD string
                            showtime_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                        else:
                            # Old format (backward compatibility): just time string "18:00"
                            time_str = showtime_item
                            showtime_date = date.today()
                            logger.debug(f"Using legacy time format, defaulting to today's date")

                        # Parse time string (format: "18:00" or "18:30")
                        hour, minute = map(int, time_str.split(":"))
                        showtime_time = dt_time(hour, minute)

                        result = self.add_showtime(movie, cinema, showtime_date, showtime_time, version)
                        if result:
                            stats["showtimes_added"] += 1

                    except ValueError as e:
                        logger.error(f"Error parsing showtime '{showtime_item}': {e}")
                        stats["errors"].append(f"Time parse error: {showtime_item}")
                    except Exception as e:
                        logger.error(f"Unexpected error with showtime '{showtime_item}': {e}")
                        stats["errors"].append(f"Showtime error: {showtime_item} - {str(e)}")

            except Exception as e:
                logger.error(f"Error processing item: {e}")
                stats["errors"].append(str(e))

        # Commit all changes
        try:
            self.db.commit()
            logger.info(f"Successfully committed: {stats}")
        except IntegrityError as e:
            # Handle duplicate key violations gracefully
            self.db.rollback()
            logger.warning(f"Commit had integrity errors (likely duplicates), re-adding valid showtimes: {e}")

            # Re-process without duplicates by committing each showtime individually
            stats_retry = self._reprocess_with_individual_commits(scraped_movies)
            return stats_retry
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to commit: {e}")
            stats["errors"].append(f"Commit failed: {e}")

        return stats

    def _reprocess_with_individual_commits(self, scraped_movies: List[Dict]) -> Dict:
        """Reprocess data with individual commits to handle duplicates"""
        stats = {
            "movies_processed": 0,
            "cinemas_processed": 0,
            "showtimes_added": 0,
            "errors": []
        }

        movies_seen = set()
        cinemas_seen = set()

        for item in scraped_movies:
            try:
                title = item.get("title")
                cinema_name = item.get("cinema")
                location = item.get("location")
                island = item.get("island")
                version = item.get("version", "VOSE")
                showtimes = item.get("showtimes", [])
                link = item.get("link")

                if not all([title, cinema_name, location, island]):
                    continue

                # Get or create movie and cinema (with individual commits)
                movie = self.get_or_create_movie(title, link)
                self.db.commit()

                if movie.id not in movies_seen:
                    movies_seen.add(movie.id)
                    stats["movies_processed"] += 1

                cinema = self.get_or_create_cinema(cinema_name, location, island)
                self.db.commit()

                if cinema.id not in cinemas_seen:
                    cinemas_seen.add(cinema.id)
                    stats["cinemas_processed"] += 1

                # Add showtimes one at a time
                for showtime_item in showtimes:
                    try:
                        # Handle both old format (string) and new format (dict with date/time)
                        if isinstance(showtime_item, dict):
                            # New format: {"date": "2025-11-07", "time": "18:00"}
                            date_str = showtime_item.get('date')
                            time_str = showtime_item.get('time')

                            if not date_str or not time_str:
                                logger.warning(f"Skipping incomplete showtime: {showtime_item}")
                                continue

                            # Parse date from YYYY-MM-DD string
                            showtime_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                        else:
                            # Old format (backward compatibility): just time string "18:00"
                            time_str = showtime_item
                            showtime_date = date.today()
                            logger.debug(f"Using legacy time format, defaulting to today's date")

                        hour, minute = map(int, time_str.split(":"))
                        showtime_time = dt_time(hour, minute)

                        # Check if exists before adding
                        existing = self.db.query(Showtime).filter(
                            Showtime.movie_id == movie.id,
                            Showtime.cinema_id == cinema.id,
                            Showtime.showtime_date == showtime_date,
                            Showtime.showtime_time == showtime_time
                        ).first()

                        if not existing:
                            showtime = Showtime(
                                movie_id=movie.id,
                                cinema_id=cinema.id,
                                showtime_date=showtime_date,
                                showtime_time=showtime_time,
                                version=version,
                                is_active=True
                            )
                            self.db.add(showtime)
                            self.db.commit()
                            stats["showtimes_added"] += 1
                        else:
                            # Update existing
                            existing.scraped_at = datetime.now()
                            existing.is_active = True
                            self.db.commit()

                    except Exception as e:
                        self.db.rollback()
                        logger.debug(f"Skipped showtime {showtime_item}: {e}")

            except Exception as e:
                self.db.rollback()
                logger.error(f"Error in retry processing: {e}")

        logger.info(f"Retry completed: {stats}")
        return stats

    def mark_old_showtimes_inactive(self):
        """Mark showtimes before today as inactive"""
        today = date.today()
        result = self.db.query(Showtime).filter(
            Showtime.showtime_date < today,
            Showtime.is_active == True
        ).update({"is_active": False})

        self.db.commit()
        logger.info(f"Marked {result} old showtimes as inactive")
        return result

    def log_scraper_run(
        self,
        scraper_name: str,
        status: str,
        movies_found: int = 0,
        showtimes_found: int = 0,
        error_message: Optional[str] = None,
        started_at: datetime = None,
        completed_at: datetime = None
    ) -> ScraperRun:
        """Log a scraper run for monitoring"""
        if started_at and completed_at:
            duration = int((completed_at - started_at).total_seconds())
        else:
            duration = None

        run = ScraperRun(
            scraper_name=scraper_name,
            status=status,
            movies_found=movies_found,
            showtimes_found=showtimes_found,
            error_message=error_message,
            started_at=started_at or datetime.now(),
            completed_at=completed_at,
            duration_seconds=duration
        )

        self.db.add(run)
        self.db.commit()
        logger.info(f"Logged scraper run: {scraper_name} - {status}")
        return run

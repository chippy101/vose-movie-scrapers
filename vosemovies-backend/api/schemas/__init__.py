"""Pydantic schemas for API requests/responses"""
from .movie import MovieBase, MovieCreate, MovieResponse
from .cinema import CinemaBase, CinemaCreate, CinemaResponse
from .showtime import ShowtimeBase, ShowtimeCreate, ShowtimeResponse, MovieShowtimeResponse
from .scraper import (
    ScrapedShowtime,
    ScrapedMovie,
    ScraperRun,
    ScraperValidationResult
)

__all__ = [
    "MovieBase", "MovieCreate", "MovieResponse",
    "CinemaBase", "CinemaCreate", "CinemaResponse",
    "ShowtimeBase", "ShowtimeCreate", "ShowtimeResponse", "MovieShowtimeResponse",
    "ScrapedShowtime", "ScrapedMovie", "ScraperRun", "ScraperValidationResult"
]
